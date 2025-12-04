"use client";

import { useEffect, useState } from "react";
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
import { Eye, Plus, Hotel, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface HotelData {
  hotelId: number;
  hotelName: string;
  hotelAddress: string;
  availableRooms: number;
  rent: number;
}

function HotelsContent() {
  const [hotels, setHotels] = useState<HotelData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    hotelName: "",
    hotelAddress: "",
    availableRooms: 10,
    rent: 5000,
  });

  const fetchHotels = async () => {
    try {
      const response = await hotelApi.getAll();
      setHotels(response.data);
    } catch (error) {
      console.error("Failed to fetch hotels:", error);
      toast.error("Failed to load hotels");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHotels();
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
      await hotelApi.create(formData);
      toast.success("Hotel created successfully");
      setDialogOpen(false);
      setFormData({
        hotelName: "",
        hotelAddress: "",
        availableRooms: 10,
        rent: 5000,
      });
      await fetchHotels();
    } catch (error: any) {
      console.error("Failed to create hotel:", error);
      toast.error(error.response?.data?.message || "Failed to create hotel");
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
          <h1 className="text-3xl font-bold mb-2">Hotels</h1>
          <p className="text-muted-foreground">Manage all partner hotels</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Hotel
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Hotel</DialogTitle>
              <DialogDescription>
                Add a new hotel to the system
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="hotelName">Hotel Name *</Label>
                  <Input
                    id="hotelName"
                    name="hotelName"
                    placeholder="e.g., Pearl Continental"
                    value={formData.hotelName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hotelAddress">Address *</Label>
                  <Input
                    id="hotelAddress"
                    name="hotelAddress"
                    placeholder="e.g., Club Road, Karachi"
                    value={formData.hotelAddress}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="availableRooms">Available Rooms</Label>
                    <Input
                      id="availableRooms"
                      name="availableRooms"
                      type="number"
                      min="1"
                      value={formData.availableRooms}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rent">Rent (PKR/night)</Label>
                    <Input
                      id="rent"
                      name="rent"
                      type="number"
                      min="0"
                      value={formData.rent}
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
                  {saving ? "Creating..." : "Create Hotel"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hotel className="h-5 w-5" />
            All Hotels
          </CardTitle>
          <CardDescription>
            {hotels.length} hotel{hotels.length !== 1 ? "s" : ""} registered
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hotels.length === 0 ? (
            <div className="text-center py-8">
              <Hotel className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No hotels added yet</p>
              <Button onClick={() => setDialogOpen(true)}>
                Add First Hotel
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead className="text-right">Rooms</TableHead>
                    <TableHead className="text-right">Rent/Night</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hotels.map((hotel) => (
                    <TableRow key={hotel.hotelId}>
                      <TableCell className="font-mono">
                        {hotel.hotelId}
                      </TableCell>
                      <TableCell className="font-medium">
                        {hotel.hotelName}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {hotel.hotelAddress}
                      </TableCell>
                      <TableCell className="text-right">
                        {hotel.availableRooms}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(hotel.rent)}
                      </TableCell>
                      <TableCell>
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/admin/hotels/${hotel.hotelId}`}>
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

export default function AdminHotelsPage() {
  return (
    <AdminRoute>
      <HotelsContent />
    </AdminRoute>
  );
}
