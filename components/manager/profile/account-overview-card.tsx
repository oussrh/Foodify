import Link from 'next/link'
import { AlertCircle, Calendar, CheckCircle, ChevronRight, Clock, Mail, Settings, Shield, Star, User, Zap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ProfileUser {
  email: string
  role: string
  createdAt: Date
  lastLogin: Date | null
  emailVerified: Date | null
}

/** The four tiles: address and its verification, role, member since (with the new-account badge), last login. */
function ProfileInfo({ user, isNewAccount }: { user: ProfileUser; isNewAccount: boolean }) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-4">
        <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-md border border-border/50">
          <div className="p-2 bg-background rounded-lg border border-border/50">
            <Mail className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">Email Address</p>
            <p className="text-sm text-muted-foreground truncate mt-0.5">{user.email}</p>
          </div>
          <div className="flex items-center gap-2">
            {user.emailVerified ? (
              <Badge className="bg-muted text-success dark:text-muted-foreground border-border">
                <CheckCircle className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            ) : (
              <Badge variant="outline" className="border-border text-warning dark:text-muted-foreground bg-muted">
                <AlertCircle className="h-3 w-3 mr-1" />
                Unverified
              </Badge>
            )}
          </div>
        </div>
                
        <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-md border border-border/50">
          <div className="p-2 bg-background rounded-lg border border-border/50">
            <Shield className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Account Role</p>
            <div className="mt-2">
              <Badge className="bg-muted text-muted-foreground dark:text-muted-foreground border-border">
                <Star className="h-3 w-3 mr-1" />
                {user.role}
              </Badge>
            </div>
          </div>
        </div>
      </div>
              
      <div className="space-y-4">
        <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-md border border-border/50">
          <div className="p-2 bg-background rounded-lg border border-border/50">
            <Calendar className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Member Since</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {user.createdAt.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
            {isNewAccount && (
              <Badge className="bg-muted text-success dark:text-muted-foreground border-border mt-2">
                <Zap className="h-3 w-3 mr-1" />
                New Account
              </Badge>
            )}
          </div>
        </div>
                
        <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-md border border-border/50">
          <div className="p-2 bg-background rounded-lg border border-border/50">
            <Clock className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Last Login</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {user.lastLogin ? user.lastLogin.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              }) : 'Never'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function QuickActions() {
  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-foreground flex items-center gap-2">
        <Settings className="h-4 w-4" />
        Quick Actions
      </h4>
      <div className="grid gap-3 md:grid-cols-2">
        <Link href="/manager/change-email">
          <Button variant="outline" className="w-full justify-between h-12 hover:bg-accent hover:border-accent-foreground/20 transition-colors">
            <span className="flex items-center gap-3">
              <Mail className="h-4 w-4" />
              <div className="text-left">
                <div className="font-medium">Change Email</div>
                <div className="text-xs text-muted-foreground">Update your email address</div>
              </div>
            </span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
                
        <Button variant="outline" className="w-full justify-between h-12 hover:bg-accent hover:border-accent-foreground/20 transition-colors">
          <span className="flex items-center gap-3">
            <Settings className="h-4 w-4" />
            <div className="text-left">
              <div className="font-medium">Account Settings</div>
              <div className="text-xs text-muted-foreground">Manage preferences</div>
            </div>
          </span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

/** The account overview: the profile tiles and the quick actions. */
export function AccountOverviewCard({ user, isNewAccount }: { user: ProfileUser; isNewAccount: boolean }) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader className="border-b border-border">
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 bg-muted rounded-lg">
            <User className="h-5 w-5 text-muted-foreground dark:text-muted-foreground" />
          </div>
          <div>
            <span className="text-lg">Account Overview</span>
            <p className="text-sm text-muted-foreground font-normal mt-0.5">
              Your account details and basic information
            </p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-8 space-y-8">
        {/* Profile Info */}
        <ProfileInfo user={user} isNewAccount={isNewAccount} />

        {/* Quick Actions */}
        <QuickActions />
      </CardContent>
    </Card>
  )
}
