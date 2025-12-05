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
  const heroImages = [
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80",
    "https://images.unsplash.com/photo-1445308394109-4ec2920981b1?auto=format&fit=crop&w=1400&q=80",
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
  ];

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
    <div className="container mx-auto px-4 py-8 space-y-10">
      {/* Hero */}
      <div
        className="relative overflow-hidden rounded-3xl border bg-primary/5"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(12,18,34,0.45), rgba(12,18,34,0.15)), url(${heroImages[0]})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/70 via-primary/50 to-secondary/60 mix-blend-multiply" />
        <div className="relative p-8 md:p-12 lg:p-16 text-white">
          <div className="flex items-center gap-3 mb-4">
            <span className="rounded-full bg-white/15 px-3 py-1 text-sm font-medium backdrop-blur">
              Explore Pakistan
            </span>
            <span className="rounded-full bg-white/15 px-3 py-1 text-sm font-medium backdrop-blur">
              Curated & Custom
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
            Find your next getaway with colorful, curated journeys.
          </h1>
          <p className="mt-4 max-w-2xl text-base md:text-lg text-white/85">
            Book ready-made adventures or craft your own custom trip across beaches,
            mountains, heritage sites, and food trails.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="lg" variant="default" className="shadow-lg shadow-black/20">
              <Link href="#packages">Browse Packages</Link>
            </Button>
            <Button
              asChild
              size="lg"
              className="bg-white/90 text-black hover:bg-white shadow-md shadow-black/10 border border-white/70"
            >
              <Link href="/bookings/new/custom">Plan a Custom Trip</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Brand photo strip */}
      <div className="grid gap-4 md:grid-cols-3" aria-hidden="true">
        {[heroImages[0], heroImages[1], heroImages[2]].map((src, idx) => (
          <div
            key={idx}
            className="relative h-44 overflow-hidden rounded-2xl border bg-muted"
            style={{
              backgroundImage: `linear-gradient(135deg, rgba(0,0,0,0.25), rgba(0,0,0,0.05)), url(${src})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        ))}
      </div>

      <div id="packages" className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold mb-2">Travel Packages</h2>
          <p className="text-muted-foreground">
            Discover our curated travel packages and plan your perfect getaway
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/bookings/new/custom">Plan a Custom Trip</Link>
          </Button>
        </div>
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
              <CardFooter className="flex">
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
