"use client";

import { useEffect, useState } from "react";
import { foodApi } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Utensils } from "lucide-react";
import { toast } from "sonner";

interface FoodPlan {
  foodId: number;
  meals: string;
  price: number;
}

export default function FoodPage() {
  const [foodPlans, setFoodPlans] = useState<FoodPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFoodPlans = async () => {
      try {
        const response = await foodApi.getAll();
        setFoodPlans(response.data);
      } catch (error) {
        console.error("Failed to fetch food plans:", error);
        toast.error("Failed to load meal plans");
      } finally {
        setLoading(false);
      }
    };

    fetchFoodPlans();
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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-28" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Meal Plans</h1>
        <p className="text-muted-foreground">
          Browse our meal plan options for your travel
        </p>
      </div>

      {foodPlans.length === 0 ? (
        <div className="text-center py-12">
          <Utensils className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-lg">
            No meal plans available at the moment.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {foodPlans.map((food) => (
            <Card key={food.foodId} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Utensils className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{food.meals}</CardTitle>
                  </div>
                </div>
                <CardDescription>Meal Plan #{food.foodId}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">
                    {formatCurrency(food.price)}
                  </span>
                  <Badge variant="secondary">Per Person</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
