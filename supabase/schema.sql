-- Uptime Database Schema
-- Run this in Supabase SQL Editor

-- ============================================
-- USERS TABLE
-- Stores TikTok user info on first login
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tiktok_user_id TEXT UNIQUE NOT NULL,
  tiktok_handle TEXT,
  avatar_url TEXT,
  timezone TEXT DEFAULT 'UTC',
  
  -- OAuth tokens (for server-side refresh later)
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DAILY POSTS TABLE
-- Records each day a user posted
-- ============================================
CREATE TABLE IF NOT EXISTS daily_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  post_date DATE NOT NULL,
  video_id TEXT,  -- TikTok video ID
  video_url TEXT,
  cover_image_url TEXT,
  verified_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicates: one record per user per day
  UNIQUE(user_id, post_date)
);

-- ============================================
-- USER STATS TABLE
-- Cached stats for fast leaderboard queries
-- Recalculated on each sync
-- ============================================
CREATE TABLE IF NOT EXISTS user_stats (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  
  -- Streak data
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  
  -- 30-day metrics
  uptime_30d DECIMAL(5,2) DEFAULT 0,  -- e.g., 87.50%
  days_posted_30d INT DEFAULT 0,
  
  -- All-time metrics
  total_posts INT DEFAULT 0,
  
  -- Tracking
  last_post_date DATE,
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- WAITLIST TABLE
-- For ridhwan.io/uptime signups
-- ============================================
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  source TEXT DEFAULT 'website',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- For faster queries
-- ============================================
CREATE INDEX IF NOT EXISTS idx_daily_posts_user_date ON daily_posts(user_id, post_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_posts_date ON daily_posts(post_date DESC);
CREATE INDEX IF NOT EXISTS idx_user_stats_streak ON user_stats(current_streak DESC);
CREATE INDEX IF NOT EXISTS idx_user_stats_uptime ON user_stats(uptime_30d DESC);
CREATE INDEX IF NOT EXISTS idx_users_tiktok_id ON users(tiktok_user_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Users can read all users (for leaderboard)
CREATE POLICY "Users are viewable by everyone" ON users
  FOR SELECT USING (true);

-- Users can only update their own record
CREATE POLICY "Users can update own record" ON users
  FOR UPDATE USING (auth.uid()::text = tiktok_user_id);

-- Daily posts are viewable by everyone (leaderboard context)
CREATE POLICY "Daily posts are viewable by everyone" ON daily_posts
  FOR SELECT USING (true);

-- User stats are viewable by everyone (leaderboard)
CREATE POLICY "User stats are viewable by everyone" ON user_stats
  FOR SELECT USING (true);

-- Service role can do anything (for Edge Functions)
-- This is handled by Supabase automatically with service_role key

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update user stats after syncing posts
CREATE OR REPLACE FUNCTION calculate_user_stats(p_user_id UUID)
RETURNS void AS $$
DECLARE
  v_total_posts INT;
  v_days_posted_30d INT;
  v_current_streak INT := 0;
  v_longest_streak INT := 0;
  v_temp_streak INT := 0;
  v_last_date DATE;
  v_current_date DATE;
  v_last_post_date DATE;
  r RECORD;
BEGIN
  -- Get total posts
  SELECT COUNT(*) INTO v_total_posts
  FROM daily_posts
  WHERE user_id = p_user_id;
  
  -- Get days posted in last 30 days
  SELECT COUNT(*) INTO v_days_posted_30d
  FROM daily_posts
  WHERE user_id = p_user_id
    AND post_date >= CURRENT_DATE - INTERVAL '30 days';
  
  -- Get last post date
  SELECT MAX(post_date) INTO v_last_post_date
  FROM daily_posts
  WHERE user_id = p_user_id;
  
  -- Calculate streaks by iterating through dates
  v_current_date := CURRENT_DATE;
  v_last_date := NULL;
  
  FOR r IN (
    SELECT DISTINCT post_date
    FROM daily_posts
    WHERE user_id = p_user_id
    ORDER BY post_date DESC
  ) LOOP
    IF v_last_date IS NULL THEN
      -- First iteration
      IF r.post_date = v_current_date OR r.post_date = v_current_date - 1 THEN
        v_temp_streak := 1;
        v_current_streak := 1;
      ELSE
        v_temp_streak := 1;
      END IF;
    ELSIF v_last_date - r.post_date = 1 THEN
      -- Consecutive day
      v_temp_streak := v_temp_streak + 1;
      IF v_last_date >= v_current_date - 1 THEN
        v_current_streak := v_temp_streak;
      END IF;
    ELSE
      -- Streak broken
      v_longest_streak := GREATEST(v_longest_streak, v_temp_streak);
      v_temp_streak := 1;
    END IF;
    
    v_last_date := r.post_date;
  END LOOP;
  
  v_longest_streak := GREATEST(v_longest_streak, v_temp_streak);
  
  -- Upsert stats
  INSERT INTO user_stats (
    user_id,
    current_streak,
    longest_streak,
    uptime_30d,
    days_posted_30d,
    total_posts,
    last_post_date,
    last_synced_at,
    updated_at
  ) VALUES (
    p_user_id,
    v_current_streak,
    v_longest_streak,
    ROUND((v_days_posted_30d::DECIMAL / 30) * 100, 2),
    v_days_posted_30d,
    v_total_posts,
    v_last_post_date,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    current_streak = EXCLUDED.current_streak,
    longest_streak = EXCLUDED.longest_streak,
    uptime_30d = EXCLUDED.uptime_30d,
    days_posted_30d = EXCLUDED.days_posted_30d,
    total_posts = EXCLUDED.total_posts,
    last_post_date = EXCLUDED.last_post_date,
    last_synced_at = EXCLUDED.last_synced_at,
    updated_at = EXCLUDED.updated_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- VIEWS
-- ============================================

-- Leaderboard view with user info
CREATE OR REPLACE VIEW leaderboard AS
SELECT 
  u.id,
  u.tiktok_user_id,
  u.tiktok_handle,
  u.avatar_url,
  s.current_streak,
  s.longest_streak,
  s.uptime_30d,
  s.days_posted_30d,
  s.total_posts,
  s.last_post_date,
  s.last_synced_at,
  RANK() OVER (ORDER BY s.current_streak DESC, s.uptime_30d DESC) as rank_by_streak,
  RANK() OVER (ORDER BY s.uptime_30d DESC, s.current_streak DESC) as rank_by_uptime
FROM users u
JOIN user_stats s ON u.id = s.user_id
WHERE s.total_posts > 0
ORDER BY s.current_streak DESC, s.uptime_30d DESC;

