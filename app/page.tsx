import { ThemeToggle } from '@/components/theme-toggle'
import SampleForm from '@/components/sample-form'

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-2xl font-bold">Welcome to Foodify</h1>
      <ThemeToggle />
      <SampleForm />
    </main>
  )
}
