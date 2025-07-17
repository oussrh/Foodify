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
import {
  GripVertical,
  Plus,
  ChevronDown,
  ChevronRight,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Transition } from "@headlessui/react";

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
  const [collapsedStates, setCollapsedStates] = useState<
    Record<string, boolean>
  >({});

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

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
    setCategories(categories.filter((c: Category) => c.id !== id));
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = categories.findIndex((c: Category) => c.id === active.id);
    const newIndex = categories.findIndex((c: Category) => c.id === over.id);

    const reordered = arrayMove(categories, oldIndex, newIndex);
    setCategories(reordered);
    await reorderCategories(
      restaurantId,
      reordered.map((c: Category) => c.id)
    );
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
      prev.map((c: Category) =>
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
    await updateSubcategory(id, {
      nameEn: names.en,
      nameFr: names.fr,
    });
  };

  const handleDeleteSub = async (catId: string, id: string) => {
    await deleteSubcategory(id);
    setCategories((prev) =>
      prev.map((c: Category) =>
        c.id === catId
          ? {
              ...c,
              subcategories: c.subcategories.filter(
                (s: Subcategory) => s.id !== id
              ),
            }
          : c
      )
    );
  };

  const handleMoveSub = async (
    catId: string,
    index: number,
    direction: "up" | "down"
  ) => {
    const cat = categories.find((c: Category) => c.id === catId);
    if (!cat) return;
    const subs = [...cat.subcategories];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= subs.length) return;
    const [item] = subs.splice(index, 1);
    subs.splice(newIndex, 0, item);
    setCategories((prev) =>
      prev.map((c: Category) =>
        c.id === catId ? { ...c, subcategories: subs } : c
      )
    );
    await reorderSubcategories(
      catId,
      subs.map((s: Subcategory) => s.id)
    );
  };

  const toggleCollapse = (id: string) => {
    setCollapsedStates((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const collapseAll = () => {
    const collapsed: Record<string, boolean> = {};
    categories.forEach((c: Category) => (collapsed[c.id] = true));
    setCollapsedStates(collapsed);
  };

  const expandAll = () => {
    const expanded: Record<string, boolean> = {};
    categories.forEach((c: Category) => (expanded[c.id] = false));
    setCollapsedStates(expanded);
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

      {/* Collapse/Expand All Buttons */}
      <div className="flex gap-2">
        <Button variant="outline" onClick={collapseAll}>
          Collapse All
        </Button>
        <Button variant="outline" onClick={expandAll}>
          Expand All
        </Button>
      </div>

      {/* Draggable Categories */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={categories.map((c: Category) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {categories.map((cat: Category) => (
            <SortableCategory
              key={cat.id}
              category={cat}
              onRename={handleRenameCategory}
              onDelete={handleDeleteCategory}
              onAddSub={handleAddSub}
              onRenameSub={handleRenameSub}
              onDeleteSub={handleDeleteSub}
              onMoveSub={handleMoveSub}
              subDrafts={subDrafts}
              setSubDrafts={setSubDrafts}
              collapsed={collapsedStates[cat.id] ?? false}
              toggleCollapsed={() => toggleCollapse(cat.id)}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}

function SortableCategory({
  category,
  onRename,
  onDelete,
  onAddSub,
  onRenameSub,
  onDeleteSub,
  onMoveSub,
  subDrafts,
  setSubDrafts,
  collapsed,
  toggleCollapsed,
}: {
  category: Category;
  onRename: (id: string, names: { en: string; fr: string }) => void;
  onDelete: (id: string) => void;
  onAddSub: (catId: string, names: { en: string; fr: string }) => void;
  onRenameSub: (id: string, names: { en: string; fr: string }) => void;
  onDeleteSub: (catId: string, id: string) => void;
  onMoveSub: (catId: string, index: number, dir: "up" | "down") => void;
  subDrafts: Record<string, { en: string; fr: string }>;
  setSubDrafts: React.Dispatch<
    React.SetStateAction<Record<string, { en: string; fr: string }>>
  >;
  collapsed: boolean;
  toggleCollapsed: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 50 : "auto",
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card
        className={`border border-muted bg-white ${
          isDragging ? "ring-2 ring-primary" : ""
        }`}
      >
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div className="flex items-center gap-2 w-full">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleCollapsed}
              className="flex-shrink-0"
            >
              {collapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
            <GripVertical
              className="text-muted-foreground flex-shrink-0 cursor-grab"
              {...attributes}
              {...listeners}
            />
            <Input
              defaultValue={category.nameEn}
              onBlur={(e) =>
                onRename(category.id, {
                  en: e.target.value,
                  fr: category.nameFr,
                })
              }
            />
            <Input
              defaultValue={category.nameFr}
              onBlur={(e) =>
                onRename(category.id, {
                  en: category.nameEn,
                  fr: e.target.value,
                })
              }
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
                <AlertDialogAction onClick={() => onDelete(category.id)}>
                  Confirm
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardHeader>

        {!collapsed && (
          <CardContent className="space-y-3">
            {category.subcategories.map((sub: Subcategory, i: number) => (
              <Transition
                key={sub.id}
                appear
                show
                enter="transition-all duration-300 ease-in-out"
                enterFrom="opacity-0 translate-y-2"
                enterTo="opacity-100 translate-y-0"
                leave="transition-all duration-300 ease-in-out"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 -translate-y-2"
              >
                <div className="flex items-center gap-2 border border-border rounded p-2">
                  <Input
                    defaultValue={sub.nameEn}
                    onBlur={(e) =>
                      onRenameSub(sub.id, {
                        en: e.target.value,
                        fr: sub.nameFr,
                      })
                    }
                  />
                  <Input
                    defaultValue={sub.nameFr}
                    onBlur={(e) =>
                      onRenameSub(sub.id, {
                        en: sub.nameEn,
                        fr: e.target.value,
                      })
                    }
                  />
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="w-8 h-8"
                      onClick={() => onMoveSub(category.id, i, "up")}
                      disabled={i === 0}
                    >
                      <ArrowUp className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="w-8 h-8"
                      onClick={() => onMoveSub(category.id, i, "down")}
                      disabled={i === category.subcategories.length - 1}
                    >
                      <ArrowDown className="w-3 h-3" />
                    </Button>
                  </div>
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
                          onClick={() => onDeleteSub(category.id, sub.id)}
                        >
                          Confirm
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </Transition>
            ))}

            {/* Add subcategory */}
            <div className="flex flex-col md:flex-row gap-2">
              <Input
                placeholder="Subcategory EN"
                value={subDrafts[category.id]?.en || ""}
                onChange={(e) =>
                  setSubDrafts((drafts) => ({
                    ...drafts,
                    [category.id]: {
                      en: e.target.value,
                      fr: drafts[category.id]?.fr || "",
                    },
                  }))
                }
              />
              <Input
                placeholder="Subcategory FR"
                value={subDrafts[category.id]?.fr || ""}
                onChange={(e) =>
                  setSubDrafts((drafts) => ({
                    ...drafts,
                    [category.id]: {
                      en: drafts[category.id]?.en || "",
                      fr: e.target.value,
                    },
                  }))
                }
              />
              <Button
                size="sm"
                onClick={() =>
                  onAddSub(category.id, {
                    en: subDrafts[category.id]?.en || "",
                    fr: subDrafts[category.id]?.fr || "",
                  })
                }
              >
                <Plus className="w-4 h-4 mr-1" /> Add Sub
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
