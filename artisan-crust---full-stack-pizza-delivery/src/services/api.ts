import axios from 'axios';
import { User, Ingredient, PizzaMenuItem, Order, AdminStats } from '../types';

const API_BASE = '/api';

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to inject JWT from localStorage
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('artisan_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authApi = {
  async register(data: { name: string; email: string; password: string }) {
    const res = await apiClient.post('/auth/register', data);
    return res.data;
  },
  async verifyEmail(data: { token: string; email?: string }) {
    const res = await apiClient.post('/auth/verify-email', data);
    return res.data;
  },
  async login(data: { email: string; password: string }) {
    const res = await apiClient.post('/auth/login', data);
    return res.data;
  },
  async googleLogin(data: { credential?: string; email?: string; name?: string; picture?: string }) {
    const res = await apiClient.post('/auth/google', data);
    return res.data;
  },
  async forgotPassword(email: string) {
    const res = await apiClient.post('/auth/forgot-password', { email });
    return res.data;
  },
  async resetPassword(data: { token: string; email?: string; newPassword: string }) {
    const res = await apiClient.post('/auth/reset-password', data);
    return res.data;
  },
  async getProfile() {
    const res = await apiClient.get<{ success: boolean; user: User }>('/auth/profile');
    return res.data;
  },
  async getDevMailbox() {
    const res = await apiClient.get('/auth/dev-mailbox');
    return res.data;
  },
  async verifyAdminPasscode(data: { passcode: string; email?: string }) {
    const res = await apiClient.post('/auth/admin-verify', data);
    return res.data;
  }
};

// Menu & Ingredients API
export const menuApi = {
  async getMenu(): Promise<PizzaMenuItem[]> {
    const res = await apiClient.get<{ success: boolean; pizzas: PizzaMenuItem[] }>('/menu');
    return res.data.pizzas || [];
  },
  async getIngredients(): Promise<{
    all: Ingredient[];
    bases: Ingredient[];
    sauces: Ingredient[];
    cheeses: Ingredient[];
    veggies: Ingredient[];
  }> {
    const res = await apiClient.get('/menu/ingredients');
    return {
      all: res.data.ingredients || [],
      bases: res.data.grouped?.bases || [],
      sauces: res.data.grouped?.sauces || [],
      cheeses: res.data.grouped?.cheeses || [],
      veggies: res.data.grouped?.veggies || []
    };
  },
  async validateCustomPizza(data: { baseId: string; sauceId: string; cheeseId: string; veggieIds: string[] }) {
    const res = await apiClient.post('/menu/validate-custom', data);
    return res.data;
  }
};

// Orders API
export const orderApi = {
  async createOrder(data: { items: any[]; customerDetails: any; paymentMethod?: 'online' | 'cod' }) {
    const res = await apiClient.post('/orders', data);
    return res.data;
  },
  async verifyPayment(data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    orderId?: string;
  }) {
    const res = await apiClient.post('/orders/verify-payment', data);
    return res.data;
  },
  async payOnline(orderId: string) {
    const res = await apiClient.post(`/orders/${orderId}/pay-online`);
    return res.data;
  },
  async getMyOrders(): Promise<Order[]> {
    const res = await apiClient.get<{ success: boolean; orders: Order[] }>('/orders/my-orders');
    return res.data.orders || [];
  },
  async trackOrder(id: string): Promise<Order> {
    const res = await apiClient.get<{ success: boolean; order: Order }>(`/orders/${id}/track`);
    return res.data.order;
  }
};

// Admin API
export const adminApi = {
  async getStats(): Promise<{ stats: AdminStats; lowStockItems: Ingredient[] }> {
    const res = await apiClient.get('/admin/stats');
    return res.data;
  },
  async getAllOrders(): Promise<Order[]> {
    const res = await apiClient.get<{ success: boolean; orders: Order[] }>('/admin/orders');
    return res.data.orders || [];
  },
  async updateOrderStatus(id: string, status: string, note?: string) {
    const res = await apiClient.patch(`/admin/orders/${id}/status`, { status, note });
    return res.data;
  },
  async updatePaymentStatus(id: string, paymentStatus: 'paid' | 'pending' | 'failed', note?: string) {
    const res = await apiClient.patch(`/admin/orders/${id}/payment`, { paymentStatus, note });
    return res.data;
  },
  async getInventory(): Promise<Ingredient[]> {
    const res = await apiClient.get<{ success: boolean; ingredients: Ingredient[] }>('/admin/inventory');
    return res.data.ingredients || [];
  },
  async createIngredient(data: Partial<Ingredient>) {
    const res = await apiClient.post('/admin/inventory', data);
    return res.data;
  },
  async updateIngredient(id: string, data: Partial<Ingredient>) {
    const res = await apiClient.put(`/admin/inventory/${id}`, data);
    return res.data;
  },
  async adjustStock(id: string, delta: number) {
    const res = await apiClient.post(`/admin/inventory/${id}/adjust-stock`, { delta });
    return res.data;
  },
  async checkLowStock() {
    const res = await apiClient.post('/admin/check-low-stock');
    return res.data;
  }
};
