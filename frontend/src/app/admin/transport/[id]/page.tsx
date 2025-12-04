"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { transportApi } from "@/lib/api";
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
import { ArrowLeft, Plane, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface TransportDetail {
  transportId: number;
  type: string;
  availableSeats: number;
  fare: number;
}

function TransportDetailContent() {
  const params = useParams();
  const router = useRouter();
  const [transport, setTransport] = useState<TransportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState({
    type: "",
    availableSeats: 0,
    fare: 0,
  });

  const transportId = Number(params.id);

  useEffect(() => {
    const fetchTransport = async () => {
      try {
        const response = await transportApi.getById(transportId);
        setTransport(response.data);
        setFormData({
          type: response.data.type,
          availableSeats: response.data.availableSeats,
          fare: response.data.fare,
        });
      } catch (error) {
        console.error("Failed to fetch transport:", error);
        toast.error("Failed to load transport details");
      } finally {
        setLoading(false);
      }
    };

    if (transportId) {
      fetchTransport();
    }
  }, [transportId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.type.trim()) {
      toast.error("Transport type is required");
      return;
    }

    setSaving(true);
    try {
      await transportApi.update(transportId, formData);
      toast.success("Transport updated successfully");
      router.push("/admin/transport");
    } catch (error: any) {
      console.error("Failed to update transport:", error);
      toast.error(
        error.response?.data?.message || "Failed to update transport",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await transportApi.delete(transportId);
      toast.success("Transport deleted successfully");
      router.push("/admin/transport");
    } catch (error: any) {
      console.error("Failed to delete transport:", error);
      toast.error(
        error.response?.data?.message || "Failed to delete transport",
      );
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

  if (!transport) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg mb-4">
            Transport not found
          </p>
          <Button asChild variant="outline">
            <Link href="/admin/transport">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Transport
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
          <Link href="/admin/transport">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Transport
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
              <AlertDialogTitle>Delete Transport</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this transport option? This
                action cannot be undone.
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
            <Plane className="h-5 w-5" />
            Edit Transport
          </CardTitle>
          <CardDescription>
            Update transport details - ID: {transport.transportId}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="type">Transport Type *</Label>
                <Input
                  id="type"
                  name="type"
                  placeholder="e.g., Bus, Flight, Train"
                  value={formData.type}
                  onChange={handleChange}
                  required
                  disabled={saving}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="availableSeats">Available Seats</Label>
                  <Input
                    id="availableSeats"
                    name="availableSeats"
                    type="number"
                    min="0"
                    value={formData.availableSeats}
                    onChange={handleChange}
                    disabled={saving}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fare">Fare per Seat (PKR)</Label>
                  <Input
                    id="fare"
                    name="fare"
                    type="number"
                    min="0"
                    value={formData.fare}
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
                onClick={() => router.push("/admin/transport")}
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

export default function AdminTransportDetailPage() {
  return (
    <AdminRoute>
      <TransportDetailContent />
    </AdminRoute>
  );
}
