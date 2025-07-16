'use client'

import { useState } from 'react'
import {
  createCategory,
  updateCategory,
  deleteCategory,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
  reorderCategories,
  reorderSubcategories,
} from '@/app/actions/menu-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'

function arrayMove<T>(arr: T[], from: number, to: number) {
  const copy = [...arr]
  const [item] = copy.splice(from, 1)
  copy.splice(to, 0, item)
  return copy
}

type Subcategory = {
  id: string
  nameEn: string
  nameFr: string
  sortOrder: number
}

type Category = {
  id: string
  nameEn: string
  nameFr: string
  sortOrder: number
  subcategories: Subcategory[]
}

export default function CategoryManager({
  initialData,
  restaurantId,
}: {
  initialData: Category[]
  restaurantId: string
}) {
  const [categories, setCategories] = useState<Category[]>(initialData)
  const [newCat, setNewCat] = useState({ en: '', fr: '' })

  const handleAddCategory = async () => {
    if (!newCat.en || !newCat.fr) return
    const cat = await createCategory(restaurantId, {
      nameEn: newCat.en,
      nameFr: newCat.fr,
    })
    setCategories([...categories, { ...cat, subcategories: [] }])
    setNewCat({ en: '', fr: '' })
  }

  const handleRenameCategory = async (
    id: string,
    names: { en: string; fr: string }
  ) => {
    await updateCategory(id, { nameEn: names.en, nameFr: names.fr })
  }

  const handleDeleteCategory = async (id: string) => {
    await deleteCategory(id)
    setCategories(categories.filter((c) => c.id !== id))
  }

  const handleAddSub = async (
    catId: string,
    names: { en: string; fr: string }
  ) => {
    const sub = await createSubcategory(catId, {
      nameEn: names.en,
      nameFr: names.fr,
    })
    setCategories((prev) =>
      prev.map((c) =>
        c.id === catId
          ? { ...c, subcategories: [...c.subcategories, sub] }
          : c
      )
    )
  }

  const handleRenameSub = async (
    id: string,
    names: { en: string; fr: string }
  ) => {
    await updateSubcategory(id, { nameEn: names.en, nameFr: names.fr })
  }

  const handleDeleteSub = async (catId: string, id: string) => {
    await deleteSubcategory(id)
    setCategories((prev) =>
      prev.map((c) =>
        c.id === catId
          ? { ...c, subcategories: c.subcategories.filter((s) => s.id !== id) }
          : c
      )
    )
  }

  const [dragCat, setDragCat] = useState<string | null>(null)
  const [dragSub, setDragSub] = useState<{ catId: string; id: string } | null>(
    null
  )

  const onCatDrop = async (targetId: string) => {
    if (!dragCat || dragCat === targetId) return
    const from = categories.findIndex((c) => c.id === dragCat)
    const to = categories.findIndex((c) => c.id === targetId)
    const newCats = arrayMove(categories, from, to)
    setCategories(newCats)
    await reorderCategories(restaurantId, newCats.map((c) => c.id))
    setDragCat(null)
  }

  const onSubDrop = async (catId: string, targetId: string) => {
    if (!dragSub || dragSub.id === targetId || dragSub.catId !== catId) return
    const cat = categories.find((c) => c.id === catId)
    if (!cat) return
    const from = cat.subcategories.findIndex((s) => s.id === dragSub.id)
    const to = cat.subcategories.findIndex((s) => s.id === targetId)
    const newSubs = arrayMove(cat.subcategories, from, to)
    const newCats = categories.map((c) =>
      c.id === catId ? { ...c, subcategories: newSubs } : c
    )
    setCategories(newCats)
    await reorderSubcategories(catId, newSubs.map((s) => s.id))
    setDragSub(null)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Add Category</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
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
          <Button onClick={handleAddCategory}>Add</Button>
        </CardContent>
      </Card>

      {categories.map((cat) => (
        <Card
          key={cat.id}
          draggable
          onDragStart={() => setDragCat(cat.id)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => onCatDrop(cat.id)}
        >
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Input
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
            </CardTitle>
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
          <CardContent className="space-y-2">
            {cat.subcategories.map((sub) => (
              <div
                key={sub.id}
                className="flex items-center gap-2"
                draggable
                onDragStart={() =>
                  setDragSub({ catId: cat.id, id: sub.id })
                }
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onSubDrop(cat.id, sub.id)}
              >
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
                    <Button variant="destructive" size="sm">
                      Delete
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
            <div className="flex gap-2">
              <Input
                placeholder="Subcategory EN"
                onChange={(e) => (cat as any).newSubEn = e.target.value}
              />
              <Input
                placeholder="Subcategory FR"
                onChange={(e) => (cat as any).newSubFr = e.target.value}
              />
              <Button
                onClick={() =>
                  handleAddSub(cat.id, {
                    en: (cat as any).newSubEn || '',
                    fr: (cat as any).newSubFr || '',
                  })
                }
              >
                Add Sub
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
