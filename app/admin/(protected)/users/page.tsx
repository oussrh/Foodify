import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import ResetPasswordButton from '@/components/reset-password-button'
import prisma from '@/lib/prisma'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import {
  MoreVertical,
  Users,
  Plus,
  Search,
  UserCheck,
  Building2,
  Calendar,
  Shield,
  Edit3,
  Key,
  Trash2,
  ExternalLink,
  Filter,
  Settings,
  BarChart3,
  TrendingUp
} from 'lucide-react'
import Image from 'next/image'

export default async function UsersPage() {
  const users = await prisma.user.findMany({
    where: { role: 'RESTAURANT_ADMIN' },
    include: { restaurants: true },
    orderBy: { createdAt: 'desc' },
  })

  // Calculate statistics
  const totalUsers = users.length
  const activeUsers = users.filter(u => u.restaurants.length > 0).length
  const totalRestaurants = users.reduce((acc, user) => acc + user.restaurants.length, 0)
  const averageRestaurantsPerUser = totalUsers > 0 ? (totalRestaurants / totalUsers).toFixed(1) : '0'

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-gray-200 pb-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl">
            <Users className="h-8 w-8 text-blue-600" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">User Management</h1>
            <div className="flex items-center gap-2 text-gray-600">
              <span className="font-medium">{totalUsers} total users</span>
              <span>•</span>
              <span>{activeUsers} active</span>
              <span>•</span>
              <span>{totalRestaurants} restaurant assignments</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Manage restaurant administrators and their access permissions
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-blue-100 text-blue-700 border-blue-200">
              <Shield className="h-3 w-3 mr-1" />
              Admin Portal
            </Badge>
            <Button asChild className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600">
              <Link href="/admin/users/create">
                <Plus className="h-4 w-4 mr-2" />
                Create User
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">{totalUsers}</p>
                <p className="text-xs text-blue-600 mt-1">Restaurant admins</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-3xl font-bold text-gray-900">{activeUsers}</p>
                <p className="text-xs text-green-600 mt-1">With restaurants</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <UserCheck className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Assignments</p>
                <p className="text-3xl font-bold text-gray-900">{totalRestaurants}</p>
                <p className="text-xs text-purple-600 mt-1">Restaurant links</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Building2 className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average</p>
                <p className="text-3xl font-bold text-gray-900">{averageRestaurantsPerUser}</p>
                <p className="text-xs text-orange-600 mt-1">Restaurants/user</p>
              </div>
              <div className="p-2 bg-orange-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-600" />
            Search & Filter Users
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by email or restaurant name..."
                className="pl-10 border-gray-200 focus:border-blue-400"
              />
            </div>
            <Button variant="outline" className="border-gray-200 hover:bg-gray-50">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Grid */}
      {users.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="text-center space-y-4">
              <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">No users yet</h3>
                <p className="text-gray-500 mt-1">
                  Start by creating your first restaurant administrator
                </p>
              </div>
              <Button asChild className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600">
                <Link href="/admin/users/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Create First User
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {users.map((user: any) => (
            <Card key={user.id} className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-0 bg-white shadow-sm hover:shadow-xl hover:-translate-y-1">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="p-2 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-lg">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg leading-tight font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                        {user.email}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">
                          Restaurant Admin
                        </Badge>
                        {user.restaurants.length > 0 && (
                          <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                            Active
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/users/${user.id}/edit`}>
                          <Edit3 className="h-4 w-4 mr-2" />
                          Edit User
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/users/${user.id}/restaurants`}>
                          <Building2 className="h-4 w-4 mr-2" />
                          Manage Restaurants
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <ResetPasswordButton id={user.id} />
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Building2 className="h-4 w-4" />
                    <span className="font-medium">
                      {user.restaurants.length} restaurant{user.restaurants.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  {user.restaurants.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-500 font-medium">Assigned Restaurants:</p>
                      <div className="flex flex-wrap gap-1">
                        {user.restaurants.slice(0, 2).map((restaurant: any) => (
                          <Badge key={restaurant.id} variant="secondary" className="text-xs">
                            {restaurant.name}
                          </Badge>
                        ))}
                        {user.restaurants.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{user.restaurants.length - 2} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="h-4 w-4" />
                    <span>Created {user.createdAt.toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <Button 
                    asChild 
                    variant="outline" 
                    className="flex-1 border-blue-200 text-blue-600 hover:bg-blue-50"
                    size="sm"
                  >
                    <Link href={`/admin/users/${user.id}/edit`}>
                      <Settings className="h-4 w-4 mr-2" />
                      Manage
                    </Link>
                  </Button>
                  <Button 
                    asChild 
                    variant="outline" 
                    className="flex-1 border-purple-200 text-purple-600 hover:bg-purple-50"
                    size="sm"
                  >
                    <Link href={`/admin/users/${user.id}/restaurants`}>
                      <Building2 className="h-4 w-4 mr-2" />
                      Restaurants
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}