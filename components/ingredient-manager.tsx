'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Dialog, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Edit2, ChefHat } from 'lucide-react'
import { addIngredient, updateIngredient, deleteIngredient } from '@/app/actions/dish-actions'
import IngredientDialogContent from '@/components/ingredients/ingredient-dialog-content'
import IngredientRow, { type Ingredient } from '@/components/ingredients/ingredient-row'
import EmptyIngredients from '@/components/ingredients/empty-ingredients'

interface IngredientManagerProps {
  dishId: string
  ingredients: Ingredient[]
}

/**
 * Lists a dish's ingredients and adds, renames and deletes them through dialogs, refreshing the
 * route after each; a blank French name is saved as the English one.
 */
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
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Ingredient
            </Button>
          </DialogTrigger>
          <IngredientDialogContent
            title={<><Plus className="h-5 w-5 text-warning" />Add New Ingredient</>}
            ids={{ en: 'nameEn', fr: 'nameFr' }}
            nameEn={nameEn}
            nameFr={nameFr}
            onNameEn={setNameEn}
            onNameFr={setNameFr}
            onCancel={() => setAddDialogOpen(false)}
            onSubmit={handleAdd}
            loading={loading}
            busy="Adding..."
            action={<><Plus className="h-4 w-4 mr-2" />Add Ingredient</>}
          />
        </Dialog>
      </div>

      {/* Ingredients List */}
      {ingredients.length === 0 ? (
        <EmptyIngredients onAdd={() => setAddDialogOpen(true)} />
      ) : (
        <div className="space-y-3">
          {ingredients.map((ingredient, index) => (
            <IngredientRow
              key={ingredient.id}
              ingredient={ingredient}
              index={index}
              loading={loading}
              onEdit={openEditDialog}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <IngredientDialogContent
          title={<><Edit2 className="h-5 w-5 text-muted-foreground" />Edit Ingredient</>}
          ids={{ en: 'editNameEn', fr: 'editNameFr' }}
          nameEn={nameEn}
          nameFr={nameFr}
          onNameEn={setNameEn}
          onNameFr={setNameFr}
          onCancel={() => setEditDialogOpen(false)}
          onSubmit={handleEdit}
          loading={loading}
          busy="Saving..."
          action={<><Edit2 className="h-4 w-4 mr-2" />Save Changes</>}
        />
      </Dialog>
    </div>
  )
}
