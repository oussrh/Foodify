import { confirmOldEmail } from '@/app/actions/profile-actions'

export default async function ConfirmOldEmailPage({ searchParams }: { searchParams: { token?: string } }) {
  const success = searchParams.token ? await confirmOldEmail(searchParams.token) : false

  return (
    <div className="p-6">
      {success ? (
        <p>Old email confirmed. Please verify the link sent to your new email address.</p>
      ) : (
        <p className="text-destructive">Invalid or expired link.</p>
      )}
    </div>
  )
}
