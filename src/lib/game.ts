export interface Player {
  id: string
  name: string
  troops: number
  roundWins: number
  isBot?: boolean
}

export interface Round {
  roundNumber: number
  player1Troops: number
  player2Troops: number
  winner: 'player1' | 'player2' | 'tie' | null
  timestamp: Date
}

export interface GameState {
  id: string
  player1: Player
  player2: Player
  currentRound: number
  rounds: Round[]
  status: 'waiting' | 'playing' | 'finished'
  winner: 'player1' | 'player2' | null
  startingTroops: number
  createdAt: Date
  updatedAt: Date
}

export interface GameMove {
  playerId: string
  troops: number
}

export interface GameConfig {
  startingTroops: number
  victoryMargin: number
  maxRounds: number
}

// Default game configuration
export const DEFAULT_GAME_CONFIG: GameConfig = {
  startingTroops: 100,
  victoryMargin: 3,
  maxRounds: 50, // Prevent infinite games
} as const

export class SequentialBlottoGame {
  private state: GameState
  private config: GameConfig

  constructor(gameId: string, player1: Omit<Player, 'troops' | 'roundWins'>, player2: Omit<Player, 'troops' | 'roundWins'>, config: GameConfig = DEFAULT_GAME_CONFIG) {
    this.config = config
    this.state = {
      id: gameId,
      player1: {
        ...player1,
        troops: config.startingTroops,
        roundWins: 0,
      },
      player2: {
        ...player2,
        troops: config.startingTroops,
        roundWins: 0,
      },
      currentRound: 1,
      rounds: [],
      status: 'waiting',
      winner: null,
      startingTroops: config.startingTroops,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  }

  getState(): GameState {
    return { ...this.state }
  }

  getConfig(): GameConfig {
    return { ...this.config }
  }

  // Add method to restore game state from database
  restoreState(gameState: GameState): void {
    this.state = {
      ...gameState,
      createdAt: new Date(gameState.createdAt),
      updatedAt: new Date(gameState.updatedAt)
    }
  }

  canMakeMove(playerId: string): boolean {
    if (this.state.status !== 'playing') return false
    
    const player = this.getPlayer(playerId)
    return player !== null
  }

  makeMove(move: GameMove): boolean {
    if (!this.canMakeMove(move.playerId)) return false
    if (move.troops < 0) return false

    const player = this.getPlayer(move.playerId)
    if (!player) return false

    // If player has 0 troops, they can only bet 0
    if (player.troops === 0) {
      move.troops = 0
    } else if (move.troops > player.troops) {
      return false
    }

    // Deduct troops
    player.troops -= move.troops

    // If this is the first move of the round, store it
    if (this.state.currentRound > this.state.rounds.length) {
      this.state.rounds.push({
        roundNumber: this.state.currentRound,
        player1Troops: move.playerId === this.state.player1.id ? move.troops : 0,
        player2Troops: move.playerId === this.state.player2.id ? move.troops : 0,
        winner: null,
        timestamp: new Date(),
      })
    } else {
      // Second move of the round
      const currentRound = this.state.rounds[this.state.rounds.length - 1]
      if (move.playerId === this.state.player1.id) {
        currentRound.player1Troops = move.troops
      } else {
        currentRound.player2Troops = move.troops
      }

      // Determine round winner
      if (currentRound.player1Troops > currentRound.player2Troops) {
        currentRound.winner = 'player1'
        this.state.player1.roundWins++
      } else if (currentRound.player2Troops > currentRound.player1Troops) {
        currentRound.winner = 'player2'
        this.state.player2.roundWins++
      } else {
        currentRound.winner = 'tie'
        // No increment for ties - troops are still lost
      }

      // Check for game end
      this.checkGameEnd()
      
      // Move to next round
      this.state.currentRound++
    }

    this.state.updatedAt = new Date()
    return true
  }

  private checkGameEnd(): void {
    const { player1, player2 } = this.state
    const roundDiff = Math.abs(player1.roundWins - player2.roundWins)

    // Check if one player has won by victory margin
    if (roundDiff >= this.config.victoryMargin) {
      this.state.status = 'finished'
      this.state.winner = player1.roundWins > player2.roundWins ? 'player1' : 'player2'
      return
    }

    // Check if both players have 0 troops
    if (player1.troops === 0 && player2.troops === 0) {
      this.state.status = 'finished'
      if (player1.roundWins > player2.roundWins) {
        this.state.winner = 'player1'
      } else if (player2.roundWins > player1.roundWins) {
        this.state.winner = 'player2'
      }
      // If round wins are equal, it's a tie (winner remains null)
      return
    }

    // Check for max rounds
    if (this.state.currentRound > this.config.maxRounds) {
      this.state.status = 'finished'
      if (player1.roundWins > player2.roundWins) {
        this.state.winner = 'player1'
      } else if (player2.roundWins > player1.roundWins) {
        this.state.winner = 'player2'
      }
      // If round wins are equal, it's a tie (winner remains null)
    }
  }

  private getPlayer(playerId: string): Player | null {
    if (this.state.player1.id === playerId) return this.state.player1
    if (this.state.player2.id === playerId) return this.state.player2
    return null
  }

  startGame(): void {
    if (this.state.status === 'waiting') {
      this.state.status = 'playing'
      this.state.updatedAt = new Date()
    }
  }

  // Bot AI for single player mode
  makeBotMove(): number {
    const bot = this.state.player2.isBot ? this.state.player2 : this.state.player1
    if (!bot.isBot) return 0

    // If bot has 0 troops, it can only bet 0
    if (bot.troops === 0) return 0

    // Simple random strategy for now
    // Can be enhanced with more sophisticated AI later
    const maxTroops = Math.min(bot.troops, Math.floor(bot.troops * 0.8))
    return Math.floor(Math.random() * (maxTroops + 1))
  }
}

// Helper functions
export function createGame(
  player1: Omit<Player, 'troops' | 'roundWins'>, 
  player2: Omit<Player, 'troops' | 'roundWins'>,
  config: GameConfig = DEFAULT_GAME_CONFIG
): SequentialBlottoGame {
  const gameId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  return new SequentialBlottoGame(gameId, player1, player2, config)
}

export function getGameStatus(game: GameState): string {
  if (game.status === 'waiting') return 'Waiting for players'
  if (game.status === 'finished') {
    if (game.winner) {
      const winner = game.winner === 'player1' ? game.player1.name : game.player2.name
      return `${winner} wins!`
    }
    return 'Game ended in a tie'
  }
  return `Round ${game.currentRound}`
} 