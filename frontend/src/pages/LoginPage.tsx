import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { useAuth } from '../state/AuthContext'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')

    try {
      await login(username, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl">
        <h1 className="text-3xl font-semibold text-white">Welcome back</h1>
        <p className="mt-2 text-sm text-slate-400">Sign in to access the AI landing dashboard.</p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <input
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-500"
            placeholder="Username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
          <input
            type="password"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-500"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {error ? <p className="text-sm text-rose-400">{error}</p> : null}
          <button
            type="submit"
            className="w-full rounded-xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-emerald-300"
          >
            Sign in
          </button>
        </form>
        <p className="mt-6 text-sm text-slate-400">
          New here?{' '}
          <Link className="text-emerald-300 hover:text-emerald-200" to="/register">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  )
}
