"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/app/actions/client-actions";
import { clientInput, type ClientInput } from "@/lib/schemas/user";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import FieldError from "@/components/forms/field-error";
import CreateAccountFields from "@/components/client-form/create-account-fields";
import CreateAssignDialog from "@/components/client-form/create-assign-dialog";
import AssignedRestaurants from "@/components/client-form/assigned-restaurants";
import { Building2, Plus, UserPlus, Check } from "lucide-react";
import { useState } from "react";

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

  const assign = (id: string) => {
    const currentValues = getValues('restaurantIds') || []
    setValue('restaurantIds', [...currentValues, id])
  }
  const remove = (id: string) => {
    const currentValues = getValues('restaurantIds') || []
    setValue('restaurantIds', currentValues.filter(currentId => currentId !== id))
  }

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
          <CreateAccountFields email={register("email")} password={register("password")} errors={errors} disabled={isSubmitting} />

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
                  <CreateAssignDialog
                    restaurants={restaurants}
                    selected={safeSelectedRestaurants}
                    onAssign={assign}
                    onRemove={remove}
                    disabled={isSubmitting}
                  />
                )}
              </div>

              {/* Current Assignments */}
              <AssignedRestaurants restaurants={restaurants} selected={safeSelectedRestaurants} onRemove={remove} disabled={isSubmitting} />
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
              <FieldError error={errors.restaurantName} />

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
