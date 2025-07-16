import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { DollarSign, Home as HomeIcon, ShoppingCart, Users } from 'lucide-react'

const tiles = [
  { icon: HomeIcon, label: 'Restaurants', value: 8 },
  { icon: Users, label: 'Users', value: 150 },
  { icon: ShoppingCart, label: 'Orders', value: 320 },
  { icon: DollarSign, label: 'Revenue', value: '$12k' },
]

export default function AdminDashboardPage() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {tiles.map(({ icon: Icon, label, value }) => (
        <Card key={label}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{label}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
