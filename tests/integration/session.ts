// tests/integration/session.ts
// Who the code under test is signed in as. The guards read the token for the id and email only
// and re-read the row for the role, so a test signs in as a row it created in its transaction.
type SessionUser = { id: string; email: string; role?: string }

export const session: { current: { user: SessionUser } | null } = { current: null }

export function signInAs(user: SessionUser | null) {
  session.current = user ? { user } : null
}
