import mongoose, { Schema } from 'mongoose';
import { isConnectedToMongo, getLocalDB, saveLocalDB } from '../config/db.js';

export type IngredientCategory = 'base' | 'sauce' | 'cheese' | 'veggie';

export interface IIngredient {
  _id?: string;
  id?: string;
  name: string;
  category: IngredientCategory;
  price: number;
  quantity: number;
  lowStockThreshold: number;
  description: string;
  isAvailable: boolean;
  lastAlertSentAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const IngredientSchema = new Schema<IIngredient>({
  name: { type: String, required: true },
  category: { type: String, enum: ['base', 'sauce', 'cheese', 'veggie'], required: true },
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 0 },
  lowStockThreshold: { type: Number, default: 10 },
  description: { type: String, default: '' },
  isAvailable: { type: Boolean, default: true },
  lastAlertSentAt: { type: Date, default: null }
}, { timestamps: true });

export const MongoIngredientModel = mongoose.models.Ingredient || mongoose.model<IIngredient>('Ingredient', IngredientSchema);

export const IngredientModel = {
  async find(filter: Partial<IIngredient> = {}): Promise<IIngredient[]> {
    if (isConnectedToMongo) {
      const items = await MongoIngredientModel.find(filter).lean();
      return items as IIngredient[];
    }
    const db = getLocalDB();
    return db.ingredients
      .filter(item => {
        for (const key in filter) {
          if ((item as any)[key] !== (filter as any)[key]) return false;
        }
        return true;
      })
      .map(item => ({ ...item, _id: item.id || item._id }));
  },

  async findById(id: string): Promise<IIngredient | null> {
    if (isConnectedToMongo) {
      const item = await MongoIngredientModel.findById(id).lean();
      return item as IIngredient | null;
    }
    const db = getLocalDB();
    const item = db.ingredients.find(i => (i.id === id || i._id === id));
    return item ? { ...item, _id: item.id || item._id } : null;
  },

  async create(data: Partial<IIngredient>): Promise<IIngredient> {
    if (isConnectedToMongo) {
      const item = await MongoIngredientModel.create(data);
      return item.toObject();
    }
    const db = getLocalDB();
    const now = new Date();
    const id = 'ing_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const newItem: IIngredient = {
      _id: id,
      id,
      name: data.name || '',
      category: data.category as IngredientCategory,
      price: Number(data.price) || 0,
      quantity: Number(data.quantity) || 0,
      lowStockThreshold: Number(data.lowStockThreshold) || 10,
      description: data.description || '',
      isAvailable: Number(data.quantity) > 0,
      lastAlertSentAt: null,
      createdAt: now,
      updatedAt: now
    };
    db.ingredients.push(newItem);
    saveLocalDB();
    return newItem;
  },

  async updateById(id: string, updates: Partial<IIngredient>): Promise<IIngredient | null> {
    if (isConnectedToMongo) {
      if (typeof updates.quantity === 'number') {
        updates.isAvailable = updates.quantity > 0;
      }
      const updated = await MongoIngredientModel.findByIdAndUpdate(id, updates, { new: true }).lean();
      return updated as IIngredient | null;
    }
    const db = getLocalDB();
    const index = db.ingredients.findIndex(i => (i.id === id || i._id === id));
    if (index === -1) return null;
    const current = db.ingredients[index];
    const newQty = updates.quantity !== undefined ? Number(updates.quantity) : current.quantity;
    db.ingredients[index] = {
      ...current,
      ...updates,
      quantity: newQty,
      isAvailable: newQty > 0,
      updatedAt: new Date()
    };
    saveLocalDB();
    return { ...db.ingredients[index], _id: db.ingredients[index].id || db.ingredients[index]._id };
  },

  async deleteById(id: string): Promise<boolean> {
    if (isConnectedToMongo) {
      const res = await MongoIngredientModel.findByIdAndDelete(id);
      return !!res;
    }
    const db = getLocalDB();
    const beforeCount = db.ingredients.length;
    db.ingredients = db.ingredients.filter(i => (i.id !== id && i._id !== id));
    saveLocalDB();
    return db.ingredients.length < beforeCount;
  },

  // Atomic stock check and deduction
  async deductStock(itemsToDeduct: { ingredientId: string; amount: number }[]): Promise<{ success: boolean; error?: string }> {
    if (isConnectedToMongo) {
      // In MongoDB, verify each item has sufficient quantity
      for (const item of itemsToDeduct) {
        const doc = await MongoIngredientModel.findById(item.ingredientId);
        if (!doc) {
          return { success: false, error: `Ingredient ${item.ingredientId} not found.` };
        }
        if (doc.quantity < item.amount) {
          return { success: false, error: `Insufficient stock for ${doc.name}. Available: ${doc.quantity}, Requested: ${item.amount}` };
        }
      }

      // Decrement atomically
      for (const item of itemsToDeduct) {
        await MongoIngredientModel.findByIdAndUpdate(item.ingredientId, {
          $inc: { quantity: -item.amount }
        });
        const updated = await MongoIngredientModel.findById(item.ingredientId);
        if (updated && updated.quantity <= 0) {
          await MongoIngredientModel.findByIdAndUpdate(item.ingredientId, { isAvailable: false });
        }
      }
      return { success: true };
    }

    const db = getLocalDB();
    // Validate first
    for (const item of itemsToDeduct) {
      const ing = db.ingredients.find(i => (i.id === item.ingredientId || i._id === item.ingredientId));
      if (!ing) {
        return { success: false, error: `Ingredient not found.` };
      }
      if (ing.quantity < item.amount) {
        return { success: false, error: `Insufficient stock for ${ing.name}. Available: ${ing.quantity}` };
      }
    }

    // Apply decrements
    for (const item of itemsToDeduct) {
      const ing = db.ingredients.find(i => (i.id === item.ingredientId || i._id === item.ingredientId))!;
      ing.quantity -= item.amount;
      ing.isAvailable = ing.quantity > 0;
      ing.updatedAt = new Date();
    }
    saveLocalDB();
    return { success: true };
  },

  async getLowStockItems(): Promise<IIngredient[]> {
    if (isConnectedToMongo) {
      const items = await MongoIngredientModel.find({
        $expr: { $lte: ['$quantity', '$lowStockThreshold'] }
      }).lean();
      return items as IIngredient[];
    }
    const db = getLocalDB();
    return db.ingredients
      .filter(item => item.quantity <= (item.lowStockThreshold || 10))
      .map(item => ({ ...item, _id: item.id || item._id }));
  }
};
