"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { bookingApi } from "@/lib/api";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface BookingDetail {
  bookingId: string;
  packageName: string | null;
  destination: string | null;
  bookingDescription: string;
  status: string;
  grandTotal: number;
  paymentStatus: string;
  paidAmount: number;
}

function CancelBookingContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState("");

  const bookingId = params.id as string;

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const response = await bookingApi.getById(bookingId);
        setBooking(response.data);
      } catch (error) {
        console.error("Failed to fetch booking:", error);
        toast.error("Failed to load booking details");
      } finally {
        setLoading(false);
      }
    };

    if (bookingId) {
      fetchBooking();
    }
  }, [bookingId]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleCancel = async () => {
    if (!reason.trim()) {
      toast.error("Please provide a reason for cancellation");
      return;
    }

    setCancelling(true);

    try {
      const response = await bookingApi.cancel(bookingId, reason);

      if (response.data.refundIssued) {
        toast.success("Booking cancelled. Refund has been issued.");
      } else {
        toast.success("Booking cancelled successfully.");
      }

      router.push("/bookings");
    } catch (error: any) {
      console.error("Failed to cancel booking:", error);
      const message =
        error.response?.data?.message || "Failed to cancel booking";
      toast.error(message);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Skeleton className="h-8 w-32 mb-6" />
        <Skeleton className="h-64" />
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

  if (booking.status === "cancelled") {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Button asChild variant="ghost" className="mb-6">
          <Link href={`/bookings/${bookingId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Booking
          </Link>
        </Button>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Already Cancelled</AlertTitle>
          <AlertDescription>
            This booking has already been cancelled.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Button asChild variant="ghost" className="mb-6">
        <Link href={`/bookings/${bookingId}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Booking
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Cancel Booking
          </CardTitle>
          <CardDescription>
            Are you sure you want to cancel this booking?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-muted/50 rounded-lg space-y-2">
            <p className="font-medium">
              {booking.packageName || booking.bookingDescription}
            </p>
            {booking.destination && (
              <p className="text-sm text-muted-foreground">
                {booking.destination}
              </p>
            )}
            <p className="text-lg font-semibold">
              {formatCurrency(booking.grandTotal)}
            </p>
          </div>

          {booking.paymentStatus === "completed" && booking.paidAmount > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Refund Notice</AlertTitle>
              <AlertDescription>
                You have paid {formatCurrency(booking.paidAmount)} for this booking.
                A refund will be processed upon cancellation.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Cancellation *</Label>
            <Textarea
              id="reason"
              placeholder="Please tell us why you're cancelling this booking..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              disabled={cancelling}
            />
          </div>

          <div className="flex gap-4">
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={cancelling || !reason.trim()}
              className="flex-1"
            >
              {cancelling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {cancelling ? "Cancelling..." : "Confirm Cancellation"}
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/bookings/${bookingId}`)}
              disabled={cancelling}
              className="flex-1"
            >
              Keep Booking
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            This action cannot be undone. Once cancelled, you will need to create
            a new booking.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CancelBookingPage() {
  return (
    <ProtectedRoute>
      <CancelBookingContent />
    </ProtectedRoute>
  );
}
