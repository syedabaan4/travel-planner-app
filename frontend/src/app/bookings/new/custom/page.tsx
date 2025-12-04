"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { hotelApi, transportApi, foodApi, bookingApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { ProtectedRoute } from "@/components/protected-route";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, addDays } from "date-fns";
import {
  ArrowLeft,
  Hotel,
  Plane,
  Utensils,
  Plus,
  Trash2,
  Loader2,
  DollarSign,
} from "lucide-react";
import { toast } from "sonner";

interface HotelOption {
  hotelId: number;
  hotelName: string;
  hotelAddress: string;
  availableRooms: number;
  rent: number;
}

interface TransportOption {
  transportId: number;
  type: string;
  availableSeats: number;
  fare: number;
}

interface FoodOption {
  foodId: number;
  meals: string;
  price: number;
}

interface SelectedHotel {
  hotelId: number;
  roomsBooked: number;
  checkIn: string;
  checkOut: string;
}

interface SelectedTransport {
  transportId: number;
  seatsBooked: number;
  travelDate: string;
}

interface SelectedFood {
  foodId: number;
  quantity: number;
}

function CustomBookingContent() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [hotels, setHotels] = useState<HotelOption[]>([]);
  const [transports, setTransports] = useState<TransportOption[]>([]);
  const [foods, setFoods] = useState<FoodOption[]>([]);

  const [description, setDescription] = useState("");
  const [selectedHotels, setSelectedHotels] = useState<SelectedHotel[]>([]);
  const [selectedTransports, setSelectedTransports] = useState<SelectedTransport[]>([]);
  const [selectedFoods, setSelectedFoods] = useState<SelectedFood[]>([]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [hotelsRes, transportsRes, foodsRes] = await Promise.all([
          hotelApi.getAll(),
          transportApi.getAll(),
          foodApi.getAll(),
        ]);
        setHotels(hotelsRes.data);
        setTransports(transportsRes.data);
        setFoods(foodsRes.data);
      } catch (error) {
        console.error("Failed to fetch options:", error);
        toast.error("Failed to load booking options");
      } finally {
        setLoading(false);
      }
    };

    fetchOptions();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const addHotel = () => {
    setSelectedHotels([
      ...selectedHotels,
      {
        hotelId: 0,
        roomsBooked: 1,
        checkIn: format(addDays(new Date(), 7), "yyyy-MM-dd"),
        checkOut: format(addDays(new Date(), 9), "yyyy-MM-dd"),
      },
    ]);
  };

  const removeHotel = (index: number) => {
    setSelectedHotels(selectedHotels.filter((_, i) => i !== index));
  };

  const updateHotel = (index: number, field: keyof SelectedHotel, value: string | number) => {
    const updated = [...selectedHotels];
    updated[index] = { ...updated[index], [field]: value };
    setSelectedHotels(updated);
  };

  const addTransport = () => {
    setSelectedTransports([
      ...selectedTransports,
      {
        transportId: 0,
        seatsBooked: 1,
        travelDate: format(addDays(new Date(), 7), "yyyy-MM-dd"),
      },
    ]);
  };

  const removeTransport = (index: number) => {
    setSelectedTransports(selectedTransports.filter((_, i) => i !== index));
  };

  const updateTransport = (index: number, field: keyof SelectedTransport, value: string | number) => {
    const updated = [...selectedTransports];
    updated[index] = { ...updated[index], [field]: value };
    setSelectedTransports(updated);
  };

  const addFood = () => {
    setSelectedFoods([
      ...selectedFoods,
      {
        foodId: 0,
        quantity: 1,
      },
    ]);
  };

  const removeFood = (index: number) => {
    setSelectedFoods(selectedFoods.filter((_, i) => i !== index));
  };

  const updateFood = (index: number, field: keyof SelectedFood, value: number) => {
    const updated = [...selectedFoods];
    updated[index] = { ...updated[index], [field]: value };
    setSelectedFoods(updated);
  };

  const calculateTotal = () => {
    let total = 0;

    selectedHotels.forEach((sh) => {
      const hotel = hotels.find((h) => h.hotelId === sh.hotelId);
      if (hotel && sh.checkIn && sh.checkOut) {
        const nights = Math.ceil(
          (new Date(sh.checkOut).getTime() - new Date(sh.checkIn).getTime()) /
            (1000 * 60 * 60 * 24)
        );
        total += hotel.rent * sh.roomsBooked * Math.max(nights, 1);
      }
    });

    selectedTransports.forEach((st) => {
      const transport = transports.find((t) => t.transportId === st.transportId);
      if (transport) {
        total += transport.fare * st.seatsBooked;
      }
    });

    selectedFoods.forEach((sf) => {
      const food = foods.find((f) => f.foodId === sf.foodId);
      if (food) {
        total += food.price * sf.quantity;
      }
    });

    return total;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) return;

    if (
      selectedHotels.length === 0 &&
      selectedTransports.length === 0 &&
      selectedFoods.length === 0
    ) {
      toast.error("Please add at least one item to your booking");
      return;
    }

    const validHotels = selectedHotels.filter((h) => h.hotelId > 0);
    const validTransports = selectedTransports.filter((t) => t.transportId > 0);
    const validFoods = selectedFoods.filter((f) => f.foodId > 0);

    if (
      validHotels.length === 0 &&
      validTransports.length === 0 &&
      validFoods.length === 0
    ) {
      toast.error("Please select items for your booking");
      return;
    }

    setSubmitting(true);

    try {
      const response = await bookingApi.createCustom({
        customerId: user.id,
        bookingDescription: description || "Custom Booking",
        hotels: validHotels.length > 0 ? validHotels : undefined,
        transport: validTransports.length > 0 ? validTransports : undefined,
        food: validFoods.length > 0 ? validFoods : undefined,
      });

      toast.success("Custom booking created successfully!");
      router.push(`/bookings/${response.data.bookingId}`);
    } catch (error: any) {
      console.error("Failed to create booking:", error);
      const message =
        error.response?.data?.message || "Failed to create booking";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="space-y-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button asChild variant="ghost" className="mb-6">
        <Link href="/bookings">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Bookings
        </Link>
      </Button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Create Custom Booking</h1>
        <p className="text-muted-foreground">
          Build your own travel package by selecting hotels, transport, and meal plans
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Booking Details</CardTitle>
                <CardDescription>
                  Add a description for your custom booking
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="e.g., Family trip to Lahore, Business travel..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Hotels Section */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Hotel className="h-5 w-5" />
                    Hotels
                  </CardTitle>
                  <CardDescription>Add hotel stays to your booking</CardDescription>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addHotel}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Hotel
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedHotels.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No hotels added yet
                  </p>
                ) : (
                  selectedHotels.map((sh, index) => (
                    <div
                      key={index}
                      className="p-4 border rounded-lg space-y-4 relative"
                    >
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8"
                        onClick={() => removeHotel(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Hotel</Label>
                          <Select
                            value={sh.hotelId.toString()}
                            onValueChange={(v) =>
                              updateHotel(index, "hotelId", parseInt(v))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select hotel" />
                            </SelectTrigger>
                            <SelectContent>
                              {hotels.map((hotel) => (
                                <SelectItem
                                  key={hotel.hotelId}
                                  value={hotel.hotelId.toString()}
                                >
                                  {hotel.hotelName} - {formatCurrency(hotel.rent)}/night
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Rooms</Label>
                          <Input
                            type="number"
                            min="1"
                            value={sh.roomsBooked}
                            onChange={(e) =>
                              updateHotel(index, "roomsBooked", parseInt(e.target.value) || 1)
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Check-in</Label>
                          <Input
                            type="date"
                            value={sh.checkIn}
                            onChange={(e) => updateHotel(index, "checkIn", e.target.value)}
                            min={format(new Date(), "yyyy-MM-dd")}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Check-out</Label>
                          <Input
                            type="date"
                            value={sh.checkOut}
                            onChange={(e) => updateHotel(index, "checkOut", e.target.value)}
                            min={sh.checkIn || format(new Date(), "yyyy-MM-dd")}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Transport Section */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Plane className="h-5 w-5" />
                    Transport
                  </CardTitle>
                  <CardDescription>Add transport to your booking</CardDescription>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addTransport}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Transport
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedTransports.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No transport added yet
                  </p>
                ) : (
                  selectedTransports.map((st, index) => (
                    <div
                      key={index}
                      className="p-4 border rounded-lg space-y-4 relative"
                    >
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8"
                        onClick={() => removeTransport(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>

                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                          <Label>Transport</Label>
                          <Select
                            value={st.transportId.toString()}
                            onValueChange={(v) =>
                              updateTransport(index, "transportId", parseInt(v))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select transport" />
                            </SelectTrigger>
                            <SelectContent>
                              {transports.map((transport) => (
                                <SelectItem
                                  key={transport.transportId}
                                  value={transport.transportId.toString()}
                                >
                                  {transport.type} - {formatCurrency(transport.fare)}/seat
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Seats</Label>
                          <Input
                            type="number"
                            min="1"
                            value={st.seatsBooked}
                            onChange={(e) =>
                              updateTransport(index, "seatsBooked", parseInt(e.target.value) || 1)
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Travel Date</Label>
                          <Input
                            type="date"
                            value={st.travelDate}
                            onChange={(e) =>
                              updateTransport(index, "travelDate", e.target.value)
                            }
                            min={format(new Date(), "yyyy-MM-dd")}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Food Section */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Utensils className="h-5 w-5" />
                    Meal Plans
                  </CardTitle>
                  <CardDescription>Add meal plans to your booking</CardDescription>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addFood}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Meal Plan
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedFoods.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No meal plans added yet
                  </p>
                ) : (
                  selectedFoods.map((sf, index) => (
                    <div
                      key={index}
                      className="p-4 border rounded-lg space-y-4 relative"
                    >
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8"
                        onClick={() => removeFood(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Meal Plan</Label>
                          <Select
                            value={sf.foodId.toString()}
                            onValueChange={(v) =>
                              updateFood(index, "foodId", parseInt(v))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select meal plan" />
                            </SelectTrigger>
                            <SelectContent>
                              {foods.map((food) => (
                                <SelectItem
                                  key={food.foodId}
                                  value={food.foodId.toString()}
                                >
                                  {food.meals} - {formatCurrency(food.price)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Quantity</Label>
                          <Input
                            type="number"
                            min="1"
                            value={sf.quantity}
                            onChange={(e) =>
                              updateFood(index, "quantity", parseInt(e.target.value) || 1)
                            }
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Summary Card */}
          <div>
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Booking Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Hotels</span>
                    <Badge variant="outline">{selectedHotels.filter(h => h.hotelId > 0).length}</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Transport</span>
                    <Badge variant="outline">{selectedTransports.filter(t => t.transportId > 0).length}</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Meal Plans</span>
                    <Badge variant="outline">{selectedFoods.filter(f => f.foodId > 0).length}</Badge>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between font-semibold text-lg">
                  <span>Estimated Total</span>
                  <span>{formatCurrency(calculateTotal())}</span>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={submitting}
                >
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {submitting ? "Creating..." : "Create Booking"}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Final cost will be calculated after booking
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function CustomBookingPage() {
  return (
    <ProtectedRoute>
      <CustomBookingContent />
    </ProtectedRoute>
  );
}
