'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

// Calories brûlées par minute selon l'activité (moyenne 75kg)
const ACTIVITY_TYPES = [
  { id: 'course',       label: 'Course à pied', icon: '🏃', cal_per_min: 10 },
  { id: 'velo',         label: 'Vélo',          icon: '🚴', cal_per_min: 8  },
  { id: 'natation',     label: 'Natation',      icon: '🏊', cal_per_min: 9  },
  { id: 'musculation',  label: 'Musculation',   icon: '💪', cal_per_min: 6  },
  { id: 'yoga',         label: 'Yoga',          icon: '🧘', cal_per_min: 4  },
  { id: 'marche',       label: 'Marche',        icon: '🚶', cal_per_min: 5  },
  { id: 'hiit',         label: 'HIIT',          icon: '🔥', cal_per_min: 12 },
  { id: 'football',     label: 'Football',      icon: '⚽', cal_per_min: 9  },
  { id: 'basketball',   label: 'Basketball',    icon: '🏀', cal_per_min: 8  },
  { id: 'autre',        label: 'Autre',         icon: '⚡', cal_per_min: 6  },
]

export default function AddActivityPage() {
  const router = useRouter()
  const [selectedType, setSelectedType] = useState('')
  const [name, setName] = useState('')
  const [duration, setDuration] = useState('')
  const [calories, setCalories] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleTypeSelect(typeId: string) {
    setSelectedType(typeId)
    const type = ACTIVITY_TYPES.find(t => t.id === typeId)
    if (type && duration) {
      setCalories(String(Math.round(type.cal_per_min * parseInt(duration))))
    }
    const type2 = ACTIVITY_TYPES.find(t => t.id === typeId)
    if (type2) setName(type2.label)
  }

  function handleDurationChange(val: string) {
    setDuration(val)
    const type = ACTIVITY_TYPES.find(t => t.id === selectedType)
    if (type && val) {
      setCalories(String(Math.round(type.cal_per_min * parseInt(val))))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedType) { setError('Choisis un type d\'activité'); return }
    setLoading(true)
    setError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/'); return }

      const { error: insertError } = await supabase
        .from('activities')
        .insert({
          user_id: session.user.id,
          type: selectedType,
          name: name || ACTIVITY_TYPES.find(t => t.id === selectedType)?.label || 'Activité',
          duration_min: parseInt(duration),
          calories_burned: parseInt(calories) || 0,
          date,
          notes: notes || null,
        })

      if (insertError) throw insertError
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'enregistrement')
    } finally {
      setLoading(false)
    }
  }

  const selectedTypeData = ACTIVITY_TYPES.find(t => t.id === selectedType)

  return (
    <main className="min-h-screen bg-[#F5F5F5] pb-24">

      {/* HEADER */}
      <div className="flex items-center gap-4 px-5 pt-5 pb-4">
        <Link href="/dashboard">
          <button className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-lg">
            ←
          </button>
        </Link>
        <div>
          <h1 className="text-[#1A1A1A] text-xl font-black">Nouvelle activité</h1>
          <p className="text-[#9D99AD] text-xs">Enregistre ta séance</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-5 flex flex-col gap-5">

        {error && (
          <div className="bg-red-50 text-red-600 text-sm rounded-xl p-3">{error}</div>
        )}

        {/* TYPE D'ACTIVITÉ */}
        <div>
          <label className="text-[#1A1A1A] text-sm font-bold mb-3 block">Type d'activité</label>
          <div className="grid grid-cols-5 gap-2">
            {ACTIVITY_TYPES.map(type => (
              <button
                key={type.id}
                type="button"
                onClick={() => handleTypeSelect(type.id)}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${
                  selectedType === type.id
                    ? 'border-[#FF6B00] bg-[#FF6B00] bg-opacity-10'
                    : 'border-gray-100 bg-white'
                }`}
              >
                <span className="text-xl">{type.icon}</span>
                <span className={`text-[9px] font-semibold text-center leading-tight ${
                  selectedType === type.id ? 'text-[#FF6B00]' : 'text-[#9D99AD]'
                }`}>{type.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* NOM PERSONNALISÉ */}
        <div>
          <label className="text-[#1A1A1A] text-sm font-bold mb-2 block">Nom de la séance</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={selectedTypeData?.label || 'Ex: Course matinale'}
            className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#FF6B00] transition-colors"
          />
        </div>

        {/* DURÉE + CALORIES */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-[#1A1A1A] text-sm font-bold mb-2 block">Durée (min)</label>
            <input
              type="number"
              value={duration}
              onChange={e => handleDurationChange(e.target.value)}
              placeholder="30"
              required
              min="1"
              max="600"
              className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#FF6B00] transition-colors"
            />
          </div>
          <div className="flex-1">
            <label className="text-[#1A1A1A] text-sm font-bold mb-2 block">
              Calories 🔥
              <span className="text-[10px] text-[#9D99AD] font-normal ml-1">(auto)</span>
            </label>
            <input
              type="number"
              value={calories}
              onChange={e => setCalories(e.target.value)}
              placeholder="300"
              required
              min="0"
              className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#FF6B00] transition-colors font-bold text-[#FF6B00]"
            />
          </div>
        </div>

        {/* DATE */}
        <div>
          <label className="text-[#1A1A1A] text-sm font-bold mb-2 block">Date</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            required
            className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#FF6B00] transition-colors"
          />
        </div>

        {/* NOTES */}
        <div>
          <label className="text-[#1A1A1A] text-sm font-bold mb-2 block">
            Notes <span className="text-[#9D99AD] font-normal">(optionnel)</span>
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Comment s'est passée ta séance ?"
            rows={3}
            className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#FF6B00] transition-colors resize-none"
          />
        </div>

        {/* PREVIEW CALORIES */}
        {selectedType && duration && calories && (
          <div className="bg-[#1A1A1A] rounded-2xl p-4 flex items-center gap-3">
            <span className="text-3xl">{selectedTypeData?.icon}</span>
            <div>
              <div className="text-white font-bold text-sm">{name || selectedTypeData?.label}</div>
              <div className="text-[#FF6B00] font-black text-lg">{calories} cal <span className="text-[#9D99AD] text-xs font-normal">en {duration} min</span></div>
            </div>
          </div>
        )}

        {/* SUBMIT */}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full text-lg disabled:opacity-60"
        >
          {loading ? 'Enregistrement...' : '💪 Enregistrer la séance'}
        </button>

      </form>
    </main>
  )
}
