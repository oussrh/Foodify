"use client";

import { useState } from "react";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
  reorderCategories,
  reorderSubcategories,
} from "@/app/actions/menu-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { GripVertical, Plus } from "lucide-react";

function arrayMove<T>(arr: T[], from: number, to: number) {
  const copy = [...arr];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

type Subcategory = {
  id: string;
  nameEn: string;
  nameFr: string;
  sortOrder: number;
};

type Category = {
  id: string;
  nameEn: string;
  nameFr: string;
  sortOrder: number;
  subcategories: Subcategory[];
};

export default function CategoryManager({
  initialData,
  restaurantId,
}: {
  initialData: Category[];
  restaurantId: string;
}) {
  const [categories, setCategories] = useState<Category[]>(initialData);
  const [newCat, setNewCat] = useState({ en: "", fr: "" });
  const [subDrafts, setSubDrafts] = useState<
    Record<string, { en: string; fr: string }>
  >({});

  const handleAddCategory = async () => {
    if (!newCat.en || !newCat.fr) return;
    const cat = await createCategory(restaurantId, {
      nameEn: newCat.en,
      nameFr: newCat.fr,
    });
    setCategories([...categories, { ...cat, subcategories: [] }]);
    setNewCat({ en: "", fr: "" });
  };

  const handleRenameCategory = async (
    id: string,
    names: { en: string; fr: string }
  ) => {
    await updateCategory(id, { nameEn: names.en, nameFr: names.fr });
  };

  const handleDeleteCategory = async (id: string) => {
    await deleteCategory(id);
    setCategories(categories.filter((c) => c.id !== id));
  };

  const handleAddSub = async (
    catId: string,
    names: { en: string; fr: string }
  ) => {
    if (!names.en || !names.fr) return;
    const sub = await createSubcategory(catId, {
      nameEn: names.en,
      nameFr: names.fr,
    });
    setCategories((prev) =>
      prev.map((c) =>
        c.id === catId ? { ...c, subcategories: [...c.subcategories, sub] } : c
      )
    );
    setSubDrafts((drafts) => ({
      ...drafts,
      [catId]: { en: "", fr: "" },
    }));
  };

  const handleRenameSub = async (
    id: string,
    names: { en: string; fr: string }
  ) => {
    await updateSubcategory(id, { nameEn: names.en, nameFr: names.fr });
  };

  const handleDeleteSub = async (catId: string, id: string) => {
    await deleteSubcategory(id);
    setCategories((prev) =>
      prev.map((c) =>
        c.id === catId
          ? {
              ...c,
              subcategories: c.subcategories.filter((s) => s.id !== id),
            }
          : c
      )
    );
  };

  const [dragCat, setDragCat] = useState<string | null>(null);
  const [dragSub, setDragSub] = useState<{
    catId: string;
    id: string;
  } | null>(null);

  const onCatDrop = async (targetId: string) => {
    if (!dragCat || dragCat === targetId) return;
    const from = categories.findIndex((c) => c.id === dragCat);
    const to = categories.findIndex((c) => c.id === targetId);
    const newCats = arrayMove(categories, from, to);
    setCategories(newCats);
    await reorderCategories(
      restaurantId,
      newCats.map((c) => c.id)
    );
    setDragCat(null);
  };

  const onSubDrop = async (catId: string, targetId: string) => {
    if (!dragSub || dragSub.id === targetId || dragSub.catId !== catId) return;
    const cat = categories.find((c) => c.id === catId);
    if (!cat) return;
    const from = cat.subcategories.findIndex((s) => s.id === dragSub.id);
    const to = cat.subcategories.findIndex((s) => s.id === targetId);
    const newSubs = arrayMove(cat.subcategories, from, to);
    const newCats = categories.map((c) =>
      c.id === catId ? { ...c, subcategories: newSubs } : c
    );
    setCategories(newCats);
    await reorderSubcategories(
      catId,
      newSubs.map((s) => s.id)
    );
    setDragSub(null);
  };

  return (
    <div className="space-y-6">
      {/* Add Category */}
      <Card>
        <CardHeader>
          <CardTitle>Add Category</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-2">
          <Input
            placeholder="Name EN"
            value={newCat.en}
            onChange={(e) => setNewCat({ ...newCat, en: e.target.value })}
          />
          <Input
            placeholder="Name FR"
            value={newCat.fr}
            onChange={(e) => setNewCat({ ...newCat, fr: e.target.value })}
          />
          <Button onClick={handleAddCategory}>
            <Plus className="w-4 h-4 mr-2" /> Add
          </Button>
        </CardContent>
      </Card>

      {/* Existing Categories */}
      {categories.map((cat) => (
        <Card
          key={cat.id}
          draggable
          onDragStart={() => setDragCat(cat.id)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => onCatDrop(cat.id)}
          className="border border-muted"
        >
          <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2 w-full">
              <GripVertical className="text-muted-foreground flex-shrink-0 cursor-grab" />
              <Input
                className="w-full"
                defaultValue={cat.nameEn}
                onBlur={(e) =>
                  handleRenameCategory(cat.id, {
                    en: e.target.value,
                    fr: cat.nameFr,
                  })
                }
                onChange={(e) => (cat.nameEn = e.target.value)}
              />
              <Input
                className="w-full"
                defaultValue={cat.nameFr}
                onBlur={(e) =>
                  handleRenameCategory(cat.id, {
                    en: cat.nameEn,
                    fr: e.target.value,
                  })
                }
                onChange={(e) => (cat.nameFr = e.target.value)}
              />
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete category?</AlertDialogTitle>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDeleteCategory(cat.id)}
                  >
                    Confirm
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Existing subcategories */}
            {cat.subcategories.map((sub) => (
              <div
                key={sub.id}
                className="flex items-center gap-2 border border-border rounded p-2"
                draggable
                onDragStart={() => setDragSub({ catId: cat.id, id: sub.id })}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onSubDrop(cat.id, sub.id)}
              >
                <GripVertical className="text-muted-foreground cursor-grab flex-shrink-0" />
                <Input
                  defaultValue={sub.nameEn}
                  onBlur={(e) =>
                    handleRenameSub(sub.id, {
                      en: e.target.value,
                      fr: sub.nameFr,
                    })
                  }
                  onChange={(e) => (sub.nameEn = e.target.value)}
                />
                <Input
                  defaultValue={sub.nameFr}
                  onBlur={(e) =>
                    handleRenameSub(sub.id, {
                      en: sub.nameEn,
                      fr: e.target.value,
                    })
                  }
                  onChange={(e) => (sub.nameFr = e.target.value)}
                />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="w-8 h-8"
                    >
                      ×
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete subcategory?</AlertDialogTitle>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeleteSub(cat.id, sub.id)}
                      >
                        Confirm
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}

            {/* Add subcategory */}
            <div className="flex flex-col md:flex-row gap-2">
              <Input
                placeholder="Subcategory EN"
                value={subDrafts[cat.id]?.en || ""}
                onChange={(e) =>
                  setSubDrafts((drafts) => ({
                    ...drafts,
                    [cat.id]: {
                      en: e.target.value,
                      fr: drafts[cat.id]?.fr || "",
                    },
                  }))
                }
              />
              <Input
                placeholder="Subcategory FR"
                value={subDrafts[cat.id]?.fr || ""}
                onChange={(e) =>
                  setSubDrafts((drafts) => ({
                    ...drafts,
                    [cat.id]: {
                      en: drafts[cat.id]?.en || "",
                      fr: e.target.value,
                    },
                  }))
                }
              />
              <Button
                size="sm"
                onClick={() =>
                  handleAddSub(cat.id, {
                    en: subDrafts[cat.id]?.en || "",
                    fr: subDrafts[cat.id]?.fr || "",
                  })
                }
              >
                <Plus className="w-4 h-4 mr-1" /> Add Sub
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
