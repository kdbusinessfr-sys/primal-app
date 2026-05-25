'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts'
import { supabase } from '@/lib/supabase'

interface Activity {
  calories_burned: number
  duration_min: number
  date: string
  type: string
}

interface WeightLog {
  weight_log: number
  week_start: string
}

export default function StatsPage() {
  const router = useRouter()
  const [activities, setActivities] = useState<Activity[]>([])
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([])
  const [period, setPeriod] = useState<'7' | '30' | '90'>('7')
  const [loading, setLoading] = useState(true)
  const [totalCal, setTotalCal] = useState(0)
  const [totalSessions, setTotalSessions] = useState(0)
  const [avgDuration, setAvgDuration] = useState(0)
  const [bestDay, setBestDay] = useState(0)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!session) { router.push('/'); return }
        try {
          const since = new Date()
          since.setDate(since.getDate() - parseInt(period))
          const sinceStr = since.toISOString().split('T')[0]

          // Activités
          const { data: acts } = await supabase
            .from('activities')
            .select('calories_burned, duration_min, date, type')
            .eq('user_id', session.user.id)
            .gte('date', sinceStr)
            .order('date', { ascending: true })
          setActivities(acts || [])

          // Stats globales
          const total = (acts || []).reduce((s: number, a: any) => s + a.calories_burned, 0)
          const avgDur = acts?.length
            ? Math.round((acts || []).reduce((s: number, a: any) => s + a.duration_min, 0) / acts.length)
            : 0
          setTotalCal(total)
          setTotalSessions((acts || []).length)
          setAvgDuration(avgDur)

          // Meilleur jour
          const byDay: Record<string, number> = {}
          ;(acts || []).forEach((a: any) => {
            byDay[a.date] = (byDay[a.date] || 0) + a.calories_burned
          })
          setBestDay(Math.max(0, ...Object.values(byDay)))

          // Poids
          const { data: weights } = await supabase
            .from('stats_weekly')
            .select('weight_log, week_start')
            .eq('user_id', session.user.id)
            .not('weight_log', 'is', null)
            .order('week_start', { ascending: true })
            .limit(12)
          setWeightLogs(weights || [])

        } catch (e) {
          console.error(e)
        } finally {
          setLoading(false)
        }
      }
    )
    return () => subscription.unsubscribe()
  }, [router, period])

  // Données graphique calories par jour
  const calByDay = activities.reduce((acc: Record<string, number>, a) => {
    const d = a.date.slice(5) // MM-DD
    acc[d] = (acc[d] || 0) + a.calories_burned
    return acc
  }, {})
  const calChartData = Object.entries(calByDay).map(([date, cal]) => ({ date, cal }))

  // Données graphique poids
  const weightChartData = weightLogs.map(w => ({
    date: w.week_start.slice(5),
    poids: w.weight_log,
  }))

  // Données par type d'activité
  const byType = activities.reduce((acc: Record<string, number>, a) => {
    acc[a.type] = (acc[a.type] || 0) + 1
    return acc
  }, {})
  const typeData = Object.entries(byType)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)

  const ICONS: Record<string, string> = {
    course: '🏃', velo: '🚴', natation: '🏊', musculation: '💪',
    yoga: '🧘', marche: '🚶', hiit: '🔥', football: '⚽',
    basketball: '🏀', autre: '⚡',
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
          <h1 className="text-[#1A1A1A] text-xl font-black">Statistiques</h1>
          <p className="text-[#9D99AD] text-xs">Ta progression PRIMAL</p>
        </div>
      </div>

      <div className="px-5 flex flex-col gap-4">

        {/* FILTRE PÉRIODE */}
        <div className="flex gap-2 bg-white rounded-2xl p-1.5 shadow-sm">
          {(['7', '30', '90'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
                period === p
                  ? 'bg-[#FF6B00] text-white shadow-sm'
                  : 'text-[#9D99AD]'
              }`}
            >
              {p === '7' ? '7 jours' : p === '30' ? '30 jours' : '3 mois'}
            </button>
          ))}
        </div>

        {/* CARDS STATS GLOBALES */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#FF6B00] rounded-2xl p-4 shadow-sm">
            <p className="text-orange-200 text-[10px] font-semibold tracking-wider mb-1">CALORIES TOTALES</p>
            <p className="text-white text-3xl font-black">{totalCal.toLocaleString()}</p>
            <p className="text-orange-200 text-xs mt-1">kcal brûlées</p>
          </div>
          <div className="bg-[#1A1A1A] rounded-2xl p-4 shadow-sm">
            <p className="text-[#9D99AD] text-[10px] font-semibold tracking-wider mb-1">SÉANCES</p>
            <p className="text-white text-3xl font-black">{totalSessions}</p>
            <p className="text-[#9D99AD] text-xs mt-1">en {period} jours</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-[#9D99AD] text-[10px] font-semibold tracking-wider mb-1">DURÉE MOYENNE</p>
            <p className="text-[#1A1A1A] text-3xl font-black">{avgDuration}</p>
            <p className="text-[#9D99AD] text-xs mt-1">min par séance</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-[#9D99AD] text-[10px] font-semibold tracking-wider mb-1">MEILLEUR JOUR</p>
            <p className="text-[#FF6B00] text-3xl font-black">{bestDay}</p>
            <p className="text-[#9D99AD] text-xs mt-1">cal en 1 jour</p>
          </div>
        </div>

        {/* GRAPHIQUE CALORIES */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="text-[#1A1A1A] text-sm font-bold mb-4">🔥 Calories brûlées</h2>
          {calChartData.length === 0 ? (
            <p className="text-[#9D99AD] text-sm text-center py-8">Pas encore de données</p>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={calChartData}>
                <defs>
                  <linearGradient id="calGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF6B00" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#FF6B00" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9D99AD' }} tickLine={false}/>
                <YAxis tick={{ fontSize: 10, fill: '#9D99AD' }} tickLine={false} axisLine={false}/>
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(val: any) => [`${val} cal`, 'Calories']}
                />
                <Area type="monotone" dataKey="cal" stroke="#FF6B00" strokeWidth={2} fill="url(#calGrad)"/>
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* GRAPHIQUE POIDS */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="text-[#1A1A1A] text-sm font-bold mb-4">⚖️ Évolution du poids</h2>
          {weightChartData.length === 0 ? (
            <p className="text-[#9D99AD] text-sm text-center py-8">Enregistre ton poids pour voir l'évolution</p>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={weightChartData}>
                <defs>
                  <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1A1A1A" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#1A1A1A" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9D99AD' }} tickLine={false}/>
                <YAxis tick={{ fontSize: 10, fill: '#9D99AD' }} tickLine={false} axisLine={false} domain={['auto', 'auto']}/>
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(val: any) => [`${val} kg`, 'Poids']}
                />
                <Area type="monotone" dataKey="poids" stroke="#1A1A1A" strokeWidth={2} fill="url(#weightGrad)"/>
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* ACTIVITÉS PAR TYPE */}
        {typeData.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h2 className="text-[#1A1A1A] text-sm font-bold mb-4">⚡ Activités par type</h2>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={typeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                <XAxis dataKey="type" tick={{ fontSize: 10, fill: '#9D99AD' }} tickLine={false}/>
                <YAxis tick={{ fontSize: 10, fill: '#9D99AD' }} tickLine={false} axisLine={false}/>
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none' }}
                  formatter={(val: any) => [`${val} séance(s)`, '']}
                />
                <Bar dataKey="count" fill="#FF6B00" radius={[6, 6, 0, 0]}/>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 mt-3">
              {typeData.map(t => (
                <div key={t.type} className="flex items-center gap-1 bg-gray-50 rounded-lg px-3 py-1.5">
                  <span>{ICONS[t.type] || '⚡'}</span>
                  <span className="text-xs font-semibold text-[#1A1A1A]">{t.type}</span>
                  <span className="text-xs text-[#FF6B00] font-bold">×{t.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* BOTTOM NAV */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex py-2 pb-4 z-50">
        <Link href="/dashboard" className="flex-1 flex flex-col items-center gap-0.5">
          <span className="text-xl">🏠</span>
          <span className="text-[10px] text-[#9D99AD]">Accueil</span>
        </Link>
        <Link href="/stats" className="flex-1 flex flex-col items-center gap-0.5">
          <span className="text-xl">📊</span>
          <span className="text-[10px] text-[#FF6B00] font-semibold">Stats</span>
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
          <span className="text-[10px] text-[#9D99AD]">Profil</span>
        </Link>
      </nav>

    </main>
  )
}
