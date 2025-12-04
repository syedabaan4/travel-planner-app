"use client";

import { useEffect, useState } from "react";
import { hotelApi } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Hotel, MapPin, DollarSign } from "lucide-react";
import { toast } from "sonner";

interface HotelAvailability {
  hotelId: number;
  hotelName: string;
  hotelAddress: string;
  totalRooms: number;
  pricePerNight: number;
  currentlyBookedRooms: number;
  availableRoomsNow: number;
}

export default function HotelsPage() {
  const [hotels, setHotels] = useState<HotelAvailability[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHotels = async () => {
      try {
        const response = await hotelApi.getAvailability();
        setHotels(response.data);
      } catch (error) {
        console.error("Failed to fetch hotels:", error);
        toast.error("Failed to load hotels");
      } finally {
        setLoading(false);
      }
    };

    fetchHotels();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getAvailabilityBadge = (available: number, total: number) => {
    const percentage = (available / total) * 100;
    if (percentage === 0) {
      return <Badge variant="destructive">Fully Booked</Badge>;
    } else if (percentage < 30) {
      return <Badge variant="destructive">Low Availability</Badge>;
    } else if (percentage < 60) {
      return <Badge variant="secondary">Limited</Badge>;
    }
    return <Badge variant="default">Available</Badge>;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-5 w-80" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-40 mb-2" />
                <Skeleton className="h-4 w-56" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Hotels</h1>
        <p className="text-muted-foreground">
          Browse our partner hotels and check real-time availability
        </p>
      </div>

      {hotels.length === 0 ? (
        <div className="text-center py-12">
          <Hotel className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-lg">
            No hotels available at the moment.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {hotels.map((hotel) => (
            <Card key={hotel.hotelId}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Hotel className="h-5 w-5" />
                      {hotel.hotelName}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <MapPin className="h-4 w-4" />
                      {hotel.hotelAddress}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-lg font-semibold">
                    <DollarSign className="h-5 w-5" />
                    {formatCurrency(hotel.pricePerNight)}
                    <span className="text-sm font-normal text-muted-foreground">
                      /night
                    </span>
                  </div>
                  {getAvailabilityBadge(hotel.availableRoomsNow, hotel.totalRooms)}
                </div>
                <div className="text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Total Rooms:</span>
                    <span>{hotel.totalRooms}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Currently Booked:</span>
                    <span>{hotel.currentlyBookedRooms}</span>
                  </div>
                  <div className="flex justify-between font-medium text-foreground">
                    <span>Available Now:</span>
                    <span>{hotel.availableRoomsNow}</span>
                  </div>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{
                      width: `${(hotel.availableRoomsNow / hotel.totalRooms) * 100}%`,
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
