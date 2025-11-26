'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCustomer } from '@/context/AuthContext';
import { hotelAPI, transportAPI, foodAPI, bookingAPI } from '@/services/api';
import { Hotel, Transport, Food, SelectedHotel, SelectedTransport, SelectedFood } from '@/types';

export default function CustomBookingPage() {
  const router = useRouter();
  const customer = useCustomer();

  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [transports, setTransports] = useState<Transport[]>([]);
  const [foods, setFoods] = useState<Food[]>([]);

  const [selectedHotels, setSelectedHotels] = useState<SelectedHotel[]>([]);
  const [selectedTransports, setSelectedTransports] = useState<SelectedTransport[]>([]);
  const [selectedFoods, setSelectedFoods] = useState<SelectedFood[]>([]);

  const [bookingDescription, setBookingDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAllServices();
  }, []);

  const fetchAllServices = async () => {
    try {
      const [hotelsRes, transportsRes, foodsRes] = await Promise.all([
        hotelAPI.getAll(),
        transportAPI.getAll(),
        foodAPI.getAll(),
      ]);

      setHotels(hotelsRes.data);
      setTransports(transportsRes.data);
      setFoods(foodsRes.data);
    } catch (error) {
      console.error('Error fetching services:', error);
      alert('Failed to load services');
    }
    setLoading(false);
  };

  const addHotel = (hotel: Hotel) => {
    setSelectedHotels([
      ...selectedHotels,
      {
        hotelId: hotel.hotelId,
        hotelName: hotel.hotelName,
        rent: hotel.rent,
        roomsBooked: 1,
        checkIn: '',
        checkOut: '',
      },
    ]);
  };

  const removeHotel = (index: number) => {
    setSelectedHotels(selectedHotels.filter((_, i) => i !== index));
  };

  const updateHotel = (index: number, field: keyof SelectedHotel, value: string | number) => {
    const updated = [...selectedHotels];
    (updated[index] as any)[field] = value;
    setSelectedHotels(updated);
  };

  const addTransport = (transport: Transport) => {
    setSelectedTransports([
      ...selectedTransports,
      {
        transportId: transport.transportId,
        type: transport.type,
        fare: transport.fare,
        seatsBooked: 1,
        travelDate: '',
      },
    ]);
  };

  const removeTransport = (index: number) => {
    setSelectedTransports(selectedTransports.filter((_, i) => i !== index));
  };

  const updateTransport = (index: number, field: keyof SelectedTransport, value: string | number) => {
    const updated = [...selectedTransports];
    (updated[index] as any)[field] = value;
    setSelectedTransports(updated);
  };

  const addFood = (food: Food) => {
    setSelectedFoods([
      ...selectedFoods,
      {
        foodId: food.foodId,
        meals: food.meals,
        price: food.price,
        quantity: 1,
      },
    ]);
  };

  const removeFood = (index: number) => {
    setSelectedFoods(selectedFoods.filter((_, i) => i !== index));
  };

  const updateFood = (index: number, field: keyof SelectedFood, value: string | number) => {
    const updated = [...selectedFoods];
    (updated[index] as any)[field] = value;
    setSelectedFoods(updated);
  };

  const calculateTotal = (): number => {
    let total = 0;

    selectedHotels.forEach((hotel) => {
      if (hotel.checkIn && hotel.checkOut) {
        const nights = Math.ceil(
          (new Date(hotel.checkOut).getTime() - new Date(hotel.checkIn).getTime()) /
            (1000 * 60 * 60 * 24)
        );
        total += (hotel.rent || 0) * hotel.roomsBooked * (nights || 1);
      }
    });

    selectedTransports.forEach((trans) => {
      total += (trans.fare || 0) * trans.seatsBooked;
    });

    selectedFoods.forEach((food) => {
      total += (food.price || 0) * food.quantity;
    });

    return total;
  };

  const handleSubmit = async () => {
    // Validation
    if (
      selectedHotels.length === 0 &&
      selectedTransports.length === 0 &&
      selectedFoods.length === 0
    ) {
      alert('Please select at least one service');
      return;
    }

    // Validate hotel dates
    for (const hotel of selectedHotels) {
      if (!hotel.checkIn || !hotel.checkOut) {
        alert('Please fill in all hotel dates');
        return;
      }
    }

    // Validate transport dates
    for (const trans of selectedTransports) {
      if (!trans.travelDate) {
        alert('Please fill in all transport dates');
        return;
      }
    }

    if (!customer) return;

    setSubmitting(true);

    try {
      const response = await bookingAPI.createCustom({
        customerId: customer.customerId,
        bookingDescription:
          bookingDescription || 'Custom booking - ' + new Date().toLocaleDateString(),
        hotels: selectedHotels.map((h) => ({
          hotelId: h.hotelId,
          roomsBooked: h.roomsBooked,
          checkIn: h.checkIn,
          checkOut: h.checkOut,
        })),
        transport: selectedTransports.map((t) => ({
          transportId: t.transportId,
          seatsBooked: t.seatsBooked,
          travelDate: t.travelDate,
        })),
        food: selectedFoods.map((f) => ({
          foodId: f.foodId,
          quantity: f.quantity,
        })),
      });

      alert('Custom booking created successfully!');
      router.push(`/booking/${response.data.bookingId}`);
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Failed to create booking. Please try again.');
    }

    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 text-lg">Loading services...</p>
      </div>
    );
  }

  const hasSelections =
    selectedHotels.length > 0 ||
    selectedTransports.length > 0 ||
    selectedFoods.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <button
        onClick={() => router.push('/dashboard')}
        className="bg-white border-2 border-gray-200 px-5 py-2.5 rounded-lg mb-8
                   hover:border-primary-500 hover:text-primary-500 transition-colors"
      >
        ← Back to Dashboard
      </button>

      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Create Custom Trip</h1>
        <p className="text-gray-500 mb-8">Build your perfect travel package</p>

        {/* Booking Description */}
        <div className="bg-white rounded-xl p-5 shadow-md mb-8">
          <label className="block text-gray-700 font-semibold mb-3">
            Trip Description
          </label>
          <textarea
            value={bookingDescription}
            onChange={(e) => setBookingDescription(e.target.value)}
            placeholder="Describe your trip..."
            rows={3}
            className="input-field resize-none"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Available Services */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hotels */}
            <div className="bg-white rounded-xl p-6 shadow-md">
              <h3 className="text-xl font-semibold text-gray-800 mb-5">
                🏨 Available Hotels
              </h3>
              <div className="space-y-4">
                {hotels.map((hotel) => (
                  <div
                    key={hotel.hotelId}
                    className="flex justify-between items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <strong className="block text-gray-800 mb-1">{hotel.hotelName}</strong>
                      <p className="text-gray-500 text-sm mb-2">{hotel.hotelAddress}</p>
                      <span className="text-primary-500 font-semibold">
                        PKR {hotel.rent}/night
                      </span>
                    </div>
                    <button
                      onClick={() => addHotel(hotel)}
                      className="px-5 py-2 bg-primary-500 text-white rounded-lg font-semibold
                                 hover:bg-primary-600 transition-colors whitespace-nowrap"
                    >
                      + Add
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Transport */}
            <div className="bg-white rounded-xl p-6 shadow-md">
              <h3 className="text-xl font-semibold text-gray-800 mb-5">
                🚗 Available Transport
              </h3>
              <div className="space-y-4">
                {transports.map((transport) => (
                  <div
                    key={transport.transportId}
                    className="flex justify-between items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <strong className="block text-gray-800 mb-1">
                        {transport.type.toUpperCase()}
                      </strong>
                      <p className="text-gray-500 text-sm mb-2">{transport.noOfSeats} seats</p>
                      <span className="text-primary-500 font-semibold">
                        PKR {transport.fare}
                      </span>
                    </div>
                    <button
                      onClick={() => addTransport(transport)}
                      className="px-5 py-2 bg-primary-500 text-white rounded-lg font-semibold
                                 hover:bg-primary-600 transition-colors whitespace-nowrap"
                    >
                      + Add
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Food */}
            <div className="bg-white rounded-xl p-6 shadow-md">
              <h3 className="text-xl font-semibold text-gray-800 mb-5">
                🍽️ Available Food Plans
              </h3>
              <div className="space-y-4">
                {foods.map((food) => (
                  <div
                    key={food.foodId}
                    className="flex justify-between items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <strong className="block text-gray-800 mb-1">{food.meals}</strong>
                      <span className="text-primary-500 font-semibold">PKR {food.price}</span>
                    </div>
                    <button
                      onClick={() => addFood(food)}
                      className="px-5 py-2 bg-primary-500 text-white rounded-lg font-semibold
                                 hover:bg-primary-600 transition-colors whitespace-nowrap"
                    >
                      + Add
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Selected Services */}
          <div className="bg-white rounded-xl p-8 shadow-md h-fit sticky top-8 max-h-[calc(100vh-120px)] overflow-y-auto">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Your Trip</h2>

            {/* Selected Hotels */}
            {selectedHotels.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm uppercase tracking-wider text-gray-500 font-semibold mb-4">
                  Hotels
                </h4>
                {selectedHotels.map((hotel, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg mb-3">
                    <div className="flex justify-between items-center mb-3">
                      <strong className="text-gray-800 text-sm">{hotel.hotelName}</strong>
                      <button
                        onClick={() => removeHotel(index)}
                        className="w-7 h-7 bg-red-500 text-white rounded-full text-xl
                                   hover:bg-red-600 transition-colors flex items-center justify-center"
                      >
                        ×
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <input
                        type="number"
                        min="1"
                        value={hotel.roomsBooked}
                        onChange={(e) =>
                          updateHotel(index, 'roomsBooked', parseInt(e.target.value) || 1)
                        }
                        placeholder="Rooms"
                        className="flex-1 min-w-[80px] p-2 border border-gray-200 rounded text-sm"
                      />
                      <input
                        type="date"
                        value={hotel.checkIn}
                        onChange={(e) => updateHotel(index, 'checkIn', e.target.value)}
                        className="flex-1 min-w-[120px] p-2 border border-gray-200 rounded text-sm"
                      />
                      <input
                        type="date"
                        value={hotel.checkOut}
                        onChange={(e) => updateHotel(index, 'checkOut', e.target.value)}
                        min={hotel.checkIn}
                        className="flex-1 min-w-[120px] p-2 border border-gray-200 rounded text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Selected Transport */}
            {selectedTransports.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm uppercase tracking-wider text-gray-500 font-semibold mb-4">
                  Transport
                </h4>
                {selectedTransports.map((trans, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg mb-3">
                    <div className="flex justify-between items-center mb-3">
                      <strong className="text-gray-800 text-sm">{trans.type?.toUpperCase()}</strong>
                      <button
                        onClick={() => removeTransport(index)}
                        className="w-7 h-7 bg-red-500 text-white rounded-full text-xl
                                   hover:bg-red-600 transition-colors flex items-center justify-center"
                      >
                        ×
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <input
                        type="number"
                        min="1"
                        value={trans.seatsBooked}
                        onChange={(e) =>
                          updateTransport(index, 'seatsBooked', parseInt(e.target.value) || 1)
                        }
                        placeholder="Seats"
                        className="flex-1 min-w-[80px] p-2 border border-gray-200 rounded text-sm"
                      />
                      <input
                        type="date"
                        value={trans.travelDate}
                        onChange={(e) => updateTransport(index, 'travelDate', e.target.value)}
                        className="flex-1 min-w-[120px] p-2 border border-gray-200 rounded text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Selected Food */}
            {selectedFoods.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm uppercase tracking-wider text-gray-500 font-semibold mb-4">
                  Food Plans
                </h4>
                {selectedFoods.map((food, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg mb-3">
                    <div className="flex justify-between items-center mb-3">
                      <strong className="text-gray-800 text-sm">{food.meals}</strong>
                      <button
                        onClick={() => removeFood(index)}
                        className="w-7 h-7 bg-red-500 text-white rounded-full text-xl
                                   hover:bg-red-600 transition-colors flex items-center justify-center"
                      >
                        ×
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="1"
                        value={food.quantity}
                        onChange={(e) =>
                          updateFood(index, 'quantity', parseInt(e.target.value) || 1)
                        }
                        placeholder="Quantity"
                        className="w-full p-2 border border-gray-200 rounded text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!hasSelections && (
              <div className="text-center py-16 text-gray-400">
                <p>Your trip is empty. Start adding services!</p>
              </div>
            )}

            {/* Total */}
            {hasSelections && (
              <>
                <div className="mt-8 p-6 bg-gradient-primary rounded-xl text-center text-white">
                  <h3 className="text-sm font-normal opacity-90 mb-4">Estimated Total</h3>
                  <div className="text-3xl font-bold">
                    PKR {calculateTotal().toLocaleString()}
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full mt-5 py-4 bg-green-500 text-white rounded-lg font-semibold
                             hover:bg-green-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Creating Booking...' : 'Create Booking'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
