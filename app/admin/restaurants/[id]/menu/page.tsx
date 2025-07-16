import CategoryManager from '@/components/category-manager'
import { getMenu } from '@/app/actions/menu-actions'

export default async function MenuPage({ params }: { params: { id: string } }) {
  const { id } = await params
  const data = await getMenu(id)
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Menu Categories</h2>
      <CategoryManager initialData={data} restaurantId={id} />
    </div>
  )
}
