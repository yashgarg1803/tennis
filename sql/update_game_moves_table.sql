-- Update existing game_moves table to match new turn-based system
-- First, let's see what the current structure looks like and update it

-- Drop the existing game_moves table and recreate it with the correct structure
DROP TABLE IF EXISTS game_moves CASCADE;

CREATE TABLE game_moves (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES game_rooms(id) ON DELETE CASCADE,
  player_id UUID NOT NULL,
  round_number INTEGER NOT NULL,
  troops INTEGER NOT NULL CHECK (troops >= 0),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(room_id, player_id, round_number)
);

-- Add the new columns to game_rooms table if they don't exist
DO $$ 
BEGIN
  -- Add current_round column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'game_rooms' AND column_name = 'current_round') THEN
    ALTER TABLE game_rooms ADD COLUMN current_round INTEGER DEFAULT 1;
  END IF;
  
  -- Add round_status column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'game_rooms' AND column_name = 'round_status') THEN
    ALTER TABLE game_rooms ADD COLUMN round_status TEXT DEFAULT 'waiting' 
      CHECK (round_status IN ('waiting', 'player1_moved', 'player2_moved', 'resolved'));
  END IF;
END $$;

-- Create indexes for the new game_moves table
CREATE INDEX idx_game_moves_room_id ON game_moves(room_id);
CREATE INDEX idx_game_moves_player_id ON game_moves(player_id);
CREATE INDEX idx_game_moves_round ON game_moves(room_id, round_number);

-- Enable Row Level Security on game_moves
ALTER TABLE game_moves ENABLE ROW LEVEL SECURITY;

-- RLS Policies for game_moves
CREATE POLICY "Users can view moves in their rooms" ON game_moves
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM game_rooms 
      WHERE id = game_moves.room_id 
      AND (player1_id = auth.uid() OR player2_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert their own moves" ON game_moves
  FOR INSERT WITH CHECK (auth.uid() = player_id);

CREATE POLICY "Users can view all moves" ON game_moves
  FOR SELECT USING (true); 