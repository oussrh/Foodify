import CreateRestaurantForm from '@/components/create-restaurant-form'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Building2, Plus, Sparkles } from 'lucide-react'
import Link from 'next/link'

export default function CreateRestaurantPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-gray-200 pb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="sm" asChild className="hover:bg-blue-50">
            <Link href="/admin/restaurants">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Restaurants
            </Link>
          </Button>
        </div>
        <div className="flex items-start gap-4">
          <div className="p-3 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl">
            <Plus className="h-8 w-8 text-green-600" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">Create New Restaurant</h1>
            <p className="text-gray-600">
              Set up a new restaurant with all necessary details and configurations
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Complete the form below to add a new restaurant to the platform
            </p>
          </div>
        </div>
      </div>

      {/* Form Section */}
      <div className="max-w-4xl">
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
            <div className="flex items-center gap-3">
              <Building2 className="h-6 w-6 text-green-600" />
              <div>
                <CardTitle className="text-xl text-gray-900">Restaurant Information</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Provide essential details about the new restaurant
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-6">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-700">
                    <p className="font-medium mb-1">Getting Started</p>
                    <p>Fill out the required information below. You can always update these details later from the restaurant management page.</p>
                  </div>
                </div>
              </div>
              
              <CreateRestaurantForm />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
