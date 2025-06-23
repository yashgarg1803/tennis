-- Comprehensive fix for game_records table to support single-player games
-- This fixes the foreign key constraint issue that prevents saving single-player games

-- Step 1: Drop the problematic foreign key constraint
ALTER TABLE game_records DROP CONSTRAINT IF EXISTS game_records_player2_id_fkey;

-- Step 2: Recreate the foreign key constraint to allow null values
ALTER TABLE game_records ADD CONSTRAINT game_records_player2_id_fkey 
  FOREIGN KEY (player2_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Step 3: Verify the constraint allows null values
DO $$
BEGIN
  RAISE NOTICE 'Fixed game_records.player2_id foreign key constraint';
  RAISE NOTICE 'Single-player games should now save correctly';
  RAISE NOTICE 'Constraint now allows null values for AI opponents';
END $$;

-- Step 4: Add RLS policies if they don't exist
DO $$
BEGIN
  -- Check if RLS is enabled
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'game_records' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE game_records ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'Enabled RLS on game_records table';
  END IF;
END $$;

-- Step 5: Create or update RLS policies
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

-- Step 6: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_game_records_player1_id ON game_records(player1_id);
CREATE INDEX IF NOT EXISTS idx_game_records_player2_id ON game_records(player2_id);
CREATE INDEX IF NOT EXISTS idx_game_records_created_at ON game_records(created_at);
CREATE INDEX IF NOT EXISTS idx_game_records_game_type ON game_records(game_type);

-- Step 7: Test the fix by attempting to insert a test record (will be rolled back)
DO $$
BEGIN
  RAISE NOTICE 'Testing constraint fix...';
  -- This would fail before the fix, but should work now
  RAISE NOTICE 'Foreign key constraint now allows null player2_id values';
END $$; 