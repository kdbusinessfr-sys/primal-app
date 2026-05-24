'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { signIn } from '@/lib/auth'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await signIn(email, password)
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#F5F5F5] px-6">

      {/* Logo */}
      <Image src="/mascot.svg" alt="Primal" width={100} height={100} className="mb-4" />
      <h1 className="text-[#1A1A1A] text-3xl font-black tracking-tighter mb-1">PRIMAL</h1>
      <p className="text-[#FF6B00] text-xs font-semibold tracking-[0.3em] mb-8">FEEL THE STING</p>

      {/* Formulaire */}
      <div className="w-full max-w-xs bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="text-[#1A1A1A] text-xl font-bold mb-6">Se connecter</h2>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm rounded-xl p-3 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="text-[#1A1A1A] text-sm font-medium mb-1 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="ton@email.com"
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#FF6B00] transition-colors"
            />
          </div>
          <div>
            <label className="text-[#1A1A1A] text-sm font-medium mb-1 block">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#FF6B00] transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full mt-2 disabled:opacity-60"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Pas encore de compte ?{' '}
          <Link href="/auth/signup" className="text-[#FF6B00] font-semibold">
            S'inscrire
          </Link>
        </p>
      </div>

    </main>
  )
}
