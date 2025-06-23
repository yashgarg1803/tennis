-- Fix the foreign key constraint to allow null values for player2_id
-- This is needed for single-player games where AI opponent has no user ID

-- Drop the existing constraint
ALTER TABLE game_records DROP CONSTRAINT IF EXISTS game_records_player2_id_fkey;

-- Recreate the constraint to allow null values
ALTER TABLE game_records ADD CONSTRAINT game_records_player2_id_fkey 
  FOREIGN KEY (player2_id) REFERENCES auth.users(id) ON DELETE SET NULL; 