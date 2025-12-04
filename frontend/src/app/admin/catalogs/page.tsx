"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { catalogApi } from "@/lib/api";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { Eye, Plus, Package, MapPin } from "lucide-react";
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
  totalTransports: number;
  totalFoodPlans: number;
  calculatedTotalCost: number;
}

function CatalogsContent() {
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCatalogs = async () => {
      try {
        const response = await catalogApi.getAll();
        setCatalogs(response.data);
      } catch (error) {
        console.error("Failed to fetch catalogs:", error);
        toast.error("Failed to load catalogs");
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-5 w-72" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Travel Packages</h1>
          <p className="text-muted-foreground">
            Manage all travel package catalogs
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/catalogs/new">
            <Plus className="mr-2 h-4 w-4" />
            New Package
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            All Packages
          </CardTitle>
          <CardDescription>
            {catalogs.length} package{catalogs.length !== 1 ? "s" : ""} available
          </CardDescription>
        </CardHeader>
        <CardContent>
          {catalogs.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                No travel packages created yet
              </p>
              <Button asChild>
                <Link href="/admin/catalogs/new">Create First Package</Link>
              </Button>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Package</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Services</TableHead>
                    <TableHead className="text-right">Total Cost</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {catalogs.map((catalog) => (
                    <TableRow key={catalog.catalogId}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{catalog.packageName}</p>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {catalog.description}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {catalog.destination}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {catalog.noOfDays} Days
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(catalog.departure), "MMM d")} -{" "}
                        {format(new Date(catalog.arrival), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {catalog.totalHotels > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {catalog.totalHotels} Hotel
                              {catalog.totalHotels > 1 ? "s" : ""}
                            </Badge>
                          )}
                          {catalog.totalTransports > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {catalog.totalTransports} Transport
                            </Badge>
                          )}
                          {catalog.totalFoodPlans > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {catalog.totalFoodPlans} Meal
                              {catalog.totalFoodPlans > 1 ? "s" : ""}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(catalog.calculatedTotalCost)}
                      </TableCell>
                      <TableCell>
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/admin/catalogs/${catalog.catalogId}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminCatalogsPage() {
  return (
    <AdminRoute>
      <CatalogsContent />
    </AdminRoute>
  );
}
