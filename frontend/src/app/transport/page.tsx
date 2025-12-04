"use client";

import { useEffect, useState } from "react";
import { transportApi } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plane, Bus, Car, Train } from "lucide-react";
import { toast } from "sonner";

interface Transport {
  transportId: number;
  type: string;
  availableSeats: number;
  fare: number;
}

export default function TransportPage() {
  const [transports, setTransports] = useState<Transport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransports = async () => {
      try {
        const response = await transportApi.getAll();
        setTransports(response.data);
      } catch (error) {
        console.error("Failed to fetch transports:", error);
        toast.error("Failed to load transport options");
      } finally {
        setLoading(false);
      }
    };

    fetchTransports();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getTransportIcon = (type: string) => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes("flight") || lowerType.includes("air")) {
      return <Plane className="h-8 w-8" />;
    }
    if (lowerType.includes("bus")) {
      return <Bus className="h-8 w-8" />;
    }
    if (lowerType.includes("train") || lowerType.includes("rail")) {
      return <Train className="h-8 w-8" />;
    }
    return <Car className="h-8 w-8" />;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-8 w-8 rounded-full mb-2" />
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-6 w-32" />
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
        <h1 className="text-3xl font-bold mb-2">Transport Options</h1>
        <p className="text-muted-foreground">
          Choose from our available transport options for your journey
        </p>
      </div>

      {transports.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">
            No transport options available at the moment.
          </p>
          <p className="text-muted-foreground">
            Check back later for new options!
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {transports.map((transport) => (
            <Card key={transport.transportId}>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-muted rounded-lg">
                    {getTransportIcon(transport.type)}
                  </div>
                  <div>
                    <CardTitle className="text-xl">{transport.type}</CardTitle>
                    <CardDescription>
                      Transport ID: {transport.transportId}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Available Seats</span>
                  <Badge
                    variant={
                      transport.availableSeats > 10
                        ? "default"
                        : transport.availableSeats > 0
                        ? "secondary"
                        : "destructive"
                    }
                  >
                    {transport.availableSeats} seats
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Fare per Seat</span>
                  <span className="font-semibold text-lg">
                    {formatCurrency(transport.fare)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
