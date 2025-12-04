"use client";

import { useEffect, useState } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Eye, Plus, Plane, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface TransportData {
  transportId: number;
  type: string;
  availableSeats: number;
  fare: number;
}

function TransportContent() {
  const [transports, setTransports] = useState<TransportData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    type: "",
    availableSeats: 40,
    fare: 2500,
  });

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

  useEffect(() => {
    fetchTransports();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

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
      await transportApi.create(formData);
      toast.success("Transport created successfully");
      setDialogOpen(false);
      setFormData({
        type: "",
        availableSeats: 40,
        fare: 2500,
      });
      await fetchTransports();
    } catch (error: any) {
      console.error("Failed to create transport:", error);
      toast.error(error.response?.data?.message || "Failed to create transport");
    } finally {
      setSaving(false);
    }
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
          <h1 className="text-3xl font-bold mb-2">Transport</h1>
          <p className="text-muted-foreground">Manage all transport options</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Transport
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Transport</DialogTitle>
              <DialogDescription>
                Add a new transport option to the system
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Transport Type *</Label>
                  <Input
                    id="type"
                    name="type"
                    placeholder="e.g., Bus, Flight, Train"
                    value={formData.type}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="availableSeats">Available Seats</Label>
                    <Input
                      id="availableSeats"
                      name="availableSeats"
                      type="number"
                      min="1"
                      value={formData.availableSeats}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fare">Fare (PKR/seat)</Label>
                    <Input
                      id="fare"
                      name="fare"
                      type="number"
                      min="0"
                      value={formData.fare}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {saving ? "Creating..." : "Create Transport"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plane className="h-5 w-5" />
            All Transport Options
          </CardTitle>
          <CardDescription>
            {transports.length} transport option{transports.length !== 1 ? "s" : ""} available
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transports.length === 0 ? (
            <div className="text-center py-8">
              <Plane className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                No transport options added yet
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                Add First Transport
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Available Seats</TableHead>
                    <TableHead className="text-right">Fare/Seat</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transports.map((transport) => (
                    <TableRow key={transport.transportId}>
                      <TableCell className="font-mono">
                        {transport.transportId}
                      </TableCell>
                      <TableCell className="font-medium">
                        {transport.type}
                      </TableCell>
                      <TableCell className="text-right">
                        {transport.availableSeats}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(transport.fare)}
                      </TableCell>
                      <TableCell>
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/admin/transport/${transport.transportId}`}>
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

export default function AdminTransportPage() {
  return (
    <AdminRoute>
      <TransportContent />
    </AdminRoute>
  );
}
