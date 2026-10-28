import mongoose, { Schema } from 'mongoose';
import { isConnectedToMongo, getLocalDB, saveLocalDB } from '../config/db.js';

export type OrderStatus = 'Order Received' | 'In Kitchen' | 'Sent to Delivery' | 'Delivered' | 'Cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed';

export interface IOrderItem {
  pizzaId?: string;
  name: string;
  isCustom: boolean;
  quantity: number;
  unitPrice: number;
  ingredientsSnapshot: {
    base: { id: string; name: string; price: number };
    sauce: { id: string; name: string; price: number };
    cheese: { id: string; name: string; price: number };
    veggies: Array<{ id: string; name: string; price: number }>;
  };
}

export interface ICustomerDetails {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  notes?: string;
}

export interface IOrder {
  _id?: string;
  id?: string;
  orderNumber: string;
  userId: string;
  customerDetails: ICustomerDetails;
  items: IOrderItem[];
  subtotal: number;
  tax: number;
  deliveryFee: number;
  totalAmount: number;
  paymentMethod?: 'online' | 'cod';
  paymentStatus: PaymentStatus;
  paymentDetails: {
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
    verifiedAt?: Date | null;
  };
  orderStatus: OrderStatus;
  statusHistory: Array<{
    status: OrderStatus;
    timestamp: Date;
    note?: string;
  }>;
  stockDeducted: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const OrderSchema = new Schema<IOrder>({
  orderNumber: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  customerDetails: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: { type: String, required: true },
    notes: { type: String, default: '' }
  },
  items: [
    {
      pizzaId: { type: String },
      name: { type: String, required: true },
      isCustom: { type: Boolean, default: false },
      quantity: { type: Number, required: true },
      unitPrice: { type: Number, required: true },
      ingredientsSnapshot: {
        base: { id: String, name: String, price: Number },
        sauce: { id: String, name: String, price: Number },
        cheese: { id: String, name: String, price: Number },
        veggies: [{ id: String, name: String, price: Number }]
      }
    }
  ],
  subtotal: { type: Number, required: true },
  tax: { type: Number, required: true },
  deliveryFee: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['online', 'cod'], default: 'online' },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
  paymentDetails: {
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    verifiedAt: { type: Date }
  },
  orderStatus: {
    type: String,
    enum: ['Order Received', 'In Kitchen', 'Sent to Delivery', 'Delivered', 'Cancelled'],
    default: 'Order Received'
  },
  statusHistory: [
    {
      status: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
      note: { type: String }
    }
  ],
  stockDeducted: { type: Boolean, default: false }
}, { timestamps: true });

export const MongoOrderModel = mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);

export const OrderModel = {
  async find(filter: any = {}): Promise<IOrder[]> {
    if (isConnectedToMongo) {
      const items = await MongoOrderModel.find(filter).sort({ createdAt: -1 }).lean();
      return items as IOrder[];
    }
    const db = getLocalDB();
    return db.orders
      .filter(item => {
        for (const key in filter) {
          if ((item as any)[key] !== (filter as any)[key]) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map(item => ({ ...item, _id: item.id || item._id }));
  },

  async findById(id: string): Promise<IOrder | null> {
    if (isConnectedToMongo) {
      const item = await MongoOrderModel.findById(id).lean();
      return item as IOrder | null;
    }
    const db = getLocalDB();
    const item = db.orders.find(o => (o.id === id || o._id === id));
    return item ? { ...item, _id: item.id || item._id } : null;
  },

  async findOne(filter: any): Promise<IOrder | null> {
    if (isConnectedToMongo) {
      const item = await MongoOrderModel.findOne(filter).lean();
      return item as IOrder | null;
    }
    const db = getLocalDB();
    const item = db.orders.find(o => {
      for (const key in filter) {
        if (key === 'paymentDetails.razorpayOrderId') {
          if (o.paymentDetails?.razorpayOrderId !== filter[key]) return false;
        } else if ((o as any)[key] !== filter[key]) {
          return false;
        }
      }
      return true;
    });
    return item ? { ...item, _id: item.id || item._id } : null;
  },

  async create(orderData: Partial<IOrder>): Promise<IOrder> {
    if (isConnectedToMongo) {
      const item = await MongoOrderModel.create(orderData);
      return item.toObject();
    }
    const db = getLocalDB();
    const now = new Date();
    const id = 'ord_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const newOrder: IOrder = {
      _id: id,
      id,
      orderNumber: orderData.orderNumber || `CRUST-${Date.now().toString().slice(-6)}`,
      userId: orderData.userId || '',
      customerDetails: orderData.customerDetails!,
      items: orderData.items || [],
      subtotal: Number(orderData.subtotal) || 0,
      tax: Number(orderData.tax) || 0,
      deliveryFee: Number(orderData.deliveryFee) || 0,
      totalAmount: Number(orderData.totalAmount) || 0,
      paymentStatus: orderData.paymentStatus || 'pending',
      paymentDetails: orderData.paymentDetails || {},
      orderStatus: orderData.orderStatus || 'Order Received',
      statusHistory: orderData.statusHistory || [
        {
          status: 'Order Received',
          timestamp: now,
          note: 'Order submitted and awaiting payment confirmation'
        }
      ],
      stockDeducted: !!orderData.stockDeducted,
      createdAt: now,
      updatedAt: now
    };
    db.orders.unshift(newOrder);
    saveLocalDB();
    return newOrder;
  },

  async updateById(id: string, updates: Partial<IOrder>): Promise<IOrder | null> {
    if (isConnectedToMongo) {
      const updated = await MongoOrderModel.findByIdAndUpdate(id, updates, { new: true }).lean();
      return updated as IOrder | null;
    }
    const db = getLocalDB();
    const index = db.orders.findIndex(o => (o.id === id || o._id === id));
    if (index === -1) return null;
    db.orders[index] = {
      ...db.orders[index],
      ...updates,
      updatedAt: new Date()
    };
    saveLocalDB();
    return { ...db.orders[index], _id: db.orders[index].id || db.orders[index]._id };
  }
};
