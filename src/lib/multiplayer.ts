import { SequentialBlottoGame, createGame, GameConfig, DEFAULT_GAME_CONFIG } from './game'
import { supabase } from './supabase'

// Re-export for convenience
export type { GameConfig }
export { DEFAULT_GAME_CONFIG }

export interface GameRoom {
  id: string
  roomCode: string
  player1: {
    id: string
    name: string
    ready: boolean
  } | null
  player2: {
    id: string
    name: string
    ready: boolean
  } | null
  gameState: any
  status: 'waiting' | 'playing' | 'finished'
  config: GameConfig
  createdAt: string
  updatedAt: string
  currentRound: number
  roundStatus: 'waiting' | 'player1_moved' | 'player2_moved' | 'resolved'
}

export interface PlayerMove {
  id: string
  roomId: string
  playerId: string
  roundNumber: number
  troops: number
  timestamp: string
}

export interface RoundMove {
  player1Move: PlayerMove | null
  player2Move: PlayerMove | null
  resolved: boolean
}

// In-memory storage for active games only (game state is kept in memory for performance)
const activeGames = new Map<string, SequentialBlottoGame>()

export function generateRoomCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export async function createGameRoom(hostId: string, hostName: string, config: GameConfig = DEFAULT_GAME_CONFIG): Promise<GameRoom> {
  const roomCode = generateRoomCode()
  const roomId = Math.random().toString(36).substring(2, 15)
  
  const room: GameRoom = {
    id: roomId,
    roomCode,
    player1: {
      id: hostId,
      name: hostName,
      ready: true
    },
    player2: null,
    gameState: null,
    status: 'waiting',
    config,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    currentRound: 1,
    roundStatus: 'waiting'
  }
  
  // Save to database - let Supabase generate the UUID
  const insertData = {
    room_code: roomCode,
    player1_id: hostId,
    player1_name: hostName,
    player2_id: null,
    player2_name: null,
    game_state: null,
    status: 'waiting',
    config: config,
    created_at: room.createdAt,
    updated_at: room.updatedAt,
    current_round: room.currentRound,
    round_status: room.roundStatus
  }

  console.log('Attempting to insert game room:', insertData)

  const { data: insertedRoom, error } = await supabase
    .from('game_rooms')
    .insert(insertData)
    .select()
    .single()

  if (error) {
    console.error('Error creating game room - details:', {
      error: error,
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint
    })
    throw new Error('Failed to create game room')
  }
  
  // Update the room object with the actual database ID
  room.id = insertedRoom.id
  return room
}

export async function joinGameRoom(roomCode: string, playerId: string, playerName: string): Promise<GameRoom | null> {
  console.log('Attempting to join room:', { roomCode, playerId, playerName })
  
  // Find room in database
  const { data: roomData, error } = await supabase
    .from('game_rooms')
    .select('*')
    .eq('room_code', roomCode)
    .single()

  if (error) {
    console.error('Error finding room - details:', {
      error: error,
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
      roomCode: roomCode
    })
    return null
  }

  console.log('Found room:', roomData)

  if (roomData.status !== 'waiting') {
    console.log('Room is not in waiting status:', roomData.status)
    return null
  }

  // Check if player is already in the room
  if (roomData.player1_id === playerId || roomData.player2_id === playerId) {
    console.log('Player already in room')
    return convertDbRoomToGameRoom(roomData)
  }

  // Check if room is full
  if (roomData.player2_id) {
    console.log('Room is full')
    return null
  }

  console.log('Joining room...')

  // Join the room
  const updateData = {
    player2_id: playerId,
    player2_name: playerName,
    updated_at: new Date().toISOString()
  }

  console.log('Updating room with data:', updateData)

  const { error: updateError } = await supabase
    .from('game_rooms')
    .update(updateData)
    .eq('room_code', roomCode)

  if (updateError) {
    console.error('Error joining room - details:', {
      error: updateError,
      code: updateError.code,
      message: updateError.message,
      details: updateError.details,
      hint: updateError.hint
    })
    return null
  }

  console.log('Successfully updated room in database')

  // Return updated room
  const { data: updatedRoom, error: fetchError } = await supabase
    .from('game_rooms')
    .select('*')
    .eq('room_code', roomCode)
    .single()

  if (fetchError) {
    console.error('Error fetching updated room:', fetchError)
    return null
  }

  console.log('Fetched updated room:', updatedRoom)
  return updatedRoom ? convertDbRoomToGameRoom(updatedRoom) : null
}

export async function startGame(roomId: string): Promise<boolean> {
  // Get room from database
  const { data: roomData, error } = await supabase
    .from('game_rooms')
    .select('*')
    .eq('id', roomId)
    .single()

  if (error || !roomData || roomData.status !== 'waiting' || !roomData.player1_id || !roomData.player2_id) {
    return false
  }

  const game = createGame(
    { id: roomData.player1_id, name: roomData.player1_name },
    { id: roomData.player2_id, name: roomData.player2_name },
    roomData.config
  )

  game.startGame()
  const gameState = game.getState()

  // Update room in database
  const { error: updateError } = await supabase
    .from('game_rooms')
    .update({
      game_state: gameState,
      status: 'playing',
      current_round: 1,
      round_status: 'waiting',
      updated_at: new Date().toISOString()
    })
    .eq('id', roomId)

  if (updateError) {
    console.error('Error starting game:', updateError)
    return false
  }

  // Store game in memory for performance
  activeGames.set(roomId, game)
  return true
}

export async function makeMove(roomId: string, move: Omit<PlayerMove, 'id'>): Promise<boolean> {
  console.log('Making move:', { roomId, move })
  
  // Get room to check current round and status
  const { data: roomData, error: roomError } = await supabase
    .from('game_rooms')
    .select('*')
    .eq('id', roomId)
    .single()

  if (roomError || !roomData || roomData.status !== 'playing') {
    console.log('Room not found or not in playing status')
    return false
  }

  // Check if player has already moved this round
  const { data: existingMoves, error: moveCheckError } = await supabase
    .from('game_moves')
    .select('*')
    .eq('room_id', roomId)
    .eq('player_id', move.playerId)
    .eq('round_number', roomData.current_round)

  if (moveCheckError) {
    console.error('Error checking existing moves:', moveCheckError)
    return false
  }

  if (existingMoves && existingMoves.length > 0) {
    console.log('Player has already moved this round')
    return false
  }

  // Insert the move
  const moveData = {
    room_id: roomId,
    player_id: move.playerId,
    round_number: roomData.current_round,
    troops: move.troops,
    timestamp: move.timestamp
  }

  const { data: insertedMove, error: insertError } = await supabase
    .from('game_moves')
    .insert(moveData)
    .select()
    .single()

  if (insertError) {
    console.error('Error inserting move:', insertError)
    return false
  }

  // Check if both players have moved for this round
  const { data: allMoves, error: movesError } = await supabase
    .from('game_moves')
    .select('*')
    .eq('room_id', roomId)
    .eq('round_number', roomData.current_round)

  if (movesError) {
    console.error('Error checking moves:', movesError)
    return false
  }

  // Check if both players have moved
  const player1Moved = allMoves.some(m => m.player_id === roomData.player1_id)
  const player2Moved = allMoves.some(m => m.player_id === roomData.player2_id)

  if (player1Moved && player2Moved) {
    // Both players have moved, resolve the round
    console.log('Both players have moved, resolving round')
    await resolveRound(roomId, roomData.current_round)
  } else {
    // Update room status to reflect the move
    let newRoundStatus = roomData.round_status
    if (move.playerId === roomData.player1_id) {
      newRoundStatus = 'player1_moved'
    } else if (move.playerId === roomData.player2_id) {
      newRoundStatus = 'player2_moved'
    }

    const { error: updateError } = await supabase
      .from('game_rooms')
      .update({
        round_status: newRoundStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', roomId)

    if (updateError) {
      console.error('Error updating room status:', updateError)
    }
  }

  return true
}

// Function to ensure game state consistency
async function ensureGameStateConsistency(roomId: string): Promise<SequentialBlottoGame | null> {
  // Get room data
  const { data: roomData, error: roomError } = await supabase
    .from('game_rooms')
    .select('*')
    .eq('id', roomId)
    .single()

  if (roomError || !roomData) {
    console.error('Error getting room data for consistency check:', roomError)
    return null
  }

  // Get or create game instance
  let game = activeGames.get(roomId)
  if (!game) {
    // Create new game instance
    game = createGame(
      { id: roomData.player1_id, name: roomData.player1_name },
      { id: roomData.player2_id, name: roomData.player2_name },
      roomData.config
    )
    game.startGame()
    activeGames.set(roomId, game)
  }

  // Always restore from database to ensure consistency
  if (roomData.game_state) {
    game.restoreState(roomData.game_state)
  }

  return game
}

async function resolveRound(roomId: string, roundNumber: number): Promise<void> {
  console.log('Resolving round:', { roomId, roundNumber })

  // Get both moves for this round
  const { data: moves, error: movesError } = await supabase
    .from('game_moves')
    .select('*')
    .eq('room_id', roomId)
    .eq('round_number', roundNumber)

  if (movesError || !moves || moves.length !== 2) {
    console.error('Error getting moves for round:', movesError, 'Moves found:', moves?.length)
    return
  }

  // Get room data
  const { data: roomData, error: roomError } = await supabase
    .from('game_rooms')
    .select('*')
    .eq('id', roomId)
    .single()

  if (roomError || !roomData) {
    console.error('Error getting room data:', roomError)
    return
  }

  // Get or restore game instance
  let game = await ensureGameStateConsistency(roomId)
  
  if (!game) {
    console.error('Failed to ensure game state consistency')
    return
  }

  // Apply both moves to the game in the correct order
  const player1Move = moves.find(m => m.player_id === roomData.player1_id)
  const player2Move = moves.find(m => m.player_id === roomData.player2_id)

  if (!player1Move || !player2Move) {
    console.error('Missing moves for round resolution')
    return
  }

  // Apply moves in order (player1 first, then player2)
  const success1 = game.makeMove({
    playerId: player1Move.player_id,
    troops: player1Move.troops
  })
  
  const success2 = game.makeMove({
    playerId: player2Move.player_id,
    troops: player2Move.troops
  })
  
  if (!success1 || !success2) {
    console.error('Failed to apply moves to game:', { player1Move, player2Move })
    return
  }

  const updatedGameState = game.getState()

  // Update room with new game state and round status
  const updateData: any = {
    game_state: updatedGameState,
    round_status: 'resolved',
    updated_at: new Date().toISOString()
  }

  // If game is finished, update status
  if (updatedGameState.status === 'finished') {
    updateData.status = 'finished'
  } else {
    // Move to next round
    updateData.current_round = roomData.current_round + 1
    updateData.round_status = 'waiting'
  }

  const { error: updateError } = await supabase
    .from('game_rooms')
    .update(updateData)
    .eq('id', roomId)

  if (updateError) {
    console.error('Error updating room after round resolution:', updateError)
  }

  // If game is finished, save to game records and clean up
  if (updatedGameState.status === 'finished') {
    await saveMultiplayerGameResult(updatedGameState, roomId)
    activeGames.delete(roomId)
  }

  console.log('Round resolved successfully')
}

async function saveMultiplayerGameResult(gameState: any, roomId: string): Promise<void> {
  try {
    // Get room data for player IDs
    const { data: roomData, error: roomError } = await supabase
      .from('game_rooms')
      .select('*')
      .eq('id', roomId)
      .single()

    if (roomError || !roomData) {
      console.error('Error getting room data for saving game result:', roomError)
      return
    }

    // Save to game_records table
    const gameData = {
      player1_id: roomData.player1_id,
      player2_id: roomData.player2_id,
      player1_name: gameState.player1.name,
      player2_name: gameState.player2.name,
      starting_troops: gameState.startingTroops,
      winner: gameState.winner,
      rounds: gameState.rounds,
      game_type: 'multiplayer',
      created_at: gameState.createdAt.toISOString(),
      finished_at: gameState.updatedAt.toISOString()
    }

    const { error: gameError } = await supabase
      .from('game_records')
      .insert(gameData)

    if (gameError) {
      console.error('Error saving multiplayer game result:', gameError)
      return
    }

    // Update user stats for both players
    await updateUserStats(roomData.player1_id, gameState, 'player1')
    await updateUserStats(roomData.player2_id, gameState, 'player2')

    console.log('Multiplayer game result saved successfully')
  } catch (error) {
    console.error('Error saving multiplayer game result:', error)
  }
}

async function updateUserStats(userId: string, gameState: any, playerRole: 'player1' | 'player2'): Promise<void> {
  try {
    const player = gameState[playerRole]
    const isWinner = gameState.winner === playerRole

    // Calculate stats
    const totalTroopsDeployed = gameState.rounds.reduce((total: number, round: any) => {
      return total + (playerRole === 'player1' ? round.player1Troops : round.player2Troops)
    }, 0)

    const roundsWon = player.roundWins

    // Get existing stats
    const { data: existingStats } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single()

    const newStats = {
      user_id: userId,
      games_played: (existingStats?.games_played || 0) + 1,
      games_won: (existingStats?.games_won || 0) + (isWinner ? 1 : 0),
      total_troops_deployed: (existingStats?.total_troops_deployed || 0) + totalTroopsDeployed,
      total_rounds_won: (existingStats?.total_rounds_won || 0) + roundsWon,
      updated_at: new Date().toISOString()
    }

    if (existingStats) {
      // Update existing stats
      await supabase
        .from('user_stats')
        .update(newStats)
        .eq('user_id', userId)
    } else {
      // Insert new stats
      await supabase
        .from('user_stats')
        .insert(newStats)
    }
  } catch (error) {
    console.error('Error updating user stats:', error)
  }
}

// Function to refresh in-memory game state from database
export async function refreshGameState(roomId: string): Promise<boolean> {
  const { data: roomData, error } = await supabase
    .from('game_rooms')
    .select('*')
    .eq('id', roomId)
    .single()

  if (error || !roomData || !roomData.game_state) {
    return false
  }

  // If there's an active game, update it with the database state
  const game = activeGames.get(roomId)
  if (game && roomData.game_state) {
    // Note: This is a simplified approach. In a real implementation,
    // you might want to reconstruct the game object from the database state
    console.log('Refreshing game state from database:', roomData.game_state)
  }

  return true
}

export async function getRoom(roomId: string): Promise<GameRoom | null> {
  const { data: roomData, error } = await supabase
    .from('game_rooms')
    .select('*')
    .eq('id', roomId)
    .single()

  if (error || !roomData) {
    return null
  }

  return convertDbRoomToGameRoom(roomData)
}

export async function getRoomByCode(roomCode: string): Promise<GameRoom | null> {
  const { data: roomData, error } = await supabase
    .from('game_rooms')
    .select('*')
    .eq('room_code', roomCode)
    .single()

  if (error || !roomData) {
    return null
  }

  return convertDbRoomToGameRoom(roomData)
}

export async function leaveRoom(roomId: string, playerId: string): Promise<boolean> {
  const { data: roomData, error } = await supabase
    .from('game_rooms')
    .select('*')
    .eq('id', roomId)
    .single()

  if (error || !roomData) {
    return false
  }

  let updateData: any = { updated_at: new Date().toISOString() }

  if (roomData.player1_id === playerId) {
    updateData.player1_id = null
    updateData.player1_name = null
  } else if (roomData.player2_id === playerId) {
    updateData.player2_id = null
    updateData.player2_name = null
  } else {
    return false // Player not in room
  }

  // If no players left, delete the room
  if ((!roomData.player1_id || roomData.player1_id === playerId) && 
      (!roomData.player2_id || roomData.player2_id === playerId)) {
    const { error: deleteError } = await supabase
      .from('game_rooms')
      .delete()
      .eq('id', roomId)

    if (deleteError) {
      console.error('Error deleting room:', deleteError)
      return false
    }
  } else {
    // Update room
    const { error: updateError } = await supabase
      .from('game_rooms')
      .update(updateData)
      .eq('id', roomId)

    if (updateError) {
      console.error('Error leaving room:', updateError)
      return false
    }
  }

  // Clean up in-memory game
  activeGames.delete(roomId)
  return true
}

// Helper function to convert database room to GameRoom interface
function convertDbRoomToGameRoom(dbRoom: any): GameRoom {
  return {
    id: dbRoom.id,
    roomCode: dbRoom.room_code,
    player1: dbRoom.player1_id ? {
      id: dbRoom.player1_id,
      name: dbRoom.player1_name,
      ready: true
    } : null,
    player2: dbRoom.player2_id ? {
      id: dbRoom.player2_id,
      name: dbRoom.player2_name,
      ready: true
    } : null,
    gameState: dbRoom.game_state,
    status: dbRoom.status,
    config: dbRoom.config,
    createdAt: dbRoom.created_at,
    updatedAt: dbRoom.updated_at,
    currentRound: dbRoom.current_round || 1,
    roundStatus: dbRoom.round_status || 'waiting'
  }
}

// Clean up old rooms (run periodically)
export async function cleanupOldRooms() {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  
  const { error } = await supabase
    .from('game_rooms')
    .delete()
    .lt('updated_at', oneHourAgo)

  if (error) {
    console.error('Error cleaning up old rooms:', error)
  }
}

// Run cleanup every hour
setInterval(cleanupOldRooms, 60 * 60 * 1000)

// Function to check if it's a player's turn
export async function isPlayerTurn(roomId: string, playerId: string): Promise<boolean> {
  const { data: roomData, error } = await supabase
    .from('game_rooms')
    .select('*')
    .eq('id', roomId)
    .single()

  if (error || !roomData || roomData.status !== 'playing') {
    return false
  }

  // Check if player has already moved this round
  const { data: existingMoves } = await supabase
    .from('game_moves')
    .select('*')
    .eq('room_id', roomId)
    .eq('player_id', playerId)
    .eq('round_number', roomData.current_round)

  return !existingMoves || existingMoves.length === 0
}

// Function to get current round status
export async function getRoundStatus(roomId: string): Promise<{
  currentRound: number
  roundStatus: string
  player1Moved: boolean
  player2Moved: boolean
} | null> {
  const { data: roomData, error } = await supabase
    .from('game_rooms')
    .select('*')
    .eq('id', roomId)
    .single()

  if (error || !roomData) {
    return null
  }

  // Check which players have moved
  const { data: player1Moves } = await supabase
    .from('game_moves')
    .select('*')
    .eq('room_id', roomId)
    .eq('player_id', roomData.player1_id)
    .eq('round_number', roomData.current_round)

  const { data: player2Moves } = await supabase
    .from('game_moves')
    .select('*')
    .eq('room_id', roomId)
    .eq('player_id', roomData.player2_id)
    .eq('round_number', roomData.current_round)

  return {
    currentRound: roomData.current_round,
    roundStatus: roomData.round_status,
    player1Moved: !!(player1Moves && player1Moves.length > 0),
    player2Moved: !!(player2Moves && player2Moves.length > 0)
  }
} 