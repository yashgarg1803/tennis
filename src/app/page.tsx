'use client'

import Link from 'next/link'
import { Shield, Users, Trophy, Zap, Target, Gamepad2, User } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export default function Home() {
  const { user, loading } = useAuth()

  // Debug logging
  console.log('Home page - User:', user)
  console.log('Home page - Loading:', loading)

  return (
    <div>
      {/* Navigation */}
      <nav className="nav">
        <div className="nav-container">
          <Link href="/" className="nav-brand">
            <Shield />
            <span>Sequential Blotto</span>
          </Link>
          <div className="nav-links">
            {!loading && (
              <>
                {user ? (
                  <Link href="/profile" className="btn btn-ghost">
                    <User />
                    Profile
                  </Link>
                ) : (
                  <Link href="/auth" className="btn btn-ghost">
                    Sign In
                  </Link>
                )}
                <Link href="/play" className="btn btn-primary">
                  Play Now
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <h1>Strategic Warfare</h1>
          <p>
            Deploy your troops strategically in this modern variant of the classic Blotto game. 
            Outthink your opponent and claim victory on the battlefield.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/play" className="btn btn-primary btn-lg">
              <Gamepad2 />
              Play Now
            </Link>
            {!user && (
              <Link href="/auth" className="btn btn-outline btn-lg">
                <Users />
                Create Account
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Game Rules */}
      <section className="container py-20">
        <div>
          <h2 className="text-3xl font-bold text-center mb-12">
            How to Play
          </h2>
          <div className="grid grid-cols-3 gap-6">
            <div className="card">
              <div className="card-header">
                <div style={{ width: '48px', height: '48px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                  <Target />
                </div>
                <h3 className="card-title">Deploy Troops</h3>
                <p className="card-description">
                  Each round, decide how many troops to send into battle. Choose wisely - 
                  you can send any number, including zero.
                </p>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <div style={{ width: '48px', height: '48px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                  <Trophy />
                </div>
                <h3 className="card-title">Win Battles</h3>
                <p className="card-description">
                  Whoever sends more troops wins the round. If tied, it&apos;s a draw. 
                  Win 3 more rounds than your opponent to claim victory.
                </p>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <div style={{ width: '48px', height: '48px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                  <Zap />
                </div>
                <h3 className="card-title">Manage Resources</h3>
                <p className="card-description">
                  Troops used in each round are permanently lost. When you reach zero troops, 
                  you can&apos;t deploy anymore, but you might still win!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Game Modes */}
      <section className="container py-20">
        <div>
          <h2 className="text-3xl font-bold text-center mb-12">
            Choose Your Battle
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">
                  <Gamepad2 />
                  Single Player
                </h3>
                <p className="card-description">
                  Practice against our AI opponent. Perfect for learning the game mechanics 
                  and developing your strategy.
                </p>
              </div>
              <div className="card-content">
                <Link href="/play/single" className="btn btn-primary" style={{ width: '100%' }}>
                  Play vs AI
                </Link>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="card-title">
                  <Users />
                  Multiplayer
                </h3>
                <p className="card-description">
                  Challenge friends or play with random opponents. Create private rooms 
                  or join existing games.
                </p>
              </div>
              <div className="card-content">
                <Link href="/play/multiplayer" className="btn btn-primary" style={{ width: '100%' }}>
                  Play vs Players
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border)', background: 'rgba(26, 26, 26, 0.95)' }}>
        <div className="container py-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Shield />
              <span className="font-semibold">Sequential Blotto</span>
            </div>
            <div className="text-sm text-secondary">
              © 2024 Sequential Blotto. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
