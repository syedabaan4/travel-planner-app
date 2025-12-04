"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { catalogApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
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
  MapPin,
  Calendar,
  DollarSign,
  Hotel,
  Plane,
  Utensils,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";

interface CatalogHotel {
  hotelId: number;
  hotelName: string;
  hotelAddress: string;
  rent: number;
  roomsIncluded: number;
}

interface CatalogTransport {
  transportId: number;
  type: string;
  fare: number;
  seatsIncluded: number;
}

interface CatalogFood {
  foodId: number;
  meals: string;
  price: number;
}

interface CatalogDetail {
  catalogId: number;
  packageName: string;
  destination: string;
  description: string;
  noOfDays: number;
  budget: number;
  departure: string;
  arrival: string;
  totalHotels: number;
  totalHotelCost: number;
  totalTransports: number;
  totalTransportCost: number;
  totalFoodPlans: number;
  totalFoodCost: number;
  calculatedTotalCost: number;
  hotels: CatalogHotel[];
  transport: CatalogTransport[];
  food: CatalogFood[];
}

export default function CatalogDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [catalog, setCatalog] = useState<CatalogDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const catalogId = Number(params.id);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const response = await catalogApi.getById(catalogId);
        setCatalog(response.data);
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleBook = () => {
    if (!isAuthenticated) {
      toast.info("Please login to book this package");
      router.push("/login");
      return;
    }
    router.push(`/bookings/new/catalog/${catalogId}`);
  };

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
    <div className="container mx-auto px-4 py-8">
      <Button asChild variant="ghost" className="mb-6">
        <Link href="/">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Packages
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
                    {catalog.packageName}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1 mt-2 text-base">
                    <MapPin className="h-4 w-4" />
                    {catalog.destination}
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="text-base px-3 py-1">
                  {catalog.noOfDays} Days
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">{catalog.description}</p>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  {formatDate(catalog.departure)} - {formatDate(catalog.arrival)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Hotels Section */}
          {catalog.hotels && catalog.hotels.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hotel className="h-5 w-5" />
                  Hotels
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {catalog.hotels.map((hotel) => (
                  <div
                    key={hotel.hotelId}
                    className="flex justify-between items-start p-4 rounded-lg bg-muted/50"
                  >
                    <div>
                      <h4 className="font-medium">{hotel.hotelName}</h4>
                      <p className="text-sm text-muted-foreground">
                        {hotel.hotelAddress}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {hotel.roomsIncluded} room{hotel.roomsIncluded > 1 ? "s" : ""} included
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {formatCurrency(hotel.rent)}/night
                      </p>
                    </div>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>Total Hotel Cost</span>
                  <span>{formatCurrency(catalog.totalHotelCost)}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Transport Section */}
          {catalog.transport && catalog.transport.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plane className="h-5 w-5" />
                  Transport
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {catalog.transport.map((transport) => (
                  <div
                    key={transport.transportId}
                    className="flex justify-between items-start p-4 rounded-lg bg-muted/50"
                  >
                    <div>
                      <h4 className="font-medium">{transport.type}</h4>
                      <p className="text-sm text-muted-foreground">
                        {transport.seatsIncluded} seat{transport.seatsIncluded > 1 ? "s" : ""} included
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {formatCurrency(transport.fare)}/seat
                      </p>
                    </div>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>Total Transport Cost</span>
                  <span>{formatCurrency(catalog.totalTransportCost)}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Food Section */}
          {catalog.food && catalog.food.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Utensils className="h-5 w-5" />
                  Meal Plans
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {catalog.food.map((food) => (
                  <div
                    key={food.foodId}
                    className="flex justify-between items-start p-4 rounded-lg bg-muted/50"
                  >
                    <div>
                      <h4 className="font-medium">{food.meals}</h4>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(food.price)}</p>
                    </div>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>Total Food Cost</span>
                  <span>{formatCurrency(catalog.totalFoodCost)}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Booking Card */}
        <div>
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Price Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
              <div className="text-sm text-muted-foreground">
                Budget: {formatCurrency(catalog.budget)}
              </div>
              <Button onClick={handleBook} className="w-full" size="lg">
                Book Now
              </Button>
              {!isAuthenticated && (
                <p className="text-xs text-center text-muted-foreground">
                  You need to login to book this package
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
