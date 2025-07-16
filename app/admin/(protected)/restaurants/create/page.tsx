import CreateRestaurantForm from "@/components/create-restaurant-form";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";

export default function CreateRestaurantPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold tracking-tight">
          Create Restaurant
        </h2>
        <Link
          href="/admin/restaurants"
          className={buttonVariants({ variant: "outline" })}
        >
          Back to Restaurants
        </Link>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>New Restaurant Details</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateRestaurantForm />
        </CardContent>
      </Card>
    </div>
  );
}
