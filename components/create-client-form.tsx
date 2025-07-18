"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/app/actions/client-actions";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Mail, Lock, Building2, Plus, UserPlus, Check } from "lucide-react";
import { useState } from "react";

type Restaurant = { id: string; name: string };

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  restaurantIds: z.array(z.string()).optional(),
  restaurantName: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function CreateClientForm({
  restaurants,
}: {
  restaurants: Restaurant[];
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      await createClient({ ...data, restaurantIds: data.restaurantIds || [] });
      setSuccess(true);
      reset();
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error creating client:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedRestaurants = watch('restaurantIds') || [];
  const newRestaurantName = watch('restaurantName');

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-green-600" />
          Create New Restaurant Administrator
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <Check className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-700 font-medium">User created successfully!</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Account Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Account Information</h3>
            
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Address
              </Label>
              <Input 
                id="email" 
                {...register("email")} 
                className="border-green-200 focus:border-green-400"
                placeholder="admin@restaurant.com"
                disabled={isSubmitting}
              />
              {errors.email && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Password
              </Label>
              <Input 
                id="password" 
                type="password" 
                {...register("password")} 
                className="border-green-200 focus:border-green-400"
                placeholder="Minimum 6 characters"
                disabled={isSubmitting}
              />
              {errors.password && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                  {errors.password.message}
                </p>
              )}
            </div>
          </div>

          {/* Restaurant Assignment */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Restaurant Assignment</h3>
            
            {restaurants.length > 0 && (
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Assign to Existing Restaurants
                </Label>
                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-4 space-y-2">
                  {restaurants.map((r: Restaurant) => (
                    <div key={r.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                      <Checkbox
                        id={`restaurant-${r.id}`}
                        value={r.id}
                        {...register('restaurantIds')}
                        disabled={isSubmitting}
                      />
                      <Label htmlFor={`restaurant-${r.id}`} className="font-normal flex-1 cursor-pointer">
                        {r.name}
                      </Label>
                    </div>
                  ))}
                </div>
                
                {selectedRestaurants.length > 0 && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-700 font-medium mb-2">Selected Restaurants:</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedRestaurants.map((id) => {
                        const restaurant = restaurants.find(r => r.id === id);
                        return restaurant ? (
                          <Badge key={id} className="bg-blue-100 text-blue-700 border-blue-200">
                            {restaurant.name}
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="relative flex items-center justify-center">
              <div className="border-t border-gray-200 w-full"></div>
              <div className="bg-white px-4 text-sm text-gray-500 font-medium">OR</div>
              <div className="border-t border-gray-200 w-full"></div>
            </div>

            {/* New Restaurant */}
            <div className="space-y-2">
              <Label htmlFor="restaurantName" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create New Restaurant
              </Label>
              <Input 
                id="restaurantName" 
                {...register("restaurantName")} 
                className="border-purple-200 focus:border-purple-400"
                placeholder="New restaurant name"
                disabled={isSubmitting}
              />
              {errors.restaurantName && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                  {errors.restaurantName.message}
                </p>
              )}
              
              {newRestaurantName && (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="text-sm text-purple-700">
                    <strong>New Restaurant:</strong> {newRestaurantName}
                  </p>
                  <p className="text-xs text-purple-600 mt-1">
                    This restaurant will be created automatically when the user is created.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating User...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Create Restaurant Administrator
                </div>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}