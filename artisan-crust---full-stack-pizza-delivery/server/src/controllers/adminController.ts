import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { OrderModel, OrderStatus } from '../models/Order.js';
import { IngredientModel, IngredientCategory } from '../models/Ingredient.js';
import { checkAndAlertLowStock } from '../services/cronService.js';

export async function getAdminStats(req: AuthRequest, res: Response) {
  try {
    const orders = await OrderModel.find();
    const ingredients = await IngredientModel.find();
    const lowStockItems = await IngredientModel.getLowStockItems();

    const totalOrders = orders.length;
    const paidOrders = orders.filter(o => o.paymentStatus === 'paid');
    const pendingOrders = orders.filter(o => o.orderStatus !== 'Delivered' && o.orderStatus !== 'Cancelled');
    const completedOrders = orders.filter(o => o.orderStatus === 'Delivered');
    const revenue = paidOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    return res.status(200).json({
      success: true,
      stats: {
        totalOrders,
        pendingOrders: pendingOrders.length,
        completedOrders: completedOrders.length,
        revenue,
        lowStockCount: lowStockItems.length,
        totalIngredients: ingredients.length
      },
      lowStockItems
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve admin statistics.' });
  }
}

export async function getAllOrders(req: AuthRequest, res: Response) {
  try {
    const orders = await OrderModel.find();
    return res.status(200).json({
      success: true,
      orders
    });
  } catch (error) {
    console.error('Error fetching admin orders:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch customer orders.' });
  }
}

export async function updateOrderStatus(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    const allowedStatuses: OrderStatus[] = ['Order Received', 'In Kitchen', 'Sent to Delivery', 'Delivered', 'Cancelled'];
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed values are: ${allowedStatuses.join(', ')}`
      });
    }

    const order = await OrderModel.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const newHistory = [
      ...order.statusHistory,
      {
        status: status as OrderStatus,
        timestamp: new Date(),
        note: note || `Order status updated to '${status}' by ${req.user?.name || 'Admin'}`
      }
    ];

    const updated = await OrderModel.updateById(id, {
      orderStatus: status as OrderStatus,
      statusHistory: newHistory
    });

    return res.status(200).json({
      success: true,
      message: `Order status updated to '${status}'.`,
      order: updated
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    return res.status(500).json({ success: false, message: 'Failed to update order status.' });
  }
}

export async function updateOrderPaymentStatus(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { paymentStatus, note } = req.body;

    const allowedPayments = ['paid', 'pending', 'failed'];
    if (!paymentStatus || !allowedPayments.includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid payment status. Allowed values are: ${allowedPayments.join(', ')}`
      });
    }

    const order = await OrderModel.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // If marking as paid and stock was not previously deducted, deduct now
    if (paymentStatus === 'paid' && !order.stockDeducted) {
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
      await IngredientModel.deductStock(deductions);
    }

    const paymentNote = note || (paymentStatus === 'paid'
      ? `Payment verified & collected (Doorstep/Cash/UPI) by ${req.user?.name || 'Head Chef'}`
      : `Payment marked as ${paymentStatus} by ${req.user?.name || 'Head Chef'}`);

    const newHistory = [
      ...order.statusHistory,
      {
        status: order.orderStatus,
        timestamp: new Date(),
        note: paymentNote
      }
    ];

    const updated = await OrderModel.updateById(id, {
      paymentStatus: paymentStatus as any,
      stockDeducted: paymentStatus === 'paid' ? true : order.stockDeducted,
      statusHistory: newHistory
    });

    return res.status(200).json({
      success: true,
      message: `Payment status updated to '${paymentStatus}'.`,
      order: updated
    });
  } catch (error) {
    console.error('Error updating order payment status:', error);
    return res.status(500).json({ success: false, message: 'Failed to update order payment status.' });
  }
}

export async function getInventory(req: AuthRequest, res: Response) {
  try {
    const ingredients = await IngredientModel.find();
    return res.status(200).json({
      success: true,
      ingredients
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch inventory.' });
  }
}

export async function createIngredient(req: AuthRequest, res: Response) {
  try {
    const { name, category, price, quantity, lowStockThreshold, description } = req.body;

    if (!name || !category || price === undefined || quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Name, category, price, and initial quantity are required.'
      });
    }

    const validCategories: IngredientCategory[] = ['base', 'sauce', 'cheese', 'veggie'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Category must be one of: ${validCategories.join(', ')}`
      });
    }

    if (Number(price) < 0 || Number(quantity) < 0) {
      return res.status(400).json({
        success: false,
        message: 'Price and quantity cannot be negative.'
      });
    }

    const newIng = await IngredientModel.create({
      name,
      category,
      price: Number(price),
      quantity: Number(quantity),
      lowStockThreshold: Number(lowStockThreshold) || 10,
      description: description || ''
    });

    return res.status(201).json({
      success: true,
      message: `Ingredient '${name}' created successfully.`,
      ingredient: newIng
    });
  } catch (error) {
    console.error('Error creating ingredient:', error);
    return res.status(500).json({ success: false, message: 'Failed to create ingredient.' });
  }
}

export async function updateIngredient(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { name, category, price, quantity, lowStockThreshold, description } = req.body;

    const existing = await IngredientModel.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Ingredient not found.' });
    }

    if (quantity !== undefined && Number(quantity) < 0) {
      return res.status(400).json({ success: false, message: 'Stock quantity cannot be negative.' });
    }
    if (price !== undefined && Number(price) < 0) {
      return res.status(400).json({ success: false, message: 'Price cannot be negative.' });
    }

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (category !== undefined) updates.category = category;
    if (price !== undefined) updates.price = Number(price);
    if (quantity !== undefined) updates.quantity = Number(quantity);
    if (lowStockThreshold !== undefined) updates.lowStockThreshold = Number(lowStockThreshold);
    if (description !== undefined) updates.description = description;

    const updated = await IngredientModel.updateById(id, updates);

    return res.status(200).json({
      success: true,
      message: 'Ingredient updated successfully.',
      ingredient: updated
    });
  } catch (error) {
    console.error('Error updating ingredient:', error);
    return res.status(500).json({ success: false, message: 'Failed to update ingredient.' });
  }
}

export async function adjustStock(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { delta } = req.body; // e.g., +5 or -5

    if (delta === undefined || typeof delta !== 'number') {
      return res.status(400).json({ success: false, message: 'Numeric delta adjustment is required.' });
    }

    const existing = await IngredientModel.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Ingredient not found.' });
    }

    const newQuantity = existing.quantity + delta;
    if (newQuantity < 0) {
      return res.status(400).json({
        success: false,
        message: `Adjustment would result in negative inventory. Current stock: ${existing.quantity}`
      });
    }

    const updated = await IngredientModel.updateById(id, { quantity: newQuantity });

    return res.status(200).json({
      success: true,
      message: `Stock updated to ${newQuantity}.`,
      ingredient: updated
    });
  } catch (error) {
    console.error('Error adjusting stock:', error);
    return res.status(500).json({ success: false, message: 'Failed to adjust stock.' });
  }
}

export async function triggerLowStockCheck(req: AuthRequest, res: Response) {
  try {
    const result = await checkAndAlertLowStock();
    return res.status(200).json({
      success: true,
      message: `Checked ${result.checked} ingredients. Dispatched alerts for ${result.alertedCount} items.`,
      result
    });
  } catch (error) {
    console.error('Error checking low stock:', error);
    return res.status(500).json({ success: false, message: 'Failed to trigger low stock check.' });
  }
}
