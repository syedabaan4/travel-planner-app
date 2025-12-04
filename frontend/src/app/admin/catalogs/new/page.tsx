"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, Package } from "lucide-react";
import { toast } from "sonner";
import { format, addDays } from "date-fns";

function CreateCatalogContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    packageName: "",
    destination: "",
    description: "",
    noOfDays: 3,
    budget: 50000,
    departure: format(addDays(new Date(), 30), "yyyy-MM-dd"),
    arrival: format(addDays(new Date(), 33), "yyyy-MM-dd"),
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.packageName.trim()) {
      toast.error("Package name is required");
      return;
    }

    if (!formData.destination.trim()) {
      toast.error("Destination is required");
      return;
    }

    const departureDate = new Date(formData.departure);
    const arrivalDate = new Date(formData.arrival);

    if (arrivalDate <= departureDate) {
      toast.error("Arrival date must be after departure date");
      return;
    }

    setLoading(true);

    try {
      const response = await catalogApi.create({
        packageName: formData.packageName,
        destination: formData.destination,
        description: formData.description,
        noOfDays: formData.noOfDays,
        budget: formData.budget,
        departure: formData.departure,
        arrival: formData.arrival,
      });

      toast.success("Catalog created successfully!");
      router.push(`/admin/catalogs/${response.data.catalogId}`);
    } catch (error: any) {
      console.error("Failed to create catalog:", error);
      const message =
        error.response?.data?.message || "Failed to create catalog";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Button asChild variant="ghost" className="mb-6">
        <Link href="/admin/catalogs">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Catalogs
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Create New Catalog
          </CardTitle>
          <CardDescription>
            Add a new travel package to the catalog
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="packageName">Package Name *</Label>
                <Input
                  id="packageName"
                  name="packageName"
                  placeholder="e.g., Karachi Explorer"
                  value={formData.packageName}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="destination">Destination *</Label>
                <Input
                  id="destination"
                  name="destination"
                  placeholder="e.g., Karachi"
                  value={formData.destination}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Describe the travel package..."
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  disabled={loading}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="noOfDays">Number of Days</Label>
                  <Input
                    id="noOfDays"
                    name="noOfDays"
                    type="number"
                    min="1"
                    value={formData.noOfDays}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="budget">Budget (PKR)</Label>
                  <Input
                    id="budget"
                    name="budget"
                    type="number"
                    min="0"
                    value={formData.budget}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="departure">Departure Date</Label>
                  <Input
                    id="departure"
                    name="departure"
                    type="date"
                    value={formData.departure}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="arrival">Arrival Date</Label>
                  <Input
                    id="arrival"
                    name="arrival"
                    type="date"
                    value={formData.arrival}
                    onChange={handleChange}
                    min={formData.departure}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? "Creating..." : "Create Catalog"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/catalogs")}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              After creating the catalog, you can add hotels, transport, and
              food plans to it.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CreateCatalogPage() {
  return (
    <AdminRoute>
      <CreateCatalogContent />
    </AdminRoute>
  );
}
