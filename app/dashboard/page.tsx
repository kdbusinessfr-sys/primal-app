'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { signOut } from '@/lib/auth'

interface Profile {
  username: string
  current_weight: number | null
  weight_goal: number | null
}

interface Activity {
  id: string
  name: string
  type: string
  duration_min: number
  calories_burned: number
  date: string
}

const DAILY_GOAL = 700

const ACTIVITY_ICONS: Record<string, string> = {
  course: '🏃',
  velo: '🚴',
  natation: '🏊',
  musculation: '💪',
  yoga: '🧘',
  marche: '🚶',
  autre: '⚡',
}

export default function DashboardPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [todayCalories, setTodayCalories] = useState(0)
  const [totalSessions, setTotalSessions] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!session) { router.push('/'); return }
        try {
          // Profil
          const { data: prof } = await supabase
            .from('users').select('*').eq('id', session.user.id).single()
          setProfile(prof)

          // Activités
          const { data: acts } = await supabase
            .from('activities').select('*')
            .eq('user_id', session.user.id)
            .order('date', { ascending: false })
            .limit(5)
          setActivities(acts || [])

          // Calories du jour
          const today = new Date().toISOString().split('T')[0]
          const { data: todayActs } = await supabase
            .from('activities').select('calories_burned')
            .eq('user_id', session.user.id).eq('date', today)
          const totalCal = (todayActs || []).reduce(
            (sum: number, a: any) => sum + a.calories_burned, 0
          )
          setTodayCalories(totalCal)

          // Total séances
          const { count } = await supabase
            .from('activities').select('*', { count: 'exact', head: true })
            .eq('user_id', session.user.id)
          setTotalSessions(count || 0)

        } catch (e) {
          console.error(e)
        } finally {
          setLoading(false)
        }
      }
    )
    return () => subscription.unsubscribe()
  }, [router])

  const progress = Math.min((todayCalories / DAILY_GOAL) * 100, 100)
  const circumference = 2 * Math.PI * 100
  const strokeDash = (progress / 100) * circumference
  const kgRestant = profile?.current_weight && profile?.weight_goal
    ? (profile.current_weight - profile.weight_goal).toFixed(1)
    : '--'

  const getMascotMessage = () => {
    if (todayCalories === 0) return "Enregistre ta première activité aujourd'hui ! 🦂"
    if (progress < 50) return `Tu es à ${DAILY_GOAL - todayCalories} cal de ton objectif !`
    if (progress < 100) return "Presque là ! Continue warrior 💪"
    return "Objectif du jour atteint ! Tu déchires 🔥"
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#F5F5F5]">
        <div className="flex flex-col items-center gap-4">
          <Image src="/mascot.svg" alt="Primal" width={80} height={80} className="animate-pulse" />
          <p className="text-[#9D99AD] text-sm font-medium tracking-widest">CHARGEMENT...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#F5F5F5] pb-24">

      {/* HEADER */}
      <div className="flex items-center justify-between px-5 pt-5 pb-2">
        <div className="flex items-center gap-3">
          <Image src="/mascot.svg" alt="Primal" width={36} height={36} />
          <div>
            <p className="text-[#9D99AD] text-[10px] tracking-[2px]">BIENVENUE</p>
            <h1 className="text-[#1A1A1A] text-lg font-black">{profile?.username || 'Warrior'}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-[#1A1A1A] px-3 py-1.5 rounded-full">
            <span className="text-sm">🔥</span>
            <span className="text-[#FF6B00] font-bold text-sm">{totalSessions}</span>
          </div>
          <button onClick={async () => { await signOut(); router.push('/') }}
            className="text-[#9D99AD] text-xs font-medium">
            Déconnexion
          </button>
        </div>
      </div>

      {/* COMPTEUR CIRCULAIRE */}
      <div className="flex flex-col items-center px-5 pt-4 pb-2">
        <div className="relative w-60 h-60">
          <svg width="240" height="240" viewBox="0 0 240 240">
            <circle cx="120" cy="120" r="100" fill="none" stroke="#E8E8E8" strokeWidth="14"/>
            <circle cx="120" cy="120" r="100" fill="none"
              stroke="url(#grad)" strokeWidth="14"
              strokeDasharray={`${strokeDash} ${circumference}`}
              strokeDashoffset={circumference * 0.25}
              strokeLinecap="round"
              transform="rotate(-90 120 120)"
            />
            <defs>
              <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FF9A45"/>
                <stop offset="100%" stopColor="#FF6B00"/>
              </linearGradient>
            </defs>
            <text x="120" y="16" textAnchor="middle" fontSize="9" fill="#9D99AD">{DAILY_GOAL}</text>
            <text x="236" y="124" textAnchor="end" fontSize="9" fill="#9D99AD">{DAILY_GOAL/2}</text>
            <text x="4" y="124" textAnchor="start" fontSize="9" fill="#9D99AD">{DAILY_GOAL/4}</text>
          </svg>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
            <div className="text-5xl font-black text-[#1A1A1A] leading-none">{todayCalories}</div>
            <div className="text-xs text-[#9D99AD] mt-1">calories brûlées</div>
            <div className="mt-2">
              <span className="text-[10px] bg-[#FF6B00] text-white px-3 py-1 rounded-full font-semibold">
                OBJECTIF {DAILY_GOAL}
              </span>
            </div>
          </div>
        </div>

        {/* BOUTON CTA */}
        <Link href="/activities/add" className="w-full max-w-xs mt-2">
          <button className="btn-primary w-full text-base shadow-lg shadow-orange-200">
            + Ajouter une activité
          </button>
        </Link>
      </div>

      {/* STATS */}
      <div className="flex gap-3 px-5 mt-3">
        <div className="flex-1 bg-white rounded-2xl p-3 text-center shadow-sm">
          <div className="text-lg mb-1">⚡</div>
          <div className="text-lg font-black text-[#1A1A1A]">{totalSessions}</div>
          <div className="text-[10px] text-[#9D99AD] font-semibold tracking-wider">SÉANCES</div>
        </div>
        <div className="flex-1 bg-[#1A1A1A] rounded-2xl p-3 text-center">
          <div className="text-lg mb-1">⚖️</div>
          <div className="text-lg font-black text-[#FF6B00]">{profile?.current_weight || '--'}</div>
          <div className="text-[10px] text-[#9D99AD] font-semibold tracking-wider">KG ACTUEL</div>
        </div>
        <div className="flex-1 bg-white rounded-2xl p-3 text-center shadow-sm">
          <div className="text-lg mb-1">🎯</div>
          <div className="text-lg font-black text-[#1A1A1A]">{kgRestant}</div>
          <div className="text-[10px] text-[#9D99AD] font-semibold tracking-wider">KG RESTANT</div>
        </div>
      </div>

      {/* ACTIVITÉS RÉCENTES */}
      <div className="px-5 mt-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-bold text-[#1A1A1A]">Activités récentes</span>
            <Link href="/activities" className="text-[11px] text-[#FF6B00] font-semibold">Voir tout</Link>
          </div>
          {activities.length === 0 ? (
            <p className="text-[#9D99AD] text-sm text-center py-4">Aucune activité encore 💪</p>
          ) : (
            <div className="flex flex-col gap-3">
              {activities.map(a => (
                <div key={a.id} className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#FF6B00] rounded-xl flex items-center justify-center text-lg">
                    {ACTIVITY_ICONS[a.type] || '⚡'}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-[#1A1A1A]">{a.name}</div>
                    <div className="text-xs text-[#9D99AD]">{a.duration_min} min · {a.calories_burned} cal</div>
                  </div>
                  <div className="text-[11px] text-[#9D99AD]">
                    {a.date === new Date().toISOString().split('T')[0] ? "Aujourd'hui" : a.date}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MASCOTTE MOTIVATIONNELLE */}
      <div className="px-5 mt-4">
        <div className="bg-[#1A1A1A] rounded-2xl p-4 flex items-center gap-3">
          <span className="text-3xl">🦂</span>
          <div>
            <div className="text-sm font-bold text-white">{getMascotMessage()}</div>
            <div className="text-xs text-[#9D99AD] mt-0.5">PRIMAL · Feel The Sting</div>
          </div>
        </div>
      </div>

      {/* BOTTOM NAV */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex py-2 pb-4 z-50">
        <Link href="/dashboard" className="flex-1 flex flex-col items-center gap-0.5">
          <span className="text-xl">🏠</span>
          <span className="text-[10px] text-[#FF6B00] font-semibold">Accueil</span>
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
          <span className="text-[10px] text-[#9D99AD]">Profil</span>
        </Link>
      </nav>

    </main>
  )
}
