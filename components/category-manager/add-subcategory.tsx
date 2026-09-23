// components/category-manager/add-subcategory.tsx
// The dashed "Add Subcategory" block at the foot of an open category card: the category's
// draft names (kept by the parent, per category) and the add button.
"use client";

import type { Dispatch, SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import type { Names, SubDrafts } from "./types";

/**
 * The add-subcategory block at the foot of an open category card. Its draft names are held by the
 * parent, keyed by category, so each card keeps its own draft; both names are required.
 */
export default function AddSubcategory({
  categoryId,
  subDrafts,
  setSubDrafts,
  onAddSub,
}: {
  categoryId: string;
  subDrafts: SubDrafts;
  setSubDrafts: Dispatch<SetStateAction<SubDrafts>>;
  onAddSub: (catId: string, names: Names) => void;
}) {
  return (
    <div className="p-4 bg-muted border-2 border-dashed border-border rounded-lg">
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <Plus className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Add Subcategory</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            placeholder="Subcategory EN"
            value={subDrafts[categoryId]?.en || ""}
            onChange={(e) =>
              setSubDrafts((drafts) => ({
                ...drafts,
                [categoryId]: {
                  en: e.target.value,
                  fr: drafts[categoryId]?.fr || "",
                },
              }))
            }
            className="border-border focus:border-border-strong"
          />
          <Input
            placeholder="Subcategory FR"
            value={subDrafts[categoryId]?.fr || ""}
            onChange={(e) =>
              setSubDrafts((drafts) => ({
                ...drafts,
                [categoryId]: {
                  en: drafts[categoryId]?.en || "",
                  fr: e.target.value,
                },
              }))
            }
            className="border-border focus:border-border-strong"
          />
        </div>
        <Button
          size="sm"
          onClick={() =>
            onAddSub(categoryId, {
              en: subDrafts[categoryId]?.en || "",
              fr: subDrafts[categoryId]?.fr || "",
            })
          }
          disabled={!subDrafts[categoryId]?.en || !subDrafts[categoryId]?.fr}
          className="bg-primary hover:bg-primary"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Subcategory
        </Button>
      </div>
    </div>
  );
}
