-- Simple fix for RLS policies causing 406 errors
-- This addresses the specific issue with game_moves table queries

-- Step 1: Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view moves in their rooms" ON game_moves;
DROP POLICY IF EXISTS "Users can insert their own moves" ON game_moves;
DROP POLICY IF EXISTS "Users can view all moves" ON game_moves;

-- Step 2: Create simpler, more permissive policies
-- Allow users to view moves if they are in the room
CREATE POLICY "Users can view moves in their rooms" ON game_moves
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM game_rooms 
      WHERE id = game_moves.room_id 
      AND (player1_id = auth.uid() OR player2_id = auth.uid())
    )
  );

-- Allow users to insert moves if they are in the room
CREATE POLICY "Users can insert their own moves" ON game_moves
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM game_rooms 
      WHERE id = game_moves.room_id 
      AND (player1_id = auth.uid() OR player2_id = auth.uid())
    )
  );

-- Step 3: Enable RLS on the table if not already enabled
ALTER TABLE game_moves ENABLE ROW LEVEL SECURITY;

-- Step 4: Verify the policies are working
-- This will show the current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'game_moves'; 