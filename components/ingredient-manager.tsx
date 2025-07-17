'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Plus, X, Edit2 } from 'lucide-react'
import { addIngredient, updateIngredient, deleteIngredient } from '@/app/actions/dish-actions'

interface Ingredient {
  id: string
  nameEn: string
  nameFr: string
}

interface IngredientManagerProps {
  dishId: string
  ingredients: Ingredient[]
}

export default function IngredientManager({ dishId, ingredients }: IngredientManagerProps) {
  const [loading, setLoading] = useState(false)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null)
  const [nameEn, setNameEn] = useState('')
  const [nameFr, setNameFr] = useState('')
  const router = useRouter()

  const handleAdd = async () => {
    if (!nameEn.trim()) return
    
    setLoading(true)
    try {
      await addIngredient(dishId, {
        nameEn: nameEn.trim(),
        nameFr: nameFr.trim() || nameEn.trim()
      })
      setNameEn('')
      setNameFr('')
      setAddDialogOpen(false)
      router.refresh()
    } catch (error) {
      console.error('Failed to add ingredient:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = async () => {
    if (!editingIngredient || !nameEn.trim()) return
    
    setLoading(true)
    try {
      await updateIngredient(editingIngredient.id, {
        nameEn: nameEn.trim(),
        nameFr: nameFr.trim() || nameEn.trim()
      })
      setEditingIngredient(null)
      setNameEn('')
      setNameFr('')
      setEditDialogOpen(false)
      router.refresh()
    } catch (error) {
      console.error('Failed to update ingredient:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (ingredientId: string) => {
    if (!confirm('Are you sure you want to delete this ingredient?')) return
    
    setLoading(true)
    try {
      await deleteIngredient(ingredientId)
      router.refresh()
    } catch (error) {
      console.error('Failed to delete ingredient:', error)
    } finally {
      setLoading(false)
    }
  }

  const openEditDialog = (ingredient: Ingredient) => {
    setEditingIngredient(ingredient)
    setNameEn(ingredient.nameEn)
    setNameFr(ingredient.nameFr)
    setEditDialogOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          {ingredients.length} ingredients
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Ingredient
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Ingredient</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="nameEn">Name (English)</Label>
                <Input
                  id="nameEn"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  placeholder="e.g., Tomato"
                />
              </div>
              <div>
                <Label htmlFor="nameFr">Name (French)</Label>
                <Input
                  id="nameFr"
                  value={nameFr}
                  onChange={(e) => setNameFr(e.target.value)}
                  placeholder="e.g., Tomate"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAdd} disabled={loading || !nameEn.trim()}>
                  {loading ? 'Adding...' : 'Add Ingredient'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Ingredients List */}
      {ingredients.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No ingredients added yet.</p>
          <p className="text-sm">Add ingredients to help customers with allergies and preferences.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {ingredients.map((ingredient) => (
            <div key={ingredient.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Badge variant="outline">{ingredient.nameEn}</Badge>
                {ingredient.nameFr && ingredient.nameFr !== ingredient.nameEn && (
                  <Badge variant="secondary">{ingredient.nameFr}</Badge>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEditDialog(ingredient)}
                  disabled={loading}
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(ingredient.id)}
                  disabled={loading}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Ingredient</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editNameEn">Name (English)</Label>
              <Input
                id="editNameEn"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder="e.g., Tomato"
              />
            </div>
            <div>
              <Label htmlFor="editNameFr">Name (French)</Label>
              <Input
                id="editNameFr"
                value={nameFr}
                onChange={(e) => setNameFr(e.target.value)}
                placeholder="e.g., Tomate"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEdit} disabled={loading || !nameEn.trim()}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}