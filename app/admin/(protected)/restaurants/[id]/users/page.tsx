//FilePath : app/admin/(protected)/restaurants/[id]/users/page.tsx

import Link from "next/link";
import prisma from "@/lib/prisma";
import { buttonVariants, Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CardContextMenu, CardContextMenuItem } from '@/components/card-context-menu';
import { 
  MoreVertical, 
  Pencil, 
  UserX, 
  ArrowLeft, 
  Users,
  Search,
  Grid3X3,
  List,
  Calendar,
  Mail,
  Shield,
  UserCheck,
  BarChart3,
  Plus,
  Edit3,
  Settings,
  Filter
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import AssignUsersDialog from "@/components/assign-users-dialog";
import RemoveRestaurantUserButton from "@/components/remove-restaurant-user-button";

async function getRestaurantUsers(restaurantId: string, searchQuery: string) {
  return await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    include: { 
      users: {
        where: searchQuery ? {
          email: {
            contains: searchQuery,
            mode: 'insensitive',
          },
        } : undefined,
        orderBy: { createdAt: 'desc' },
      }
    },
  });
}

export default async function RestaurantUsersPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams?: Promise<{ search?: string; view?: string }>
}) {
  const { id } = await params;
  const sp = searchParams ? await searchParams : undefined;
  const searchQuery = sp?.search || '';
  const viewMode = sp?.view || 'grid';
  const restaurant = await getRestaurantUsers(id, searchQuery);

  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="border-0 shadow-lg max-w-md w-full">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="text-center space-y-6">
              <div className="mx-auto h-20 w-20 rounded-full bg-gradient-to-br from-red-100 to-pink-100 dark:from-red-900/30 dark:to-pink-900/30 flex items-center justify-center">
                <Users className="h-10 w-10 text-red-600 dark:text-red-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-foreground">Restaurant Not Found</h3>
                <p className="text-muted-foreground">The restaurant you&apos;re looking for doesn&apos;t exist or has been deleted.</p>
              </div>
              <Button asChild className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600">
                <Link href="/admin/restaurants">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Restaurants
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate statistics
  const totalUsers = restaurant.users.length;
  const activeUsers = restaurant.users.length; // All assigned users are considered active

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="sm" asChild className="hover:bg-blue-50 dark:hover:bg-blue-900/20">
            <Link href={`/admin/restaurants/${restaurant.id}/edit`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Restaurant
            </Link>
          </Button>
        </div>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-xl">
              <Users className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Restaurant Users</h1>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="font-medium">{restaurant.name}</span>
                <span>•</span>
                <span>{totalUsers} user{totalUsers !== 1 ? 's' : ''}</span>
                {searchQuery && (
                  <>
                    <span>•</span>
                    <span>Filtered by &ldquo;{searchQuery}&rdquo;</span>
                  </>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Manage users with access to this restaurant
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700/50">
              <Shield className="h-3 w-3 mr-1" />
              Restaurant Users
            </Badge>
            <AssignUsersDialog
              restaurantId={restaurant.id}
              defaultUserIds={restaurant.users.map((u: any) => u.id)}
            />
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-3xl font-bold text-foreground">{totalUsers}</p>
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">Restaurant managers</p>
              </div>
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                <p className="text-3xl font-bold text-foreground">{activeUsers}</p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">With restaurant access</p>
              </div>
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <UserCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Restaurant</p>
                <p className="text-2xl font-bold text-foreground truncate">{restaurant.name}</p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Current venue</p>
              </div>
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Controls */}
      <Card>
        <CardHeader className="bg-muted/50 border-b">
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-muted-foreground" />
            Search & Filter Users
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <form
              className="flex max-w-md items-center gap-3 flex-1"
              action={`/admin/restaurants/${restaurant.id}/users`}
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  name="search"
                  placeholder="Search users by email..."
                  defaultValue={searchQuery}
                  className="pl-10"
                />
              </div>
              <input type="hidden" name="view" value={viewMode} />
              <Button 
                variant="outline" 
                type="submit"
                className="border-purple-200 text-purple-600 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-400 dark:hover:bg-purple-900/20"
              >
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
            </form>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">View:</span>
              <div className="flex items-center border rounded-lg p-1">
                <Link 
                  href={`/admin/restaurants/${restaurant.id}/users?${new URLSearchParams({ ...(searchQuery && { search: searchQuery }), view: 'grid' }).toString()}`}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Link>
                <Link 
                  href={`/admin/restaurants/${restaurant.id}/users?${new URLSearchParams({ ...(searchQuery && { search: searchQuery }), view: 'list' }).toString()}`}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <List className="h-4 w-4" />
                </Link>
              </div>
            </div>
            
            {searchQuery && (
              <Button 
                variant="ghost" 
                asChild
                className="text-muted-foreground hover:text-foreground"
              >
                <Link href={`/admin/restaurants/${restaurant.id}/users`}>
                  Clear Filter
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Users Display */}
      {restaurant.users.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="text-center space-y-6">
              <div className="mx-auto h-20 w-20 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 flex items-center justify-center">
                <Users className="h-10 w-10 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-foreground">
                  {searchQuery ? 'No users found' : 'No users assigned'}
                </h3>
                <p className="text-muted-foreground max-w-sm">
                  {searchQuery 
                    ? `No users found matching "${searchQuery}". Try adjusting your search terms.`
                    : 'This restaurant doesn&apos;t have any assigned users yet. Assign users to grant management permissions.'
                  }
                </p>
              </div>
              {!searchQuery && (
                <AssignUsersDialog
                  restaurantId={restaurant.id}
                  defaultUserIds={restaurant.users.map((u: any) => u.id)}
                />
              )}
            </div>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {restaurant.users.map((user: any) => (
            <Card key={user.id} className="group overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="p-2 bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-lg">
                      <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg leading-tight font-semibold text-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors truncate">
                        {user.email}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className="bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700/50 text-xs">
                          Restaurant Admin
                        </Badge>
                        <Badge className="bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700/50 text-xs">
                          Active
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <CardContextMenu>
                    <CardContextMenuItem>
                      <Link href={`/admin/users/${user.id}/edit`} className="flex items-center w-full">
                        <Edit3 className="h-4 w-4 mr-2" />
                        Edit User
                      </Link>
                    </CardContextMenuItem>
                    <RemoveRestaurantUserButton
                      restaurantId={restaurant.id}
                      userIds={restaurant.users.map((r: any) => r.id)}
                      userId={user.id}
                    />
                  </CardContextMenu>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span className="font-medium truncate">{user.email}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Joined {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}</span>
                  </div>
                </div>
                
                <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <Button 
                    asChild 
                    variant="outline" 
                    className="flex-1 border-purple-200 text-purple-600 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-400 dark:hover:bg-purple-900/20"
                    size="sm"
                  >
                    <Link href={`/admin/users/${user.id}/edit`}>
                      <Settings className="h-4 w-4 mr-2" />
                      Manage
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader className="bg-muted/50 border-b">
            <CardTitle className="flex items-center gap-2">
              <List className="h-5 w-5 text-muted-foreground" />
              User List View
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Role & Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Joined</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {restaurant.users.map((user: any) => (
                    <tr key={user.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12">
                            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 flex items-center justify-center">
                              <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-foreground">{user.email}</div>
                            <div className="text-sm text-muted-foreground">Restaurant Administrator</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <Badge className="bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700/50 text-xs">
                            Restaurant Admin
                          </Badge>
                          <Badge className="bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700/50 text-xs block">
                            Active
                          </Badge>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <CardContextMenu alwaysVisible={true}>
                          <CardContextMenuItem>
                            <Link href={`/admin/users/${user.id}/edit`} className="flex items-center w-full">
                              <Edit3 className="h-4 w-4 mr-2" />
                              Edit User
                            </Link>
                          </CardContextMenuItem>
                          <RemoveRestaurantUserButton
                            restaurantId={restaurant.id}
                            userIds={restaurant.users.map((r: any) => r.id)}
                            userId={user.id}
                          />
                        </CardContextMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
