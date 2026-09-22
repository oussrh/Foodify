-- A kitchen tablet is an account, not a person: it signs in with a password, never a second
-- factor, and passes only the order board's guard. Every management guard refuses it.
ALTER TYPE "UserRole" ADD VALUE 'KITCHEN';
