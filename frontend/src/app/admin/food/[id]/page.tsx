"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { foodApi } from "@/lib/api";
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
import { ArrowLeft, Utensils, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface FoodDetail {
  foodId: number;
  meals: string;
  price: number;
}

function FoodDetailContent() {
  const params = useParams();
  const router = useRouter();
  const [food, setFood] = useState<FoodDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState({
    meals: "",
    price: 0,
  });

  const foodId = Number(params.id);

  useEffect(() => {
    const fetchFood = async () => {
      try {
        const response = await foodApi.getById(foodId);
        setFood(response.data);
        setFormData({
          meals: response.data.meals,
          price: response.data.price,
        });
      } catch (error) {
        console.error("Failed to fetch food plan:", error);
        toast.error("Failed to load meal plan details");
      } finally {
        setLoading(false);
      }
    };

    if (foodId) {
      fetchFood();
    }
  }, [foodId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.meals.trim()) {
      toast.error("Meal description is required");
      return;
    }

    setSaving(true);
    try {
      await foodApi.update(foodId, formData);
      toast.success("Meal plan updated successfully");
      router.push("/admin/food");
    } catch (error: any) {
      console.error("Failed to update food plan:", error);
      toast.error(
        error.response?.data?.message || "Failed to update meal plan",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await foodApi.delete(foodId);
      toast.success("Meal plan deleted successfully");
      router.push("/admin/food");
    } catch (error: any) {
      console.error("Failed to delete food plan:", error);
      toast.error(
        error.response?.data?.message || "Failed to delete meal plan",
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

  if (!food) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg mb-4">
            Meal plan not found
          </p>
          <Button asChild variant="outline">
            <Link href="/admin/food">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Meal Plans
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
          <Link href="/admin/food">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Meal Plans
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
              <AlertDialogTitle>Delete Meal Plan</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this meal plan? This action
                cannot be undone.
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
            <Utensils className="h-5 w-5" />
            Edit Meal Plan
          </CardTitle>
          <CardDescription>
            Update meal plan details - ID: {food.foodId}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="meals">Meal Description *</Label>
                <Input
                  id="meals"
                  name="meals"
                  placeholder="e.g., Breakfast + Dinner"
                  value={formData.meals}
                  onChange={handleChange}
                  required
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price (PKR)</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  value={formData.price}
                  onChange={handleChange}
                  disabled={saving}
                />
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
                onClick={() => router.push("/admin/food")}
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

export default function AdminFoodDetailPage() {
  return (
    <AdminRoute>
      <FoodDetailContent />
    </AdminRoute>
  );
}
