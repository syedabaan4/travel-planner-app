'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCustomer } from '@/context/AuthContext';
import { catalogAPI, bookingAPI } from '@/services/api';
import { Catalog } from '@/types';

export default function CatalogDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const customer = useCustomer();
  const id = params.id as string;

  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingData, setBookingData] = useState({
    checkIn: '',
    checkOut: '',
    travelDate: '',
    bookingDescription: '',
  });
  const [isBooking, setIsBooking] = useState(false);

  useEffect(() => {
    fetchCatalogDetails();
  }, [id]);

  const fetchCatalogDetails = async () => {
    try {
      const response = await catalogAPI.getById(id);
      setCatalog(response.data);
    } catch (error) {
      console.error('Error fetching catalog:', error);
      alert('Failed to load package details');
    }
    setLoading(false);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setBookingData({
      ...bookingData,
      [e.target.name]: e.target.value,
    });
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!bookingData.checkIn || !bookingData.checkOut || !bookingData.travelDate) {
      alert('Please fill in all required dates');
      return;
    }

    if (!customer || !catalog) return;

    setIsBooking(true);

    try {
      const response = await bookingAPI.createFromCatalog({
        customerId: customer.customerId,
        catalogId: catalog.catalogId,
        bookingDescription: bookingData.bookingDescription || catalog.packageName,
        checkIn: bookingData.checkIn,
        checkOut: bookingData.checkOut,
        travelDate: bookingData.travelDate,
      });

      alert('Booking created successfully!');
      router.push(`/booking/${response.data.bookingId}`);
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Failed to create booking. Please try again.');
    }

    setIsBooking(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 text-lg">Loading package details...</p>
      </div>
    );
  }

  if (!catalog) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 text-lg">Package not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <button
        onClick={() => router.push('/dashboard')}
        className="bg-white border-2 border-gray-200 px-5 py-2.5 rounded-lg mb-8
                   hover:border-primary-500 hover:text-primary-500 transition-colors"
      >
        ← Back to Dashboard
      </button>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Package Info */}
        <div className="lg:col-span-2 bg-white rounded-xl p-10 shadow-md">
          <div className="flex justify-between items-start mb-5">
            <h1 className="text-3xl font-bold text-gray-800">
              {catalog.packageName}
            </h1>
            <span className="bg-primary-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
              {catalog.noOfDays} Days
            </span>
          </div>

          <p className="text-gray-500 text-lg mb-4">📍 {catalog.destination}</p>
          <p className="text-gray-600 leading-relaxed mb-8">{catalog.description}</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
            <div className="bg-gray-50 p-5 rounded-lg text-center">
              <strong className="block text-gray-500 text-sm mb-2">Budget</strong>
              <span className="text-gray-800 text-lg font-semibold">
                PKR {catalog.budget.toLocaleString()}
              </span>
            </div>
            <div className="bg-gray-50 p-5 rounded-lg text-center">
              <strong className="block text-gray-500 text-sm mb-2">Departure</strong>
              <span className="text-gray-800 text-lg font-semibold">
                {new Date(catalog.departure).toLocaleDateString()}
              </span>
            </div>
            <div className="bg-gray-50 p-5 rounded-lg text-center">
              <strong className="block text-gray-500 text-sm mb-2">Return</strong>
              <span className="text-gray-800 text-lg font-semibold">
                {new Date(catalog.arrival).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Included Services */}
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                🏨 Included Hotels
              </h3>
              {catalog.hotels && catalog.hotels.length > 0 ? (
                <ul className="space-y-3">
                  {catalog.hotels.map((hotel) => (
                    <li
                      key={hotel.hotelId}
                      className="bg-gray-50 p-4 rounded-lg"
                    >
                      <strong className="block text-gray-800 mb-1">
                        {hotel.hotelName}
                      </strong>
                      <p className="text-gray-500 text-sm mb-1">{hotel.hotelAddress}</p>
                      <span className="text-gray-400 text-sm">
                        PKR {hotel.rent}/night · {hotel.roomsIncluded} room(s) included
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No hotels included</p>
              )}
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                🚗 Included Transport
              </h3>
              {catalog.transport && catalog.transport.length > 0 ? (
                <ul className="space-y-3">
                  {catalog.transport.map((trans) => (
                    <li
                      key={trans.transportId}
                      className="bg-gray-50 p-4 rounded-lg"
                    >
                      <strong className="block text-gray-800 mb-1">
                        {trans.type.toUpperCase()}
                      </strong>
                      <span className="text-gray-400 text-sm">
                        PKR {trans.fare} · {trans.seatsIncluded} seat(s) included
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No transport included</p>
              )}
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                🍽️ Included Food
              </h3>
              {catalog.food && catalog.food.length > 0 ? (
                <ul className="space-y-3">
                  {catalog.food.map((food) => (
                    <li
                      key={food.foodId}
                      className="bg-gray-50 p-4 rounded-lg"
                    >
                      <strong className="block text-gray-800 mb-1">
                        {food.meals}
                      </strong>
                      <span className="text-gray-400 text-sm">PKR {food.price}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No food plans included</p>
              )}
            </div>
          </div>
        </div>

        {/* Booking Form */}
        <div className="bg-white rounded-xl p-8 shadow-md h-fit sticky top-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">
            Book This Package
          </h2>
          <form onSubmit={handleBooking} className="space-y-5">
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Check-in Date *
              </label>
              <input
                type="date"
                name="checkIn"
                value={bookingData.checkIn}
                onChange={handleInputChange}
                required
                min={new Date().toISOString().split('T')[0]}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Check-out Date *
              </label>
              <input
                type="date"
                name="checkOut"
                value={bookingData.checkOut}
                onChange={handleInputChange}
                required
                min={bookingData.checkIn || new Date().toISOString().split('T')[0]}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Travel Date *
              </label>
              <input
                type="date"
                name="travelDate"
                value={bookingData.travelDate}
                onChange={handleInputChange}
                required
                min={new Date().toISOString().split('T')[0]}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Special Requests (Optional)
              </label>
              <textarea
                name="bookingDescription"
                value={bookingData.bookingDescription}
                onChange={handleInputChange}
                placeholder="Any special requests or notes..."
                rows={4}
                className="input-field resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isBooking}
              className="btn-primary font-semibold"
            >
              {isBooking ? 'Booking...' : 'Confirm Booking'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
