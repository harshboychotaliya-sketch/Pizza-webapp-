import mongoose, { Schema } from 'mongoose';
import { isConnectedToMongo, getLocalDB, saveLocalDB } from '../config/db.js';

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

export interface IPizzaMenu {
  _id?: string;
  id?: string;
  name: string;
  slug?: string;
  badge?: string;
  description: string;
  category: 'classic' | 'specialty' | 'vegetarian' | 'gourmet';
  basePrice: number;
  image: string;
  defaultIngredients: {
    baseName: string;
    sauceName: string;
    cheeseName: string;
    veggieNames: string[];
  };
  isAvailable: boolean;
  isFeatured?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const PizzaMenuSchema = new Schema<IPizzaMenu>({
  name: { type: String, required: true },
  slug: { type: String, unique: true, sparse: true },
  badge: { type: String },
  description: { type: String, required: true },
  category: { type: String, enum: ['classic', 'specialty', 'vegetarian', 'gourmet'], required: true },
  basePrice: { type: Number, required: true },
  image: { type: String, required: true },
  defaultIngredients: {
    baseName: { type: String, required: true },
    sauceName: { type: String, required: true },
    cheeseName: { type: String, required: true },
    veggieNames: [{ type: String }]
  },
  isAvailable: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false }
}, { timestamps: true });

export const MongoPizzaMenuModel = mongoose.models.PizzaMenu || mongoose.model<IPizzaMenu>('PizzaMenu', PizzaMenuSchema);

export const PizzaMenuModel = {
  async find(filter: Partial<IPizzaMenu> = {}): Promise<IPizzaMenu[]> {
    if (isConnectedToMongo) {
      const items = await MongoPizzaMenuModel.find(filter).lean();
      return (items as IPizzaMenu[]).map(item => ({
        ...item,
        slug: item.slug || slugify(item.name)
      }));
    }
    const db = getLocalDB();
    return db.pizzas
      .filter(item => {
        for (const key in filter) {
          if ((item as any)[key] !== (filter as any)[key]) return false;
        }
        return true;
      })
      .map(item => ({
        ...item,
        _id: item.id || item._id,
        id: item.id || item._id,
        slug: item.slug || slugify(item.name)
      }));
  },

  async findById(id: string): Promise<IPizzaMenu | null> {
    if (isConnectedToMongo) {
      const item = await MongoPizzaMenuModel.findById(id).lean();
      if (!item) return null;
      return { ...item, slug: item.slug || slugify(item.name) } as IPizzaMenu;
    }
    const db = getLocalDB();
    const item = db.pizzas.find(p => (p.id === id || p._id === id));
    if (!item) return null;
    return {
      ...item,
      _id: item.id || item._id,
      id: item.id || item._id,
      slug: item.slug || slugify(item.name)
    };
  },

  async findBySlugOrId(identifier: string): Promise<IPizzaMenu | null> {
    const clean = identifier.trim().toLowerCase();
    if (isConnectedToMongo) {
      const item = await MongoPizzaMenuModel.findOne({
        $or: [
          { slug: clean },
          { _id: identifier },
          { name: { $regex: new RegExp(`^${clean}$`, 'i') } }
        ]
      }).lean();
      if (!item) return null;
      return { ...item, slug: item.slug || slugify(item.name) } as IPizzaMenu;
    }

    const db = getLocalDB();
    const item = db.pizzas.find(p => {
      const currentSlug = p.slug || slugify(p.name);
      return (
        currentSlug === clean ||
        p.id === identifier ||
        p._id === identifier ||
        p.name.toLowerCase() === clean
      );
    });
    if (!item) return null;
    return {
      ...item,
      _id: item.id || item._id,
      id: item.id || item._id,
      slug: item.slug || slugify(item.name)
    };
  },

  async create(data: Partial<IPizzaMenu>): Promise<IPizzaMenu> {
    const rawSlug = data.slug && data.slug.trim().length > 0 ? slugify(data.slug) : slugify(data.name || 'artisan-pizza');
    let uniqueSlug = rawSlug;
    
    if (isConnectedToMongo) {
      let counter = 1;
      while (await MongoPizzaMenuModel.findOne({ slug: uniqueSlug })) {
        uniqueSlug = `${rawSlug}-${counter++}`;
      }
      const item = await MongoPizzaMenuModel.create({
        ...data,
        slug: uniqueSlug
      });
      return item.toObject();
    }

    const db = getLocalDB();
    let counter = 1;
    while (db.pizzas.some(p => (p.slug || slugify(p.name)) === uniqueSlug)) {
      uniqueSlug = `${rawSlug}-${counter++}`;
    }

    const now = new Date();
    const id = 'pza_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const newPizza: IPizzaMenu = {
      _id: id,
      id,
      name: data.name || '',
      slug: uniqueSlug,
      badge: data.badge || '',
      description: data.description || '',
      category: data.category || 'classic',
      basePrice: Number(data.basePrice) || 0,
      image: data.image || '/src/assets/images/pizza_margherita_classic_1792929165993.jpg',
      defaultIngredients: data.defaultIngredients || {
        baseName: 'Thin Crust Sourdough',
        sauceName: 'San Marzano Tomato',
        cheeseName: 'Fior di Latte Mozzarella',
        veggieNames: []
      },
      isAvailable: data.isAvailable !== undefined ? data.isAvailable : true,
      isFeatured: Boolean(data.isFeatured),
      createdAt: now,
      updatedAt: now
    };
    db.pizzas.push(newPizza);
    saveLocalDB();
    return newPizza;
  },

  async updateById(id: string, updateData: Partial<IPizzaMenu>): Promise<IPizzaMenu | null> {
    if (isConnectedToMongo) {
      if (updateData.slug) {
        updateData.slug = slugify(updateData.slug);
      }
      const updated = await MongoPizzaMenuModel.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true }
      ).lean();
      return (updated as IPizzaMenu) || null;
    }

    const db = getLocalDB();
    const index = db.pizzas.findIndex(p => p.id === id || p._id === id);
    if (index === -1) return null;

    const existing = db.pizzas[index];
    const targetSlug = updateData.slug ? slugify(updateData.slug) : (existing.slug || slugify(existing.name));

    const updatedPizza: IPizzaMenu = {
      ...existing,
      ...updateData,
      slug: targetSlug,
      updatedAt: new Date()
    };

    db.pizzas[index] = updatedPizza;
    saveLocalDB();
    return updatedPizza;
  },

  async deleteById(id: string): Promise<boolean> {
    if (isConnectedToMongo) {
      const res = await MongoPizzaMenuModel.findByIdAndDelete(id);
      return Boolean(res);
    }
    const db = getLocalDB();
    const initialLen = db.pizzas.length;
    db.pizzas = db.pizzas.filter(p => p.id !== id && p._id !== id);
    if (db.pizzas.length !== initialLen) {
      saveLocalDB();
      return true;
    }
    return false;
  }
};
