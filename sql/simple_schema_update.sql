-- Simple schema update - just add missing columns to existing tables
-- This is safer than dropping and recreating tables

-- Add missing columns to game_rooms table
DO $$ 
BEGIN
  -- Add current_round column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'game_rooms' AND column_name = 'current_round') THEN
    ALTER TABLE game_rooms ADD COLUMN current_round INTEGER DEFAULT 1;
    RAISE NOTICE 'Added current_round column to game_rooms';
  ELSE
    RAISE NOTICE 'current_round column already exists in game_rooms';
  END IF;
  
  -- Add round_status column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'game_rooms' AND column_name = 'round_status') THEN
    ALTER TABLE game_rooms ADD COLUMN round_status TEXT DEFAULT 'waiting' 
      CHECK (round_status IN ('waiting', 'player1_moved', 'player2_moved', 'resolved'));
    RAISE NOTICE 'Added round_status column to game_rooms';
  ELSE
    RAISE NOTICE 'round_status column already exists in game_rooms';
  END IF;
END $$;

-- Update game_moves table structure if needed
DO $$
BEGIN
  -- Check if room_id column exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'game_moves' AND column_name = 'room_id') THEN
    -- Add room_id column if it doesn't exist
    ALTER TABLE game_moves ADD COLUMN room_id UUID;
    RAISE NOTICE 'Added room_id column to game_moves';
    
    -- Add foreign key constraint
    ALTER TABLE game_moves ADD CONSTRAINT game_moves_room_id_fkey 
      FOREIGN KEY (room_id) REFERENCES game_rooms(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added foreign key constraint for room_id';
  ELSE
    RAISE NOTICE 'room_id column already exists in game_moves';
  END IF;
  
  -- Check if player_id column exists (instead of player_number)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'game_moves' AND column_name = 'player_id') THEN
    -- Add player_id column if it doesn't exist
    ALTER TABLE game_moves ADD COLUMN player_id UUID;
    RAISE NOTICE 'Added player_id column to game_moves';
  ELSE
    RAISE NOTICE 'player_id column already exists in game_moves';
  END IF;
  
  -- Check if troops column exists (instead of troops_sent)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'game_moves' AND column_name = 'troops') THEN
    -- Add troops column if it doesn't exist
    ALTER TABLE game_moves ADD COLUMN troops INTEGER CHECK (troops >= 0);
    RAISE NOTICE 'Added troops column to game_moves';
  ELSE
    RAISE NOTICE 'troops column already exists in game_moves';
  END IF;
  
  -- Check if timestamp column exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'game_moves' AND column_name = 'timestamp') THEN
    -- Add timestamp column if it doesn't exist
    ALTER TABLE game_moves ADD COLUMN timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    RAISE NOTICE 'Added timestamp column to game_moves';
  ELSE
    RAISE NOTICE 'timestamp column already exists in game_moves';
  END IF;
END $$;

-- Create unique constraint for room_id, player_id, round_number if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'game_moves_room_player_round_unique'
  ) THEN
    ALTER TABLE game_moves ADD CONSTRAINT game_moves_room_player_round_unique 
      UNIQUE(room_id, player_id, round_number);
    RAISE NOTICE 'Added unique constraint for room_id, player_id, round_number';
  ELSE
    RAISE NOTICE 'Unique constraint already exists';
  END IF;
END $$;

-- Create indexes if they don't exist
DO $$
BEGIN
  -- Index for room_id
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_game_moves_room_id') THEN
    CREATE INDEX idx_game_moves_room_id ON game_moves(room_id);
    RAISE NOTICE 'Created index idx_game_moves_room_id';
  END IF;
  
  -- Index for player_id
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_game_moves_player_id') THEN
    CREATE INDEX idx_game_moves_player_id ON game_moves(player_id);
    RAISE NOTICE 'Created index idx_game_moves_player_id';
  END IF;
  
  -- Index for round lookup
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_game_moves_round') THEN
    CREATE INDEX idx_game_moves_round ON game_moves(room_id, round_number);
    RAISE NOTICE 'Created index idx_game_moves_round';
  END IF;
END $$;

-- Enable RLS if not already enabled
ALTER TABLE game_moves ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Users can view moves in their rooms" ON game_moves;
DROP POLICY IF EXISTS "Users can insert their own moves" ON game_moves;
DROP POLICY IF EXISTS "Users can view all moves" ON game_moves;

-- Create new policies
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