'use client'

import { useAuth } from '@autocare/api-client/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { type FormEvent, useEffect, useState } from 'react'

const LoginPage = () => {
  const router = useRouter()
  const params = useSearchParams()
  const redirectTo = params.get('redirect') ?? '/profile'
  const { login, isAuthenticated, isLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(redirectTo)
    }
  }, [isAuthenticated, isLoading, redirectTo, router])

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    login.mutate(
      { email, password },
      {
        onSuccess: () => router.replace(redirectTo),
      },
    )
  }

  return (
    <main
      style={{
        maxWidth: 360,
        margin: '64px auto',
        padding: 24,
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>Sign in</h1>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
        <label style={{ display: 'grid', gap: 4 }}>
          <span>Email</span>
          <input
            type='email'
            required
            value={email}
            autoComplete='username'
            onChange={(event) => setEmail(event.target.value)}
            style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #ccc' }}
          />
        </label>
        <label style={{ display: 'grid', gap: 4 }}>
          <span>Password</span>
          <input
            type='password'
            required
            value={password}
            autoComplete='current-password'
            onChange={(event) => setPassword(event.target.value)}
            style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #ccc' }}
          />
        </label>
        <button
          type='submit'
          disabled={login.isPending}
          style={{
            padding: '10px 12px',
            borderRadius: 6,
            border: 'none',
            background: '#111',
            color: '#fff',
            cursor: login.isPending ? 'wait' : 'pointer',
          }}
        >
          {login.isPending ? 'Signing in…' : 'Sign in'}
        </button>
        {login.error ? (
          <p style={{ color: '#b00020', fontSize: 14 }}>
            {login.error.message || 'Unable to sign in'}
          </p>
        ) : null}
      </form>
    </main>
  )
}

export default LoginPage
