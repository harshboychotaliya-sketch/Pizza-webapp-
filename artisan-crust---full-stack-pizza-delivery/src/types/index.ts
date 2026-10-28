export type Role = 'customer' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  isVerified: boolean;
}

export type IngredientCategory = 'base' | 'sauce' | 'cheese' | 'veggie';

export interface Ingredient {
  id: string;
  _id?: string;
  name: string;
  category: IngredientCategory;
  price: number;
  quantity: number;
  lowStockThreshold: number;
  description: string;
  isAvailable: boolean;
}

export interface PizzaMenuItem {
  id: string;
  _id?: string;
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
}

export interface CartItem {
  cartItemId: string;
  pizzaId?: string;
  name: string;
  isCustom: boolean;
  quantity: number;
  unitPrice: number;
  ingredients: {
    base: { id: string; name: string; price: number };
    sauce: { id: string; name: string; price: number };
    cheese: { id: string; name: string; price: number };
    veggies: Array<{ id: string; name: string; price: number }>;
  };
  image?: string;
}

export type OrderStatus = 'Order Received' | 'In Kitchen' | 'Sent to Delivery' | 'Delivered' | 'Cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed';

export interface Order {
  id: string;
  _id?: string;
  orderNumber: string;
  userId: string;
  customerDetails: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    postalCode: string;
    notes?: string;
  };
  items: Array<{
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
  }>;
  subtotal: number;
  tax: number;
  deliveryFee: number;
  totalAmount: number;
  paymentMethod?: 'online' | 'cod';
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  statusHistory: Array<{
    status: OrderStatus;
    timestamp: string;
    note?: string;
  }>;
  createdAt: string;
}

export interface AdminStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  revenue: number;
  lowStockCount: number;
  totalIngredients: number;
}
