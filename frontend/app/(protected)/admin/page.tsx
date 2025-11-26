'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { bookingAPI, paymentAPI, customerAPI } from '@/services/api';
import Header from '@/components/Header';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Booking, Payment, Customer } from '@/types';

type TabType = 'bookings' | 'payments' | 'customers' | 'catalogs';

function AdminDashboardContent() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('bookings');
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'bookings') {
        const response = await bookingAPI.getAll();
        setBookings(response.data);
      } else if (activeTab === 'payments') {
        const response = await paymentAPI.getAll();
        setPayments(response.data);
      } else if (activeTab === 'customers') {
        const response = await customerAPI.getAll();
        setCustomers(response.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    setLoading(false);
  };

  const updateBookingStatus = async (bookingId: string, status: 'confirmed' | 'cancelled') => {
    try {
      await bookingAPI.updateStatus(bookingId, status);
      alert('Booking status updated successfully');
      fetchData();
    } catch (error) {
      console.error('Error updating booking status:', error);
      alert('Failed to update booking status');
    }
  };

  const viewBookingDetails = (bookingId: string) => {
    router.push(`/booking/${bookingId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header isAdmin />

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-5 py-5 flex flex-wrap gap-3">
        <button
          className={`tab ${activeTab === 'bookings' ? 'active' : ''}`}
          onClick={() => setActiveTab('bookings')}
        >
          Bookings
        </button>
        <button
          className={`tab ${activeTab === 'payments' ? 'active' : ''}`}
          onClick={() => setActiveTab('payments')}
        >
          Payments
        </button>
        <button
          className={`tab ${activeTab === 'customers' ? 'active' : ''}`}
          onClick={() => setActiveTab('customers')}
        >
          Customers
        </button>
        <button
          className={`tab ${activeTab === 'catalogs' ? 'active' : ''}`}
          onClick={() => setActiveTab('catalogs')}
        >
          Manage Catalogs
        </button>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-5 py-5">
        {loading ? (
          <div className="text-center py-16 text-gray-500 text-lg">Loading...</div>
        ) : (
          <>
            {/* Bookings Tab */}
            {activeTab === 'bookings' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">All Bookings</h2>
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-primary-500 text-white">
                        <tr>
                          <th className="px-4 py-4 text-left text-sm font-semibold uppercase tracking-wide">
                            Booking ID
                          </th>
                          <th className="px-4 py-4 text-left text-sm font-semibold uppercase tracking-wide">
                            Customer
                          </th>
                          <th className="px-4 py-4 text-left text-sm font-semibold uppercase tracking-wide">
                            Type
                          </th>
                          <th className="px-4 py-4 text-left text-sm font-semibold uppercase tracking-wide">
                            Date
                          </th>
                          <th className="px-4 py-4 text-left text-sm font-semibold uppercase tracking-wide">
                            Status
                          </th>
                          <th className="px-4 py-4 text-left text-sm font-semibold uppercase tracking-wide">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {bookings.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                              No bookings found
                            </td>
                          </tr>
                        ) : (
                          bookings.map((booking) => (
                            <tr key={booking.bookingId} className="hover:bg-gray-50">
                              <td className="px-4 py-4 text-sm text-gray-600">
                                {booking.bookingId.slice(0, 8)}...
                              </td>
                              <td className="px-4 py-4 text-sm text-gray-600">
                                {booking.customerName}
                              </td>
                              <td className="px-4 py-4 text-sm text-gray-600">
                                {booking.isCustom ? 'Custom' : 'Package'}
                              </td>
                              <td className="px-4 py-4 text-sm text-gray-600">
                                {new Date(booking.bookingDate).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-4">
                                <span className={`status-badge ${booking.status}`}>
                                  {booking.status}
                                </span>
                              </td>
                              <td className="px-4 py-4">
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    onClick={() => viewBookingDetails(booking.bookingId)}
                                    className="px-3 py-1.5 bg-primary-500 text-white text-xs font-semibold rounded hover:bg-primary-600 transition-colors"
                                  >
                                    View
                                  </button>
                                  {booking.status === 'pending' && (
                                    <>
                                      <button
                                        onClick={() =>
                                          updateBookingStatus(booking.bookingId, 'confirmed')
                                        }
                                        className="px-3 py-1.5 bg-green-500 text-white text-xs font-semibold rounded hover:bg-green-600 transition-colors"
                                      >
                                        Confirm
                                      </button>
                                      <button
                                        onClick={() =>
                                          updateBookingStatus(booking.bookingId, 'cancelled')
                                        }
                                        className="px-3 py-1.5 bg-red-500 text-white text-xs font-semibold rounded hover:bg-red-600 transition-colors"
                                      >
                                        Cancel
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Payments Tab */}
            {activeTab === 'payments' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">All Payments</h2>
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-primary-500 text-white">
                        <tr>
                          <th className="px-4 py-4 text-left text-sm font-semibold uppercase tracking-wide">
                            Payment ID
                          </th>
                          <th className="px-4 py-4 text-left text-sm font-semibold uppercase tracking-wide">
                            Customer
                          </th>
                          <th className="px-4 py-4 text-left text-sm font-semibold uppercase tracking-wide">
                            Amount
                          </th>
                          <th className="px-4 py-4 text-left text-sm font-semibold uppercase tracking-wide">
                            Method
                          </th>
                          <th className="px-4 py-4 text-left text-sm font-semibold uppercase tracking-wide">
                            Date
                          </th>
                          <th className="px-4 py-4 text-left text-sm font-semibold uppercase tracking-wide">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {payments.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                              No payments found
                            </td>
                          </tr>
                        ) : (
                          payments.map((payment) => (
                            <tr key={payment.paymentId} className="hover:bg-gray-50">
                              <td className="px-4 py-4 text-sm text-gray-600">
                                {payment.paymentId.slice(0, 8)}...
                              </td>
                              <td className="px-4 py-4 text-sm text-gray-600">
                                {payment.customerName}
                              </td>
                              <td className="px-4 py-4 text-sm text-gray-600 font-medium">
                                PKR {payment.amount.toLocaleString()}
                              </td>
                              <td className="px-4 py-4 text-sm text-gray-600">
                                {payment.method.replace('_', ' ').toUpperCase()}
                              </td>
                              <td className="px-4 py-4 text-sm text-gray-600">
                                {new Date(payment.paymentDate).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-4">
                                <span className={`status-badge ${payment.status}`}>
                                  {payment.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Customers Tab */}
            {activeTab === 'customers' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">All Customers</h2>
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-primary-500 text-white">
                        <tr>
                          <th className="px-4 py-4 text-left text-sm font-semibold uppercase tracking-wide">
                            ID
                          </th>
                          <th className="px-4 py-4 text-left text-sm font-semibold uppercase tracking-wide">
                            Name
                          </th>
                          <th className="px-4 py-4 text-left text-sm font-semibold uppercase tracking-wide">
                            Email
                          </th>
                          <th className="px-4 py-4 text-left text-sm font-semibold uppercase tracking-wide">
                            Phone
                          </th>
                          <th className="px-4 py-4 text-left text-sm font-semibold uppercase tracking-wide">
                            Username
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {customers.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                              No customers found
                            </td>
                          </tr>
                        ) : (
                          customers.map((customer) => (
                            <tr key={customer.customerId} className="hover:bg-gray-50">
                              <td className="px-4 py-4 text-sm text-gray-600">
                                {customer.customerId}
                              </td>
                              <td className="px-4 py-4 text-sm text-gray-800 font-medium">
                                {customer.name}
                              </td>
                              <td className="px-4 py-4 text-sm text-gray-600">
                                {customer.email}
                              </td>
                              <td className="px-4 py-4 text-sm text-gray-600">
                                {customer.phone || '-'}
                              </td>
                              <td className="px-4 py-4 text-sm text-gray-600">
                                {customer.username}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Catalogs Tab */}
            {activeTab === 'catalogs' && (
              <div className="bg-white rounded-xl shadow-md p-10 text-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  Manage Catalog Packages
                </h2>
                <p className="text-gray-500">
                  Coming soon: Add, edit, and delete catalog packages
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <ProtectedRoute adminOnly>
      <AdminDashboardContent />
    </ProtectedRoute>
  );
}
