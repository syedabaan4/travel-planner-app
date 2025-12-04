"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { bookingApi, paymentApi } from "@/lib/api";
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Hotel,
  Plane,
  Utensils,
  DollarSign,
  CreditCard,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

interface BookingHotel {
  hotelId: number;
  hotelName: string;
  hotelAddress: string;
  roomsBooked: number;
  checkIn: string;
  checkOut: string;
  totalCost: number;
}

interface BookingTransport {
  transportId: number;
  type: string;
  seatsBooked: number;
  travelDate: string;
  totalCost: number;
}

interface BookingFood {
  foodId: number;
  meals: string;
  quantity: number;
  totalCost: number;
}

interface Payment {
  paymentId: string;
  amount: number;
  paymentDate: string;
  method: string;
  status: string;
  transactionId: string;
}

interface BookingDetail {
  bookingId: string;
  customerId: number;
  customerName: string;
  customerEmail: string;
  catalogId: number | null;
  packageName: string | null;
  destination: string | null;
  isCustom: boolean;
  bookingType: string;
  bookingDescription: string;
  bookingDate: string;
  status: string;
  totalHotelCost: number;
  totalTransportCost: number;
  totalFoodCost: number;
  grandTotal: number;
  paymentStatus: string;
  paidAmount: number;
  hotels?: BookingHotel[];
  transport?: BookingTransport[];
  food?: BookingFood[];
}

function BookingDetailContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);

  const bookingId = params.id as string;

  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        const [bookingRes, paymentRes] = await Promise.allSettled([
          bookingApi.getById(bookingId),
          paymentApi.getByBooking(bookingId),
        ]);

        if (bookingRes.status === "fulfilled") {
          setBooking(bookingRes.value.data);
        }

        if (paymentRes.status === "fulfilled") {
          setPayment(paymentRes.value.data);
        }
      } catch (error) {
        console.error("Failed to fetch booking details:", error);
        toast.error("Failed to load booking details");
      } finally {
        setLoading(false);
      }
    };

    if (bookingId) {
      fetchBookingDetails();
    }
  }, [bookingId]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "confirmed":
        return <Badge className="bg-green-500">Confirmed</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const getPaymentBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return <Badge className="bg-green-500">Paid</Badge>;
      case "refunded":
        return <Badge variant="outline">Refunded</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const canPay =
    booking?.status !== "cancelled" &&
    (booking?.paymentStatus === "pending" || !booking?.paymentStatus);

  const canCancel =
    booking?.status !== "cancelled" && booking?.status !== "confirmed";

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-32 mb-6" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-48" />
            <Skeleton className="h-64" />
          </div>
          <div>
            <Skeleton className="h-72" />
          </div>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg mb-4">
            Booking not found
          </p>
          <Button asChild variant="outline">
            <Link href="/bookings">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Bookings
            </Link>
          </Button>
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

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Main Info Card */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">
                    {booking.packageName || booking.bookingDescription}
                  </CardTitle>
                  {booking.destination && (
                    <CardDescription className="flex items-center gap-1 mt-2 text-base">
                      <MapPin className="h-4 w-4" />
                      {booking.destination}
                    </CardDescription>
                  )}
                </div>
                <div className="flex gap-2">
                  {getStatusBadge(booking.status)}
                  <Badge variant="outline">
                    {booking.isCustom ? "Custom" : "Package"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">{booking.bookingDescription}</p>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  Booked on {format(new Date(booking.bookingDate), "MMMM d, yyyy")}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                Booking ID: <code className="bg-muted px-1 rounded">{booking.bookingId}</code>
              </div>
            </CardContent>
          </Card>

          {/* Hotels Section */}
          {booking.hotels && booking.hotels.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hotel className="h-5 w-5" />
                  Hotels
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {booking.hotels.map((hotel, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-start p-4 rounded-lg bg-muted/50"
                  >
                    <div>
                      <h4 className="font-medium">{hotel.hotelName}</h4>
                      <p className="text-sm text-muted-foreground">
                        {hotel.hotelAddress}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {hotel.roomsBooked} room{hotel.roomsBooked > 1 ? "s" : ""} •{" "}
                        {format(new Date(hotel.checkIn), "MMM d")} -{" "}
                        {format(new Date(hotel.checkOut), "MMM d, yyyy")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(hotel.totalCost)}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Transport Section */}
          {booking.transport && booking.transport.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plane className="h-5 w-5" />
                  Transport
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {booking.transport.map((transport, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-start p-4 rounded-lg bg-muted/50"
                  >
                    <div>
                      <h4 className="font-medium">{transport.type}</h4>
                      <p className="text-sm text-muted-foreground">
                        {transport.seatsBooked} seat{transport.seatsBooked > 1 ? "s" : ""} •{" "}
                        {format(new Date(transport.travelDate), "MMM d, yyyy")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(transport.totalCost)}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Food Section */}
          {booking.food && booking.food.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Utensils className="h-5 w-5" />
                  Meal Plans
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {booking.food.map((food, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-start p-4 rounded-lg bg-muted/50"
                  >
                    <div>
                      <h4 className="font-medium">{food.meals}</h4>
                      <p className="text-sm text-muted-foreground">
                        Quantity: {food.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(food.totalCost)}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Payment Info */}
          {payment && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    {getPaymentBadge(payment.status)}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-medium">{formatCurrency(payment.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Method</span>
                    <span className="capitalize">{payment.method?.replace("_", " ")}</span>
                  </div>
                  {payment.paymentDate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date</span>
                      <span>{format(new Date(payment.paymentDate), "MMM d, yyyy HH:mm")}</span>
                    </div>
                  )}
                  {payment.transactionId && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Transaction ID</span>
                      <code className="bg-muted px-1 rounded text-sm">{payment.transactionId}</code>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Cost Breakdown Card */}
        <div>
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Cost Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Hotels</span>
                  <span>{formatCurrency(booking.totalHotelCost)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Transport</span>
                  <span>{formatCurrency(booking.totalTransportCost)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Meals</span>
                  <span>{formatCurrency(booking.totalFoodCost)}</span>
                </div>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>Grand Total</span>
                <span>{formatCurrency(booking.grandTotal)}</span>
              </div>
              {booking.paidAmount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Paid</span>
                  <span>{formatCurrency(booking.paidAmount)}</span>
                </div>
              )}

              <div className="pt-4 space-y-2">
                {canPay && (
                  <Button asChild className="w-full">
                    <Link href={`/bookings/${booking.bookingId}/pay`}>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Pay Now
                    </Link>
                  </Button>
                )}
                {canCancel && (
                  <Button asChild variant="destructive" className="w-full">
                    <Link href={`/bookings/${booking.bookingId}/cancel`}>
                      <XCircle className="mr-2 h-4 w-4" />
                      Cancel Booking
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function BookingDetailPage() {
  return (
    <ProtectedRoute>
      <BookingDetailContent />
    </ProtectedRoute>
  );
}
