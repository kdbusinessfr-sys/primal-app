import Image from 'next/image'
import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#F5F5F5] px-6">

      {/* Halo orange derrière la mascotte */}
      <div className="relative flex items-center justify-center mb-8">
        <div className="absolute w-64 h-64 rounded-full bg-[#FF6B00] opacity-10 blur-3xl" />
        <Image
          src="/mascot.svg"
          alt="Mascotte Primal — scorpion"
          width={260}
          height={260}
          priority
        />
      </div>

      {/* Nom + tagline */}
      <h1 className="text-white text-6xl font-black tracking-tighter mb-2">
        PRIMAL
      </h1>
      <p className="text-[#FF6B00] text-sm font-semibold tracking-[0.3em] mb-12">
        FEEL THE STING
      </p>

      {/* Boutons */}
      <div className="flex flex-col gap-4 w-full max-w-xs">
        <Link href="/auth/signup">
          <button className="btn-primary w-full text-lg">
            Commencer
          </button>
        </Link>
        <Link href="/auth/login">
          <button className="btn-secondary w-full text-lg">
            Se connecter
          </button>
        </Link>
      </div>

      {/* Footer */}
      <p className="text-gray-600 text-xs mt-12 tracking-widest">
        primal.velops.fr
      </p>

    </main>
  )
}
