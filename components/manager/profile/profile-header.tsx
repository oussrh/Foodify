import { AlertCircle, CheckCircle, User } from 'lucide-react'

/** The page's title and the account status banner (verified, or verification required). */
export function ProfileHeader({ emailVerified }: { emailVerified: Date | null }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-lg">
          <User className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Account Profile
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your account settings, security, and preferences
          </p>
        </div>
      </div>
        
      {/* Account Status Banner */}
      <div className={`p-4 rounded-md border ${
emailVerified 
? 'bg-muted border-border' 
: 'bg-muted border-border'
}`}>
        <div className="flex items-center gap-3">
          {emailVerified ? (
            <CheckCircle className="h-5 w-5 text-success dark:text-muted-foreground" />
          ) : (
            <AlertCircle className="h-5 w-5 text-warning dark:text-muted-foreground" />
          )}
          <div>
            <p className={`text-sm font-medium ${
emailVerified 
? 'text-success' 
: 'text-warning'
}`}>
              {emailVerified ? 'Account Verified' : 'Email Verification Required'}
            </p>
            <p className={`text-sm ${
emailVerified 
? 'text-success dark:text-muted-foreground' 
: 'text-warning dark:text-muted-foreground'
}`}>
              {emailVerified 
                ? 'Your account is fully verified and secure' 
                : 'Please verify your email address to secure your account'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

/** What the page shows when the signed-in address has no account row. */
export function ProfileNotFound() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="text-center space-y-4">
        <User className="h-12 w-12 text-muted-foreground mx-auto" />
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-foreground">User not found</h3>
          <p className="text-sm text-muted-foreground">The requested user profile could not be located.</p>
        </div>
      </div>
    </div>
  )
}
