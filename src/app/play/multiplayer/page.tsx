'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Users, Plus, Link as LinkIcon, Home } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { createGameRoom, joinGameRoom, GameConfig, DEFAULT_GAME_CONFIG } from '@/lib/multiplayer'

export default function MultiplayerPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [roomCode, setRoomCode] = useState('')
  const [gameConfig, setGameConfig] = useState<GameConfig>(DEFAULT_GAME_CONFIG)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showJoinForm, setShowJoinForm] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleCreateRoom = async () => {
    if (!user) {
      setError('Please sign in to create a game room')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const room = await createGameRoom(
        user.id,
        user.user_metadata?.full_name || user.email || 'Player',
        gameConfig
      )
      
      // Navigate to the game room using room code instead of ID
      router.push(`/play/multiplayer/room/${room.roomCode}`)
    } catch (err) {
      console.error('Error creating room:', err)
      setError('Failed to create game room')
    } finally {
      setIsLoading(false)
    }
  }

  const handleJoinRoom = async () => {
    if (!user) {
      setError('Please sign in to join a game room')
      return
    }

    if (!roomCode.trim()) {
      setError('Please enter a room code')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const room = await joinGameRoom(
        roomCode.trim().toUpperCase(),
        user.id,
        user.user_metadata?.full_name || user.email || 'Player'
      )
      
      if (room) {
        router.push(`/play/multiplayer/room/${room.roomCode}`)
      } else {
        setError('Room not found or full')
      }
    } catch (err) {
      console.error('Error joining room:', err)
      setError('Failed to join game room')
    } finally {
      setIsLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container py-20 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-secondary">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div style={{ maxWidth: '64rem', margin: '0 auto' }}>
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <Link href="/play" className="btn btn-ghost btn-sm">
            <Home />
            Back to Menu
          </Link>
          <h1 className="text-2xl font-bold">Multiplayer</h1>
          <div style={{ width: '80px' }}></div>
        </div>

        {/* Authentication Check */}
        {!user && (
          <div className="card mb-8">
            <div className="card-header">
              <h3 className="card-title">Sign In Required</h3>
              <p className="card-description">
                You need to sign in to play multiplayer games
              </p>
            </div>
            <div className="card-content">
              <div className="flex gap-4">
                <Link href="/auth" className="btn btn-primary">
                  <Users />
                  Sign In
                </Link>
                <Link href="/play/single" className="btn btn-outline">
                  Play Single Player Instead
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="card mb-8" style={{ borderColor: '#ef4444' }}>
            <div className="card-content">
              <p style={{ color: '#ef4444' }}>{error}</p>
            </div>
          </div>
        )}

        {/* Game Options */}
        {user && (
          <div className="grid grid-cols-2 gap-8 mb-8">
            {/* Create Game */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">
                  <Plus />
                  Create Game
                </h3>
                <p className="card-description">
                  Start a new multiplayer game and invite friends
                </p>
              </div>
              <div className="card-content">
                {showCreateForm ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Game Configuration */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label className="text-sm font-medium">Starting Troops per Player</label>
                        <div className="flex items-center gap-4">
                          <input
                            type="range"
                            min="10"
                            max="500"
                            step="10"
                            value={gameConfig.startingTroops}
                            onChange={(e) => setGameConfig((prev: GameConfig) => ({ ...prev, startingTroops: Number(e.target.value) }))}
                            className="input-range"
                            style={{ flex: 1 }}
                          />
                          <span className="font-bold" style={{ minWidth: '60px' }}>{gameConfig.startingTroops}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button 
                        onClick={handleCreateRoom} 
                        className="btn btn-primary" 
                        style={{ flex: 1 }}
                        disabled={isLoading}
                      >
                        {isLoading ? 'Creating...' : 'Create Room'}
                      </button>
                      <button 
                        onClick={() => setShowCreateForm(false)} 
                        className="btn btn-outline"
                        disabled={isLoading}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setShowCreateForm(true)} className="btn btn-primary" style={{ width: '100%' }}>
                    Create Private Room
                  </button>
                )}
              </div>
            </div>

            {/* Join Game */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">
                  <LinkIcon />
                  Join Game
                </h3>
                <p className="card-description">
                  Join an existing game with a room code
                </p>
              </div>
              <div className="card-content">
                {showJoinForm ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label className="text-sm font-medium">Room Code</label>
                      <input
                        type="text"
                        placeholder="Enter room code (e.g., ABC123)"
                        value={roomCode}
                        onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                        className="input"
                        style={{ textTransform: 'uppercase' }}
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <button 
                        onClick={handleJoinRoom} 
                        className="btn btn-primary" 
                        style={{ flex: 1 }}
                        disabled={isLoading}
                      >
                        {isLoading ? 'Joining...' : 'Join Room'}
                      </button>
                      <button 
                        onClick={() => setShowJoinForm(false)} 
                        className="btn btn-outline"
                        disabled={isLoading}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setShowJoinForm(true)} className="btn btn-primary" style={{ width: '100%' }}>
                    Join with Code
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* How Multiplayer Works */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">How Multiplayer Works</h3>
            <p className="card-description">
              Learn how to play with friends
            </p>
          </div>
          <div className="card-content">
            <div className="grid grid-cols-3 gap-4">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <h4 className="font-semibold">1. Create a Room</h4>
                <p className="text-secondary text-sm">
                  Start a new game and get a unique room code to share with friends.
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <h4 className="font-semibold">2. Share the Code</h4>
                <p className="text-secondary text-sm">
                  Send the room code to your friends so they can join your game.
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <h4 className="font-semibold">3. Play Together</h4>
                <p className="text-secondary text-sm">
                  Once everyone joins, the game starts automatically and you can play in real-time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 