"use client";

import { useState } from "react";
import {
  createCategory,
  updateCategory,
  createSubcategory,
  updateSubcategory,
  reorderCategories,
  reorderSubcategories,
  toggleCategoryStatus,
  toggleSubcategoryStatus,
} from "@/app/actions/menu-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
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
  Eye,
  EyeOff,
  Edit2,
  FolderPlus,
  Settings,
  Sparkles,
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

type Subcategory = {
  id: string;
  nameEn: string;
  nameFr: string;
  sortOrder: number;
  isActive?: boolean;
};

type Category = {
  id: string;
  nameEn: string;
  nameFr: string;
  sortOrder: number;
  isActive?: boolean;
  subcategories: Subcategory[];
};

export default function ManagerCategoryManager({
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
    setCategories([...categories, { ...cat, subcategories: [], isActive: true }]);
    setNewCat({ en: "", fr: "" });
  };

  const handleRenameCategory = async (
    id: string,
    names: { en: string; fr: string }
  ) => {
    await updateCategory(id, { nameEn: names.en, nameFr: names.fr });
    setCategories(prev => 
      prev.map(cat => 
        cat.id === id ? { ...cat, nameEn: names.en, nameFr: names.fr } : cat
      )
    );
  };

  const handleToggleCategoryStatus = async (id: string) => {
    try {
      await toggleCategoryStatus(id);
      setCategories(prev => 
        prev.map(cat => 
          cat.id === id ? { ...cat, isActive: !cat.isActive } : cat
        )
      );
    } catch (error) {
      console.error('Failed to toggle category status:', error);
    }
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
        c.id === catId ? { ...c, subcategories: [...c.subcategories, { ...sub, isActive: true }] } : c
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

  const handleToggleSubStatus = async (catId: string, subId: string) => {
    try {
      await toggleSubcategoryStatus(subId);
      setCategories(prev =>
        prev.map(cat =>
          cat.id === catId
            ? {
                ...cat,
                subcategories: cat.subcategories.map(sub =>
                  sub.id === subId ? { ...sub, isActive: !sub.isActive } : sub
                ),
              }
            : cat
        )
      );
    } catch (error) {
      console.error('Failed to toggle subcategory status:', error);
    }
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
    <div className="space-y-8">
      {/* Add Category */}
      <Card className="border-0">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <FolderPlus className="h-5 w-5 text-success" />
            Add New Category
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Name (English)</label>
                <Input
                  placeholder="e.g., Appetizers"
                  value={newCat.en}
                  onChange={(e) => setNewCat({ ...newCat, en: e.target.value })}
                  className="border-border focus:border-border-strong"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Name (French)</label>
                <Input
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

      {/* Controls */}
      <div className="flex items-center gap-4">
        <div className="flex gap-2">
          <Button variant="outline" onClick={collapseAll} size="sm">
            Collapse All
          </Button>
          <Button variant="outline" onClick={expandAll} size="sm">
            Expand All
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-muted text-warning border-border">
            Manager Mode
          </Badge>
          <span className="text-sm text-muted-foreground">Organize & enable/disable (no delete)</span>
        </div>
      </div>

      {/* Categories */}
      {categories.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="text-center space-y-4">
              <div className="mx-auto h-16 w-16 rounded-full flex items-center justify-center">
                <FolderPlus className="h-8 w-8 text-success" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">No categories yet</h3>
                <p className="text-muted-foreground mt-1">
                  Start organizing your menu by creating your first category
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={categories.map((c: Category) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-4">
              {categories.map((cat: Category) => (
                <SortableCategory
                  key={cat.id}
                  category={cat}
                  onRename={handleRenameCategory}
                  onToggleStatus={handleToggleCategoryStatus}
                  onAddSub={handleAddSub}
                  onRenameSub={handleRenameSub}
                  onToggleSubStatus={handleToggleSubStatus}
                  onMoveSub={handleMoveSub}
                  subDrafts={subDrafts}
                  setSubDrafts={setSubDrafts}
                  collapsed={collapsedStates[cat.id] ?? false}
                  toggleCollapsed={() => toggleCollapse(cat.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

function SortableCategory({
  category,
  onRename,
  onToggleStatus,
  onAddSub,
  onRenameSub,
  onToggleSubStatus,
  onMoveSub,
  subDrafts,
  setSubDrafts,
  collapsed,
  toggleCollapsed,
}: {
  category: Category;
  onRename: (id: string, names: { en: string; fr: string }) => void;
  onToggleStatus: (id: string) => void;
  onAddSub: (catId: string, names: { en: string; fr: string }) => void;
  onRenameSub: (id: string, names: { en: string; fr: string }) => void;
  onToggleSubStatus: (catId: string, subId: string) => void;
  onMoveSub: (catId: string, index: number, dir: "up" | "down") => void;
  subDrafts: Record<string, { en: string; fr: string }>;
  setSubDrafts: React.Dispatch<
    React.SetStateAction<Record<string, { en: string; fr: string }>>
  >;
  collapsed: boolean;
  toggleCollapsed: () => void;
}) {
  const [editMode, setEditMode] = useState(false);
  const [editNames, setEditNames] = useState({ en: category.nameEn, fr: category.nameFr });

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

  const handleSaveEdit = () => {
    onRename(category.id, editNames);
    setEditMode(false);
  };

  const handleCancelEdit = () => {
    setEditNames({ en: category.nameEn, fr: category.nameFr });
    setEditMode(false);
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className={`border-0 ${isDragging ? "ring-2" : ""} ${category.isActive === false ? "opacity-60" : ""}`}>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
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
              
              {editMode ? (
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    value={editNames.en}
                    onChange={(e) => setEditNames({ ...editNames, en: e.target.value })}
                    className="border-border focus:border-border-strong"
                    placeholder="English name"
                  />
                  <Input
                    value={editNames.fr}
                    onChange={(e) => setEditNames({ ...editNames, fr: e.target.value })}
                    className="border-border focus:border-border-strong"
                    placeholder="French name"
                  />
                  <Button size="sm" onClick={handleSaveEdit} className="bg-primary hover:bg-primary">
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{category.nameEn}</h3>
                    {category.nameFr && (
                      <p className="text-sm text-muted-foreground italic">{category.nameFr}</p>
                    )}
                  </div>
                  <Badge variant="outline" className="text-muted-foreground border-border">
                    {category.subcategories.length} sub{category.subcategories.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
              )}
            </div>
            
            {!editMode && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {category.isActive !== false ? 'Active' : 'Inactive'}
                  </span>
                  <Switch
                    checked={category.isActive !== false}
                    onCheckedChange={() => onToggleStatus(category.id)}
                    className="data-[state=checked]:bg-primary"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditMode(true)}
                  className="text-muted-foreground hover:text-muted-foreground"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        {!collapsed && (
          <CardContent className="p-6 space-y-4">
            {/* Subcategories */}
            {category.subcategories.map((sub: Subcategory, i: number) => (
              <div
                key={sub.id}
                className={`flex items-center gap-3 p-3 border border-border rounded-lg ${sub.isActive === false ? "opacity-60" : ""}`}
              >
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input
                    defaultValue={sub.nameEn}
                    onBlur={(e) =>
                      onRenameSub(sub.id, {
                        en: e.target.value,
                        fr: sub.nameFr,
                      })
                    }
                    className="border-border focus:border-border-strong"
                  />
                  <Input
                    defaultValue={sub.nameFr}
                    onBlur={(e) =>
                      onRenameSub(sub.id, {
                        en: sub.nameEn,
                        fr: e.target.value,
                      })
                    }
                    className="border-border focus:border-border-strong"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8"
                      onClick={() => onMoveSub(category.id, i, "up")}
                      disabled={i === 0}
                    >
                      <ArrowUp className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8"
                      onClick={() => onMoveSub(category.id, i, "down")}
                      disabled={i === category.subcategories.length - 1}
                    >
                      <ArrowDown className="w-3 h-3" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {sub.isActive !== false ? (
                      <Eye className="h-4 w-4 text-success" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    )}
                    <Switch
                      checked={sub.isActive !== false}
                      onCheckedChange={() => onToggleSubStatus(category.id, sub.id)}
                      className="data-[state=checked]:bg-primary"
                    />
                  </div>
                </div>
              </div>
            ))}

            {/* Add subcategory */}
            <div className="p-4 bg-muted border-2 border-dashed border-border rounded-lg">
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <Plus className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Add Subcategory</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                    className="border-border focus:border-border-strong"
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
                    className="border-border focus:border-border-strong"
                  />
                </div>
                <Button
                  size="sm"
                  onClick={() =>
                    onAddSub(category.id, {
                      en: subDrafts[category.id]?.en || "",
                      fr: subDrafts[category.id]?.fr || "",
                    })
                  }
                  disabled={!subDrafts[category.id]?.en || !subDrafts[category.id]?.fr}
                  className="bg-primary hover:bg-primary"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Subcategory
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}