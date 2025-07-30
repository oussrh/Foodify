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
import { deleteDish } from "@/app/actions/dish-actions";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";

interface DeleteDishButtonProps {
  id: string;
  dishName?: string;
}

export default function DeleteDishButton({
  id,
  dishName,
}: DeleteDishButtonProps) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteDish(id);
      setOpen(false); // Close the dialog
      router.refresh(); // Refresh the page to show updated data
    } catch (error) {
      console.error("Failed to delete dish:", error);
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
          className="gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-full">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <AlertDialogTitle className="text-lg font-semibold text-gray-900">
                Delete Dish
              </AlertDialogTitle>
            </div>
          </div>
        </AlertDialogHeader>
        <div className="space-y-4">
          <AlertDialogDescription className="text-gray-600 leading-relaxed">
            Are you sure you want to permanently delete{" "}
            {dishName ? (
              <span className="font-semibold text-gray-900">&ldquo;{dishName}&rdquo;</span>
            ) : (
              "this dish"
            )}?
          </AlertDialogDescription>
          
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-700">
                <strong>Warning:</strong> This action cannot be undone. All dish data, including images, descriptions, and customer interactions will be permanently removed.
              </div>
            </div>
          </div>
        </div>
        <AlertDialogFooter className="gap-3">
          <AlertDialogCancel 
            disabled={loading}
            className="flex-1"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Permanently
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
