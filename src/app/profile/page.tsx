'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getUserStats, getRecentGames, GameRecord, UserStats } from '@/lib/supabase'
import { Trophy, Target, Shield, Clock, TrendingUp, Activity, LogOut, Home } from 'lucide-react'
import Link from 'next/link'

export default function ProfilePage() {
  const { user, signOut } = useAuth()
  const [stats, setStats] = useState<UserStats | null>(null)
  const [recentGames, setRecentGames] = useState<GameRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      loadUserData()
    }
  }, [user])

  const loadUserData = async () => {
    if (!user) return
    
    setLoading(true)
    setError(null)
    
    try {
      // Load user stats and recent games in parallel
      const [statsData, gamesData] = await Promise.all([
        getUserStats(user.id),
        getRecentGames(user.id, 5)
      ])
      
      setStats(statsData)
      setRecentGames(gamesData)
    } catch (err) {
      console.error('Error loading user data:', err)
      setError('Failed to load profile data')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getGameResult = (game: GameRecord) => {
    if (!user) return 'Unknown'
    
    if (game.player1_id === user.id) {
      return game.winner === 'player1' ? 'Victory' : game.winner === 'player2' ? 'Defeat' : 'Tie'
    } else {
      return game.winner === 'player2' ? 'Victory' : game.winner === 'player1' ? 'Defeat' : 'Tie'
    }
  }

  const getOpponentName = (game: GameRecord) => {
    if (!user) return 'Unknown'
    
    // For single-player games, show "AI Opponent"
    if (game.game_type === 'single') {
      return 'AI Opponent'
    }
    
    // For multiplayer games, show the other player's name
    return game.player1_id === user.id ? game.player2_name : game.player1_name
  }

  const getResultColor = (result: string) => {
    switch (result) {
      case 'Victory': return '#10b981'
      case 'Defeat': return '#ef4444'
      default: return '#6b7280'
    }
  }

  if (!user) {
    return (
      <div className="container py-20">
        <div style={{ maxWidth: '32rem', margin: '0 auto', textAlign: 'center' }}>
          <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
          <p className="text-secondary mb-8">You need to be signed in to view your profile.</p>
          <Link href="/auth" className="btn btn-primary">
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container py-20">
        <div style={{ maxWidth: '32rem', margin: '0 auto', textAlign: 'center' }}>
          <div className="loading-spinner" style={{ margin: '0 auto 1rem' }}></div>
          <p>Loading your profile...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container py-20">
        <div style={{ maxWidth: '32rem', margin: '0 auto', textAlign: 'center' }}>
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p className="text-secondary mb-8">{error}</p>
          <button onClick={loadUserData} className="btn btn-primary">
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div style={{ maxWidth: '64rem', margin: '0 auto' }}>
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <Link href="/" className="btn btn-ghost btn-sm">
            <Home />
            Home
          </Link>
          <h1 className="text-2xl font-bold">Your Profile</h1>
          <button onClick={signOut} className="btn btn-ghost btn-sm">
            <LogOut />
            Sign Out
          </button>
        </div>

        {/* User Info */}
        <div className="card mb-8">
          <div className="card-header">
            <h3 className="card-title">Player Information</h3>
          </div>
          <div className="card-content">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {user.user_metadata?.avatar_url && (
                <img 
                  src={user.user_metadata.avatar_url} 
                  alt="Profile" 
                  style={{ 
                    width: '64px', 
                    height: '64px', 
                    borderRadius: '50%',
                    objectFit: 'cover'
                  }} 
                />
              )}
              <div>
                <h4 className="font-bold text-lg">{user.user_metadata?.full_name || user.email}</h4>
                <p className="text-secondary">{user.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="card-content text-center">
              <div style={{ color: '#3b82f6', marginBottom: '0.5rem' }}>
                <Activity size={24} />
              </div>
              <div className="font-bold text-2xl">{stats?.games_played || 0}</div>
              <div className="text-sm text-secondary">Games Played</div>
            </div>
          </div>

          <div className="card">
            <div className="card-content text-center">
              <div style={{ color: '#10b981', marginBottom: '0.5rem' }}>
                <Trophy size={24} />
              </div>
              <div className="font-bold text-2xl">{stats?.games_won || 0}</div>
              <div className="text-sm text-secondary">Games Won</div>
            </div>
          </div>

          <div className="card">
            <div className="card-content text-center">
              <div style={{ color: '#f59e0b', marginBottom: '0.5rem' }}>
                <Target size={24} />
              </div>
              <div className="font-bold text-2xl">{stats?.total_rounds_won || 0}</div>
              <div className="text-sm text-secondary">Rounds Won</div>
            </div>
          </div>

          <div className="card">
            <div className="card-content text-center">
              <div style={{ color: '#8b5cf6', marginBottom: '0.5rem' }}>
                <Shield size={24} />
              </div>
              <div className="font-bold text-2xl">{stats?.total_troops_deployed || 0}</div>
              <div className="text-sm text-secondary">Troops Deployed</div>
            </div>
          </div>
        </div>

        {/* Win Rate */}
        {stats && stats.games_played > 0 && (
          <div className="card mb-8">
            <div className="card-header">
              <h3 className="card-title">
                <TrendingUp />
                Performance
              </h3>
            </div>
            <div className="card-content">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <div className="flex justify-between mb-2">
                    <span>Win Rate</span>
                    <span className="font-bold">
                      {Math.round((stats.games_won / stats.games_played) * 100)}%
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ 
                        width: `${(stats.games_won / stats.games_played) * 100}%`,
                        backgroundColor: '#10b981'
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Games */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Clock />
              Recent Games
            </h3>
          </div>
          <div className="card-content">
            {recentGames.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <p className="text-secondary mb-4">No games played yet</p>
                <Link href="/play" className="btn btn-primary">
                  Play Your First Game
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {recentGames.map((game) => {
                  const result = getGameResult(game)
                  const opponent = getOpponentName(game)
                  
                  return (
                    <Link 
                      key={game.id} 
                      href={`/profile/game/${game.id}`}
                      className="game-item"
                      style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">vs {opponent}</div>
                          <div className="text-sm text-secondary">
                            {game.starting_troops} troops • {formatDate(game.created_at)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div 
                            className="font-bold"
                            style={{ color: getResultColor(result) }}
                          >
                            {result}
                          </div>
                          <div className="text-sm text-secondary">
                            {game.rounds?.length || 0} rounds
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 