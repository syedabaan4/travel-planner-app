"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { paymentApi, bookingApi } from "@/lib/api";
import { AdminRoute } from "@/components/admin-route";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import {
  ArrowLeft,
  CreditCard,
  DollarSign,
  Calendar,
  User,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface Payment {
  paymentId: string;
  bookingId: string;
  amount: number;
  paymentDate: string;
  method: string;
  status: string;
  transactionId: string;
  customerName?: string;
}

interface BookingInfo {
  bookingId: string;
  customerName: string;
  customerEmail: string;
  packageName: string | null;
  bookingDescription: string;
  destination: string | null;
  grandTotal: number;
}

const PAYMENT_STATUSES = ["pending", "completed", "failed", "refunded"];

function PaymentDetailContent() {
  const params = useParams();
  const router = useRouter();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [booking, setBooking] = useState<BookingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [newTransactionId, setNewTransactionId] = useState("");

  const paymentId = params.id as string;

  useEffect(() => {
    const fetchPaymentDetails = async () => {
      try {
        // First get all payments to find this one
        const paymentsRes = await paymentApi.getAll();
        const foundPayment = paymentsRes.data.find(
          (p: Payment) => p.paymentId === paymentId
        );

        if (foundPayment) {
          setPayment(foundPayment);
          setNewStatus(foundPayment.status);
          setNewTransactionId(foundPayment.transactionId || "");

          // Fetch booking details
          try {
            const bookingRes = await bookingApi.getById(foundPayment.bookingId);
            setBooking(bookingRes.data);
          } catch {
            console.error("Failed to fetch booking");
          }
        }
      } catch (error) {
        console.error("Failed to fetch payment details:", error);
        toast.error("Failed to load payment details");
      } finally {
        setLoading(false);
      }
    };

    if (paymentId) {
      fetchPaymentDetails();
    }
  }, [paymentId]);

  const handleStatusUpdate = async () => {
    if (!payment) return;

    setUpdating(true);
    try {
      await paymentApi.updateStatus(paymentId, {
        status: newStatus,
        transactionId: newTransactionId || undefined,
      });

      setPayment({
        ...payment,
        status: newStatus,
        transactionId: newTransactionId || payment.transactionId,
      });

      toast.success("Payment status updated successfully");
    } catch (error: any) {
      console.error("Failed to update payment status:", error);
      toast.error(
        error.response?.data?.message || "Failed to update payment status"
      );
    } finally {
      setUpdating(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return <Badge className="bg-green-500">Completed</Badge>;
      case "refunded":
        return <Badge variant="outline">Refunded</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Skeleton className="h-8 w-32 mb-6" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg mb-4">
            Payment not found
          </p>
          <Button asChild variant="outline">
            <Link href="/admin/payments">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Payments
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button asChild variant="ghost" className="mb-6">
        <Link href="/admin/payments">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Payments
        </Link>
      </Button>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Payment Details Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Details
              </CardTitle>
              {getStatusBadge(payment.status)}
            </div>
            <CardDescription>
              Payment ID: {payment.paymentId}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
                <span className="text-muted-foreground">Amount</span>
              </div>
              <span className="text-2xl font-bold">
                {formatCurrency(payment.amount)}
              </span>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Method</span>
                <span className="capitalize">
                  {payment.method?.replace("_", " ") || "N/A"}
                </span>
              </div>

              {payment.paymentDate && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Payment Date</span>
                  <span>
                    {format(new Date(payment.paymentDate), "MMM d, yyyy HH:mm")}
                  </span>
                </div>
              )}

              {payment.transactionId && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Transaction ID</span>
                  <code className="bg-muted px-2 py-0.5 rounded text-xs">
                    {payment.transactionId}
                  </code>
                </div>
              )}

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Booking ID</span>
                <Link
                  href={`/admin/bookings/${payment.bookingId}`}
                  className="text-primary hover:underline font-mono text-xs"
                >
                  {payment.bookingId.substring(0, 8)}...
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Update Status Card */}
        <Card>
          <CardHeader>
            <CardTitle>Update Payment Status</CardTitle>
            <CardDescription>
              Change the payment status and transaction details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Payment Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      <span className="capitalize">{status}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Transaction ID</Label>
              <Input
                placeholder="Enter transaction ID"
                value={newTransactionId}
                onChange={(e) => setNewTransactionId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Update the external transaction reference if needed
              </p>
            </div>

            <Button
              onClick={handleStatusUpdate}
              disabled={updating}
              className="w-full"
            >
              {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {updating ? "Updating..." : "Update Payment"}
            </Button>
          </CardContent>
        </Card>

        {/* Booking Info Card */}
        {booking && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Associated Booking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{booking.customerName}</p>
                      <p className="text-sm text-muted-foreground">
                        {booking.customerEmail}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="font-medium">
                    {booking.packageName || booking.bookingDescription}
                  </p>
                  {booking.destination && (
                    <p className="text-sm text-muted-foreground">
                      {booking.destination}
                    </p>
                  )}
                </div>
              </div>

              <Separator className="my-4" />

              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Booking Total</p>
                  <p className="text-lg font-semibold">
                    {formatCurrency(booking.grandTotal)}
                  </p>
                </div>
                <Button asChild variant="outline">
                  <Link href={`/admin/bookings/${booking.bookingId}`}>
                    View Booking Details
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function AdminPaymentDetailPage() {
  return (
    <AdminRoute>
      <PaymentDetailContent />
    </AdminRoute>
  );
}
