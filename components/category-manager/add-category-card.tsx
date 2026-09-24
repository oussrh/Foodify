// components/category-manager/add-category-card.tsx
// The "Add New Category" card: the two name inputs and their draft, cleared once the parent
// has created the category. The icon colour is the one thing the two portals paint differently.
"use client";

import { useId, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FolderPlus, Plus } from "lucide-react";
import type { Names } from "./types";

/**
 * The card that creates a category from its English and French names. Both are required; the draft
 * is cleared only once the parent's onAdd has created it.
 */
export default function AddCategoryCard({
  onAdd,
  iconClassName,
}: {
  /** Resolves whether the category was created; a refused name keeps the draft to correct. */
  onAdd: (names: Names) => Promise<boolean>;
  iconClassName: string;
}) {
  const ids = useId()
  const [newCat, setNewCat] = useState({ en: "", fr: "" });

  const handleAddCategory = async () => {
    if (!newCat.en || !newCat.fr) return;
    if (await onAdd(newCat)) setNewCat({ en: "", fr: "" });
  };

  return (
    <Card className="border-0">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <FolderPlus className={`h-5 w-5 ${iconClassName}`} />
          Add New Category
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor={`${ids}-en`} className="text-sm font-medium text-muted-foreground">Name (English)</label>
              <Input id={`${ids}-en`}
                placeholder="e.g., Appetizers"
                value={newCat.en}
                onChange={(e) => setNewCat({ ...newCat, en: e.target.value })}
                className="border-border focus:border-border-strong"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor={`${ids}-fr`} className="text-sm font-medium text-muted-foreground">Name (French)</label>
              <Input id={`${ids}-fr`}
                placeholder="e.g., Entrées"
                value={newCat.fr}
                onChange={(e) => setNewCat({ ...newCat, fr: e.target.value })}
                className="border-border focus:border-border-strong"
              />
            </div>
          </div>
          <Button
            onClick={handleAddCategory}
            disabled={!newCat.en || !newCat.fr}
            className=""
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Category
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
