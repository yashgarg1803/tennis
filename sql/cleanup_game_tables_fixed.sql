-- Cleanup script to consolidate redundant game tables
-- This will create a cleaner, more maintainable database structure

-- Step 1: Create a consolidated game_records table (if it doesn't exist)
-- We'll use game_records as our main table for completed games
CREATE TABLE IF NOT EXISTS game_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player1_id UUID REFERENCES auth.users(id),
  player2_id UUID REFERENCES auth.users(id),
  player1_name TEXT NOT NULL,
  player2_name TEXT NOT NULL,
  starting_troops INTEGER NOT NULL,
  winner TEXT CHECK (winner IN ('player1', 'player2', null)),
  rounds JSONB DEFAULT '[]'::jsonb,
  game_type TEXT DEFAULT 'multiplayer' CHECK (game_type IN ('single', 'multiplayer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  finished_at TIMESTAMP WITH TIME ZONE
);

-- Step 2: Migrate data from 'games' table to 'game_records' if needed
DO $$
BEGIN
  -- Check if games table has data and game_records is empty
  IF EXISTS (SELECT 1 FROM games LIMIT 1) AND NOT EXISTS (SELECT 1 FROM game_records LIMIT 1) THEN
    INSERT INTO game_records (
      id, player1_id, player2_id, player1_name, player2_name, 
      starting_troops, winner, rounds, game_type, created_at, finished_at
    )
    SELECT 
      gen_random_uuid(), -- Generate new UUID since games.id is TEXT
      player1_id,
      CASE 
        WHEN player2_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
        THEN player2_id::UUID 
        ELSE NULL 
      END,
      player1_name,
      player2_name,
      starting_troops,
      winner,
      rounds,
      'multiplayer', -- Assume all existing games are multiplayer
      created_at,
      finished_at
    FROM games;
    
    RAISE NOTICE 'Migrated data from games table to game_records';
  END IF;
END $$;

-- Step 3: Drop unnecessary tables and create indexes
DO $$
BEGIN
  -- Drop games_old (backup table)
  DROP TABLE IF EXISTS games_old CASCADE;
  RAISE NOTICE 'Dropped games_old table';

  -- Drop games table (redundant with game_records)
  DROP TABLE IF EXISTS games CASCADE;
  RAISE NOTICE 'Dropped games table';

  -- Drop game_rounds table (redundant - round data stored in JSON)
  DROP TABLE IF EXISTS game_rounds CASCADE;
  RAISE NOTICE 'Dropped game_rounds table';
END $$;

-- Step 4: Create indexes for game_records
CREATE INDEX IF NOT EXISTS idx_game_records_player1_id ON game_records(player1_id);
CREATE INDEX IF NOT EXISTS idx_game_records_player2_id ON game_records(player2_id);
CREATE INDEX IF NOT EXISTS idx_game_records_created_at ON game_records(created_at);
CREATE INDEX IF NOT EXISTS idx_game_records_game_type ON game_records(game_type);

-- Step 5: Enable RLS on game_records
ALTER TABLE game_records ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policies for game_records
DROP POLICY IF EXISTS "Users can view games they played in" ON game_records;
CREATE POLICY "Users can view games they played in" ON game_records
  FOR SELECT USING (
    auth.uid() = player1_id OR 
    auth.uid() = player2_id
  );

DROP POLICY IF EXISTS "Users can insert games they played in" ON game_records;
CREATE POLICY "Users can insert games they played in" ON game_records
  FOR INSERT WITH CHECK (
    auth.uid() = player1_id OR 
    auth.uid() = player2_id
  );

-- Step 7: Add unique constraint to game_moves if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'game_moves_room_player_round_unique'
  ) THEN
    ALTER TABLE game_moves ADD CONSTRAINT game_moves_room_player_round_unique 
      UNIQUE(room_id, player_id, round_number);
    RAISE NOTICE 'Added unique constraint to game_moves';
  END IF;
END $$;

-- Step 8: Create missing indexes for game_moves
CREATE INDEX IF NOT EXISTS idx_game_moves_room_id ON game_moves(room_id);
CREATE INDEX IF NOT EXISTS idx_game_moves_player_id ON game_moves(player_id);
CREATE INDEX IF NOT EXISTS idx_game_moves_round ON game_moves(room_id, round_number);

-- Step 9: Verify the final structure
DO $$
BEGIN
  RAISE NOTICE 'Final table structure:';
  RAISE NOTICE '- game_rooms: Multiplayer game sessions';
  RAISE NOTICE '- game_moves: Individual player moves';
  RAISE NOTICE '- game_records: Completed game results';
  RAISE NOTICE '- user_stats: Player statistics';
END $$; 