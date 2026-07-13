import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock } from 'lucide-react'

import useAuth from '../hooks/useAuth'

const LoginPage = () => {
  const navigate = useNavigate()
  const { login, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    try {
      await login(email, password)
      navigate('/dashboard', { replace: true })
    } catch {
      setError('Unable to login. Please check your credentials.')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="glass-card w-full max-w-md rounded-2xl p-8 text-slate-100 transition-all hover:shadow-[0_0_45px_rgba(79,124,255,0.4)]">
        <div className="mb-6 flex items-center gap-2 text-xl font-semibold">
          <Lock className="h-5 w-5 text-blue-300" /> IntelliCAM AI Login
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <input
            className="w-full rounded-lg border border-slate-500/40 bg-slate-950/40 p-3 outline-none transition focus:border-blue-400"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <input
            className="w-full rounded-lg border border-slate-500/40 bg-slate-950/40 p-3 outline-none transition focus:border-blue-400"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          {error && <p className="text-sm text-red-300">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-500/80 px-4 py-3 font-medium transition hover:bg-blue-400 disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default LoginPage
