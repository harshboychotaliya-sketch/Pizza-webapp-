import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { OrderModel, IOrderItem, IOrder } from '../models/Order.js';
import { IngredientModel } from '../models/Ingredient.js';
import { PizzaMenuModel } from '../models/PizzaMenu.js';
import { createRazorpayOrder, verifyRazorpaySignature, generateTestSimulationCredentials } from '../services/razorpayService.js';
import { sendEmail } from '../services/emailService.js';

export async function createOrder(req: AuthRequest, res: Response) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required to place an order.' });
    }

    const { items, customerDetails, paymentMethod = 'online' } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Your cart is empty. Please add at least one pizza.' });
    }

    if (!customerDetails || !customerDetails.name || !customerDetails.phone || !customerDetails.address) {
      return res.status(400).json({ success: false, message: 'Please provide complete delivery details (name, phone, address).' });
    }

    // Backend price recalculation & stock verification
    const validatedItems: IOrderItem[] = [];
    const stockItemsNeeded: { [id: string]: { name: string; required: number; available: number } } = {};
    let subtotal = 0;

    for (const item of items) {
      const qty = Math.max(1, Number(item.quantity) || 1);

      if (item.isCustom) {
        // Validate custom pizza ingredients
        const base = await IngredientModel.findById(item.ingredients?.base?.id || item.baseId);
        const sauce = await IngredientModel.findById(item.ingredients?.sauce?.id || item.sauceId);
        const cheese = await IngredientModel.findById(item.ingredients?.cheese?.id || item.cheeseId);

        if (!base || !sauce || !cheese) {
          return res.status(400).json({ success: false, message: 'Custom pizza is missing required ingredients.' });
        }

        const veggies: any[] = [];
        let veggiesPrice = 0;
        const veggieList = item.ingredients?.veggies || item.veggies || [];

        for (const v of veggieList) {
          const vId = v.id || v;
          const foundV = await IngredientModel.findById(vId);
          if (foundV) {
            veggies.push({ id: foundV.id || foundV._id, name: foundV.name, price: foundV.price });
            veggiesPrice += foundV.price;
            const key = foundV.id || foundV._id!;
            stockItemsNeeded[key] = {
              name: foundV.name,
              required: (stockItemsNeeded[key]?.required || 0) + qty,
              available: foundV.quantity
            };
          }
        }

        const baseKey = base.id || base._id!;
        const sauceKey = sauce.id || sauce._id!;
        const cheeseKey = cheese.id || cheese._id!;

        stockItemsNeeded[baseKey] = {
          name: base.name,
          required: (stockItemsNeeded[baseKey]?.required || 0) + qty,
          available: base.quantity
        };
        stockItemsNeeded[sauceKey] = {
          name: sauce.name,
          required: (stockItemsNeeded[sauceKey]?.required || 0) + qty,
          available: sauce.quantity
        };
        stockItemsNeeded[cheeseKey] = {
          name: cheese.name,
          required: (stockItemsNeeded[cheeseKey]?.required || 0) + qty,
          available: cheese.quantity
        };

        const unitPrice = base.price + sauce.price + cheese.price + veggiesPrice;
        subtotal += unitPrice * qty;

        validatedItems.push({
          name: item.name || 'Custom Crafted Pizza',
          isCustom: true,
          quantity: qty,
          unitPrice,
          ingredientsSnapshot: {
            base: { id: baseKey, name: base.name, price: base.price },
            sauce: { id: sauceKey, name: sauce.name, price: sauce.price },
            cheese: { id: cheeseKey, name: cheese.name, price: cheese.price },
            veggies
          }
        });
      } else {
        // Standard menu pizza
        const preset = await PizzaMenuModel.findById(item.pizzaId || item.id);
        const name = preset ? preset.name : item.name;
        const unitPrice = preset ? preset.basePrice : Number(item.unitPrice) || 399;
        subtotal += unitPrice * qty;

        // Try mapping to ingredients for stock track
        const allIngs = await IngredientModel.find();
        const base = allIngs.find(i => i.category === 'base');
        const sauce = allIngs.find(i => i.category === 'sauce');
        const cheese = allIngs.find(i => i.category === 'cheese');

        if (base) {
          const k = base.id || base._id!;
          stockItemsNeeded[k] = { name: base.name, required: (stockItemsNeeded[k]?.required || 0) + qty, available: base.quantity };
        }
        if (sauce) {
          const k = sauce.id || sauce._id!;
          stockItemsNeeded[k] = { name: sauce.name, required: (stockItemsNeeded[k]?.required || 0) + qty, available: sauce.quantity };
        }
        if (cheese) {
          const k = cheese.id || cheese._id!;
          stockItemsNeeded[k] = { name: cheese.name, required: (stockItemsNeeded[k]?.required || 0) + qty, available: cheese.quantity };
        }

        validatedItems.push({
          pizzaId: preset ? (preset.id || preset._id) : undefined,
          name,
          isCustom: false,
          quantity: qty,
          unitPrice,
          ingredientsSnapshot: {
            base: { id: base ? (base.id || base._id!) : 'b1', name: base?.name || 'Sourdough', price: base?.price || 120 },
            sauce: { id: sauce ? (sauce.id || sauce._id!) : 's1', name: sauce?.name || 'San Marzano', price: sauce?.price || 60 },
            cheese: { id: cheese ? (cheese.id || cheese._id!) : 'c1', name: cheese?.name || 'Mozzarella', price: cheese?.price || 90 },
            veggies: []
          }
        });
      }
    }

    // Verify stock counts
    for (const id in stockItemsNeeded) {
      const check = stockItemsNeeded[id];
      if (check.available < check.required) {
        return res.status(400).json({
          success: false,
          message: `Cannot place order: '${check.name}' has insufficient stock (Requested: ${check.required}, Available: ${check.available}). Please adjust your cart.`
        });
      }
    }

    // Calculations
    const tax = Math.round(subtotal * 0.05); // 5% GST
    const deliveryFee = subtotal >= 500 ? 0 : 49;
    const totalAmount = subtotal + tax + deliveryFee;

    const orderNumber = `CRUST-${Date.now().toString().slice(-6)}`;

    // CASE 1: CASH ON DELIVERY (COD)
    if (paymentMethod === 'cod') {
      // Deduct stock immediately to reserve fresh ingredients for baking
      const deductions: { ingredientId: string; amount: number }[] = [];
      for (const id in stockItemsNeeded) {
        deductions.push({ ingredientId: id, amount: stockItemsNeeded[id].required });
      }
      await IngredientModel.deductStock(deductions);

      const order = await OrderModel.create({
        orderNumber,
        userId: user.id || user._id!,
        customerDetails: {
          name: customerDetails.name,
          email: customerDetails.email || user.email,
          phone: customerDetails.phone,
          address: customerDetails.address,
          city: customerDetails.city || 'Bangalore',
          postalCode: customerDetails.postalCode || '560001',
          notes: customerDetails.notes || ''
        },
        items: validatedItems,
        subtotal,
        tax,
        deliveryFee,
        totalAmount,
        paymentMethod: 'cod',
        paymentStatus: 'pending',
        paymentDetails: {},
        orderStatus: 'Order Received',
        statusHistory: [
          {
            status: 'Order Received',
            timestamp: new Date(),
            note: `Order placed with Cash on Delivery (COD). Total ₹${totalAmount} payable at doorstep.`
          }
        ],
        stockDeducted: true
      });

      // Send confirmation email
      await sendEmail({
        to: order.customerDetails.email,
        subject: `Cash on Delivery Order Placed #${order.orderNumber} - Artisan Crust`,
        type: 'order_confirmation',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; padding: 24px; border: 1px solid #EFEAE4; background: #FAF7F2; border-radius: 8px;">
            <h2 style="color: #E23722;">Cash on Delivery Order Confirmed!</h2>
            <p>Thank you, <strong>${order.customerDetails.name}</strong>!</p>
            <p>Order Number: <strong>${order.orderNumber}</strong></p>
            <p>Amount to Pay at Door: <strong>₹${order.totalAmount}</strong> (Cash or UPI)</p>
            <p>Status: <strong>Order Received</strong> (Our pizzaiolos are preparing your fresh dough!)</p>
          </div>
        `
      });

      return res.status(201).json({
        success: true,
        isCod: true,
        message: 'Cash on delivery order placed successfully!',
        order: {
          id: order.id || order._id,
          orderNumber: order.orderNumber,
          totalAmount: order.totalAmount,
          subtotal: order.subtotal,
          tax: order.tax,
          deliveryFee: order.deliveryFee,
          orderStatus: order.orderStatus,
          paymentStatus: order.paymentStatus,
          paymentMethod: 'cod'
        }
      });
    }

    // CASE 2: ONLINE PAYMENT (RAZORPAY)
    const rzpOrder = await createRazorpayOrder({
      amountInINR: totalAmount,
      receipt: orderNumber,
      notes: { orderNumber, userId: user.id || user._id }
    });

    // Save order in database
    const order = await OrderModel.create({
      orderNumber,
      userId: user.id || user._id!,
      customerDetails: {
        name: customerDetails.name,
        email: customerDetails.email || user.email,
        phone: customerDetails.phone,
        address: customerDetails.address,
        city: customerDetails.city || 'Bangalore',
        postalCode: customerDetails.postalCode || '560001',
        notes: customerDetails.notes || ''
      },
      items: validatedItems,
      subtotal,
      tax,
      deliveryFee,
      totalAmount,
      paymentMethod: 'online',
      paymentStatus: 'pending',
      paymentDetails: {
        razorpayOrderId: rzpOrder.id
      },
      orderStatus: 'Order Received',
      stockDeducted: false
    });

    return res.status(201).json({
      success: true,
      isCod: false,
      order: {
        id: order.id || order._id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        subtotal: order.subtotal,
        tax: order.tax,
        deliveryFee: order.deliveryFee,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        paymentMethod: 'online'
      },
      razorpay: {
        orderId: rzpOrder.id,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        keyId: rzpOrder.keyId,
        testSimulation: generateTestSimulationCredentials(rzpOrder.id)
      }
    });
  } catch (error: any) {
    console.error('Order creation error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create order.' });
  }
}

export async function verifyPayment(req: AuthRequest, res: Response) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Missing payment signature verification parameters.' });
    }

    const order = orderId
      ? await OrderModel.findById(orderId)
      : await OrderModel.findOne({ 'paymentDetails.razorpayOrderId': razorpay_order_id });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order associated with this payment was not found.' });
    }

    // Verify cryptographic signature
    const isValid = verifyRazorpaySignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature
    });

    if (!isValid) {
      await OrderModel.updateById(order.id || order._id!, {
        paymentStatus: 'failed',
        statusHistory: [
          ...order.statusHistory,
          { status: 'Cancelled', timestamp: new Date(), note: 'Payment verification failed: invalid signature.' }
        ]
      });
      return res.status(400).json({ success: false, message: 'Payment verification failed. Invalid signature.' });
    }

    // Prevent deducting stock twice if callback is repeated
    if (order.stockDeducted) {
      return res.status(200).json({
        success: true,
        message: 'Payment already verified and stock deducted.',
        order: await OrderModel.findById(order.id || order._id!)
      });
    }

    // Prepare atomic stock deductions
    const deductions: { ingredientId: string; amount: number }[] = [];
    for (const item of order.items) {
      const snap = item.ingredientsSnapshot;
      if (snap.base?.id) deductions.push({ ingredientId: snap.base.id, amount: item.quantity });
      if (snap.sauce?.id) deductions.push({ ingredientId: snap.sauce.id, amount: item.quantity });
      if (snap.cheese?.id) deductions.push({ ingredientId: snap.cheese.id, amount: item.quantity });
      if (snap.veggies) {
        for (const v of snap.veggies) {
          if (v.id) deductions.push({ ingredientId: v.id, amount: item.quantity });
        }
      }
    }

    const deductResult = await IngredientModel.deductStock(deductions);
    if (!deductResult.success) {
      console.warn('Inventory deduction warning:', deductResult.error);
    }

    // Update order to paid
    const updatedOrder = await OrderModel.updateById(order.id || order._id!, {
      paymentStatus: 'paid',
      stockDeducted: true,
      paymentDetails: {
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        verifiedAt: new Date()
      },
      statusHistory: [
        ...order.statusHistory,
        {
          status: 'Order Received',
          timestamp: new Date(),
          note: `Payment verified successfully via Razorpay (Txn ID: ${razorpay_payment_id})`
        }
      ]
    });

    // Send order confirmation email
    await sendEmail({
      to: order.customerDetails.email,
      subject: `Order Confirmed #${order.orderNumber} - Artisan Crust`,
      type: 'order_confirmation',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; padding: 24px; border: 1px solid #EFEAE4; background: #FAF7F2; border-radius: 8px;">
          <h2 style="color: #E23722;">Order Confirmed!</h2>
          <p>Thank you for your order, <strong>${order.customerDetails.name}</strong>!</p>
          <p>Order Number: <strong>${order.orderNumber}</strong></p>
          <p>Total Paid: <strong>₹${order.totalAmount}</strong></p>
          <p>Status: <strong>Order Received</strong> (Our pizzaiolos are preparing your fresh dough!)</p>
        </div>
      `
    });

    return res.status(200).json({
      success: true,
      message: 'Payment verified successfully and stock updated.',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    return res.status(500).json({ success: false, message: 'Server error during payment verification.' });
  }
}

export async function getUserOrders(req: AuthRequest, res: Response) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const orders = await OrderModel.find({ userId: user.id || user._id });
    return res.status(200).json({
      success: true,
      orders
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve orders.' });
  }
}

export async function trackOrder(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const user = req.user;

    const order = await OrderModel.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // Customer can only view their own orders unless admin
    if (user && user.role !== 'admin' && order.userId !== (user.id || user._id)) {
      return res.status(403).json({ success: false, message: 'Forbidden. You can only track your own orders.' });
    }

    return res.status(200).json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Error tracking order:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve order tracking details.' });
  }
}

export async function initiatePaymentForExistingOrder(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const user = req.user;

    const order = await OrderModel.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    if (user && user.role !== 'admin' && order.userId !== (user.id || user._id)) {
      return res.status(403).json({ success: false, message: 'Forbidden. You do not own this order.' });
    }

    if (order.paymentStatus === 'paid') {
      return res.status(400).json({ success: false, message: 'Order is already marked as paid.' });
    }

    const rzpOrder = await createRazorpayOrder({
      amountInINR: order.totalAmount,
      receipt: order.orderNumber,
      notes: { orderNumber: order.orderNumber, userId: order.userId }
    });

    await OrderModel.updateById(order.id || order._id!, {
      paymentDetails: {
        razorpayOrderId: rzpOrder.id
      }
    });

    return res.status(200).json({
      success: true,
      razorpay: {
        orderId: rzpOrder.id,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        keyId: rzpOrder.keyId,
        testSimulation: generateTestSimulationCredentials(rzpOrder.id)
      }
    });
  } catch (error) {
    console.error('Error initiating payment for order:', error);
    return res.status(500).json({ success: false, message: 'Failed to initiate online payment.' });
  }
}

