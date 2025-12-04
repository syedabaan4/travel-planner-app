"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { hotelApi } from "@/lib/api";
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
import { Skeleton } from "@/components/ui/skeleton";
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
import { ArrowLeft, Hotel, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface HotelDetail {
  hotelId: number;
  hotelName: string;
  hotelAddress: string;
  availableRooms: number;
  rent: number;
}

function HotelDetailContent() {
  const params = useParams();
  const router = useRouter();
  const [hotel, setHotel] = useState<HotelDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState({
    hotelName: "",
    hotelAddress: "",
    availableRooms: 0,
    rent: 0,
  });

  const hotelId = Number(params.id);

  useEffect(() => {
    const fetchHotel = async () => {
      try {
        const response = await hotelApi.getById(hotelId);
        setHotel(response.data);
        setFormData({
          hotelName: response.data.hotelName,
          hotelAddress: response.data.hotelAddress,
          availableRooms: response.data.availableRooms,
          rent: response.data.rent,
        });
      } catch (error) {
        console.error("Failed to fetch hotel:", error);
        toast.error("Failed to load hotel details");
      } finally {
        setLoading(false);
      }
    };

    if (hotelId) {
      fetchHotel();
    }
  }, [hotelId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.hotelName.trim()) {
      toast.error("Hotel name is required");
      return;
    }

    if (!formData.hotelAddress.trim()) {
      toast.error("Hotel address is required");
      return;
    }

    setSaving(true);
    try {
      await hotelApi.update(hotelId, formData);
      toast.success("Hotel updated successfully");
      router.push("/admin/hotels");
    } catch (error: any) {
      console.error("Failed to update hotel:", error);
      toast.error(error.response?.data?.message || "Failed to update hotel");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await hotelApi.delete(hotelId);
      toast.success("Hotel deleted successfully");
      router.push("/admin/hotels");
    } catch (error: any) {
      console.error("Failed to delete hotel:", error);
      toast.error(error.response?.data?.message || "Failed to delete hotel");
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Skeleton className="h-8 w-32 mb-6" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg mb-4">Hotel not found</p>
          <Button asChild variant="outline">
            <Link href="/admin/hotels">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Hotels
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <Button asChild variant="ghost">
          <Link href="/admin/hotels">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Hotels
          </Link>
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={deleting}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Hotel</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this hotel? This action cannot
                be undone.
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hotel className="h-5 w-5" />
            Edit Hotel
          </CardTitle>
          <CardDescription>
            Update hotel details - ID: {hotel.hotelId}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="hotelName">Hotel Name *</Label>
                <Input
                  id="hotelName"
                  name="hotelName"
                  value={formData.hotelName}
                  onChange={handleChange}
                  required
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hotelAddress">Address *</Label>
                <Input
                  id="hotelAddress"
                  name="hotelAddress"
                  value={formData.hotelAddress}
                  onChange={handleChange}
                  required
                  disabled={saving}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="availableRooms">Available Rooms</Label>
                  <Input
                    id="availableRooms"
                    name="availableRooms"
                    type="number"
                    min="0"
                    value={formData.availableRooms}
                    onChange={handleChange}
                    disabled={saving}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rent">Rent per Night (PKR)</Label>
                  <Input
                    id="rent"
                    name="rent"
                    type="number"
                    min="0"
                    value={formData.rent}
                    onChange={handleChange}
                    disabled={saving}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {saving ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/hotels")}
                disabled={saving}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminHotelDetailPage() {
  return (
    <AdminRoute>
      <HotelDetailContent />
    </AdminRoute>
  );
}
