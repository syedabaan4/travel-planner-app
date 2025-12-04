"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { catalogApi } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Calendar, DollarSign } from "lucide-react";
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
  totalHotels: number;
  totalHotelCost: number;
  totalTransports: number;
  totalTransportCost: number;
  totalFoodPlans: number;
  totalFoodCost: number;
  calculatedTotalCost: number;
}

export default function HomePage() {
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCatalogs = async () => {
      try {
        const response = await catalogApi.getAll();
        setCatalogs(response.data);
      } catch (error) {
        console.error("Failed to fetch catalogs:", error);
        toast.error("Failed to load travel packages");
      } finally {
        setLoading(false);
      }
    };

    fetchCatalogs();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
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
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-16 w-full mb-4" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Travel Packages</h1>
        <p className="text-muted-foreground">
          Discover our curated travel packages and plan your perfect getaway
        </p>
      </div>

      {catalogs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">
            No travel packages available at the moment.
          </p>
          <p className="text-muted-foreground">
            Check back later for exciting new destinations!
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {catalogs.map((catalog) => (
            <Card key={catalog.catalogId} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">
                      {catalog.packageName}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <MapPin className="h-4 w-4" />
                      {catalog.destination}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">{catalog.noOfDays} Days</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {catalog.description}
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {formatDate(catalog.departure)} -{" "}
                      {formatDate(catalog.arrival)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    <span className="font-semibold text-lg">
                      {formatCurrency(catalog.calculatedTotalCost)}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 mt-4 flex-wrap">
                  {catalog.totalHotels > 0 && (
                    <Badge variant="outline">
                      {catalog.totalHotels} Hotel
                      {catalog.totalHotels > 1 ? "s" : ""}
                    </Badge>
                  )}
                  {catalog.totalTransports > 0 && (
                    <Badge variant="outline">
                      {catalog.totalTransports} Transport
                    </Badge>
                  )}
                  {catalog.totalFoodPlans > 0 && (
                    <Badge variant="outline">
                      {catalog.totalFoodPlans} Meal Plan
                      {catalog.totalFoodPlans > 1 ? "s" : ""}
                    </Badge>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full">
                  <Link href={`/catalogs/${catalog.catalogId}`}>
                    View Details
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
