"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { catalogApi, hotelApi, transportApi, foodApi } from "@/lib/api";
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
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Hotel,
  Plane,
  Utensils,
  DollarSign,
  Plus,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface CatalogHotel {
  hotelId: number;
  hotelName: string;
  hotelAddress: string;
  rent: number;
  roomsIncluded: number;
}

interface CatalogTransport {
  transportId: number;
  type: string;
  fare: number;
  seatsIncluded: number;
}

interface CatalogFood {
  foodId: number;
  meals: string;
  price: number;
}

interface CatalogDetail {
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
  hotels: CatalogHotel[];
  transport: CatalogTransport[];
  food: CatalogFood[];
}

interface HotelOption {
  hotelId: number;
  hotelName: string;
  rent: number;
}

interface TransportOption {
  transportId: number;
  type: string;
  fare: number;
}

interface FoodOption {
  foodId: number;
  meals: string;
  price: number;
}

function CatalogDetailContent() {
  const params = useParams();
  const router = useRouter();
  const [catalog, setCatalog] = useState<CatalogDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Options for adding services
  const [hotels, setHotels] = useState<HotelOption[]>([]);
  const [transports, setTransports] = useState<TransportOption[]>([]);
  const [foods, setFoods] = useState<FoodOption[]>([]);

  // Add hotel form
  const [hotelDialogOpen, setHotelDialogOpen] = useState(false);
  const [selectedHotelId, setSelectedHotelId] = useState("");
  const [roomsIncluded, setRoomsIncluded] = useState(1);

  // Add transport form
  const [transportDialogOpen, setTransportDialogOpen] = useState(false);
  const [selectedTransportId, setSelectedTransportId] = useState("");
  const [seatsIncluded, setSeatsIncluded] = useState(1);

  // Add food form
  const [foodDialogOpen, setFoodDialogOpen] = useState(false);
  const [selectedFoodId, setSelectedFoodId] = useState("");

  const catalogId = Number(params.id);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catalogRes, hotelsRes, transportsRes, foodsRes] =
          await Promise.all([
            catalogApi.getById(catalogId),
            hotelApi.getAll(),
            transportApi.getAll(),
            foodApi.getAll(),
          ]);

        setCatalog(catalogRes.data);
        setHotels(hotelsRes.data);
        setTransports(transportsRes.data);
        setFoods(foodsRes.data);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        toast.error("Failed to load catalog details");
      } finally {
        setLoading(false);
      }
    };

    if (catalogId) {
      fetchData();
    }
  }, [catalogId]);

  const refreshCatalog = async () => {
    try {
      const response = await catalogApi.getById(catalogId);
      setCatalog(response.data);
    } catch (error) {
      console.error("Failed to refresh catalog:", error);
    }
  };

  const handleAddHotel = async () => {
    if (!selectedHotelId) {
      toast.error("Please select a hotel");
      return;
    }

    setSaving(true);
    try {
      await catalogApi.addHotel(catalogId, {
        hotelId: parseInt(selectedHotelId),
        roomsIncluded,
      });
      toast.success("Hotel added to catalog");
      setHotelDialogOpen(false);
      setSelectedHotelId("");
      setRoomsIncluded(1);
      await refreshCatalog();
    } catch (error: any) {
      console.error("Failed to add hotel:", error);
      toast.error(error.response?.data?.message || "Failed to add hotel");
    } finally {
      setSaving(false);
    }
  };

  const handleAddTransport = async () => {
    if (!selectedTransportId) {
      toast.error("Please select a transport");
      return;
    }

    setSaving(true);
    try {
      await catalogApi.addTransport(catalogId, {
        transportId: parseInt(selectedTransportId),
        seatsIncluded,
      });
      toast.success("Transport added to catalog");
      setTransportDialogOpen(false);
      setSelectedTransportId("");
      setSeatsIncluded(1);
      await refreshCatalog();
    } catch (error: any) {
      console.error("Failed to add transport:", error);
      toast.error(error.response?.data?.message || "Failed to add transport");
    } finally {
      setSaving(false);
    }
  };

  const handleAddFood = async () => {
    if (!selectedFoodId) {
      toast.error("Please select a meal plan");
      return;
    }

    setSaving(true);
    try {
      await catalogApi.addFood(catalogId, {
        foodId: parseInt(selectedFoodId),
      });
      toast.success("Meal plan added to catalog");
      setFoodDialogOpen(false);
      setSelectedFoodId("");
      await refreshCatalog();
    } catch (error: any) {
      console.error("Failed to add food:", error);
      toast.error(error.response?.data?.message || "Failed to add meal plan");
    } finally {
      setSaving(false);
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
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-32 mb-6" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-48" />
            <Skeleton className="h-64" />
          </div>
          <div>
            <Skeleton className="h-72" />
          </div>
        </div>
      </div>
    );
  }

  if (!catalog) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg mb-4">
            Catalog not found
          </p>
          <Button asChild variant="outline">
            <Link href="/admin/catalogs">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Catalogs
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button asChild variant="ghost" className="mb-6">
        <Link href="/admin/catalogs">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Catalogs
        </Link>
      </Button>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Main Info Card */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">{catalog.packageName}</CardTitle>
                  <CardDescription className="flex items-center gap-1 mt-2 text-base">
                    <MapPin className="h-4 w-4" />
                    {catalog.destination}
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="text-base px-3 py-1">
                  {catalog.noOfDays} Days
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">{catalog.description}</p>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  {format(new Date(catalog.departure), "MMMM d, yyyy")} -{" "}
                  {format(new Date(catalog.arrival), "MMMM d, yyyy")}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                Budget: {formatCurrency(catalog.budget)}
              </div>
            </CardContent>
          </Card>

          {/* Hotels Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Hotel className="h-5 w-5" />
                  Hotels
                </CardTitle>
                <CardDescription>
                  {catalog.hotels?.length || 0} hotel(s) included
                </CardDescription>
              </div>
              <Dialog open={hotelDialogOpen} onOpenChange={setHotelDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Hotel
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Hotel to Catalog</DialogTitle>
                    <DialogDescription>
                      Select a hotel and specify the number of rooms to include
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Hotel</Label>
                      <Select
                        value={selectedHotelId}
                        onValueChange={setSelectedHotelId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select hotel" />
                        </SelectTrigger>
                        <SelectContent>
                          {hotels.map((hotel) => (
                            <SelectItem
                              key={hotel.hotelId}
                              value={hotel.hotelId.toString()}
                            >
                              {hotel.hotelName} - {formatCurrency(hotel.rent)}
                              /night
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Rooms Included</Label>
                      <Input
                        type="number"
                        min="1"
                        value={roomsIncluded}
                        onChange={(e) =>
                          setRoomsIncluded(parseInt(e.target.value) || 1)
                        }
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setHotelDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleAddHotel} disabled={saving}>
                      {saving && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Add Hotel
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="space-y-4">
              {!catalog.hotels || catalog.hotels.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hotels added yet
                </p>
              ) : (
                catalog.hotels.map((hotel) => (
                  <div
                    key={hotel.hotelId}
                    className="flex justify-between items-start p-4 rounded-lg bg-muted/50"
                  >
                    <div>
                      <h4 className="font-medium">{hotel.hotelName}</h4>
                      <p className="text-sm text-muted-foreground">
                        {hotel.hotelAddress}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {hotel.roomsIncluded} room
                        {hotel.roomsIncluded > 1 ? "s" : ""} included
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {formatCurrency(hotel.rent)}/night
                      </p>
                    </div>
                  </div>
                ))
              )}
              {catalog.totalHotelCost > 0 && (
                <>
                  <Separator />
                  <div className="flex justify-between font-medium">
                    <span>Total Hotel Cost</span>
                    <span>{formatCurrency(catalog.totalHotelCost)}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Transport Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Plane className="h-5 w-5" />
                  Transport
                </CardTitle>
                <CardDescription>
                  {catalog.transport?.length || 0} transport option(s) included
                </CardDescription>
              </div>
              <Dialog
                open={transportDialogOpen}
                onOpenChange={setTransportDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Transport
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Transport to Catalog</DialogTitle>
                    <DialogDescription>
                      Select a transport option and specify the number of seats
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Transport</Label>
                      <Select
                        value={selectedTransportId}
                        onValueChange={setSelectedTransportId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select transport" />
                        </SelectTrigger>
                        <SelectContent>
                          {transports.map((transport) => (
                            <SelectItem
                              key={transport.transportId}
                              value={transport.transportId.toString()}
                            >
                              {transport.type} - {formatCurrency(transport.fare)}
                              /seat
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Seats Included</Label>
                      <Input
                        type="number"
                        min="1"
                        value={seatsIncluded}
                        onChange={(e) =>
                          setSeatsIncluded(parseInt(e.target.value) || 1)
                        }
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setTransportDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleAddTransport} disabled={saving}>
                      {saving && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Add Transport
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="space-y-4">
              {!catalog.transport || catalog.transport.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No transport added yet
                </p>
              ) : (
                catalog.transport.map((transport) => (
                  <div
                    key={transport.transportId}
                    className="flex justify-between items-start p-4 rounded-lg bg-muted/50"
                  >
                    <div>
                      <h4 className="font-medium">{transport.type}</h4>
                      <p className="text-sm text-muted-foreground">
                        {transport.seatsIncluded} seat
                        {transport.seatsIncluded > 1 ? "s" : ""} included
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {formatCurrency(transport.fare)}/seat
                      </p>
                    </div>
                  </div>
                ))
              )}
              {catalog.totalTransportCost > 0 && (
                <>
                  <Separator />
                  <div className="flex justify-between font-medium">
                    <span>Total Transport Cost</span>
                    <span>{formatCurrency(catalog.totalTransportCost)}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Food Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Utensils className="h-5 w-5" />
                  Meal Plans
                </CardTitle>
                <CardDescription>
                  {catalog.food?.length || 0} meal plan(s) included
                </CardDescription>
              </div>
              <Dialog open={foodDialogOpen} onOpenChange={setFoodDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Meal Plan
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Meal Plan to Catalog</DialogTitle>
                    <DialogDescription>
                      Select a meal plan to include in the package
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Meal Plan</Label>
                      <Select
                        value={selectedFoodId}
                        onValueChange={setSelectedFoodId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select meal plan" />
                        </SelectTrigger>
                        <SelectContent>
                          {foods.map((food) => (
                            <SelectItem
                              key={food.foodId}
                              value={food.foodId.toString()}
                            >
                              {food.meals} - {formatCurrency(food.price)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setFoodDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleAddFood} disabled={saving}>
                      {saving && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Add Meal Plan
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="space-y-4">
              {!catalog.food || catalog.food.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No meal plans added yet
                </p>
              ) : (
                catalog.food.map((food) => (
                  <div
                    key={food.foodId}
                    className="flex justify-between items-start p-4 rounded-lg bg-muted/50"
                  >
                    <div>
                      <h4 className="font-medium">{food.meals}</h4>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(food.price)}</p>
                    </div>
                  </div>
                ))
              )}
              {catalog.totalFoodCost > 0 && (
                <>
                  <Separator />
                  <div className="flex justify-between font-medium">
                    <span>Total Food Cost</span>
                    <span>{formatCurrency(catalog.totalFoodCost)}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div>
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Cost Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Hotels</span>
                  <span>{formatCurrency(catalog.totalHotelCost)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Transport</span>
                  <span>{formatCurrency(catalog.totalTransportCost)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Meals</span>
                  <span>{formatCurrency(catalog.totalFoodCost)}</span>
                </div>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>{formatCurrency(catalog.calculatedTotalCost)}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                Budget: {formatCurrency(catalog.budget)}
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="font-medium">Package Stats</h4>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-muted/50 rounded">
                    <p className="text-lg font-bold">{catalog.totalHotels}</p>
                    <p className="text-xs text-muted-foreground">Hotels</p>
                  </div>
                  <div className="p-2 bg-muted/50 rounded">
                    <p className="text-lg font-bold">{catalog.totalTransports}</p>
                    <p className="text-xs text-muted-foreground">Transport</p>
                  </div>
                  <div className="p-2 bg-muted/50 rounded">
                    <p className="text-lg font-bold">{catalog.totalFoodPlans}</p>
                    <p className="text-xs text-muted-foreground">Meals</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function AdminCatalogDetailPage() {
  return (
    <AdminRoute>
      <CatalogDetailContent />
    </AdminRoute>
  );
}
