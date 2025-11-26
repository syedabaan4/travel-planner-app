// User types
export interface Customer {
  customerId: string;
  name: string;
  email: string;
  phone?: string;
  username: string;
}

export interface Admin {
  adminId: string;
  name: string;
  username: string;
}

export type User = Customer | Admin;

export type UserRole = 'admin' | 'customer';

// Auth types
export interface AuthState {
  user: User | null;
  token: string | null;
  role: UserRole | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isCustomer: boolean;
  login: (username: string, password: string, isAdmin?: boolean) => Promise<AuthResult>;
  register: (userData: RegisterData) => Promise<AuthResult>;
  logout: () => void;
}

export interface AuthResult {
  success: boolean;
  message?: string;
}

export interface RegisterData {
  name: string;
  email: string;
  phone?: string;
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  customer?: Customer;
  admin?: Admin;
}

// Catalog/Package types
export interface Catalog {
  catalogId: string;
  packageName: string;
  destination: string;
  description: string;
  budget: number;
  noOfDays: number;
  departure: string;
  arrival: string;
  hotels?: CatalogHotel[];
  transport?: CatalogTransport[];
  food?: CatalogFood[];
}

export interface CatalogHotel extends Hotel {
  roomsIncluded: number;
}

export interface CatalogTransport extends Transport {
  seatsIncluded: number;
}

export interface CatalogFood extends Food {
  quantity?: number;
}

// Hotel types
export interface Hotel {
  hotelId: string;
  hotelName: string;
  hotelAddress: string;
  rent: number;
  noOfRooms: number;
}

// Transport types
export interface Transport {
  transportId: string;
  type: string;
  fare: number;
  noOfSeats: number;
}

// Food types
export interface Food {
  foodId: string;
  meals: string;
  price: number;
}

// Booking types
export interface Booking {
  bookingId: string;
  customerId: string;
  customerName?: string;
  catalogId?: string;
  packageName?: string;
  bookingDescription: string;
  bookingDate: string;
  status: BookingStatus;
  isCustom: boolean;
  hotels?: BookingHotel[];
  transport?: BookingTransport[];
  food?: BookingFood[];
  payment?: Payment;
}

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';

export interface BookingHotel {
  hotelId: string;
  hotelName: string;
  hotelAddress?: string;
  rent: number;
  roomsBooked: number;
  checkIn: string;
  checkOut: string;
}

export interface BookingTransport {
  transportId: string;
  type: string;
  fare: number;
  seatsBooked: number;
  travelDate: string;
}

export interface BookingFood {
  foodId: string;
  meals: string;
  price: number;
  quantity: number;
}

// Create booking types
export interface CreateCatalogBookingData {
  customerId: string;
  catalogId: string;
  bookingDescription: string;
  checkIn: string;
  checkOut: string;
  travelDate: string;
}

export interface CreateCustomBookingData {
  customerId: string;
  bookingDescription: string;
  hotels: SelectedHotel[];
  transport: SelectedTransport[];
  food: SelectedFood[];
}

export interface SelectedHotel {
  hotelId: string;
  hotelName?: string;
  rent?: number;
  roomsBooked: number;
  checkIn: string;
  checkOut: string;
}

export interface SelectedTransport {
  transportId: string;
  type?: string;
  fare?: number;
  seatsBooked: number;
  travelDate: string;
}

export interface SelectedFood {
  foodId: string;
  meals?: string;
  price?: number;
  quantity: number;
}

// Payment types
export interface Payment {
  paymentId: string;
  bookingId: string;
  customerId?: string;
  customerName?: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  paymentDate: string;
  transactionId?: string;
}

export type PaymentMethod = 'credit_card' | 'debit_card' | 'paypal' | 'bank_transfer';
export type PaymentStatus = 'pending' | 'completed' | 'failed';

export interface CreatePaymentData {
  bookingId: string;
  amount: number;
  method: PaymentMethod;
  transactionId?: string;
}

// API Response types
export interface ApiError {
  message: string;
  status?: number;
}
