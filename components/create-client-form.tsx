"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/app/actions/client-actions";
import { clientInput, type ClientInput } from "@/lib/schemas/user";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Mail, Lock, Building2, Plus, UserPlus, Check, X, Search } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Restaurant = { id: string; name: string };

const schema = clientInput;
type FormValues = ClientInput;

export default function CreateClientForm({
  restaurants,
}: {
  restaurants: Restaurant[];
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
    getValues,
    setValue,
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

  const selectedRestaurants = useWatch({ control, name: 'restaurantIds' }) || [];
  const newRestaurantName = useWatch({ control, name: 'restaurantName' });

  // Ensure selectedRestaurants is always an array
  const safeSelectedRestaurants = Array.isArray(selectedRestaurants) ? selectedRestaurants : [];

  return (
    <Card className="border-0">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-success" />
          Create New Restaurant Administrator
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {success && (
          <div className="mb-6 p-4 bg-muted border border-border rounded-lg flex items-center gap-2">
            <Check className="h-4 w-4 text-success" />
            <span className="text-sm text-success font-medium">User created successfully!</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Account Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground border-b pb-2">Account Information</h3>
            
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Address
              </Label>
              <Input 
                id="email" 
                {...register("email")} 
                className="border-border focus:border-border-strong"
                placeholder="admin@restaurant.com"
                disabled={isSubmitting}
              />
              {errors.email && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <span className="w-1 h-1 bg-destructive rounded-full"></span>
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Password
              </Label>
              <Input 
                id="password" 
                type="password" 
                {...register("password")} 
                className="border-border focus:border-border-strong"
                placeholder="Minimum 6 characters"
                disabled={isSubmitting}
              />
              {errors.password && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <span className="w-1 h-1 bg-destructive rounded-full"></span>
                  {errors.password.message}
                </p>
              )}
            </div>
          </div>

          {/* Restaurant Assignment */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground border-b pb-2">Restaurant Assignment</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium leading-none text-muted-foreground flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Restaurant Assignments
                </p>
                {restaurants.length > 0 && (
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button type="button" variant="outline" size="sm" className="border-border text-muted-foreground hover:bg-muted">
                        <Plus className="h-4 w-4 mr-2" />
                        Assign Restaurants
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Building2 className="h-5 w-5 text-muted-foreground" />
                          Assign Restaurants to User
                        </DialogTitle>
                      </DialogHeader>
                      
                      <div className="space-y-4">
                        {/* Search */}
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -/2 text-muted-foreground h-4 w-4" />
                          <Input
                            placeholder="Search restaurants..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 border-border focus:border-border-strong"
                          />
                        </div>
                        
                        {/* Restaurant List */}
                        <div className="max-h-96 overflow-y-auto space-y-2">
                          {restaurants
                            .filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()))
                            .map((restaurant) => {
                              const isAssigned = safeSelectedRestaurants.includes(restaurant.id)
                              
                              return (
                                <div 
                                  key={restaurant.id}
                                  className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
 isAssigned ? 'bg-muted border-border' : 'bg-card border-border hover:bg-muted'
 }`}
                                >
                                  <div className="flex-1">
                                    <h4 className="font-medium text-foreground">{restaurant.name}</h4>
                                    {isAssigned && (
                                      <Badge className="bg-muted text-muted-foreground border-border text-xs mt-1">
                                        Assigned
                                      </Badge>
                                    )}
                                  </div>
                                  
                                  <div className="flex items-center gap-2">
                                    {isAssigned ? (
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          const currentValues = getValues('restaurantIds') || []
                                          const newValues = currentValues.filter(id => id !== restaurant.id)
                                          setValue('restaurantIds', newValues)
                                        }}
                                        className="border-border text-destructive hover:bg-muted"
                                        disabled={isSubmitting}
                                      >
                                        <X className="h-4 w-4 mr-1" />
                                        Remove
                                      </Button>
                                    ) : (
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          const currentValues = getValues('restaurantIds') || []
                                          const newValues = [...currentValues, restaurant.id]
                                          setValue('restaurantIds', newValues)
                                        }}
                                        className="border-border text-success hover:bg-muted"
                                        disabled={isSubmitting}
                                      >
                                        <Plus className="h-4 w-4 mr-1" />
                                        Assign
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                        </div>
                        
                        {restaurants.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
                          <div className="text-center py-8">
                            <Building2 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">No restaurants found</p>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
              
              {/* Current Assignments */}
              {safeSelectedRestaurants.length === 0 ? (
                <div className="p-4 bg-muted border-2 border-dashed border-border rounded-lg text-center">
                  <Building2 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">No restaurants assigned</p>
                  <p className="text-xs text-muted-foreground">
                    {restaurants.length > 0 ? 'Click "Assign Restaurants" to select restaurants' : 'No restaurants available to assign'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Assigned Restaurants ({safeSelectedRestaurants.length}):</p>
                  <div className="space-y-2">
                    {safeSelectedRestaurants.map((id) => {
                      const restaurant = restaurants.find(r => r.id === id)
                      return restaurant ? (
                        <div key={id} className="flex items-center justify-between p-3 bg-muted border border-border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <h4 className="font-medium text-foreground">{restaurant.name}</h4>
                              <Badge className="bg-muted text-muted-foreground border-border text-xs mt-1">
                                Assigned
                              </Badge>
                            </div>
                          </div>
                          
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const currentValues = getValues('restaurantIds') || []
                              const newValues = currentValues.filter(currentId => currentId !== id)
                              setValue('restaurantIds', newValues)
                            }}
                            className="text-destructive hover:bg-muted"
                            disabled={isSubmitting}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : null
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-border w-full"></div>
              <div className="bg-card px-4 text-sm text-muted-foreground font-medium">OR</div>
              <div className="border-t border-border w-full"></div>
            </div>

            {/* New Restaurant */}
            <div className="space-y-2">
              <Label htmlFor="restaurantName" className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create New Restaurant
              </Label>
              <Input 
                id="restaurantName" 
                {...register("restaurantName")} 
                className="border-border focus:border-border-strong"
                placeholder="New restaurant name"
                disabled={isSubmitting}
              />
              {errors.restaurantName && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <span className="w-1 h-1 bg-destructive rounded-full"></span>
                  {errors.restaurantName.message}
                </p>
              )}
              
              {newRestaurantName && (
                <div className="p-3 bg-muted border border-border rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>New Restaurant:</strong> {newRestaurantName}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    This restaurant will be created automatically when the user is created.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-border">
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full disabled:opacity-50"
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