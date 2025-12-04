"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { customerApi } from "@/lib/api";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  BookOpen,
  CheckCircle,
  XCircle,
  DollarSign,
  Award,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

interface CustomerSummary {
  customerId: number;
  name: string;
  email: string;
  phone: string;
  username: string;
  totalBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  totalSpent: number;
  customerTier: string;
}

function CustomerDetailContent() {
  const params = useParams();
  const router = useRouter();
  const [customer, setCustomer] = useState<CustomerSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const customerId = Number(params.id);

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const response = await customerApi.getSummary(customerId);
        setCustomer(response.data);
      } catch (error) {
        console.error("Failed to fetch customer:", error);
        toast.error("Failed to load customer details");
      } finally {
        setLoading(false);
      }
    };

    if (customerId) {
      fetchCustomer();
    }
  }, [customerId]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await customerApi.delete(customerId);
      toast.success("Customer deleted successfully");
      router.push("/admin/customers");
    } catch (error: any) {
      console.error("Failed to delete customer:", error);
      toast.error(error.response?.data?.message || "Failed to delete customer");
    } finally {
      setDeleting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getTierColor = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case "platinum":
        return "bg-gradient-to-r from-gray-300 to-gray-500 text-white";
      case "gold":
        return "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white";
      case "silver":
        return "bg-gradient-to-r from-gray-400 to-gray-600 text-white";
      default:
        return "bg-gradient-to-r from-amber-600 to-amber-800 text-white";
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-32 mb-6" />
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-64" />
          <Skeleton className="h-64 md:col-span-2" />
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg mb-4">
            Customer not found
          </p>
          <Button asChild variant="outline">
            <Link href="/admin/customers">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Customers
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <Button asChild variant="ghost">
          <Link href="/admin/customers">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Customers
          </Link>
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={deleting}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Customer
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Customer</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this customer? This action
                cannot be undone and will also delete all associated bookings
                and payments.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card */}
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <User className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-xl">{customer.name}</CardTitle>
            <CardDescription>@{customer.username}</CardDescription>
            <div className="mt-2">
              <Badge
                className={`${getTierColor(customer.customerTier)} px-3 py-1`}
              >
                <Award className="mr-1 h-3 w-3" />
                {customer.customerTier} Member
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{customer.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{customer.phone}</span>
            </div>
            <Separator />
            <div className="text-xs text-muted-foreground">
              Customer ID: {customer.customerId}
            </div>
          </CardContent>
        </Card>

        {/* Stats Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Customer Statistics</CardTitle>
            <CardDescription>Booking and spending summary</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{customer.totalBookings}</p>
                  <p className="text-sm text-muted-foreground">
                    Total Bookings
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {customer.confirmedBookings}
                  </p>
                  <p className="text-sm text-muted-foreground">Confirmed</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <XCircle className="h-6 w-6 text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {customer.cancelledBookings}
                  </p>
                  <p className="text-sm text-muted-foreground">Cancelled</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                <div className="p-2 bg-yellow-500/10 rounded-lg">
                  <DollarSign className="h-6 w-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {formatCurrency(customer.totalSpent)}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Spent</p>
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            <div className="space-y-4">
              <h4 className="font-medium">Membership Tier Progress</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span
                    className={
                      customer.customerTier === "Bronze" ? "font-bold" : ""
                    }
                  >
                    Bronze
                  </span>
                  <span>&lt; PKR 50,000</span>
                </div>
                <div className="flex justify-between">
                  <span
                    className={
                      customer.customerTier === "Silver" ? "font-bold" : ""
                    }
                  >
                    Silver
                  </span>
                  <span>≥ PKR 50,000</span>
                </div>
                <div className="flex justify-between">
                  <span
                    className={
                      customer.customerTier === "Gold" ? "font-bold" : ""
                    }
                  >
                    Gold
                  </span>
                  <span>≥ PKR 100,000</span>
                </div>
                <div className="flex justify-between">
                  <span
                    className={
                      customer.customerTier === "Platinum" ? "font-bold" : ""
                    }
                  >
                    Platinum
                  </span>
                  <span>≥ PKR 200,000</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AdminCustomerDetailPage() {
  return (
    <AdminRoute>
      <CustomerDetailContent />
    </AdminRoute>
  );
}
