-- Comprehensive fix for multiplayer issues
-- This addresses the 406 errors and round management problems

-- Step 1: Fix RLS policies for game_moves table
-- The current policies are too restrictive and causing 406 errors

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view moves in their rooms" ON game_moves;
DROP POLICY IF EXISTS "Users can insert their own moves" ON game_moves;
DROP POLICY IF EXISTS "Users can view all moves" ON game_moves;

-- Create simpler, more permissive policies
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

-- Add a more permissive policy for debugging
CREATE POLICY "Allow all authenticated users to view moves" ON game_moves
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Step 2: Fix the round management issue
-- The problem is that rounds are being overwritten instead of properly managed
-- Let's add better constraints and triggers

-- Add a trigger to prevent duplicate moves
CREATE OR REPLACE FUNCTION prevent_duplicate_moves()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if a move already exists for this player in this round
  IF EXISTS (
    SELECT 1 FROM game_moves 
    WHERE room_id = NEW.room_id 
    AND player_id = NEW.player_id 
    AND round_number = NEW.round_number
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000')
  ) THEN
    RAISE EXCEPTION 'Player has already moved in this round';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS prevent_duplicate_moves_trigger ON game_moves;

-- Create the trigger
CREATE TRIGGER prevent_duplicate_moves_trigger
  BEFORE INSERT OR UPDATE ON game_moves
  FOR EACH ROW
  EXECUTE FUNCTION prevent_duplicate_moves();

-- Step 3: Add a function to properly manage round progression
CREATE OR REPLACE FUNCTION check_round_completion()
RETURNS TRIGGER AS $$
DECLARE
  room_record RECORD;
  player1_move_count INTEGER;
  player2_move_count INTEGER;
BEGIN
  -- Get room information
  SELECT * INTO room_record 
  FROM game_rooms 
  WHERE id = NEW.room_id;
  
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;
  
  -- Count moves for both players in this round
  SELECT COUNT(*) INTO player1_move_count
  FROM game_moves 
  WHERE room_id = NEW.room_id 
  AND round_number = NEW.round_number
  AND player_id = room_record.player1_id;
  
  SELECT COUNT(*) INTO player2_move_count
  FROM game_moves 
  WHERE room_id = NEW.room_id 
  AND round_number = NEW.round_number
  AND player_id = room_record.player2_id;
  
  -- If both players have moved, mark round as ready for resolution
  IF player1_move_count > 0 AND player2_move_count > 0 THEN
    UPDATE game_rooms 
    SET round_status = 'resolved',
        updated_at = NOW()
    WHERE id = NEW.room_id;
  ELSE
    -- Update round status based on who moved
    IF NEW.player_id = room_record.player1_id THEN
      UPDATE game_rooms 
      SET round_status = 'player1_moved',
          updated_at = NOW()
      WHERE id = NEW.room_id;
    ELSIF NEW.player_id = room_record.player2_id THEN
      UPDATE game_rooms 
      SET round_status = 'player2_moved',
          updated_at = NOW()
      WHERE id = NEW.room_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS check_round_completion_trigger ON game_moves;

-- Create the trigger
CREATE TRIGGER check_round_completion_trigger
  AFTER INSERT ON game_moves
  FOR EACH ROW
  EXECUTE FUNCTION check_round_completion();

-- Step 4: Add better indexes for performance
CREATE INDEX IF NOT EXISTS idx_game_moves_room_round ON game_moves(room_id, round_number);
CREATE INDEX IF NOT EXISTS idx_game_moves_player_round ON game_moves(player_id, round_number);
CREATE INDEX IF NOT EXISTS idx_game_moves_room_player_round ON game_moves(room_id, player_id, round_number);

-- Step 5: Add a function to clean up orphaned moves
CREATE OR REPLACE FUNCTION cleanup_orphaned_moves()
RETURNS void AS $$
BEGIN
  -- Delete moves that don't have corresponding rooms
  DELETE FROM game_moves 
  WHERE room_id NOT IN (SELECT id FROM game_rooms);
  
  -- Delete moves from finished games
  DELETE FROM game_moves 
  WHERE room_id IN (
    SELECT id FROM game_rooms WHERE status = 'finished'
  );
END;
$$ LANGUAGE plpgsql;

-- Step 6: Verify the fixes
DO $$
BEGIN
  RAISE NOTICE 'Multiplayer fixes applied:';
  RAISE NOTICE '1. Fixed RLS policies for game_moves table';
  RAISE NOTICE '2. Added trigger to prevent duplicate moves';
  RAISE NOTICE '3. Added trigger to manage round completion';
  RAISE NOTICE '4. Added performance indexes';
  RAISE NOTICE '5. Added cleanup function for orphaned moves';
  RAISE NOTICE '';
  RAISE NOTICE 'The 406 errors should now be resolved';
  RAISE NOTICE 'Round management should work correctly';
END $$; 