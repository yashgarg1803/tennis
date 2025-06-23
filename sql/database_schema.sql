-- Reset database (run this first to clear existing data)
DROP TABLE IF EXISTS game_moves CASCADE;
DROP TABLE IF EXISTS games CASCADE;
DROP TABLE IF EXISTS game_rooms CASCADE;
DROP TABLE IF EXISTS user_stats CASCADE;
DROP TABLE IF EXISTS friends CASCADE;

-- Create tables
CREATE TABLE user_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  games_played INTEGER DEFAULT 0,
  games_won INTEGER DEFAULT 0,
  total_troops_deployed INTEGER DEFAULT 0,
  total_rounds_won INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE friends (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  friend_id UUID NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

CREATE TABLE game_rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_code TEXT NOT NULL UNIQUE,
  player1_id UUID,
  player1_name TEXT,
  player2_id UUID,
  player2_name TEXT,
  game_state JSONB,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'finished')),
  config JSONB DEFAULT '{"startingTroops": 100, "maxRounds": 10}',
  current_round INTEGER DEFAULT 1,
  round_status TEXT DEFAULT 'waiting' CHECK (round_status IN ('waiting', 'player1_moved', 'player2_moved', 'resolved')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE game_moves (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES game_rooms(id) ON DELETE CASCADE,
  player_id UUID NOT NULL,
  round_number INTEGER NOT NULL,
  troops INTEGER NOT NULL CHECK (troops >= 0),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(room_id, player_id, round_number)
);

CREATE TABLE games (
  id TEXT PRIMARY KEY,
  player1_id UUID NOT NULL,
  player2_id UUID NOT NULL,
  player1_name TEXT NOT NULL,
  player2_name TEXT NOT NULL,
  starting_troops INTEGER NOT NULL,
  winner TEXT CHECK (winner IN ('player1', 'player2', null)),
  rounds JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  finished_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX idx_user_stats_user_id ON user_stats(user_id);
CREATE INDEX idx_friends_user_id ON friends(user_id);
CREATE INDEX idx_friends_friend_id ON friends(friend_id);
CREATE INDEX idx_friends_status ON friends(status);
CREATE INDEX idx_game_rooms_room_code ON game_rooms(room_code);
CREATE INDEX idx_game_rooms_player1_id ON game_rooms(player1_id);
CREATE INDEX idx_game_rooms_player2_id ON game_rooms(player2_id);
CREATE INDEX idx_game_rooms_status ON game_rooms(status);
CREATE INDEX idx_game_moves_room_id ON game_moves(room_id);
CREATE INDEX idx_game_moves_player_id ON game_moves(player_id);
CREATE INDEX idx_game_moves_round ON game_moves(room_id, round_number);
CREATE INDEX idx_games_player1_id ON games(player1_id);
CREATE INDEX idx_games_player2_id ON games(player2_id);
CREATE INDEX idx_games_created_at ON games(created_at);

-- Enable Row Level Security
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_moves ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_stats
CREATE POLICY "Users can view their own stats" ON user_stats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stats" ON user_stats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stats" ON user_stats
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for friends
CREATE POLICY "Users can view their own friend relationships" ON friends
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can insert friend requests" ON friends
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own friend relationships" ON friends
  FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can delete their own friend relationships" ON friends
  FOR DELETE USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- RLS Policies for game_rooms
CREATE POLICY "Users can view rooms they're in" ON game_rooms
  FOR SELECT USING (
    auth.uid() = player1_id OR 
    auth.uid() = player2_id OR 
    status = 'waiting'
  );

CREATE POLICY "Users can create rooms" ON game_rooms
  FOR INSERT WITH CHECK (auth.uid() = player1_id);

CREATE POLICY "Users can update rooms they're in" ON game_rooms
  FOR UPDATE USING (
    auth.uid() = player1_id OR 
    auth.uid() = player2_id
  );

CREATE POLICY "Users can delete rooms they created" ON game_rooms
  FOR DELETE USING (auth.uid() = player1_id);

-- RLS Policies for game_moves
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

CREATE POLICY "Users can view all moves" ON game_moves
  FOR SELECT USING (true);

-- RLS Policies for games
CREATE POLICY "Users can view games they played in" ON games
  FOR SELECT USING (
    auth.uid() = player1_id OR 
    auth.uid() = player2_id
  );

CREATE POLICY "Users can insert games they played in" ON games
  FOR INSERT WITH CHECK (
    auth.uid() = player1_id OR 
    auth.uid() = player2_id
  );

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_stats_updated_at BEFORE UPDATE ON user_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_friends_updated_at BEFORE UPDATE ON friends
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_game_rooms_updated_at BEFORE UPDATE ON game_rooms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to clean up old rooms
CREATE OR REPLACE FUNCTION cleanup_old_rooms()
RETURNS void AS $$
BEGIN
  DELETE FROM game_rooms 
  WHERE updated_at < NOW() - INTERVAL '1 hour'
  AND status = 'waiting';
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean up old rooms (if using pg_cron)
-- SELECT cron.schedule('cleanup-old-rooms', '0 * * * *', 'SELECT cleanup_old_rooms();'); 