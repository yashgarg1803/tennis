-- Temporary script to disable RLS for testing
-- This will help us determine if RLS is causing the 406 errors

-- Disable RLS on game_moves table
ALTER TABLE game_moves DISABLE ROW LEVEL SECURITY;

-- Test query to see if it works now
-- You can run this in the Supabase SQL editor to test:
-- SELECT * FROM game_moves WHERE room_id = '668cdc4f-1c05-443a-b180-d819f777fc0d' AND player_id = 'ec167823-156a-415e-af26-57ae38b53578' AND round_number = 1;

-- If the above works, then RLS was the issue
-- If you want to re-enable RLS later, run:
-- ALTER TABLE game_moves ENABLE ROW LEVEL SECURITY; 