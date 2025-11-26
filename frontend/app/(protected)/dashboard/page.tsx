'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useCustomer } from '@/context/AuthContext';
import { catalogAPI, bookingAPI } from '@/services/api';
import Header from '@/components/Header';
import { Catalog, Booking } from '@/types';

export default function DashboardPage() {
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<'catalogs' | 'bookings'>('catalogs');
  const [loading, setLoading] = useState(true);

  const customer = useCustomer();
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, [activeTab, customer]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'catalogs') {
        const response = await catalogAPI.getAll();
        setCatalogs(response.data);
      } else if (activeTab === 'bookings' && customer) {
        const response = await bookingAPI.getByCustomerId(customer.customerId);
        setMyBookings(response.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    setLoading(false);
  };

  const viewCatalogDetails = (catalogId: string) => {
    router.push(`/catalog/${catalogId}`);
  };

  const viewBookingDetails = (bookingId: string) => {
    router.push(`/booking/${bookingId}`);
  };

  const createCustomBooking = () => {
    router.push('/custom-booking');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-5 py-5 flex gap-3">
        <button
          className={`tab ${activeTab === 'catalogs' ? 'active' : ''}`}
          onClick={() => setActiveTab('catalogs')}
        >
          Browse Packages
        </button>
        <button
          className={`tab ${activeTab === 'bookings' ? 'active' : ''}`}
          onClick={() => setActiveTab('bookings')}
        >
          My Bookings
        </button>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-5 py-5">
        {loading ? (
          <div className="text-center py-16 text-gray-500 text-lg">
            Loading...
          </div>
        ) : (
          <>
            {/* Catalogs Tab */}
            {activeTab === 'catalogs' && (
              <div>
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-800">
                    Available Travel Packages
                  </h2>
                  <button onClick={createCustomBooking} className="btn-secondary">
                    Create Custom Trip
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {catalogs.length === 0 ? (
                    <p className="text-gray-500 col-span-full text-center py-10">
                      No packages available at the moment.
                    </p>
                  ) : (
                    catalogs.map((catalog) => (
                      <div
                        key={catalog.catalogId}
                        className="card hover:-translate-y-1 transition-transform duration-300"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="text-xl font-semibold text-gray-800">
                            {catalog.packageName}
                          </h3>
                          <span className="bg-primary-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                            {catalog.noOfDays} Days
                          </span>
                        </div>
                        <p className="text-gray-500 text-sm mb-2">
                          📍 {catalog.destination}
                        </p>
                        <p className="text-gray-600 text-sm leading-relaxed mb-5 line-clamp-2">
                          {catalog.description}
                        </p>
                        <div className="bg-gray-50 p-4 rounded-lg mb-5 space-y-2">
                          <div className="text-sm text-gray-600">
                            <strong>Budget:</strong> PKR {catalog.budget.toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-600">
                            <strong>Departure:</strong>{' '}
                            {new Date(catalog.departure).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-gray-600">
                            <strong>Return:</strong>{' '}
                            {new Date(catalog.arrival).toLocaleDateString()}
                          </div>
                        </div>
                        <button
                          onClick={() => viewCatalogDetails(catalog.catalogId)}
                          className="btn-primary"
                        >
                          View Details & Book
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Bookings Tab */}
            {activeTab === 'bookings' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-8">My Bookings</h2>

                {myBookings.length === 0 ? (
                  <div className="text-center py-16">
                    <p className="text-gray-500 text-lg mb-5">
                      You haven&apos;t made any bookings yet.
                    </p>
                    <button
                      onClick={() => setActiveTab('catalogs')}
                      className="btn-primary max-w-xs mx-auto"
                    >
                      Browse Packages
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-5">
                    {myBookings.map((booking) => (
                      <div key={booking.bookingId} className="card">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-xl font-semibold text-gray-800">
                            {booking.isCustom ? '✏️ Custom Trip' : '📦 Package Booking'}
                          </h3>
                          <span className={`status-badge ${booking.status}`}>
                            {booking.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-4">{booking.bookingDescription}</p>
                        <div className="flex gap-8 mb-5 text-sm text-gray-500">
                          <span>
                            <strong>Booking Date:</strong>{' '}
                            {new Date(booking.bookingDate).toLocaleDateString()}
                          </span>
                          <span>
                            <strong>Booking ID:</strong>{' '}
                            {booking.bookingId.slice(0, 8)}...
                          </span>
                        </div>
                        <button
                          onClick={() => viewBookingDetails(booking.bookingId)}
                          className="btn-secondary"
                        >
                          View Details
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
