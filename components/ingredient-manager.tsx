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
          <ChefHat className="h-4 w-4 text-orange-500" />
          <span className="text-sm font-medium text-gray-700">
            {ingredients.length} ingredient{ingredients.length !== 1 ? 's' : ''}
          </span>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-orange-500 hover:bg-orange-600 shadow-sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Ingredient
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-orange-500" />
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
                    className="border-orange-200 focus:border-orange-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nameFr" className="text-sm font-medium">Name (French)</Label>
                  <Input
                    id="nameFr"
                    value={nameFr}
                    onChange={(e) => setNameFr(e.target.value)}
                    placeholder="e.g., Tomate"
                    className="border-orange-200 focus:border-orange-400"
                  />
                  <p className="text-xs text-gray-500">Optional - defaults to English name if empty</p>
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setAddDialogOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button 
                  onClick={handleAdd} 
                  disabled={loading || !nameEn.trim()}
                  className="flex-1 bg-orange-500 hover:bg-orange-600"
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
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
              <ChefHat className="h-8 w-8 text-orange-500" />
            </div>
            <div className="space-y-2">
              <p className="font-medium text-gray-900">No ingredients added yet</p>
              <p className="text-sm text-gray-500 max-w-sm mx-auto">
                Add ingredients to help customers with allergies and dietary preferences make informed choices.
              </p>
            </div>
            <Button 
              onClick={() => setAddDialogOpen(true)}
              className="bg-orange-500 hover:bg-orange-600"
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
              className="group flex items-center justify-between p-4 border-2 border-gray-100 rounded-xl hover:border-orange-200 hover:bg-orange-50/30 transition-all duration-200"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-medium text-orange-600">#{index + 1}</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge 
                    variant="outline" 
                    className="bg-white border-orange-200 text-orange-700 font-medium"
                  >
                    {ingredient.nameEn}
                  </Badge>
                  {ingredient.nameFr && ingredient.nameFr !== ingredient.nameEn && (
                    <Badge 
                      variant="secondary" 
                      className="bg-blue-50 text-blue-700 border-blue-200"
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
                  className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(ingredient.id)}
                  disabled={loading}
                  className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600 text-gray-400"
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
              <Edit2 className="h-5 w-5 text-blue-500" />
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
                  className="border-blue-200 focus:border-blue-400"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editNameFr" className="text-sm font-medium">Name (French)</Label>
                <Input
                  id="editNameFr"
                  value={nameFr}
                  onChange={(e) => setNameFr(e.target.value)}
                  placeholder="e.g., Tomate"
                  className="border-blue-200 focus:border-blue-400"
                />
                <p className="text-xs text-gray-500">Optional - defaults to English name if empty</p>
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
                className="flex-1 bg-blue-500 hover:bg-blue-600"
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