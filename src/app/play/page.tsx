import Link from 'next/link'
import { Gamepad2, Users, ArrowRight, Home } from 'lucide-react'

export default function PlayMenu() {
  return (
    <div className="container py-8">
      <div style={{ maxWidth: '64rem', margin: '0 auto' }}>
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <Link href="/" className="btn btn-ghost btn-sm">
            <Home />
            Home
          </Link>
          <h1 className="text-3xl font-bold">Choose Game Mode</h1>
          <div style={{ width: '80px' }}></div> {/* Spacer for centering */}
        </div>

        {/* Game Modes */}
        <div className="grid grid-cols-2 gap-8 mb-12">
          {/* Single Player */}
          <div className="card">
            <div className="card-header">
              <div style={{ width: '64px', height: '64px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <Gamepad2 />
              </div>
              <h3 className="card-title text-2xl">Single Player</h3>
              <p className="card-description">
                Practice against our AI opponent. Perfect for learning the game mechanics 
                and developing your strategy. No account required!
              </p>
            </div>
            <div className="card-content">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div className="flex items-center gap-2">
                    <div style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%' }}></div>
                    <span className="text-sm">Instant play - no waiting</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%' }}></div>
                    <span className="text-sm">Practice at your own pace</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%' }}></div>
                    <span className="text-sm">Learn advanced strategies</span>
                  </div>
                </div>
                <Link href="/play/single" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                  <Gamepad2 />
                  Play vs AI
                  <ArrowRight />
                </Link>
              </div>
            </div>
          </div>

          {/* Multiplayer */}
          <div className="card">
            <div className="card-header">
              <div style={{ width: '64px', height: '64px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <Users />
              </div>
              <h3 className="card-title text-2xl">Multiplayer</h3>
              <p className="card-description">
                Challenge friends or play with random opponents. Create private rooms 
                or join existing games. Real-time strategic battles!
              </p>
            </div>
            <div className="card-content">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div className="flex items-center gap-2">
                    <div style={{ width: '8px', height: '8px', background: '#3b82f6', borderRadius: '50%' }}></div>
                    <span className="text-sm">Real-time gameplay</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div style={{ width: '8px', height: '8px', background: '#3b82f6', borderRadius: '50%' }}></div>
                    <span className="text-sm">Private game rooms</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div style={{ width: '8px', height: '8px', background: '#3b82f6', borderRadius: '50%' }}></div>
                    <span className="text-sm">Match history & stats</span>
                  </div>
                </div>
                <Link href="/play/multiplayer" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                  <Users />
                  Play vs Players
                  <ArrowRight />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Start Info */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">How to Play</h3>
            <p className="card-description">
              Quick reminder of the game rules
            </p>
          </div>
          <div className="card-content">
            <div className="grid grid-cols-3 gap-4">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <h4 className="font-semibold">🎯 Deploy Troops</h4>
                <p className="text-secondary text-sm">
                  Each round, choose how many troops to send into battle. You can send any number, including zero.
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <h4 className="font-semibold">⚔️ Win Battles</h4>
                <p className="text-secondary text-sm">
                  Whoever sends more troops wins the round. Win 3 more rounds than your opponent to claim victory.
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <h4 className="font-semibold">💀 Manage Resources</h4>
                <p className="text-secondary text-sm">
                  Troops used in each round are permanently lost. When you reach zero troops, you can&apos;t deploy anymore.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 