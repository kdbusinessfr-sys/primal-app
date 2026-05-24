'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [currentWeight, setCurrentWeight] = useState('')
  const [weightGoal, setWeightGoal] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // 1 — Inscription Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: { username },
        },
      })

      if (signUpError) throw signUpError
      if (!data.user) throw new Error('Erreur lors de la création du compte')

      // 2 — Sauvegarde profil complet dans la table users
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email: data.user.email!,
          username,
          current_weight: currentWeight ? parseFloat(currentWeight) : null,
          weight_goal: weightGoal ? parseFloat(weightGoal) : null,
        })

      if (profileError) throw profileError

      // 3 — Sauvegarde objectif dans la table goals
      if (weightGoal) {
        await supabase
          .from('goals')
          .insert({
            user_id: data.user.id,
            target_weight: parseFloat(weightGoal),
            status: 'active',
          })
      }

      // 4 — Affiche message de confirmation email
      setSuccess(true)

    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'inscription')
    } finally {
      setLoading(false)
    }
  }

  // Page de succès — attendre confirmation email
  if (success) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-[#F5F5F5] px-6">
        <div className="w-full max-w-xs bg-white rounded-2xl p-8 shadow-sm text-center">
          <div className="text-5xl mb-4">🦂</div>
          <h2 className="text-[#1A1A1A] text-xl font-black mb-2">Vérifie ta boîte mail !</h2>
          <p className="text-[#9D99AD] text-sm leading-relaxed mb-6">
            On a envoyé un lien de confirmation à <strong className="text-[#1A1A1A]">{email}</strong>. Clique dessus pour activer ton compte PRIMAL.
          </p>
          <div className="bg-[#F5F5F5] rounded-xl p-4">
            <p className="text-[#9D99AD] text-xs">Tu ne vois pas l'email ? Vérifie tes spams.</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#F5F5F5] px-6 py-12">
      <Image src="/mascot.svg" alt="Primal" width={100} height={100} className="mb-4" />
      <h1 className="text-[#1A1A1A] text-3xl font-black tracking-tighter mb-1">PRIMAL</h1>
      <p className="text-[#FF6B00] text-xs font-semibold tracking-[0.3em] mb-8">FEEL THE STING</p>

      <div className="w-full max-w-xs bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="text-[#1A1A1A] text-xl font-bold mb-6">Créer un compte</h2>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm rounded-xl p-3 mb-4">{error}</div>
        )}

        <form onSubmit={handleSignup} className="flex flex-col gap-4">
          <div>
            <label className="text-[#1A1A1A] text-sm font-medium mb-1 block">Pseudo</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="TonPseudo"
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#FF6B00] transition-colors"
            />
          </div>
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
              minLength={6}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#FF6B00] transition-colors"
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-[#1A1A1A] text-sm font-medium mb-1 block">Poids actuel (kg)</label>
              <input
                type="number"
                value={currentWeight}
                onChange={e => setCurrentWeight(e.target.value)}
                placeholder="75"
                min="30"
                max="300"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#FF6B00] transition-colors"
              />
            </div>
            <div className="flex-1">
              <label className="text-[#1A1A1A] text-sm font-medium mb-1 block">Objectif (kg)</label>
              <input
                type="number"
                value={weightGoal}
                onChange={e => setWeightGoal(e.target.value)}
                placeholder="65"
                min="30"
                max="300"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#FF6B00] transition-colors"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full mt-2 disabled:opacity-60"
          >
            {loading ? 'Création...' : 'Commencer PRIMAL'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Déjà un compte ?{' '}
          <Link href="/auth/login" className="text-[#FF6B00] font-semibold">Se connecter</Link>
        </p>
      </div>
    </main>
  )
}
