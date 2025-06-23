'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Shield, Trophy, Target, ArrowRight, RotateCcw, Home, Copy, Check, Users, Clock } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { getRoom, makeMove, startGame, leaveRoom, GameRoom, joinGameRoom, getRoomByCode, refreshGameState, isPlayerTurn, getRoundStatus } from '@/lib/multiplayer'

export default function MultiplayerRoom() {
  const params = useParams()
  const router = useRouter()
  const { user, loading } = useAuth()
  const [room, setRoom] = useState<GameRoom | null>(null)
  const [playerTroops, setPlayerTroops] = useState<number>(0)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const [isMyTurn, setIsMyTurn] = useState(false)
  const [roundStatus, setRoundStatus] = useState<{
    currentRound: number
    roundStatus: string
    player1Moved: boolean
    player2Moved: boolean
  } | null>(null)

  const roomCode = params.id as string

  useEffect(() => {
    if (loading || !user) return

    const fetchRoom = async () => {
      try {
        // Try to get room by code first
        let fetchedRoom = await getRoomByCode(roomCode)
        
        if (!fetchedRoom) {
          // If room doesn't exist, try to join it
          fetchedRoom = await joinGameRoom(roomCode, user.id, user.user_metadata?.full_name || user.email || 'Unknown Player')
          
          if (!fetchedRoom) {
            setError('Room not found or could not join')
            return
          }
        }

        setRoom(fetchedRoom)

        // If game is playing, check turn status
        if (fetchedRoom.status === 'playing') {
          const turnStatus = await isPlayerTurn(fetchedRoom.id, user.id)
          setIsMyTurn(turnStatus)
          
          const roundInfo = await getRoundStatus(fetchedRoom.id)
          setRoundStatus(roundInfo)
        }
      } catch (err) {
        console.error('Error fetching room:', err)
        setError('Failed to load room')
      }
    }

    fetchRoom()
    
    // Poll for room updates
    const interval = setInterval(fetchRoom, 2000)
    return () => clearInterval(interval)
  }, [roomCode, user, loading, router])

  const handleStartGame = async () => {
    if (!room) return
    
    try {
      const success = await startGame(room.id)
      if (success) {
        const updatedRoom = await getRoomByCode(roomCode)
        setRoom(updatedRoom)
      }
    } catch (err) {
      console.error('Error starting game:', err)
      setError('Failed to start game')
    }
  }

  const handleDeploy = async () => {
    if (!room || !user || !isMyTurn) return

    try {
      const success = await makeMove(room.id, {
        roomId: room.id,
        playerId: user.id,
        roundNumber: room.currentRound,
        troops: playerTroops,
        timestamp: new Date().toISOString()
      })

      if (success) {
        setPlayerTroops(0)
        setIsMyTurn(false)
        const updatedRoom = await getRoomByCode(roomCode)
        setRoom(updatedRoom)
      }
    } catch (err) {
      console.error('Error making move:', err)
      setError('Failed to make move')
    }
  }

  const handleLeaveRoom = async () => {
    if (room && user) {
      try {
        await leaveRoom(room.id, user.id)
      } catch (err) {
        console.error('Error leaving room:', err)
      }
    }
    router.push('/play/multiplayer')
  }

  const copyRoomCode = () => {
    if (room) {
      navigator.clipboard.writeText(room.roomCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) {
    return (
      <div className="container py-20 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-secondary">Loading room...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container py-20">
        <div style={{ maxWidth: '32rem', margin: '0 auto' }}>
          <div className="card" style={{ borderColor: '#ef4444' }}>
            <div className="card-header">
              <h3 className="card-title" style={{ color: '#ef4444' }}>Error</h3>
              <p className="card-description">{error}</p>
            </div>
            <div className="card-content">
              <Link href="/play/multiplayer" className="btn btn-primary">
                Back to Multiplayer
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!room) {
    return (
      <div className="container py-20 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-secondary">Loading room...</p>
        </div>
      </div>
    )
  }

  const isHost = room.player1?.id === user?.id
  const isPlayer2 = room.player2?.id === user?.id
  const gameState = room.gameState
  const isGameFinished = room.status === 'finished'

  return (
    <div className="container py-8">
      <div style={{ maxWidth: '64rem', margin: '0 auto' }}>
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <Link href="/play/multiplayer" className="btn btn-ghost btn-sm">
            <Home />
            Back to Multiplayer
          </Link>
          <div className="text-center">
            <h1 className="text-2xl font-bold">Game Room</h1>
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="text-secondary">Room Code:</span>
              <span style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '1.125rem' }}>{room.roomCode}</span>
              <button onClick={copyRoomCode} className="btn btn-ghost btn-sm">
                {copied ? <Check /> : <Copy />}
              </button>
            </div>
          </div>
          <button onClick={handleLeaveRoom} className="btn btn-ghost btn-sm">
            Leave Room
          </button>
        </div>

        {/* Waiting Room */}
        {room.status === 'waiting' && (
          <div className="card mb-8">
            <div className="card-header">
              <h3 className="card-title">Waiting for Players</h3>
              <p className="card-description">
                Share the room code with a friend to start playing
              </p>
            </div>
            <div className="card-content">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3" style={{ background: 'rgba(55, 65, 81, 0.3)', borderRadius: '8px' }}>
                    <Users style={{ color: '#3b82f6' }} />
                    <div>
                      <p className="font-medium">{room.player1?.name || 'Waiting...'}</p>
                      <p className="text-sm text-secondary">Player 1</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3" style={{ background: 'rgba(55, 65, 81, 0.3)', borderRadius: '8px' }}>
                    <Users style={{ color: '#3b82f6' }} />
                    <div>
                      <p className="font-medium">{room.player2?.name || 'Waiting...'}</p>
                      <p className="text-sm text-secondary">Player 2</p>
                    </div>
                  </div>
                </div>
                
                {isHost && room.player2 && (
                  <button onClick={handleStartGame} className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                    <ArrowRight />
                    Start Game
                  </button>
                )}
                
                {!room.player2 && (
                  <p className="text-center text-secondary">
                    Waiting for a second player to join...
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Game in Progress */}
        {room.status === 'playing' && gameState && (
          <>
            {/* Game Status */}
            <div className="card mb-6">
              <div className="card-header">
                <h3 className="card-title text-center">
                  {isGameFinished 
                    ? gameState.winner === 'player1' 
                      ? '🎉 Player 1 Wins! 🎉' 
                      : '🎉 Player 2 Wins! 🎉'
                    : isMyTurn 
                      ? 'Your turn to deploy troops' 
                      : 'Waiting for opponent...'
                  }
                </h3>
                {!isGameFinished && roundStatus && (
                  <div className="text-center mt-2">
                    <div className="flex items-center justify-center gap-4 text-sm text-secondary">
                      <span>Round {roundStatus.currentRound}</span>
                      <div className="flex items-center gap-2">
                        <Clock size={16} />
                        <span>
                          {roundStatus.player1Moved && roundStatus.player2Moved 
                            ? 'Resolving round...' 
                            : roundStatus.player1Moved 
                              ? 'Player 1 moved, waiting for Player 2' 
                              : roundStatus.player2Moved 
                                ? 'Player 2 moved, waiting for Player 1' 
                                : 'Both players need to move'
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Player Stats */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              {/* Player 1 */}
              <div className={`card ${gameState.winner === 'player1' ? 'winner' : ''}`}>
                <div className="card-header">
                  <h3 className="card-title">
                    <Shield style={{ color: '#3b82f6' }} />
                    {gameState.player1.name}
                  </h3>
                </div>
                <div className="card-content">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div className="flex justify-between">
                      <span>Troops Remaining:</span>
                      <span className="font-bold">{gameState.player1.troops}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Round Wins:</span>
                      <span className="font-bold" style={{ color: '#10b981' }}>{gameState.player1.roundWins}</span>
                    </div>
                    {roundStatus && (
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <span className={`font-bold ${roundStatus.player1Moved ? 'text-green-500' : 'text-yellow-500'}`}>
                          {roundStatus.player1Moved ? '✓ Moved' : '⏳ Waiting'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Player 2 */}
              <div className={`card ${gameState.winner === 'player2' ? 'winner' : ''}`}>
                <div className="card-header">
                  <h3 className="card-title">
                    <Target style={{ color: '#ef4444' }} />
                    {gameState.player2.name}
                  </h3>
                </div>
                <div className="card-content">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div className="flex justify-between">
                      <span>Troops Remaining:</span>
                      <span className="font-bold">{gameState.player2.troops}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Round Wins:</span>
                      <span className="font-bold" style={{ color: '#10b981' }}>{gameState.player2.roundWins}</span>
                    </div>
                    {roundStatus && (
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <span className={`font-bold ${roundStatus.player2Moved ? 'text-green-500' : 'text-yellow-500'}`}>
                          {roundStatus.player2Moved ? '✓ Moved' : '⏳ Waiting'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Troop Deployment */}
            {!isGameFinished && isMyTurn && (
              <div className="card mb-8">
                <div className="card-header">
                  <h3 className="card-title">Deploy Your Troops</h3>
                  <p className="card-description">
                    Choose how many troops to send into battle this round
                  </p>
                </div>
                <div className="card-content">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="0"
                        max={gameState.player1.id === user?.id ? gameState.player1.troops : gameState.player2.troops}
                        value={playerTroops}
                        onChange={(e) => setPlayerTroops(Number(e.target.value))}
                        className="input-range"
                        style={{ flex: 1 }}
                      />
                      <span className="font-bold" style={{ minWidth: '60px' }}>{playerTroops}</span>
                    </div>
                    <div className="flex justify-between text-sm text-secondary">
                      <span>0 troops</span>
                      <span>{gameState.player1.id === user?.id ? gameState.player1.troops : gameState.player2.troops} troops</span>
                    </div>
                    <button 
                      onClick={handleDeploy} 
                      className="btn btn-primary"
                      style={{ width: '100%' }}
                      disabled={playerTroops < 0 || playerTroops > (gameState.player1.id === user?.id ? gameState.player1.troops : gameState.player2.troops)}
                    >
                      <ArrowRight />
                      Deploy {playerTroops} Troops
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Waiting for opponent */}
            {!isGameFinished && !isMyTurn && (
              <div className="card mb-8">
                <div className="card-header">
                  <h3 className="card-title text-center">
                    <Clock style={{ color: '#f59e0b' }} />
                    Waiting for Opponent
                  </h3>
                  <p className="card-description text-center">
                    Your opponent is making their move. The round will resolve once both players have deployed their troops.
                  </p>
                </div>
              </div>
            )}

            {/* Round History */}
            {gameState.rounds.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Battle History</h3>
                </div>
                <div className="card-content">
                  <div className="battle-history">
                    {gameState.rounds.map((round: any, index: number) => (
                      <div key={index} className="battle-round">
                        <span className="font-medium">Round {round.roundNumber}</span>
                        <div className="flex items-center gap-4">
                          <span style={{ color: '#3b82f6' }}>{round.player1Troops} troops</span>
                          <span className="text-secondary">vs</span>
                          <span style={{ color: '#ef4444' }}>{round.player2Troops} troops</span>
                          {round.winner && (
                            <span className={`font-bold ${
                              round.winner === 'player1' ? 'round-result win' : 
                              round.winner === 'player2' ? 'round-result lose' : 'round-result tie'
                            }`}>
                              {round.winner === 'player1' ? 'Player 1 wins' : 
                               round.winner === 'player2' ? 'Player 2 wins' : 'Tie'}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Game Over Actions */}
            {isGameFinished && (
              <div className="mt-8 flex justify-center gap-4">
                <Link href="/play/multiplayer" className="btn btn-primary btn-lg">
                  <RotateCcw />
                  Play Again
                </Link>
                <Link href="/play/multiplayer" className="btn btn-outline btn-lg">
                  <Home />
                  Back to Multiplayer
                </Link>
              </div>
            )}
          </>
        )}

        {/* Game Finished State */}
        {room.status === 'finished' && gameState && (
          <>
            {/* Game Result */}
            <div className="card mb-6">
              <div className="card-header">
                <h3 className="card-title text-center text-2xl">
                  {gameState.winner === 'player1' 
                    ? '🎉 Player 1 Wins! 🎉' 
                    : gameState.winner === 'player2'
                    ? '🎉 Player 2 Wins! 🎉'
                    : '🤝 Game Ended in a Tie! 🤝'
                  }
                </h3>
                <p className="card-description text-center">
                  The battle has concluded! Here are the final results.
                </p>
              </div>
            </div>

            {/* Final Player Stats */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              {/* Player 1 */}
              <div className={`card ${gameState.winner === 'player1' ? 'winner' : ''}`}>
                <div className="card-header">
                  <h3 className="card-title">
                    <Shield style={{ color: '#3b82f6' }} />
                    {gameState.player1.name}
                    {gameState.winner === 'player1' && <Trophy style={{ color: '#fbbf24', marginLeft: '8px' }} />}
                  </h3>
                </div>
                <div className="card-content">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div className="flex justify-between">
                      <span>Final Troops:</span>
                      <span className="font-bold">{gameState.player1.troops}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Round Wins:</span>
                      <span className="font-bold" style={{ color: '#10b981' }}>{gameState.player1.roundWins}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Result:</span>
                      <span className={`font-bold ${
                        gameState.winner === 'player1' ? 'text-green-500' : 
                        gameState.winner === 'player2' ? 'text-red-500' : 'text-yellow-500'
                      }`}>
                        {gameState.winner === 'player1' ? '🏆 Winner' : 
                         gameState.winner === 'player2' ? '❌ Defeated' : '🤝 Tie'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Player 2 */}
              <div className={`card ${gameState.winner === 'player2' ? 'winner' : ''}`}>
                <div className="card-header">
                  <h3 className="card-title">
                    <Target style={{ color: '#ef4444' }} />
                    {gameState.player2.name}
                    {gameState.winner === 'player2' && <Trophy style={{ color: '#fbbf24', marginLeft: '8px' }} />}
                  </h3>
                </div>
                <div className="card-content">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div className="flex justify-between">
                      <span>Final Troops:</span>
                      <span className="font-bold">{gameState.player2.troops}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Round Wins:</span>
                      <span className="font-bold" style={{ color: '#10b981' }}>{gameState.player2.roundWins}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Result:</span>
                      <span className={`font-bold ${
                        gameState.winner === 'player2' ? 'text-green-500' : 
                        gameState.winner === 'player1' ? 'text-red-500' : 'text-yellow-500'
                      }`}>
                        {gameState.winner === 'player2' ? '🏆 Winner' : 
                         gameState.winner === 'player1' ? '❌ Defeated' : '🤝 Tie'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Complete Battle History */}
            {gameState.rounds.length > 0 && (
              <div className="card mb-8">
                <div className="card-header">
                  <h3 className="card-title">Complete Battle History</h3>
                  <p className="card-description">Every round of the epic battle</p>
                </div>
                <div className="card-content">
                  <div className="battle-history">
                    {gameState.rounds.map((round: any, index: number) => (
                      <div key={index} className="battle-round">
                        <span className="font-medium">Round {round.roundNumber}</span>
                        <div className="flex items-center gap-4">
                          <span style={{ color: '#3b82f6' }}>{round.player1Troops} troops</span>
                          <span className="text-secondary">vs</span>
                          <span style={{ color: '#ef4444' }}>{round.player2Troops} troops</span>
                          {round.winner && (
                            <span className={`font-bold ${
                              round.winner === 'player1' ? 'round-result win' : 
                              round.winner === 'player2' ? 'round-result lose' : 'round-result tie'
                            }`}>
                              {round.winner === 'player1' ? 'Player 1 wins' : 
                               round.winner === 'player2' ? 'Player 2 wins' : 'Tie'}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Game Over Actions */}
            <div className="flex justify-center gap-4">
              <Link href="/play/multiplayer" className="btn btn-primary btn-lg">
                <RotateCcw />
                Play Again
              </Link>
              <Link href="/profile" className="btn btn-outline btn-lg">
                <Trophy />
                View Profile
              </Link>
              <Link href="/play/multiplayer" className="btn btn-ghost btn-lg">
                <Home />
                Back to Multiplayer
              </Link>
            </div>
          </>
        )}

        {/* Game Finished but No Game State */}
        {room.status === 'finished' && !gameState && (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title text-center">🎮 Game Over</h3>
              <p className="card-description text-center">
                The multiplayer game has ended. Game details are no longer available.
              </p>
            </div>
            <div className="card-content">
              <div className="flex justify-center gap-4">
                <Link href="/play/multiplayer" className="btn btn-primary btn-lg">
                  <RotateCcw />
                  Play Again
                </Link>
                <Link href="/play/multiplayer" className="btn btn-ghost btn-lg">
                  <Home />
                  Back to Multiplayer
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 