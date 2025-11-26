'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { bookingAPI, paymentAPI } from '@/services/api';
import { Booking, PaymentMethod } from '@/types';

export default function BookingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const id = params.id as string;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    method: 'credit_card' as PaymentMethod,
    transactionId: '',
  });

  useEffect(() => {
    fetchBookingDetails();
  }, [id]);

  const fetchBookingDetails = async () => {
    try {
      const response = await bookingAPI.getById(id);
      setBooking(response.data);

      // Calculate total amount if no payment exists
      if (!response.data.payment) {
        const totalAmount = calculateTotal(response.data);
        setPaymentData((prev) => ({ ...prev, amount: totalAmount.toString() }));
      }
    } catch (error) {
      console.error('Error fetching booking:', error);
      alert('Failed to load booking details');
    }
    setLoading(false);
  };

  const calculateTotal = (bookingData: Booking): number => {
    let total = 0;

    // Add hotel costs
    if (bookingData.hotels) {
      bookingData.hotels.forEach((hotel) => {
        const nights = calculateNights(hotel.checkIn, hotel.checkOut);
        total += hotel.rent * hotel.roomsBooked * nights;
      });
    }

    // Add transport costs
    if (bookingData.transport) {
      bookingData.transport.forEach((trans) => {
        total += trans.fare * trans.seatsBooked;
      });
    }

    // Add food costs
    if (bookingData.food) {
      bookingData.food.forEach((food) => {
        total += food.price * food.quantity;
      });
    }

    return total;
  };

  const calculateNights = (checkIn: string, checkOut: string): number => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays || 1;
  };

  const handleCancelBooking = async () => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      await bookingAPI.updateStatus(id, 'cancelled');
      alert('Booking cancelled successfully');
      fetchBookingDetails();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert('Failed to cancel booking');
    }
  };

  const handleConfirmBooking = async () => {
    try {
      await bookingAPI.updateStatus(id, 'confirmed');
      alert('Booking confirmed successfully');
      fetchBookingDetails();
    } catch (error) {
      console.error('Error confirming booking:', error);
      alert('Failed to confirm booking');
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await paymentAPI.create({
        bookingId: id,
        amount: parseFloat(paymentData.amount),
        method: paymentData.method,
        transactionId: paymentData.transactionId || undefined,
      });

      alert('Payment submitted successfully!');
      setShowPaymentForm(false);
      fetchBookingDetails();
    } catch (error) {
      console.error('Error creating payment:', error);
      alert('Failed to process payment');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 text-lg">Loading booking details...</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 text-lg">Booking not found</p>
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
        {/* Booking Info */}
        <div className="lg:col-span-2 bg-white rounded-xl p-10 shadow-md">
          <div className="flex justify-between items-start mb-8 pb-5 border-b-2 border-gray-100">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                {booking.isCustom ? '✏️ Custom Trip' : '📦 Package Booking'}
              </h1>
              <p className="text-gray-400 text-sm font-mono">
                Booking ID: {booking.bookingId}
              </p>
            </div>
            <span className={`status-badge ${booking.status}`}>
              {booking.status.toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8 p-5 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-500">
              <strong className="block text-gray-700 mb-1">Customer</strong>
              {booking.customerName}
            </div>
            <div className="text-sm text-gray-500">
              <strong className="block text-gray-700 mb-1">Booking Date</strong>
              {new Date(booking.bookingDate).toLocaleDateString()}
            </div>
            {booking.packageName && (
              <div className="text-sm text-gray-500">
                <strong className="block text-gray-700 mb-1">Package</strong>
                {booking.packageName}
              </div>
            )}
          </div>

          {booking.bookingDescription && (
            <div className="mb-8 p-5 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Description</h3>
              <p className="text-gray-600 leading-relaxed">{booking.bookingDescription}</p>
            </div>
          )}

          {/* Hotels */}
          {booking.hotels && booking.hotels.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">🏨 Hotels</h3>
              {booking.hotels.map((hotel, index) => (
                <div key={index} className="bg-gray-50 p-5 rounded-lg mb-4">
                  <h4 className="font-semibold text-gray-800 mb-2">{hotel.hotelName}</h4>
                  <p className="text-gray-500 text-sm mb-4">{hotel.hotelAddress}</p>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm text-gray-500">
                    <span>Rooms: {hotel.roomsBooked}</span>
                    <span>Rate: PKR {hotel.rent}/night</span>
                    <span>Check-in: {new Date(hotel.checkIn).toLocaleDateString()}</span>
                    <span>Check-out: {new Date(hotel.checkOut).toLocaleDateString()}</span>
                    <span className="col-span-2 md:col-span-1 font-semibold text-primary-500 text-base pt-2 md:pt-0 border-t md:border-t-0 border-gray-200">
                      Total: PKR{' '}
                      {(
                        hotel.rent *
                        hotel.roomsBooked *
                        calculateNights(hotel.checkIn, hotel.checkOut)
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Transport */}
          {booking.transport && booking.transport.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">🚗 Transport</h3>
              {booking.transport.map((trans, index) => (
                <div key={index} className="bg-gray-50 p-5 rounded-lg mb-4">
                  <h4 className="font-semibold text-gray-800 mb-3">
                    {trans.type.toUpperCase()}
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-500">
                    <span>Seats: {trans.seatsBooked}</span>
                    <span>Fare: PKR {trans.fare}/seat</span>
                    <span>Travel Date: {new Date(trans.travelDate).toLocaleDateString()}</span>
                    <span className="font-semibold text-primary-500 text-base">
                      Total: PKR {(trans.fare * trans.seatsBooked).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Food */}
          {booking.food && booking.food.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">🍽️ Food Plans</h3>
              {booking.food.map((food, index) => (
                <div key={index} className="bg-gray-50 p-5 rounded-lg mb-4">
                  <h4 className="font-semibold text-gray-800 mb-3">{food.meals}</h4>
                  <div className="grid grid-cols-3 gap-3 text-sm text-gray-500">
                    <span>Quantity: {food.quantity}</span>
                    <span>Price: PKR {food.price}</span>
                    <span className="font-semibold text-primary-500 text-base">
                      Total: PKR {(food.price * food.quantity).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Total Cost */}
          <div className="my-10 p-8 bg-gradient-primary rounded-xl text-center text-white">
            <h3 className="text-lg font-normal opacity-90 mb-4">Total Amount</h3>
            <div className="text-4xl font-bold">
              PKR {calculateTotal(booking).toLocaleString()}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-8">
            {booking.status === 'pending' && !isAdmin && (
              <>
                <button onClick={handleCancelBooking} className="btn-danger flex-1 py-4 text-base">
                  Cancel Booking
                </button>
                {!booking.payment && (
                  <button
                    onClick={() => setShowPaymentForm(true)}
                    className="btn-primary flex-1 py-4 text-base"
                  >
                    Make Payment
                  </button>
                )}
              </>
            )}

            {isAdmin && booking.status === 'pending' && (
              <>
                <button onClick={handleConfirmBooking} className="btn-success flex-1 py-4 text-base">
                  Confirm Booking
                </button>
                <button onClick={handleCancelBooking} className="btn-danger flex-1 py-4 text-base">
                  Cancel Booking
                </button>
              </>
            )}
          </div>
        </div>

        {/* Payment Section */}
        <div className="bg-white rounded-xl p-8 shadow-md h-fit sticky top-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            Payment Information
          </h2>

          {booking.payment ? (
            <div className="bg-gray-50 p-5 rounded-lg space-y-4">
              <div className="flex justify-between text-sm">
                <strong className="text-gray-500">Payment ID:</strong>
                <span className="text-gray-700 font-medium">
                  {booking.payment.paymentId.slice(0, 8)}...
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <strong className="text-gray-500">Amount:</strong>
                <span className="text-gray-700 font-medium">
                  PKR {booking.payment.amount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <strong className="text-gray-500">Method:</strong>
                <span className="text-gray-700 font-medium">
                  {booking.payment.method.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <strong className="text-gray-500">Date:</strong>
                <span className="text-gray-700 font-medium">
                  {new Date(booking.payment.paymentDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between text-sm items-center">
                <strong className="text-gray-500">Status:</strong>
                <span className={`status-badge ${booking.payment.status}`}>
                  {booking.payment.status.toUpperCase()}
                </span>
              </div>
              {booking.payment.transactionId && (
                <div className="flex justify-between text-sm">
                  <strong className="text-gray-500">Transaction ID:</strong>
                  <span className="text-gray-700 font-medium">
                    {booking.payment.transactionId}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-400">
              <p>No payment made yet</p>
            </div>
          )}

          {/* Payment Form */}
          {showPaymentForm && !booking.payment && (
            <form
              onSubmit={handlePaymentSubmit}
              className="mt-8 pt-8 border-t-2 border-gray-100 space-y-5"
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Make Payment</h3>

              <div>
                <label className="block text-gray-700 font-medium text-sm mb-2">
                  Amount (PKR)
                </label>
                <input
                  type="number"
                  value={paymentData.amount}
                  onChange={(e) =>
                    setPaymentData({ ...paymentData, amount: e.target.value })
                  }
                  required
                  min="1"
                  step="0.01"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium text-sm mb-2">
                  Payment Method
                </label>
                <select
                  value={paymentData.method}
                  onChange={(e) =>
                    setPaymentData({
                      ...paymentData,
                      method: e.target.value as PaymentMethod,
                    })
                  }
                  required
                  className="input-field"
                >
                  <option value="credit_card">Credit Card</option>
                  <option value="debit_card">Debit Card</option>
                  <option value="paypal">PayPal</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-medium text-sm mb-2">
                  Transaction ID (Optional)
                </label>
                <input
                  type="text"
                  value={paymentData.transactionId}
                  onChange={(e) =>
                    setPaymentData({
                      ...paymentData,
                      transactionId: e.target.value,
                    })
                  }
                  placeholder="Enter transaction reference"
                  className="input-field"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button type="submit" className="btn-primary flex-1">
                  Submit Payment
                </button>
                <button
                  type="button"
                  onClick={() => setShowPaymentForm(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
