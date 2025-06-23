-- Simple fix for the game_records player2_id foreign key constraint
-- This allows null values for single-player games

-- Drop the existing foreign key constraint
ALTER TABLE game_records DROP CONSTRAINT IF EXISTS game_records_player2_id_fkey;

-- Recreate the foreign key constraint to allow null values
ALTER TABLE game_records ADD CONSTRAINT game_records_player2_id_fkey 
  FOREIGN KEY (player2_id) REFERENCES auth.users(id) ON DELETE SET NULL; 