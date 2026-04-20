'use client'

import { useAuth } from '@autocare/api-client/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

const ProfilePage = () => {
  const router = useRouter()
  const { user, permissions, isAuthenticated, isLoading, logout, can } = useAuth()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login?redirect=/profile')
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return <main style={{ padding: 24 }}>Loading…</main>
  }
  if (!user) return null

  return (
    <main style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h1>Your profile</h1>
      <dl style={{ display: 'grid', gridTemplateColumns: 'max-content 1fr', gap: 8 }}>
        <dt>Email</dt>
        <dd>{user.email}</dd>
        <dt>Role</dt>
        <dd>{user.role}</dd>
        <dt>Organization</dt>
        <dd>{user.organizationId ?? '—'}</dd>
      </dl>

      <h2 style={{ marginTop: 24 }}>Permissions</h2>
      <ul>
        {permissions.map((perm) => (
          <li key={perm}>
            <code>{perm}</code>
          </li>
        ))}
      </ul>

      <section style={{ marginTop: 24, display: 'flex', gap: 12 }}>
        {can('logs.create') ? (
          <button type='button'>Add maintenance log</button>
        ) : (
          <button type='button' disabled title='You do not have permission to add logs'>
            Add maintenance log
          </button>
        )}
        <button
          type='button'
          onClick={() => logout.mutate(undefined, { onSuccess: () => router.replace('/login') })}
          disabled={logout.isPending}
        >
          {logout.isPending ? 'Signing out…' : 'Sign out'}
        </button>
      </section>
    </main>
  )
}

export default ProfilePage
