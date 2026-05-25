'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface WeightLog {
  id: string
  weight: number
  date: string
  note: string | null
}

export default function WeightPage() {
  const router = useRouter()
  const [logs, setLogs] = useState<WeightLog[]>([])
  const [currentWeight, setCurrentWeight] = useState('')
  const [weightGoal, setWeightGoal] = useState<number | null>(null)
  const [newWeight, setNewWeight] = useState('')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [userId, setUserId] = useState('')

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!session) { router.push('/'); return }
        setUserId(session.user.id)
        try {
          // Profil
          const { data: profile } = await supabase
            .from('users').select('current_weight, weight_goal')
            .eq('id', session.user.id).single()
          if (profile) {
            setCurrentWeight(profile.current_weight || '')
            setWeightGoal(profile.weight_goal)
          }

          // Historique poids depuis stats_weekly
          const { data: weightData } = await supabase
            .from('stats_weekly')
            .select('id, weight_log, week_start')
            .eq('user_id', session.user.id)
            .not('weight_log', 'is', null)
            .order('week_start', { ascending: false })
            .limit(10)

          if (weightData) {
            setLogs(weightData.map((w: any) => ({
              id: w.id,
              weight: w.weight_log,
              date: w.week_start,
              note: null,
            })))
          }
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
    if (!newWeight) return
    setSaving(true)
    setError('')
    try {
      const weight = parseFloat(newWeight)

      // Met à jour le poids actuel dans users
      await supabase
        .from('users')
        .update({ current_weight: weight })
        .eq('id', userId)

      // Enregistre dans stats_weekly
      const weekStart = new Date(date)
      weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1)
      const weekStr = weekStart.toISOString().split('T')[0]

      const { data: existing } = await supabase
        .from('stats_weekly')
        .select('id')
        .eq('user_id', userId)
        .eq('week_start', weekStr)
        .single()

      if (existing) {
        await supabase
          .from('stats_weekly')
          .update({ weight_log: weight })
          .eq('id', existing.id)
      } else {
        await supabase
          .from('stats_weekly')
          .insert({
            user_id: userId,
            week_start: weekStr,
            weight_log: weight,
            total_calories: 0,
            total_sessions: 0,
            avg_duration: 0,
          })
      }

      setCurrentWeight(String(weight))
      setLogs(prev => [{
        id: Date.now().toString(),
        weight,
        date,
        note: note || null,
      }, ...prev.filter(l => l.date !== date)])
      setNewWeight('')
      setNote('')
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'enregistrement')
    } finally {
      setSaving(false)
    }
  }

  const progress = weightGoal && currentWeight
    ? Math.max(0, Math.min(100,
        ((parseFloat(currentWeight) - weightGoal) /
        (parseFloat(currentWeight) - weightGoal + 1)) * 100
      ))
    : 0

  const kgRestant = weightGoal && currentWeight
    ? (parseFloat(currentWeight) - weightGoal).toFixed(1)
    : '--'

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
          <h1 className="text-[#1A1A1A] text-xl font-black">Suivi du poids</h1>
          <p className="text-[#9D99AD] text-xs">Ta progression vers l'objectif</p>
        </div>
      </div>

      <div className="px-5 flex flex-col gap-4">

        {/* CARDS POIDS */}
        <div className="flex gap-3">
          <div className="flex-1 bg-white rounded-2xl p-4 shadow-sm text-center">
            <p className="text-[#9D99AD] text-[10px] font-semibold tracking-wider mb-1">ACTUEL</p>
            <p className="text-[#1A1A1A] text-3xl font-black">
              {currentWeight || '--'}
              <span className="text-sm font-normal text-[#9D99AD]"> kg</span>
            </p>
          </div>
          <div className="flex-1 bg-[#FF6B00] rounded-2xl p-4 shadow-sm text-center">
            <p className="text-orange-200 text-[10px] font-semibold tracking-wider mb-1">OBJECTIF</p>
            <p className="text-white text-3xl font-black">
              {weightGoal || '--'}
              <span className="text-sm font-normal text-orange-200"> kg</span>
            </p>
          </div>
          <div className="flex-1 bg-[#1A1A1A] rounded-2xl p-4 shadow-sm text-center">
            <p className="text-[#9D99AD] text-[10px] font-semibold tracking-wider mb-1">RESTANT</p>
            <p className="text-[#FF6B00] text-3xl font-black">
              -{kgRestant}
              <span className="text-sm font-normal text-[#9D99AD]"> kg</span>
            </p>
          </div>
        </div>

        {/* BARRE PROGRESSION */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-bold text-[#1A1A1A]">Progression</span>
            <span className="text-sm font-bold text-[#FF6B00]">
              {logs.length > 1
                ? `${(logs[logs.length-1].weight - parseFloat(currentWeight)).toFixed(1)} kg perdu`
                : 'Commence à logger !'}
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-[#FF9A45] to-[#FF6B00] h-3 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-[#9D99AD]">{weightGoal} kg</span>
            <span className="text-[10px] text-[#9D99AD]">{currentWeight} kg</span>
          </div>
        </div>

        {/* FORMULAIRE AJOUT POIDS */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="text-[#1A1A1A] text-sm font-bold mb-3">⚖️ Enregistrer mon poids aujourd'hui</h2>

          {error && <div className="bg-red-50 text-red-600 text-sm rounded-xl p-3 mb-3">{error}</div>}
          {success && <div className="bg-green-50 text-green-600 text-sm rounded-xl p-3 mb-3">✓ Poids enregistré !</div>}

          <form onSubmit={handleSave} className="flex flex-col gap-3">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-[#1A1A1A] text-xs font-semibold mb-1 block">Poids (kg)</label>
                <input
                  type="number"
                  value={newWeight}
                  onChange={e => setNewWeight(e.target.value)}
                  placeholder={currentWeight || '74.5'}
                  step="0.1"
                  min="30"
                  max="300"
                  required
                  className="w-full border border-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#FF6B00] transition-colors font-bold"
                />
              </div>
              <div className="flex-1">
                <label className="text-[#1A1A1A] text-xs font-semibold mb-1 block">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full border border-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#FF6B00] transition-colors"
                />
              </div>
            </div>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Note (optionnel)"
              className="w-full border border-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#FF6B00] transition-colors"
            />
            <button type="submit" disabled={saving} className="btn-primary w-full disabled:opacity-60">
              {saving ? 'Enregistrement...' : '💾 Sauvegarder'}
            </button>
          </form>
        </div>

        {/* HISTORIQUE */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="text-[#1A1A1A] text-sm font-bold mb-3">📅 Historique</h2>
          {logs.length === 0 ? (
            <p className="text-[#9D99AD] text-sm text-center py-4">Aucune entrée encore — commence aujourd'hui !</p>
          ) : (
            <div className="flex flex-col gap-2">
              {logs.map((log, i) => (
                <div key={log.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                      i === 0 ? 'bg-[#FF6B00]' : 'bg-gray-100'
                    }`}>
                      {i === 0 ? '📍' : '⚖️'}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#1A1A1A]">{log.weight} kg</p>
                      <p className="text-xs text-[#9D99AD]">{log.date}</p>
                    </div>
                  </div>
                  {i < logs.length - 1 && (
                    <span className={`text-sm font-bold ${
                      log.weight < logs[i+1].weight ? 'text-green-500' : 'text-red-400'
                    }`}>
                      {log.weight < logs[i+1].weight ? '↓' : '↑'}
                      {Math.abs(log.weight - logs[i+1].weight).toFixed(1)} kg
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

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
          <span className="text-[10px] text-[#FF6B00] font-semibold">Poids</span>
        </Link>
        <Link href="/profile" className="flex-1 flex flex-col items-center gap-0.5">
          <span className="text-xl">👤</span>
          <span className="text-[10px] text-[#9D99AD]">Profil</span>
        </Link>
      </nav>

    </main>
  )
}
