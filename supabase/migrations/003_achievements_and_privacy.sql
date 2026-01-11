-- Migration: Add achievements and privacy settings
-- This adds:
-- 1. is_public column to users table (for leaderboard visibility)
-- 2. user_achievements table to track earned achievements

-- ============================================
-- ADD PRIVACY SETTING TO USERS
-- ============================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT true;

-- Update leaderboard view to respect privacy setting
DROP VIEW IF EXISTS leaderboard;

CREATE OR REPLACE VIEW leaderboard AS
SELECT 
  u.id,
  u.tiktok_user_id,
  u.tiktok_handle,
  u.display_name,
  u.avatar_url,
  u.is_public,
  COALESCE(s.current_streak, 0) as current_streak,
  COALESCE(s.longest_streak, 0) as longest_streak,
  COALESCE(s.uptime_30d, 0) as uptime_30d,
  COALESCE(s.days_posted_30d, 0) as days_posted_30d,
  COALESCE(s.total_posts, 0) as total_posts,
  s.last_post_date,
  s.last_synced_at,
  RANK() OVER (ORDER BY COALESCE(s.current_streak, 0) DESC) as rank_by_streak,
  RANK() OVER (ORDER BY COALESCE(s.uptime_30d, 0) DESC) as rank_by_uptime
FROM users u
LEFT JOIN user_stats s ON u.id = s.user_id
WHERE u.is_public = true  -- Only include public profiles
ORDER BY COALESCE(s.current_streak, 0) DESC;

-- ============================================
-- CREATE ACHIEVEMENTS TABLE
-- ============================================

-- Achievement definitions (what achievements exist)
CREATE TABLE IF NOT EXISTS achievements (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,  -- Ionicons icon name
  color text NOT NULL, -- Hex color for the badge
  requirement_type text NOT NULL, -- 'streak', 'total_posts', 'uptime', 'rank'
  requirement_value int NOT NULL, -- The value needed to unlock
  created_at timestamptz DEFAULT now()
);

-- User achievements (which achievements each user has earned)
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id text NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at timestamptz DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);

-- ============================================
-- INSERT DEFAULT ACHIEVEMENTS
-- ============================================

INSERT INTO achievements (id, name, description, icon, color, requirement_type, requirement_value) VALUES
  ('first_streak', 'First Streak', 'Start your first posting streak', 'flame', '#FF6B6B', 'streak', 1),
  ('streak_7', '7 Day Streak', 'Post for 7 consecutive days', 'calendar', '#4ECDC4', 'streak', 7),
  ('streak_30', '30 Day Streak', 'Post for 30 consecutive days', 'star', '#A855F7', 'streak', 30),
  ('streak_100', 'Century Streak', 'Post for 100 consecutive days', 'diamond', '#FFD700', 'streak', 100),
  ('posts_10', 'Getting Started', 'Post 10 videos total', 'videocam', '#00F2EA', 'total_posts', 10),
  ('posts_50', 'Content Creator', 'Post 50 videos total', 'film', '#FF8C00', 'total_posts', 50),
  ('posts_100', 'Video Master', 'Post 100 videos total', 'rocket', '#00D4AA', 'total_posts', 100),
  ('top_10', 'Top 10', 'Reach top 10 on the leaderboard', 'trophy', '#FFE66D', 'rank', 10),
  ('top_1', 'Champion', 'Reach #1 on the leaderboard', 'medal', '#FF0050', 'rank', 1)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- RLS POLICIES FOR NEW TABLES
-- ============================================

ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Achievements are read-only for everyone
CREATE POLICY "Allow public read on achievements" ON achievements
  FOR SELECT USING (true);

-- User achievements can be read and written by the app
CREATE POLICY "Allow public read on user_achievements" ON user_achievements
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert on user_achievements" ON user_achievements
  FOR INSERT WITH CHECK (true);

-- ============================================
-- FUNCTION TO CHECK AND AWARD ACHIEVEMENTS
-- ============================================

CREATE OR REPLACE FUNCTION check_and_award_achievements(p_user_id uuid)
RETURNS void AS $$
DECLARE
  v_stats RECORD;
  v_rank int;
  v_achievement RECORD;
BEGIN
  -- Get user stats
  SELECT * INTO v_stats FROM user_stats WHERE user_id = p_user_id;
  
  -- Get user's current rank by streak
  SELECT rank_by_streak INTO v_rank FROM leaderboard WHERE id = p_user_id;
  
  -- Check each achievement
  FOR v_achievement IN SELECT * FROM achievements LOOP
    -- Skip if already earned
    IF EXISTS (SELECT 1 FROM user_achievements WHERE user_id = p_user_id AND achievement_id = v_achievement.id) THEN
      CONTINUE;
    END IF;
    
    -- Check if requirement is met
    CASE v_achievement.requirement_type
      WHEN 'streak' THEN
        IF COALESCE(v_stats.current_streak, 0) >= v_achievement.requirement_value OR 
           COALESCE(v_stats.longest_streak, 0) >= v_achievement.requirement_value THEN
          INSERT INTO user_achievements (user_id, achievement_id) VALUES (p_user_id, v_achievement.id);
        END IF;
      WHEN 'total_posts' THEN
        IF COALESCE(v_stats.total_posts, 0) >= v_achievement.requirement_value THEN
          INSERT INTO user_achievements (user_id, achievement_id) VALUES (p_user_id, v_achievement.id);
        END IF;
      WHEN 'rank' THEN
        IF v_rank IS NOT NULL AND v_rank <= v_achievement.requirement_value THEN
          INSERT INTO user_achievements (user_id, achievement_id) VALUES (p_user_id, v_achievement.id);
        END IF;
    END CASE;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

