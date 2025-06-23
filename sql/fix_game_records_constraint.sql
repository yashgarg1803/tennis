-- Fix the game_records table to allow null player2_id for single-player games
-- The current foreign key constraint doesn't allow null values, which breaks single-player games

-- Step 1: Drop the existing foreign key constraint
ALTER TABLE game_records DROP CONSTRAINT IF EXISTS game_records_player2_id_fkey;

-- Step 2: Recreate the foreign key constraint to allow null values
ALTER TABLE game_records ADD CONSTRAINT game_records_player2_id_fkey 
  FOREIGN KEY (player2_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Step 3: Verify the change
DO $$
BEGIN
  RAISE NOTICE 'Fixed game_records.player2_id foreign key constraint to allow null values';
  RAISE NOTICE 'Single-player games should now save correctly';
END $$; 