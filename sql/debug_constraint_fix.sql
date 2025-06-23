-- Debug and fix the game_records constraint issue
-- This script will check the current constraint and fix it properly

-- Step 1: Check current constraint details
DO $$
BEGIN
  RAISE NOTICE 'Checking current constraint details...';
  
  -- Check if the constraint exists and its definition
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'game_records_player2_id_fkey'
  ) THEN
    RAISE NOTICE 'Constraint game_records_player2_id_fkey exists';
    
    -- Check if it allows null values
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
      WHERE tc.constraint_name = 'game_records_player2_id_fkey'
      AND kcu.column_name = 'player2_id'
      AND kcu.is_nullable = 'YES'
    ) THEN
      RAISE NOTICE 'Constraint allows null values - this should work';
    ELSE
      RAISE NOTICE 'Constraint does NOT allow null values - this is the problem';
    END IF;
  ELSE
    RAISE NOTICE 'Constraint game_records_player2_id_fkey does NOT exist';
  END IF;
END $$;

-- Step 2: Force drop the constraint (with CASCADE if needed)
DO $$
BEGIN
  RAISE NOTICE 'Attempting to drop the constraint...';
  
  -- Try to drop the constraint
  BEGIN
    ALTER TABLE game_records DROP CONSTRAINT game_records_player2_id_fkey;
    RAISE NOTICE 'Successfully dropped the constraint';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error dropping constraint: %', SQLERRM;
  END;
END $$;

-- Step 3: Recreate the constraint properly
DO $$
BEGIN
  RAISE NOTICE 'Recreating the constraint to allow null values...';
  
  BEGIN
    ALTER TABLE game_records ADD CONSTRAINT game_records_player2_id_fkey 
      FOREIGN KEY (player2_id) REFERENCES auth.users(id) ON DELETE SET NULL;
    RAISE NOTICE 'Successfully recreated the constraint with ON DELETE SET NULL';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error recreating constraint: %', SQLERRM;
  END;
END $$;

-- Step 4: Verify the fix
DO $$
BEGIN
  RAISE NOTICE 'Verifying the fix...';
  
  -- Check if the constraint now allows null values
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_name = 'game_records_player2_id_fkey'
    AND kcu.column_name = 'player2_id'
    AND kcu.is_nullable = 'YES'
  ) THEN
    RAISE NOTICE 'SUCCESS: Constraint now allows null values for player2_id';
    RAISE NOTICE 'Single-player games should now save correctly!';
  ELSE
    RAISE NOTICE 'WARNING: Constraint still does not allow null values';
  END IF;
END $$; 