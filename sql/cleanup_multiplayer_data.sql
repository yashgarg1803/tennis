-- Cleanup script for multiplayer data issues
-- This will clean up any problematic data that might be causing the 406 errors and round issues

-- Step 1: Clean up orphaned moves (moves without corresponding rooms)
DELETE FROM game_moves 
WHERE room_id NOT IN (SELECT id FROM game_rooms);

-- Step 2: Clean up moves from finished games
DELETE FROM game_moves 
WHERE room_id IN (
  SELECT id FROM game_rooms WHERE status = 'finished'
);

-- Step 3: Clean up duplicate moves for the same player in the same round
-- Use a window function approach instead of MIN() for UUID
DELETE FROM game_moves 
WHERE id IN (
  SELECT id FROM (
    SELECT id, 
           ROW_NUMBER() OVER (
             PARTITION BY room_id, player_id, round_number 
             ORDER BY timestamp ASC
           ) as rn
    FROM game_moves
  ) ranked
  WHERE rn > 1
);

-- Step 4: Reset any rooms that are stuck in a bad state
UPDATE game_rooms 
SET round_status = 'waiting',
    current_round = 1,
    updated_at = NOW()
WHERE status = 'playing' 
AND round_status NOT IN ('waiting', 'player1_moved', 'player2_moved', 'resolved');

-- Step 5: Clean up any rooms that have been abandoned
DELETE FROM game_rooms 
WHERE updated_at < NOW() - INTERVAL '2 hours'
AND status = 'waiting';

-- Step 6: Verify the cleanup
DO $$
DECLARE
  orphaned_moves_count INTEGER;
  finished_game_moves_count INTEGER;
  duplicate_moves_count INTEGER;
  stuck_rooms_count INTEGER;
BEGIN
  -- Count orphaned moves
  SELECT COUNT(*) INTO orphaned_moves_count
  FROM game_moves 
  WHERE room_id NOT IN (SELECT id FROM game_rooms);
  
  -- Count moves from finished games
  SELECT COUNT(*) INTO finished_game_moves_count
  FROM game_moves 
  WHERE room_id IN (SELECT id FROM game_rooms WHERE status = 'finished');
  
  -- Count duplicate moves
  SELECT COUNT(*) INTO duplicate_moves_count
  FROM (
    SELECT room_id, player_id, round_number, COUNT(*)
    FROM game_moves 
    GROUP BY room_id, player_id, round_number
    HAVING COUNT(*) > 1
  ) duplicates;
  
  -- Count stuck rooms
  SELECT COUNT(*) INTO stuck_rooms_count
  FROM game_rooms 
  WHERE status = 'playing' 
  AND round_status NOT IN ('waiting', 'player1_moved', 'player2_moved', 'resolved');
  
  RAISE NOTICE 'Cleanup completed:';
  RAISE NOTICE '- Orphaned moves: %', orphaned_moves_count;
  RAISE NOTICE '- Moves from finished games: %', finished_game_moves_count;
  RAISE NOTICE '- Duplicate moves: %', duplicate_moves_count;
  RAISE NOTICE '- Stuck rooms: %', stuck_rooms_count;
  
  IF orphaned_moves_count = 0 AND finished_game_moves_count = 0 AND 
     duplicate_moves_count = 0 AND stuck_rooms_count = 0 THEN
    RAISE NOTICE 'All cleanup checks passed!';
  ELSE
    RAISE NOTICE 'Some issues remain - consider running the script again';
  END IF;
END $$; 