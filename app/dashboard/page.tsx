'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { getCurrentUser, getUserProfile, signOut } from '@/lib/auth'

export default function DashboardPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadUser() {
      try {
        const user = await getCurrentUser()
        if (!user) {
          router.push('/')
          return
        }
        const userProfile = await getUserProfile(user.id)
        setProfile(userProfile)
      } catch {
        router.push('/')
      } finally {
        setLoading(false)
      }
    }
    loadUser()
  }, [router])

  async function handleSignOut() {
    await signOut()
    router.push('/')
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
    <main className="min-h-screen bg-[#F5F5F5] px-6 py-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Image src="/mascot.svg" alt="Primal" width={48} height={48} />
          <div>
            <p className="text-[#9D99AD] text-xs tracking-widest">BIENVENUE</p>
            <h1 className="text-[#1A1A1A] text-xl font-black tracking-tight">
              {profile?.username || 'Warrior'}
            </h1>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="text-[#9D99AD] text-sm font-medium"
        >
          Déconnexion
        </button>
      </div>

      {/* Cards stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-[#9D99AD] text-xs font-medium mb-1">POIDS ACTUEL</p>
          <p className="text-[#1A1A1A] text-2xl font-black">
            {profile?.current_weight || '--'}
            <span className="text-sm font-normal text-[#9D99AD]"> kg</span>
          </p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-[#9D99AD] text-xs font-medium mb-1">OBJECTIF</p>
          <p className="text-[#FF6B00] text-2xl font-black">
            {profile?.weight_goal || '--'}
            <span className="text-sm font-normal text-[#9D99AD]"> kg</span>
          </p>
        </div>
        <div className="bg-[#1A1A1A] rounded-2xl p-4 shadow-sm">
          <p className="text-[#9D99AD] text-xs font-medium mb-1">SÉANCES</p>
          <p className="text-white text-2xl font-black">0</p>
        </div>
        <div className="bg-[#FF6B00] rounded-2xl p-4 shadow-sm">
          <p className="text-orange-200 text-xs font-medium mb-1">CALORIES</p>
          <p className="text-white text-2xl font-black">0</p>
        </div>
      </div>

      {/* Mascotte motivationnelle */}
      <div className="bg-white rounded-2xl p-6 shadow-sm flex items-center gap-4 mb-6">
        <Image src="/mascot.svg" alt="Primal" width={64} height={64} />
        <div>
          <p className="text-[#1A1A1A] font-bold text-sm mb-1">Prêt à transiger ?</p>
          <p className="text-[#9D99AD] text-xs">
            Enregistre ta première activité et commence à sentir le dard 🦂
          </p>
        </div>
      </div>

      {/* Bouton ajouter activité */}
      <button className="btn-primary w-full text-lg">
        + Ajouter une activité
      </button>

    </main>
  )
}
