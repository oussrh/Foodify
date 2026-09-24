import { describe, expect, it } from 'vitest'
import { describeHost, localDatabaseHost } from './db-setup.mjs'

describe('localDatabaseHost', () => {
  it('accepts this machine, by name, IPv4 and IPv6', () => {
    expect(localDatabaseHost('postgresql://test:test@localhost:5499/test')).toBe('localhost')
    expect(localDatabaseHost('postgresql://u:p@127.0.0.1:5432/db')).toBe('127.0.0.1')
    expect(localDatabaseHost('postgresql://u:p@[::1]:5432/db')).toBe('::1')
    expect(localDatabaseHost('postgresql://u:p@LOCALHOST/db')).toBe('localhost')
  })

  it('refuses a remote host, a look-alike, no URL and an unreadable one', () => {
    expect(localDatabaseHost('postgresql://u:p@ep-x-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require')).toBeNull()
    expect(localDatabaseHost('postgresql://u:p@localhost.evil.example/db')).toBeNull()
    expect(localDatabaseHost('postgresql://u:p@127.0.0.2/db')).toBeNull()
    expect(localDatabaseHost(undefined)).toBeNull()
    expect(localDatabaseHost('')).toBeNull()
    expect(localDatabaseHost('not a url')).toBeNull()
  })
})

describe('describeHost', () => {
  it('names the host and database, never the credentials', () => {
    expect(describeHost('postgresql://user:secret@db.example.com:5432/app')).toBe('db.example.com/app')
    expect(describeHost('nope')).toBe('an unreadable DATABASE_URL')
  })
})
