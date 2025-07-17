"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { deleteRestaurant } from "@/app/actions/restaurant-actions";
import { Trash2, Loader2 } from "lucide-react";

interface DeleteRestaurantButtonProps {
  id: string;
  restaurantName?: string;
  className?: string;
  redirectTo?: string; // Optional redirect path after deletion
}

export default function DeleteRestaurantButton({
  id,
  restaurantName,
  className,
  redirectTo,
}: DeleteRestaurantButtonProps) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteRestaurant(id);
      setOpen(false); // Close the dialog

      // Redirect to a specific path or refresh
      if (redirectTo) {
        router.push(redirectTo as any);
      } else {
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to delete restaurant:", error);
      // You might want to show a toast notification here
      // or set an error state to display to the user
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          size="sm"
          disabled={loading}
          className={`gap-2 ${className || ""}`}
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete restaurant?</AlertDialogTitle>
          <AlertDialogDescription>
            {restaurantName
              ? `Are you sure you want to delete "${restaurantName}"? This will permanently remove the restaurant, all its dishes, categories, and related data. This action cannot be undone.`
              : "Are you sure you want to delete this restaurant? This will permanently remove the restaurant, all its dishes, categories, and related data. This action cannot be undone."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Restaurant"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
