import type { AppPageProps } from '@/types/page'

export default function RestaurantPage({ params }: AppPageProps<{ slug: string }>) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-2xl font-bold">Restaurant: {params.slug}</h1>
    </main>
  )
}
