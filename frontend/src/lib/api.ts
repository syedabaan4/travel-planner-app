import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Redirect to login if not already there
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  customerLogin: (username: string, password: string) =>
    api.post('/api/auth/customer/login', { username, password }),
  customerRegister: (data: { name: string; email: string; phone: string; username: string; password: string }) =>
    api.post('/api/auth/customer/register', data),
  adminLogin: (username: string, password: string) =>
    api.post('/api/auth/admin/login', { username, password }),
};

// Customer API
export const customerApi = {
  getAll: () => api.get('/api/customers'),
  getById: (id: number) => api.get(`/api/customers/${id}`),
  getSummary: (id: number) => api.get(`/api/customers/${id}/summary`),
  update: (id: number, data: { name?: string; email?: string; phone?: string; password?: string }) =>
    api.put(`/api/customers/${id}`, data),
  delete: (id: number) => api.delete(`/api/customers/${id}`),
};

// Catalog API
export const catalogApi = {
  getAll: () => api.get('/api/catalogs'),
  getById: (id: number) => api.get(`/api/catalogs/${id}`),
  create: (data: { packageName: string; destination: string; description: string; noOfDays: number; budget: number; departure: string; arrival: string }) =>
    api.post('/api/catalogs', data),
  addHotel: (catalogId: number, data: { hotelId: number; roomsIncluded: number }) =>
    api.post(`/api/catalogs/${catalogId}/hotels`, data),
  addTransport: (catalogId: number, data: { transportId: number; seatsIncluded: number }) =>
    api.post(`/api/catalogs/${catalogId}/transport`, data),
  addFood: (catalogId: number, data: { foodId: number }) =>
    api.post(`/api/catalogs/${catalogId}/food`, data),
};

// Hotel API
export const hotelApi = {
  getAll: () => api.get('/api/hotels'),
  getAvailability: () => api.get('/api/hotels/availability'),
  getById: (id: number) => api.get(`/api/hotels/${id}`),
  create: (data: { hotelName: string; hotelAddress: string; availableRooms: number; rent: number }) =>
    api.post('/api/hotels', data),
  update: (id: number, data: { hotelName?: string; hotelAddress?: string; availableRooms?: number; rent?: number }) =>
    api.put(`/api/hotels/${id}`, data),
  delete: (id: number) => api.delete(`/api/hotels/${id}`),
};

// Transport API
export const transportApi = {
  getAll: () => api.get('/api/transport'),
  getById: (id: number) => api.get(`/api/transport/${id}`),
  create: (data: { type: string; availableSeats: number; fare: number }) =>
    api.post('/api/transport', data),
  update: (id: number, data: { type?: string; availableSeats?: number; fare?: number }) =>
    api.put(`/api/transport/${id}`, data),
  delete: (id: number) => api.delete(`/api/transport/${id}`),
};

// Food API
export const foodApi = {
  getAll: () => api.get('/api/food'),
  getById: (id: number) => api.get(`/api/food/${id}`),
  create: (data: { meals: string; price: number }) =>
    api.post('/api/food', data),
  update: (id: number, data: { meals?: string; price?: number }) =>
    api.put(`/api/food/${id}`, data),
  delete: (id: number) => api.delete(`/api/food/${id}`),
};

// Booking API
export const bookingApi = {
  getAll: () => api.get('/api/bookings'),
  getByCustomer: (customerId: number) => api.get(`/api/bookings/customer/${customerId}`),
  getById: (id: string) => api.get(`/api/bookings/${id}`),
  getCostBreakdown: (id: string) => api.get(`/api/bookings/${id}/total`),
  createFromCatalog: (data: { customerId: number; catalogId: number; bookingDescription: string; checkIn: string; checkOut: string; travelDate: string }) =>
    api.post('/api/bookings/catalog', data),
  createCustom: (data: {
    customerId: number;
    bookingDescription: string;
    hotels?: { hotelId: number; roomsBooked: number; checkIn: string; checkOut: string }[];
    transport?: { transportId: number; seatsBooked: number; travelDate: string }[];
    food?: { foodId: number; quantity: number }[];
  }) => api.post('/api/bookings/custom', data),
  cancel: (id: string, reason: string) => api.post(`/api/bookings/${id}/cancel`, { reason }),
  updateStatus: (id: string, status: string) => api.patch(`/api/bookings/${id}/status`, { status }),
  delete: (id: string) => api.delete(`/api/bookings/${id}`),
};

// Payment API
export const paymentApi = {
  getAll: () => api.get('/api/payments'),
  getByBooking: (bookingId: string) => api.get(`/api/payments/booking/${bookingId}`),
  process: (data: { bookingId: string; method: string; transactionId: string }) =>
    api.post('/api/payments/process', data),
  complete: (paymentId: string, transactionId: string) =>
    api.post(`/api/payments/${paymentId}/complete`, { transactionId }),
  updateStatus: (paymentId: string, data: { status: string; transactionId?: string }) =>
    api.patch(`/api/payments/${paymentId}/status`, data),
};

// Reports API
export const reportsApi = {
  getDashboard: () => api.get('/api/reports/dashboard'),
  getRevenue: () => api.get('/api/reports/revenue'),
};

export default api;
