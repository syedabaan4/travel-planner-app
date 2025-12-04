"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { customerApi } from "@/lib/api";
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
import {
  User,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  BookOpen,
  CheckCircle,
  XCircle,
  Settings,
  Award,
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

function ProfileContent() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<CustomerSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      if (!user?.id) return;

      try {
        const response = await customerApi.getSummary(user.id);
        setSummary(response.data);
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [user?.id]);

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
        <div className="mb-8">
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-5 w-72" />
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-1">
            <Skeleton className="h-64" />
          </div>
          <div className="md:col-span-2">
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">
            Failed to load profile. Please try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Profile</h1>
          <p className="text-muted-foreground">
            View and manage your account information
          </p>
        </div>
        <Button asChild>
          <Link href="/profile/edit">
            <Settings className="mr-2 h-4 w-4" />
            Edit Profile
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card */}
        <Card className="md:col-span-1">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <User className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-xl">{summary.name}</CardTitle>
            <CardDescription>@{summary.username}</CardDescription>
            <div className="mt-2">
              <Badge className={`${getTierColor(summary.customerTier)} px-3 py-1`}>
                <Award className="mr-1 h-3 w-3" />
                {summary.customerTier} Member
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{summary.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{summary.phone}</span>
            </div>
          </CardContent>
        </Card>

        {/* Stats Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Booking Statistics</CardTitle>
            <CardDescription>Your travel history at a glance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{summary.totalBookings}</p>
                  <p className="text-sm text-muted-foreground">Total Bookings</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{summary.confirmedBookings}</p>
                  <p className="text-sm text-muted-foreground">Confirmed</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <XCircle className="h-6 w-6 text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{summary.cancelledBookings}</p>
                  <p className="text-sm text-muted-foreground">Cancelled</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                <div className="p-2 bg-yellow-500/10 rounded-lg">
                  <DollarSign className="h-6 w-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {formatCurrency(summary.totalSpent)}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Spent</p>
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            <div className="space-y-4">
              <h4 className="font-medium">Membership Tiers</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>Bronze</span>
                  <span>&lt; PKR 50,000</span>
                </div>
                <div className="flex justify-between">
                  <span>Silver</span>
                  <span>≥ PKR 50,000</span>
                </div>
                <div className="flex justify-between">
                  <span>Gold</span>
                  <span>≥ PKR 100,000</span>
                </div>
                <div className="flex justify-between">
                  <span>Platinum</span>
                  <span>≥ PKR 200,000</span>
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            <div className="flex gap-4">
              <Button asChild variant="outline" className="flex-1">
                <Link href="/bookings">
                  <Calendar className="mr-2 h-4 w-4" />
                  View My Bookings
                </Link>
              </Button>
              <Button asChild className="flex-1">
                <Link href="/bookings/new/custom">
                  Create Custom Booking
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}
