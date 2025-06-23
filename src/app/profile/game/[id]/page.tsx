'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getGameById, GameRecord } from '@/lib/supabase'
import { Shield, Target, ArrowLeft, Trophy, Clock } from 'lucide-react'
import Link from 'next/link'

export default function GameDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [game, setGame] = useState<GameRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id && typeof id === 'string') {
      loadGame()
    }
  }, [id])

  const loadGame = async () => {
    if (!id || typeof id !== 'string') return
    
    setLoading(true)
    setError(null)
    
    try {
      const gameData = await getGameById(id)
      if (gameData) {
        setGame(gameData)
      } else {
        setError('Game not found')
      }
    } catch (err) {
      console.error('Error loading game:', err)
      setError('Failed to load game')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
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
    
    if (game.game_type === 'single') {
      return 'AI Opponent'
    }
    
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
          <p className="text-secondary mb-8">You need to be signed in to view game details.</p>
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
          <p>Loading game details...</p>
        </div>
      </div>
    )
  }

  if (error || !game) {
    return (
      <div className="container py-20">
        <div style={{ maxWidth: '32rem', margin: '0 auto', textAlign: 'center' }}>
          <h1 className="text-2xl font-bold mb-4">Game Not Found</h1>
          <p className="text-secondary mb-8">{error || 'The requested game could not be found.'}</p>
          <Link href="/profile" className="btn btn-primary">
            Back to Profile
          </Link>
        </div>
      </div>
    )
  }

  const result = getGameResult(game)
  const opponent = getOpponentName(game)

  return (
    <div className="container py-8">
      <div style={{ maxWidth: '64rem', margin: '0 auto' }}>
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <Link href="/profile" className="btn btn-ghost btn-sm">
            <ArrowLeft />
            Back to Profile
          </Link>
          <h1 className="text-2xl font-bold">Game Details</h1>
          <div style={{ width: '80px' }}></div>
        </div>

        {/* Game Summary */}
        <div className="card mb-8">
          <div className="card-header">
            <h3 className="card-title">Game Summary</h3>
          </div>
          <div className="card-content">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="flex justify-between items-center">
                <span className="text-secondary">Opponent:</span>
                <span className="font-bold">{opponent}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-secondary">Starting Troops:</span>
                <span className="font-bold">{game.starting_troops} each</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-secondary">Result:</span>
                <span 
                  className="font-bold"
                  style={{ color: getResultColor(result) }}
                >
                  {result}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-secondary">Date:</span>
                <span className="font-bold">{formatDate(game.created_at)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-secondary">Duration:</span>
                <span className="font-bold">
                  {game.rounds?.length || 0} rounds
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Round-by-Round Battle Log */}
        {game.rounds && game.rounds.length > 0 && (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <Clock />
                Battle Log
              </h3>
              <p className="card-description">
                Round-by-round breakdown of the battle
              </p>
            </div>
            <div className="card-content">
              <div className="battle-history">
                {game.rounds.map((round: any, index: number) => (
                  <div key={index} className="battle-round">
                    <span className="font-medium">Round {round.roundNumber}</span>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Shield style={{ color: '#3b82f6' }} />
                        <span>{round.player1Troops} troops</span>
                      </div>
                      <span className="text-secondary">vs</span>
                      <div className="flex items-center gap-2">
                        <Target style={{ color: '#ef4444' }} />
                        <span>{round.player2Troops} troops</span>
                      </div>
                      {round.winner && (
                        <span className={`font-bold ${
                          round.winner === 'player1' ? 'round-result win' : 
                          round.winner === 'player2' ? 'round-result lose' : 'round-result tie'
                        }`}>
                          {round.winner === 'player1' ? 'You win' : 
                           round.winner === 'player2' ? (game.game_type === 'single' ? 'AI wins' : 'Opponent wins') : 'Tie'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Game Actions */}
        <div className="mt-8 flex justify-center gap-4">
          <Link href="/play/single" className="btn btn-primary btn-lg">
            <Trophy />
            Play Again
          </Link>
          <Link href="/profile" className="btn btn-outline btn-lg">
            <ArrowLeft />
            Back to Profile
          </Link>
        </div>
      </div>
    </div>
  )
} 