import CreateRestaurantForm from '@/components/create-restaurant-form'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Building2, Plus, Sparkles } from 'lucide-react'
import Link from 'next/link'

export default function CreateRestaurantPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="sm" asChild className="hover:bg-muted">
            <Link href="/admin/restaurants">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Restaurants
            </Link>
          </Button>
        </div>
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-md">
            <Plus className="h-8 w-8 text-success" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Create New Restaurant</h1>
            <p className="text-muted-foreground">
              Set up a new restaurant with all necessary details and configurations
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Complete the form below to add a new restaurant to the platform
            </p>
          </div>
        </div>
      </div>

      {/* Form Section */}
      <div className="max-w-4xl">
        <Card className="border-0">
          <CardHeader className="border-b">
            <div className="flex items-center gap-3">
              <Building2 className="h-6 w-6 text-success" />
              <div>
                <CardTitle className="text-xl text-foreground">Restaurant Information</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Provide essential details about the new restaurant
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-6">
              <div className="p-4 bg-muted border border-border rounded-lg">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-muted-foreground">
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
