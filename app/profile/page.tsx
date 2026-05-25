'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { signOut } from '@/lib/auth'

export default function ProfilePage() {
  const router = useRouter()
  const [userId, setUserId] = useState('')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [currentWeight, setCurrentWeight] = useState('')
  const [weightGoal, setWeightGoal] = useState('')
  const [totalSessions, setTotalSessions] = useState(0)
  const [totalCal, setTotalCal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!session) { router.push('/'); return }
        setUserId(session.user.id)
        setEmail(session.user.email || '')
        try {
          const { data: profile } = await supabase
            .from('users').select('*')
            .eq('id', session.user.id).single()
          if (profile) {
            setUsername(profile.username || '')
            setCurrentWeight(profile.current_weight || '')
            setWeightGoal(profile.weight_goal || '')
          }
          // Stats totales
          const { data: acts } = await supabase
            .from('activities').select('calories_burned')
            .eq('user_id', session.user.id)
          setTotalSessions(acts?.length || 0)
          setTotalCal((acts || []).reduce((s: number, a: any) => s + a.calories_burned, 0))
        } catch (e) {
          console.error(e)
        } finally {
          setLoading(false)
        }
      }
    )
    return () => subscription.unsubscribe()
  }, [router])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({
          username,
          current_weight: currentWeight ? parseFloat(currentWeight) : null,
          weight_goal: weightGoal ? parseFloat(weightGoal) : null,
        })
        .eq('id', userId)
      if (updateError) throw updateError
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  async function handleSignOut() {
    await signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#F5F5F5]">
        <p className="text-[#9D99AD] text-sm tracking-widest">CHARGEMENT...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#F5F5F5] pb-24">

      {/* HEADER */}
      <div className="flex items-center gap-4 px-5 pt-5 pb-4">
        <Link href="/dashboard">
          <button className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-lg">←</button>
        </Link>
        <div>
          <h1 className="text-[#1A1A1A] text-xl font-black">Mon profil</h1>
          <p className="text-[#9D99AD] text-xs">Tes informations PRIMAL</p>
        </div>
      </div>

      <div className="px-5 flex flex-col gap-4">

        {/* AVATAR + NOM */}
        <div className="bg-[#1A1A1A] rounded-2xl p-6 flex items-center gap-4">
          <div className="relative">
            <Image src="/mascot.svg" alt="Avatar" width={64} height={64} />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#FF6B00] rounded-full flex items-center justify-center text-[10px]">🦂</div>
          </div>
          <div>
            <h2 className="text-white text-xl font-black">{username || 'Warrior'}</h2>
            <p className="text-[#9D99AD] text-xs">{email}</p>
            <div className="flex gap-2 mt-2">
              <span className="text-[10px] bg-[#FF6B00] text-white px-2 py-0.5 rounded-full font-semibold">
                {totalSessions} séances
              </span>
              <span className="text-[10px] bg-[#333] text-[#9D99AD] px-2 py-0.5 rounded-full font-semibold">
                {totalCal.toLocaleString()} cal
              </span>
            </div>
          </div>
        </div>

        {/* FORMULAIRE */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="text-[#1A1A1A] text-sm font-bold mb-4">✏️ Modifier mes infos</h2>

          {error && <div className="bg-red-50 text-red-600 text-sm rounded-xl p-3 mb-3">{error}</div>}
          {success && <div className="bg-green-50 text-green-600 text-sm rounded-xl p-3 mb-3">✓ Profil mis à jour !</div>}

          <form onSubmit={handleSave} className="flex flex-col gap-3">
            <div>
              <label className="text-[#1A1A1A] text-xs font-semibold mb-1 block">Pseudo</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="TonPseudo"
                className="w-full border border-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#FF6B00] transition-colors"
              />
            </div>
            <div>
              <label className="text-[#1A1A1A] text-xs font-semibold mb-1 block">Email</label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full border border-gray-100 rounded-xl px-4 py-3 text-sm bg-gray-50 text-[#9D99AD] cursor-not-allowed"
              />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-[#1A1A1A] text-xs font-semibold mb-1 block">Poids actuel (kg)</label>
                <input
                  type="number"
                  value={currentWeight}
                  onChange={e => setCurrentWeight(e.target.value)}
                  placeholder="74"
                  step="0.1"
                  min="30"
                  max="300"
                  className="w-full border border-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#FF6B00] transition-colors"
                />
              </div>
              <div className="flex-1">
                <label className="text-[#1A1A1A] text-xs font-semibold mb-1 block">Objectif (kg)</label>
                <input
                  type="number"
                  value={weightGoal}
                  onChange={e => setWeightGoal(e.target.value)}
                  placeholder="70"
                  step="0.1"
                  min="30"
                  max="300"
                  className="w-full border border-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#FF6B00] transition-colors"
                />
              </div>
            </div>
            <button type="submit" disabled={saving} className="btn-primary w-full disabled:opacity-60">
              {saving ? 'Sauvegarde...' : '💾 Sauvegarder'}
            </button>
          </form>
        </div>

        {/* OBJECTIF PROGRESSION */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="text-[#1A1A1A] text-sm font-bold mb-3">🎯 Mon objectif</h2>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-[#9D99AD]">{weightGoal} kg <span className="text-[#FF6B00]">objectif</span></span>
            <span className="text-xs text-[#9D99AD]">{currentWeight} kg <span className="text-[#1A1A1A] font-bold">actuel</span></span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3">
            <div className="bg-gradient-to-r from-[#FF9A45] to-[#FF6B00] h-3 rounded-full" style={{
              width: weightGoal && currentWeight
                ? `${Math.min(100, Math.max(5, (1 - (parseFloat(currentWeight) - parseFloat(weightGoal)) / parseFloat(currentWeight)) * 100))}%`
                : '5%'
            }}/>
          </div>
          <p className="text-xs text-[#9D99AD] mt-2 text-center">
            {weightGoal && currentWeight
              ? `Il te reste ${(parseFloat(currentWeight) - parseFloat(weightGoal)).toFixed(1)} kg à perdre 💪`
              : 'Définis ton objectif ci-dessus'}
          </p>
        </div>

        {/* DÉCONNEXION */}
        <button
          onClick={handleSignOut}
          className="w-full bg-white border-2 border-gray-100 rounded-2xl p-4 text-[#9D99AD] font-semibold text-sm hover:border-red-200 hover:text-red-400 transition-colors"
        >
          🚪 Se déconnecter
        </button>

      </div>

      {/* BOTTOM NAV */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex py-2 pb-4 z-50">
        <Link href="/dashboard" className="flex-1 flex flex-col items-center gap-0.5">
          <span className="text-xl">🏠</span>
          <span className="text-[10px] text-[#9D99AD]">Accueil</span>
        </Link>
        <Link href="/stats" className="flex-1 flex flex-col items-center gap-0.5">
          <span className="text-xl">📊</span>
          <span className="text-[10px] text-[#9D99AD]">Stats</span>
        </Link>
        <Link href="/activities/add" className="flex-1 flex flex-col items-center gap-0.5">
          <span className="text-xl">➕</span>
          <span className="text-[10px] text-[#9D99AD]">Activité</span>
        </Link>
        <Link href="/weight" className="flex-1 flex flex-col items-center gap-0.5">
          <span className="text-xl">⚖️</span>
          <span className="text-[10px] text-[#9D99AD]">Poids</span>
        </Link>
        <Link href="/profile" className="flex-1 flex flex-col items-center gap-0.5">
          <span className="text-xl">👤</span>
          <span className="text-[10px] text-[#FF6B00] font-semibold">Profil</span>
        </Link>
      </nav>

    </main>
  )
}
