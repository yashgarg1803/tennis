'use client'

import { useState, useEffect } from 'react'
import { SequentialBlottoGame, createGame, DEFAULT_GAME_CONFIG, GameConfig } from '@/lib/game'
import { saveGameResult } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Shield, Trophy, Target, ArrowRight, RotateCcw, Home, Settings } from 'lucide-react'
import Link from 'next/link'

export default function SinglePlayerGame() {
  const [game, setGame] = useState<SequentialBlottoGame | null>(null)
  const [gameState, setGameState] = useState<any>(null)
  const [playerTroops, setPlayerTroops] = useState<number>(0)
  const [isWaitingForBot, setIsWaitingForBot] = useState(false)
  const [gameConfig, setGameConfig] = useState<GameConfig>(DEFAULT_GAME_CONFIG)
  const [showSetup, setShowSetup] = useState(true)
  const [gameSaved, setGameSaved] = useState(false)
  const { user } = useAuth()

  const startNewGame = () => {
    const newGame = createGame(
      { id: 'player', name: 'You', isBot: false },
      { id: 'bot', name: 'AI Opponent', isBot: true },
      gameConfig
    )
    newGame.startGame()
    setGame(newGame)
    setGameState(newGame.getState())
    setPlayerTroops(0)
    setIsWaitingForBot(false)
    setShowSetup(false)
    setGameSaved(false)
  }

  const makeMove = (troops: number) => {
    if (!game || !gameState) return

    // Player makes move
    const success = game.makeMove({ playerId: 'player', troops })
    if (!success) return

    const updatedState = game.getState()
    setGameState(updatedState)

    // Check if game is still ongoing
    if (updatedState.status === 'playing') {
      setIsWaitingForBot(true)
      
      // Bot makes move after a short delay
      setTimeout(() => {
        if (game && gameState.status === 'playing') {
          const botTroops = game.makeBotMove()
          game.makeMove({ playerId: 'bot', troops: botTroops })
          const finalState = game.getState()
          setGameState(finalState)
          setIsWaitingForBot(false)
          
          // Save game result if game is finished
          if (finalState.status === 'finished' && user && !gameSaved) {
            saveGameResult(finalState, user.id).then((result) => {
              if (result.success) {
                setGameSaved(true)
                console.log('Game saved successfully')
              } else {
                console.error('Failed to save game:', result.error)
              }
            })
          }
        }
      }, 1000)
    } else if (updatedState.status === 'finished' && user && !gameSaved) {
      // Save game result if game ended on player's move
      saveGameResult(updatedState, user.id).then((result) => {
        if (result.success) {
          setGameSaved(true)
          console.log('Game saved successfully')
        } else {
          console.error('Failed to save game:', result.error)
        }
      })
    }
  }

  const handleDeploy = () => {
    if (playerTroops >= 0 && playerTroops <= gameState?.player1.troops) {
      makeMove(playerTroops)
      setPlayerTroops(0)
    }
  }

  const resetToSetup = () => {
    setGame(null)
    setGameState(null)
    setShowSetup(true)
  }

  // Game Setup Screen
  if (showSetup) {
    return (
      <div className="container py-20">
        <div style={{ maxWidth: '32rem', margin: '0 auto' }}>
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <Link href="/play" className="btn btn-ghost btn-sm">
              <Home />
              Back to Menu
            </Link>
            <h1 className="text-2xl font-bold">Game Setup</h1>
            <div style={{ width: '80px' }}></div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <Settings />
                Configure Your Game
              </h3>
              <p className="card-description">
                Customize the game settings before starting
              </p>
            </div>
            <div className="card-content">
              {/* Starting Troops Configuration */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div className="flex justify-between items-center mb-4">
                  <label className="text-sm font-medium">Starting Troops per Player</label>
                  <span className="font-bold text-lg">{gameConfig.startingTroops}</span>
                </div>
                <div style={{ marginBottom: '0.5rem' }}>
                  <input
                    type="range"
                    min="10"
                    max="500"
                    step="10"
                    value={gameConfig.startingTroops}
                    onChange={(e) => setGameConfig(prev => ({ ...prev, startingTroops: Number(e.target.value) }))}
                    className="input-range"
                  />
                  <div className="flex justify-between text-sm text-secondary">
                    <span>10 troops</span>
                    <span>500 troops</span>
                  </div>
                </div>
                <p className="text-sm text-secondary">
                  Each player starts with {gameConfig.startingTroops} troops. Choose wisely - 
                  you'll need to manage these troops throughout the entire game!
                </p>
              </div>

              {/* Game Rules Reminder */}
              <div style={{ padding: '1rem', background: 'rgba(55, 65, 81, 0.3)', borderRadius: '8px', marginBottom: '1.5rem' }}>
                <h4 className="font-semibold mb-3">Game Rules:</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div className="flex items-start gap-2">
                    <span style={{ color: '#3b82f6', marginTop: '2px' }}>•</span>
                    <span className="text-sm">Deploy any number of troops per round (0 to your remaining troops)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span style={{ color: '#10b981', marginTop: '2px' }}>•</span>
                    <span className="text-sm">Whoever sends more troops wins the round</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span style={{ color: '#f59e0b', marginTop: '2px' }}>•</span>
                    <span className="text-sm">If tied, it's a draw (no one wins, troops are still lost)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span style={{ color: '#ef4444', marginTop: '2px' }}>•</span>
                    <span className="text-sm">Win by 3 rounds to claim victory</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span style={{ color: '#8b5cf6', marginTop: '2px' }}>•</span>
                    <span className="text-sm">If you run out of troops, you can still participate by betting 0 troops per round</span>
                  </div>
                </div>
              </div>

              {/* Start Game Button */}
              <button onClick={startNewGame} className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                <Shield />
                Start Game with {gameConfig.startingTroops} Troops Each
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!gameState) {
    return <div>Loading...</div>
  }

  const isGameFinished = gameState.status === 'finished'
  const currentRound = gameState.rounds[gameState.rounds.length - 1]
  const isPlayerTurn = gameState.status === 'playing' && !isWaitingForBot

  return (
    <div className="container py-8">
      <div style={{ maxWidth: '64rem', margin: '0 auto' }}>
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <Link href="/play" className="btn btn-ghost btn-sm">
            <Home />
            Menu
          </Link>
          <div className="text-center">
            <h1 className="text-2xl font-bold">Single Player</h1>
            <p className="text-secondary">Round {gameState.currentRound} • {gameState.startingTroops} starting troops</p>
          </div>
          <button onClick={resetToSetup} className="btn btn-ghost btn-sm">
            <RotateCcw />
            New Game
          </button>
        </div>

        {/* Game Status */}
        <div className="card mb-6">
          <div className="card-header">
            <h3 className="card-title text-center">
              {isGameFinished 
                ? gameState.winner === 'player1' 
                  ? '🎉 You Win! 🎉' 
                  : '😔 AI Wins 😔'
                : isWaitingForBot 
                  ? '🤖 AI is thinking...' 
                  : 'Your turn to deploy troops'
              }
            </h3>
          </div>
        </div>

        {/* Player Stats */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* Player */}
          <div className={`card ${gameState.winner === 'player1' ? 'winner' : ''}`}>
            <div className="card-header">
              <h3 className="card-title">
                <Shield style={{ color: '#3b82f6' }} />
                You
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
              </div>
            </div>
          </div>

          {/* AI */}
          <div className={`card ${gameState.winner === 'player2' ? 'winner' : ''}`}>
            <div className="card-header">
              <h3 className="card-title">
                <Target style={{ color: '#ef4444' }} />
                AI Opponent
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
              </div>
            </div>
          </div>
        </div>

        {/* Troop Deployment */}
        {!isGameFinished && isPlayerTurn && (
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
                    max={gameState.player1.troops}
                    value={playerTroops}
                    onChange={(e) => setPlayerTroops(Number(e.target.value))}
                    className="input-range"
                    style={{ flex: 1 }}
                  />
                  <span className="font-bold" style={{ minWidth: '60px' }}>{playerTroops}</span>
                </div>
                <div className="flex justify-between text-sm text-secondary">
                  <span>0 troops</span>
                  <span>{gameState.player1.troops} troops</span>
                </div>
                <button 
                  onClick={handleDeploy} 
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                  disabled={playerTroops < 0 || playerTroops > gameState.player1.troops}
                >
                  <ArrowRight />
                  Deploy {playerTroops} Troops
                </button>
              </div>
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
                          {round.winner === 'player1' ? 'You win' : 
                           round.winner === 'player2' ? 'AI wins' : 'Tie'}
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
            <button onClick={resetToSetup} className="btn btn-primary btn-lg">
              <RotateCcw />
              Play Again
            </button>
            <Link href="/play" className="btn btn-outline btn-lg">
              <Home />
              Back to Menu
            </Link>
          </div>
        )}
      </div>
    </div>
  )
} 