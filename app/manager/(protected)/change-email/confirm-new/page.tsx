import { confirmNewEmail } from '@/app/actions/profile-actions'

export default async function ConfirmNewEmailPage({ searchParams }: { searchParams: { token?: string } }) {
  const success = searchParams.token ? await confirmNewEmail(searchParams.token) : false

  return (
    <div className="p-6">
      {success ? (
        <p>Your email has been successfully updated.</p>
      ) : (
        <p className="text-destructive">Invalid or expired link.</p>
      )}
    </div>
  )
}
