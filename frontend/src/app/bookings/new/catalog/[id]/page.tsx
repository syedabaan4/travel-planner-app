"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { catalogApi, bookingApi } from "@/lib/api";
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
import { format, addDays } from "date-fns";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  DollarSign,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface Catalog {
  catalogId: number;
  packageName: string;
  destination: string;
  description: string;
  noOfDays: number;
  budget: number;
  departure: string;
  arrival: string;
  calculatedTotalCost: number;
  totalHotelCost: number;
  totalTransportCost: number;
  totalFoodCost: number;
}

function BookCatalogContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const catalogId = Number(params.id);

  const [formData, setFormData] = useState({
    bookingDescription: "",
    checkIn: "",
    checkOut: "",
    travelDate: "",
  });

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const response = await catalogApi.getById(catalogId);
        setCatalog(response.data);

        // Set default dates based on catalog
        const checkIn = response.data.departure
          ? format(new Date(response.data.departure), "yyyy-MM-dd")
          : format(addDays(new Date(), 7), "yyyy-MM-dd");
        const checkOut = response.data.arrival
          ? format(new Date(response.data.arrival), "yyyy-MM-dd")
          : format(addDays(new Date(), 7 + response.data.noOfDays), "yyyy-MM-dd");

        setFormData({
          bookingDescription: `Booking for ${response.data.packageName}`,
          checkIn,
          checkOut,
          travelDate: checkIn,
        });
      } catch (error) {
        console.error("Failed to fetch catalog:", error);
        toast.error("Failed to load package details");
      } finally {
        setLoading(false);
      }
    };

    if (catalogId) {
      fetchCatalog();
    }
  }, [catalogId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Auto-update travel date when check-in changes
    if (name === "checkIn") {
      setFormData((prev) => ({
        ...prev,
        travelDate: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id || !catalog) return;

    const checkInDate = new Date(formData.checkIn);
    const checkOutDate = new Date(formData.checkOut);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkInDate < today) {
      toast.error("Check-in date cannot be in the past");
      return;
    }

    if (checkOutDate <= checkInDate) {
      toast.error("Check-out date must be after check-in date");
      return;
    }

    setSubmitting(true);

    try {
      const response = await bookingApi.createFromCatalog({
        customerId: user.id,
        catalogId: catalog.catalogId,
        bookingDescription: formData.bookingDescription,
        checkIn: formData.checkIn,
        checkOut: formData.checkOut,
        travelDate: formData.travelDate,
      });

      toast.success("Booking created successfully!");
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Skeleton className="h-8 w-32 mb-6" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!catalog) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg mb-4">
            Package not found
          </p>
          <Button asChild variant="outline">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Packages
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button asChild variant="ghost" className="mb-6">
        <Link href={`/catalogs/${catalog.catalogId}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Package
        </Link>
      </Button>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Package Summary */}
        <Card>
          <CardHeader>
            <CardTitle>{catalog.packageName}</CardTitle>
            <CardDescription className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {catalog.destination}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{catalog.description}</p>

            <div className="flex items-center gap-2">
              <Badge variant="secondary">{catalog.noOfDays} Days</Badge>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Hotels</span>
                <span>{formatCurrency(catalog.totalHotelCost)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Transport</span>
                <span>{formatCurrency(catalog.totalTransportCost)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Meals</span>
                <span>{formatCurrency(catalog.totalFoodCost)}</span>
              </div>
            </div>

            <Separator />

            <div className="flex justify-between font-semibold text-lg">
              <span>Total</span>
              <span>{formatCurrency(catalog.calculatedTotalCost)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Booking Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Book This Package
            </CardTitle>
            <CardDescription>
              Fill in the details to complete your booking
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bookingDescription">Booking Description</Label>
                <Textarea
                  id="bookingDescription"
                  name="bookingDescription"
                  placeholder="Add any notes for your booking..."
                  value={formData.bookingDescription}
                  onChange={handleChange}
                  required
                  disabled={submitting}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="checkIn">Check-in Date</Label>
                <Input
                  id="checkIn"
                  name="checkIn"
                  type="date"
                  value={formData.checkIn}
                  onChange={handleChange}
                  required
                  disabled={submitting}
                  min={format(new Date(), "yyyy-MM-dd")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="checkOut">Check-out Date</Label>
                <Input
                  id="checkOut"
                  name="checkOut"
                  type="date"
                  value={formData.checkOut}
                  onChange={handleChange}
                  required
                  disabled={submitting}
                  min={formData.checkIn || format(new Date(), "yyyy-MM-dd")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="travelDate">Travel Date</Label>
                <Input
                  id="travelDate"
                  name="travelDate"
                  type="date"
                  value={formData.travelDate}
                  onChange={handleChange}
                  required
                  disabled={submitting}
                  min={format(new Date(), "yyyy-MM-dd")}
                />
                <p className="text-xs text-muted-foreground">
                  The date you plan to start your trip
                </p>
              </div>

              <Separator />

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Total Amount</span>
                </div>
                <span className="text-xl font-bold">
                  {formatCurrency(catalog.calculatedTotalCost)}
                </span>
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={submitting}
              >
                {submitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {submitting ? "Creating Booking..." : "Confirm Booking"}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Payment will be processed after booking confirmation
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function BookCatalogPage() {
  return (
    <ProtectedRoute>
      <BookCatalogContent />
    </ProtectedRoute>
  );
}
