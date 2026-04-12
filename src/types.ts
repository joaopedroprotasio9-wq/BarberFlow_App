export interface Barbershop {
  id: string;
  name: string;
  slug: string; // URL handle
  ownerUid: string;
  email: string;
  subscriptionStatus: 'active' | 'trial' | 'expired' | 'past_due' | 'canceled' | 'unpaid';
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionEndDate?: string;
  createdAt: string;
  businessHours: {
    start: string; // e.g., "09:00"
    end: string;   // e.g., "18:00"
  };
}

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number; // in minutes
  barbershopId: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  lastVisit?: string;
  visitCount: number;
  totalSpent: number;
  points: number;
  barbershopId: string;
}

export interface Appointment {
  id: string;
  clientId: string;
  clientName: string;
  serviceId: string;
  serviceName: string;
  price: number;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  barbershopId: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  price: number;
  stock: number;
  minStock: number;
  barbershopId: string;
}

export interface Sale {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  totalPrice: number;
  date: string;
  barbershopId: string;
}
