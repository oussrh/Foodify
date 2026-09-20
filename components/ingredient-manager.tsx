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
import { Plus, X, Edit2, Loader2, ChefHat, Trash2 } from 'lucide-react'
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <ChefHat className="h-4 w-4 text-warning" />
          <span className="text-sm font-medium text-muted-foreground">
            {ingredients.length} ingredient{ingredients.length !== 1 ? 's' : ''}
          </span>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-muted0 hover:bg-primary">
              <Plus className="h-4 w-4 mr-2" />
              Add Ingredient
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-warning" />
                Add New Ingredient
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nameEn" className="text-sm font-medium">Name (English) *</Label>
                  <Input
                    id="nameEn"
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                    placeholder="e.g., Tomato"
                    className="border-border focus:border-border-strong"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nameFr" className="text-sm font-medium">Name (French)</Label>
                  <Input
                    id="nameFr"
                    value={nameFr}
                    onChange={(e) => setNameFr(e.target.value)}
                    placeholder="e.g., Tomate"
                    className="border-border focus:border-border-strong"
                  />
                  <p className="text-xs text-muted-foreground">Optional - defaults to English name if empty</p>
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setAddDialogOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button 
                  onClick={handleAdd} 
                  disabled={loading || !nameEn.trim()}
                  className="flex-1 bg-muted0 hover:bg-primary"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Ingredient
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Ingredients List */}
      {ingredients.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-border rounded-md bg-muted">
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              <ChefHat className="h-8 w-8 text-warning" />
            </div>
            <div className="space-y-2">
              <p className="font-medium text-foreground">No ingredients added yet</p>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Add ingredients to help customers with allergies and dietary preferences make informed choices.
              </p>
            </div>
            <Button 
              onClick={() => setAddDialogOpen(true)}
              className="bg-muted0 hover:bg-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add First Ingredient
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {ingredients.map((ingredient, index) => (
            <div 
              key={ingredient.id} 
              className="group flex items-center justify-between p-4 border-2 border-border rounded-md hover:border-border hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-medium text-warning">#{index + 1}</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge 
                    variant="outline" 
                    className="bg-card border-border text-warning font-medium"
                  >
                    {ingredient.nameEn}
                  </Badge>
                  {ingredient.nameFr && ingredient.nameFr !== ingredient.nameEn && (
                    <Badge 
                      variant="secondary" 
                      className="bg-muted text-muted-foreground border-border"
                    >
                      {ingredient.nameFr}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEditDialog(ingredient)}
                  disabled={loading}
                  className="h-8 w-8 p-0 hover:bg-muted hover:text-muted-foreground"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(ingredient.id)}
                  disabled={loading}
                  className="h-8 w-8 p-0 hover:bg-muted hover:text-destructive text-muted-foreground"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="h-5 w-5 text-muted-foreground" />
              Edit Ingredient
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="editNameEn" className="text-sm font-medium">Name (English) *</Label>
                <Input
                  id="editNameEn"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  placeholder="e.g., Tomato"
                  className="border-border focus:border-border-strong"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editNameFr" className="text-sm font-medium">Name (French)</Label>
                <Input
                  id="editNameFr"
                  value={nameFr}
                  onChange={(e) => setNameFr(e.target.value)}
                  placeholder="e.g., Tomate"
                  className="border-border focus:border-border-strong"
                />
                <p className="text-xs text-muted-foreground">Optional - defaults to English name if empty</p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <Button 
                variant="outline" 
                onClick={() => setEditDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleEdit} 
                disabled={loading || !nameEn.trim()}
                className="flex-1 bg-muted0 hover:bg-primary"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}