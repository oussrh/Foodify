import Link from 'next/link'
import { buttonVariants, Button } from '@/components/ui/button'
import ResetAdminPasswordButton from '@/components/reset-admin-password-button'
import prisma from '@/lib/prisma'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { 
  MoreVertical, 
  Shield,
  UserPlus,
  Search,
  Grid3X3,
  List,
  Edit,
  Key,
  Calendar,
  Mail,
  Users,
  BarChart3,
  TrendingUp,
  Settings,
  Crown
} from 'lucide-react'

export default async function AdminsPage({
  searchParams,
}: {
  searchParams?: Promise<{ search?: string; view?: string }>
}) {
  const sp = searchParams ? await searchParams : undefined
  const searchQuery = sp?.search || ''
  const viewMode = sp?.view || 'grid'
  
  const admins = await prisma.user.findMany({
    where: { 
      role: 'SUPER_ADMIN',
      ...(searchQuery && {
        email: {
          contains: searchQuery,
          mode: 'insensitive',
        },
      }),
    },
    orderBy: { createdAt: 'desc' },
  })
  
  // Calculate statistics
  const totalAdmins = admins.length
  const recentAdmins = admins.filter(admin => {
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    return new Date(admin.createdAt) > oneWeekAgo
  }).length
  
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-gray-200 pb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-br from-red-100 to-pink-100 rounded-xl">
              <Shield className="h-8 w-8 text-red-600" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">Admin Management</h1>
              <div className="flex items-center gap-2 text-gray-600">
                <span className="font-medium">{totalAdmins} admin{totalAdmins !== 1 ? 's' : ''}</span>
                <span>•</span>
                <span>{recentAdmins} new this week</span>
                {searchQuery && (
                  <>
                    <span>•</span>
                    <span>Filtered by &ldquo;{searchQuery}&rdquo;</span>
                  </>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Manage super administrator accounts with full system access
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-red-100 text-red-700 border-red-200">
              <Crown className="h-3 w-3 mr-1" />
              Super Admin Portal
            </Badge>
            <Button 
              asChild 
              className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 shadow-lg"
            >
              <Link href="/admin/admins/create">
                <UserPlus className="h-5 w-5 mr-2" />
                Create Admin
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
                <p className="text-sm font-medium text-gray-600">Total Admins</p>
                <p className="text-3xl font-bold text-gray-900">{totalAdmins}</p>
                <p className="text-xs text-red-600 mt-1">Super administrators</p>
              </div>
              <div className="p-2 bg-red-100 rounded-lg">
                <Shield className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Recent Admins</p>
                <p className="text-3xl font-bold text-gray-900">{recentAdmins}</p>
                <p className="text-xs text-green-600 mt-1">Added this week</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">System Access</p>
                <p className="text-3xl font-bold text-gray-900">Full</p>
                <p className="text-xs text-purple-600 mt-1">All permissions</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Settings className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Sessions</p>
                <p className="text-3xl font-bold text-gray-900">{totalAdmins}</p>
                <p className="text-xs text-blue-600 mt-1">Currently online</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Controls */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-gray-600" />
            Search & Filter Admins
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <form
              className="flex max-w-md items-center gap-3 flex-1"
              action="/admin/admins"
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  name="search"
                  placeholder="Search admins by email..."
                  defaultValue={searchQuery}
                  className="pl-10 border-gray-200 focus:border-red-400"
                />
              </div>
              <input type="hidden" name="view" value={viewMode} />
              <Button 
                variant="outline" 
                type="submit"
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
            </form>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">View:</span>
              <div className="flex items-center border border-gray-200 rounded-lg p-1">
                <Link 
                  href={`/admin/admins?${new URLSearchParams({ ...(searchQuery && { search: searchQuery }), view: 'grid' }).toString()}`}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-red-100 text-red-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Link>
                <Link 
                  href={`/admin/admins?${new URLSearchParams({ ...(searchQuery && { search: searchQuery }), view: 'list' }).toString()}`}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-red-100 text-red-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <List className="h-4 w-4" />
                </Link>
              </div>
            </div>
            
            {searchQuery && (
              <Button 
                variant="ghost" 
                asChild
                className="text-gray-500 hover:text-gray-700"
              >
                <Link href="/admin/admins">
                  Clear Filter
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Admins Display */}
      {admins.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="text-center space-y-6">
              <div className="mx-auto h-20 w-20 rounded-full bg-gradient-to-br from-red-100 to-pink-100 flex items-center justify-center">
                <Shield className="h-10 w-10 text-red-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-gray-900">
                  {searchQuery ? 'No admins found' : 'No admins yet'}
                </h3>
                <p className="text-muted-foreground max-w-sm">
                  {searchQuery 
                    ? `No admins found matching &ldquo;${searchQuery}&rdquo;. Try adjusting your search terms.`
                    : 'Get started by creating your first super administrator account.'
                  }
                </p>
              </div>
              {!searchQuery && (
                <Button size="lg" className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600" asChild>
                  <Link href="/admin/admins/create">
                    <UserPlus className="h-5 w-5 mr-2" />
                    Create First Admin
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {admins.map((admin: any) => {
            const isRecent = (() => {
              const oneWeekAgo = new Date()
              oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
              return new Date(admin.createdAt) > oneWeekAgo
            })()
            
            return (
              <Card key={admin.id} className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-0 bg-white shadow-sm hover:shadow-xl hover:-translate-y-1">
                <div className="aspect-video relative bg-gradient-to-br from-red-50 to-pink-50 overflow-hidden">
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center space-y-2">
                      <Shield className="h-16 w-16 text-red-500 mx-auto" />
                      <span className="text-sm text-red-600 font-medium">Super Administrator</span>
                    </div>
                  </div>
                  
                  {/* Super admin badge */}
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-red-100 text-red-700 border-red-200">
                      <Crown className="h-3 w-3 mr-1" />
                      Super Admin
                    </Badge>
                  </div>
                  
                  {/* Recent indicator */}
                  {isRecent && (
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-green-100 text-green-700 border-green-200">
                        New
                      </Badge>
                    </div>
                  )}
                </div>
                
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1 min-w-0">
                      <CardTitle className="text-lg leading-tight font-semibold text-gray-900 group-hover:text-red-600 transition-colors">
                        Administrator
                      </CardTitle>
                      <div className="flex items-center gap-1 text-gray-600">
                        <Mail className="h-3 w-3" />
                        <span className="text-sm truncate">{admin.email}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-500">
                        <Calendar className="h-3 w-3" />
                        <span className="text-xs">Created {new Date(admin.createdAt).toLocaleDateString()}</span>
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
                          <Link href={`/admin/admins/${admin.id}/edit`}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Admin
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <ResetAdminPasswordButton id={admin.id} />
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0 space-y-4">
                  <div className="space-y-2">
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-2 text-red-700">
                        <Shield className="h-4 w-4" />
                        <span className="text-sm font-medium">Full System Access</span>
                      </div>
                      <p className="text-xs text-red-600 mt-1">
                        Can manage all restaurants, users, and system settings
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <Button 
                      asChild 
                      variant="outline" 
                      className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                      size="sm"
                    >
                      <Link href={`/admin/admins/${admin.id}/edit`}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Link>
                    </Button>
                    <ResetAdminPasswordButton id={admin.id} className="flex-1" />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50 border-b">
            <CardTitle className="flex items-center gap-2">
              <List className="h-5 w-5 text-red-600" />
              Administrator List View
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Administrator</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Access Level</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {admins.map((admin: any) => {
                    const isRecent = (() => {
                      const oneWeekAgo = new Date()
                      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
                      return new Date(admin.createdAt) > oneWeekAgo
                    })()
                    
                    return (
                      <tr key={admin.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-12 w-12">
                              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-red-100 to-pink-100 flex items-center justify-center">
                                <Shield className="h-6 w-6 text-red-600" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{admin.email}</div>
                              <div className="text-sm text-gray-500 flex items-center gap-1">
                                <Crown className="h-3 w-3" />
                                Super Administrator
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-1">
                            <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">
                              Full Access
                            </Badge>
                            {isRecent && (
                              <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                                New
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(admin.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/admins/${admin.id}/edit`}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Admin
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <ResetAdminPasswordButton id={admin.id} />
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
