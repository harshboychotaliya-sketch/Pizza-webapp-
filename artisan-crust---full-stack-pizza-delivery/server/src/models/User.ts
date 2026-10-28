import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { isConnectedToMongo, getLocalDB, saveLocalDB } from '../config/db.js';

export interface IUser {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  password: string;
  role: 'customer' | 'admin';
  isVerified: boolean;
  verificationToken?: string | null;
  verificationTokenExpires?: Date | null;
  resetPasswordToken?: string | null;
  resetPasswordExpires?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
  isVerified: { type: Boolean, default: false },
  verificationToken: { type: String, default: null },
  verificationTokenExpires: { type: Date, default: null },
  resetPasswordToken: { type: String, default: null },
  resetPasswordExpires: { type: Date, default: null },
}, { timestamps: true });

export const MongoUserModel = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

// Hybrid model interface that works with Mongo or local fallback
export const UserModel = {
  async findOne(filter: Partial<IUser>): Promise<IUser | null> {
    if (isConnectedToMongo) {
      const user = await MongoUserModel.findOne(filter).lean();
      return user as IUser | null;
    }
    const db = getLocalDB();
    const user = db.users.find(u => {
      for (const key in filter) {
        if (key === 'email' && filter.email) {
          if (u.email.toLowerCase() !== filter.email.toLowerCase()) return false;
        } else if ((u as any)[key] !== (filter as any)[key]) {
          return false;
        }
      }
      return true;
    });
    return user ? { ...user, _id: user.id || user._id } : null;
  },

  async findById(id: string): Promise<IUser | null> {
    if (isConnectedToMongo) {
      const user = await MongoUserModel.findById(id).lean();
      return user as IUser | null;
    }
    const db = getLocalDB();
    const user = db.users.find(u => (u.id === id || u._id === id));
    return user ? { ...user, _id: user.id || user._id } : null;
  },

  async create(userData: Partial<IUser>): Promise<IUser> {
    if (isConnectedToMongo) {
      const user = await MongoUserModel.create(userData);
      return user.toObject();
    }
    const db = getLocalDB();
    const now = new Date();
    const id = 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const newUser: IUser = {
      _id: id,
      id,
      name: userData.name || '',
      email: (userData.email || '').toLowerCase().trim(),
      password: userData.password || '',
      role: userData.role || 'customer',
      isVerified: !!userData.isVerified,
      verificationToken: userData.verificationToken || null,
      verificationTokenExpires: userData.verificationTokenExpires || null,
      resetPasswordToken: userData.resetPasswordToken || null,
      resetPasswordExpires: userData.resetPasswordExpires || null,
      createdAt: now,
      updatedAt: now
    };
    db.users.push(newUser);
    saveLocalDB();
    return newUser;
  },

  async updateById(id: string, updates: Partial<IUser>): Promise<IUser | null> {
    if (isConnectedToMongo) {
      const updated = await MongoUserModel.findByIdAndUpdate(id, updates, { new: true }).lean();
      return updated as IUser | null;
    }
    const db = getLocalDB();
    const index = db.users.findIndex(u => (u.id === id || u._id === id));
    if (index === -1) return null;
    db.users[index] = {
      ...db.users[index],
      ...updates,
      updatedAt: new Date()
    };
    saveLocalDB();
    return { ...db.users[index], _id: db.users[index].id || db.users[index]._id };
  },

  async count(): Promise<number> {
    if (isConnectedToMongo) {
      return MongoUserModel.countDocuments();
    }
    return getLocalDB().users.length;
  }
};
