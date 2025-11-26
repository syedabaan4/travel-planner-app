import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import {
  Catalog,
  Hotel,
  Transport,
  Food,
  Booking,
  Payment,
  Customer,
  LoginResponse,
  RegisterData,
  CreateCatalogBookingData,
  CreateCustomBookingData,
  CreatePaymentData,
  BookingStatus,
  PaymentStatus,
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests automatically
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('role');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  customerRegister: (data: RegisterData) =>
    api.post('/auth/customer/register', data),

  customerLogin: (data: { username: string; password: string }) =>
    api.post<LoginResponse>('/auth/customer/login', data),

  adminLogin: (data: { username: string; password: string }) =>
    api.post<LoginResponse>('/auth/admin/login', data),
};

// Catalog API
export const catalogAPI = {
  getAll: () =>
    api.get<Catalog[]>('/catalogs'),

  getById: (id: string) =>
    api.get<Catalog>(`/catalogs/${id}`),

  create: (data: Partial<Catalog>) =>
    api.post<Catalog>('/catalogs', data),

  update: (id: string, data: Partial<Catalog>) =>
    api.put<Catalog>(`/catalogs/${id}`, data),

  delete: (id: string) =>
    api.delete(`/catalogs/${id}`),
};

// Hotel API
export const hotelAPI = {
  getAll: () =>
    api.get<Hotel[]>('/hotels'),

  getById: (id: string) =>
    api.get<Hotel>(`/hotels/${id}`),

  create: (data: Partial<Hotel>) =>
    api.post<Hotel>('/hotels', data),

  update: (id: string, data: Partial<Hotel>) =>
    api.put<Hotel>(`/hotels/${id}`, data),

  delete: (id: string) =>
    api.delete(`/hotels/${id}`),
};

// Transport API
export const transportAPI = {
  getAll: () =>
    api.get<Transport[]>('/transport'),

  getById: (id: string) =>
    api.get<Transport>(`/transport/${id}`),

  create: (data: Partial<Transport>) =>
    api.post<Transport>('/transport', data),

  update: (id: string, data: Partial<Transport>) =>
    api.put<Transport>(`/transport/${id}`, data),

  delete: (id: string) =>
    api.delete(`/transport/${id}`),
};

// Food API
export const foodAPI = {
  getAll: () =>
    api.get<Food[]>('/food'),

  getById: (id: string) =>
    api.get<Food>(`/food/${id}`),

  create: (data: Partial<Food>) =>
    api.post<Food>('/food', data),

  update: (id: string, data: Partial<Food>) =>
    api.put<Food>(`/food/${id}`, data),

  delete: (id: string) =>
    api.delete(`/food/${id}`),
};

// Booking API
export const bookingAPI = {
  getAll: () =>
    api.get<Booking[]>('/bookings'),

  getByCustomerId: (customerId: string) =>
    api.get<Booking[]>(`/bookings/customer/${customerId}`),

  getById: (id: string) =>
    api.get<Booking>(`/bookings/${id}`),

  createFromCatalog: (data: CreateCatalogBookingData) =>
    api.post<Booking>('/bookings/catalog', data),

  createCustom: (data: CreateCustomBookingData) =>
    api.post<Booking>('/bookings/custom', data),

  updateStatus: (id: string, status: BookingStatus) =>
    api.patch<Booking>(`/bookings/${id}/status`, { status }),

  delete: (id: string) =>
    api.delete(`/bookings/${id}`),
};

// Payment API
export const paymentAPI = {
  getAll: () =>
    api.get<Payment[]>('/payments'),

  getByBookingId: (bookingId: string) =>
    api.get<Payment>(`/payments/booking/${bookingId}`),

  create: (data: CreatePaymentData) =>
    api.post<Payment>('/payments', data),

  updateStatus: (id: string, status: PaymentStatus, transactionId?: string) =>
    api.patch<Payment>(`/payments/${id}/status`, { status, transactionId }),
};

// Customer API
export const customerAPI = {
  getAll: () =>
    api.get<Customer[]>('/customers'),

  getById: (id: string) =>
    api.get<Customer>(`/customers/${id}`),

  update: (id: string, data: Partial<Customer>) =>
    api.put<Customer>(`/customers/${id}`, data),

  delete: (id: string) =>
    api.delete(`/customers/${id}`),
};

export default api;
