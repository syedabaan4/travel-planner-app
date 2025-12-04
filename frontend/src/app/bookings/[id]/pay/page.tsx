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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  CreditCard,
  CheckCircle,
  Loader2,
  DollarSign,
} from "lucide-react";
import { toast } from "sonner";

interface BookingDetail {
  bookingId: string;
  packageName: string | null;
  bookingDescription: string;
  destination: string | null;
  status: string;
  grandTotal: number;
  paymentStatus: string;
}

interface Payment {
  paymentId: string;
  amount: number;
  status: string;
  method: string;
  transactionId: string;
}

type PaymentStep = "process" | "complete" | "done";

const PAYMENT_METHODS = [
  { value: "credit_card", label: "Credit Card" },
  { value: "debit_card", label: "Debit Card" },
  { value: "paypal", label: "PayPal" },
  { value: "bank_transfer", label: "Bank Transfer" },
];

function PaymentContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState<PaymentStep>("process");

  const [method, setMethod] = useState("credit_card");
  const [transactionId, setTransactionId] = useState("");
  const [completeTransactionId, setCompleteTransactionId] = useState("");

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

        if (paymentRes.status === "fulfilled" && paymentRes.value.data) {
          setPayment(paymentRes.value.data);
          // If payment exists and is pending, go to complete step
          if (paymentRes.value.data.status === "pending") {
            setStep("complete");
          } else if (paymentRes.value.data.status === "completed") {
            setStep("done");
          }
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

  const generateTransactionId = () => {
    return `TXN${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!booking) return;

    const txnId = transactionId || generateTransactionId();
    setProcessing(true);

    try {
      const response = await paymentApi.process({
        bookingId: booking.bookingId,
        method,
        transactionId: txnId,
      });

      setPayment(response.data);
      setStep("complete");
      toast.success("Payment initiated! Please complete the payment.");
    } catch (error: any) {
      console.error("Failed to process payment:", error);
      const message =
        error.response?.data?.message || "Failed to process payment";
      toast.error(message);
    } finally {
      setProcessing(false);
    }
  };

  const handleCompletePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!payment) return;

    const txnId = completeTransactionId || `${payment.transactionId}_COMPLETE`;
    setProcessing(true);

    try {
      await paymentApi.complete(payment.paymentId, txnId);
      setStep("done");
      toast.success("Payment completed successfully!");
    } catch (error: any) {
      console.error("Failed to complete payment:", error);
      const message =
        error.response?.data?.message || "Failed to complete payment";
      toast.error(message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Skeleton className="h-8 w-32 mb-6" />
        <Skeleton className="h-96" />
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
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg mb-4">
            This booking has been cancelled and cannot be paid for.
          </p>
          <Button asChild variant="outline">
            <Link href={`/bookings/${booking.bookingId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Booking
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Button asChild variant="ghost" className="mb-6">
        <Link href={`/bookings/${booking.bookingId}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Booking
        </Link>
      </Button>

      {/* Step Indicator */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center gap-4">
          <div
            className={`flex items-center gap-2 ${
              step === "process" ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === "process"
                  ? "bg-primary text-primary-foreground"
                  : "bg-green-500 text-white"
              }`}
            >
              {step !== "process" ? <CheckCircle className="h-5 w-5" /> : "1"}
            </div>
            <span className="font-medium">Process</span>
          </div>
          <div className="w-16 h-0.5 bg-muted" />
          <div
            className={`flex items-center gap-2 ${
              step === "complete" ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === "complete"
                  ? "bg-primary text-primary-foreground"
                  : step === "done"
                    ? "bg-green-500 text-white"
                    : "bg-muted"
              }`}
            >
              {step === "done" ? <CheckCircle className="h-5 w-5" /> : "2"}
            </div>
            <span className="font-medium">Complete</span>
          </div>
        </div>
      </div>

      {/* Booking Summary */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>
            {booking.packageName || booking.bookingDescription}
          </CardTitle>
          {booking.destination && (
            <CardDescription>{booking.destination}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <span className="text-muted-foreground">Amount to Pay</span>
            </div>
            <span className="text-2xl font-bold">
              {formatCurrency(booking.grandTotal)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Step 1: Process Payment */}
      {step === "process" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Details
            </CardTitle>
            <CardDescription>
              Enter your payment information to proceed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProcessPayment} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="method">Payment Method</Label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((pm) => (
                      <SelectItem key={pm.value} value={pm.value}>
                        {pm.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="transactionId">Transaction ID (Optional)</Label>
                <Input
                  id="transactionId"
                  placeholder="Auto-generated if left empty"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  disabled={processing}
                />
                <p className="text-xs text-muted-foreground">
                  A unique transaction ID will be generated if not provided
                </p>
              </div>

              <Separator />

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={processing}
              >
                {processing && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {processing ? "Processing..." : "Initiate Payment"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Complete Payment */}
      {step === "complete" && payment && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Complete Payment
            </CardTitle>
            <CardDescription>
              Confirm your payment to finalize the transaction
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6 p-4 bg-muted/50 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Payment ID</span>
                <code className="bg-muted px-1 rounded">
                  {payment.paymentId}
                </code>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <Badge variant="secondary">Pending</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Method</span>
                <span className="capitalize">
                  {payment.method?.replace("_", " ")}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-medium">
                  {formatCurrency(payment.amount)}
                </span>
              </div>
            </div>

            <form onSubmit={handleCompletePayment} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="completeTransactionId">
                  Confirmation Transaction ID (Optional)
                </Label>
                <Input
                  id="completeTransactionId"
                  placeholder="Auto-generated if left empty"
                  value={completeTransactionId}
                  onChange={(e) => setCompleteTransactionId(e.target.value)}
                  disabled={processing}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={processing}
              >
                {processing && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {processing ? "Completing..." : "Complete Payment"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Payment Complete */}
      {step === "done" && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="mb-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-2">Payment Successful!</h3>
            <p className="text-muted-foreground mb-6">
              Your payment has been completed and your booking is confirmed.
            </p>
            <Button asChild>
              <Link href={`/bookings/${booking.bookingId}`}>
                View Booking Details
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function PaymentPage() {
  return (
    <ProtectedRoute>
      <PaymentContent />
    </ProtectedRoute>
  );
}
