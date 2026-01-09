-- Fix RLS Policies for Uptime App
-- Since we're not using Supabase Auth (we use TikTok OAuth directly),
-- we need to allow public access for app operations

-- ============================================
-- DROP EXISTING RESTRICTIVE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users are viewable by everyone" ON users;
DROP POLICY IF EXISTS "Users can update own record" ON users;
DROP POLICY IF EXISTS "Daily posts are viewable by everyone" ON daily_posts;
DROP POLICY IF EXISTS "User stats are viewable by everyone" ON user_stats;

-- ============================================
-- NEW POLICIES - Allow app to read/write
-- ============================================

-- Users table: Allow all operations from the app
-- In production, you might want to add API key validation via Edge Functions
CREATE POLICY "Allow public read on users" ON users
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert on users" ON users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on users" ON users
  FOR UPDATE USING (true);

-- Daily posts: Allow app to manage posts
CREATE POLICY "Allow public read on daily_posts" ON daily_posts
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert on daily_posts" ON daily_posts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on daily_posts" ON daily_posts
  FOR UPDATE USING (true);

-- User stats: Allow app to manage stats
CREATE POLICY "Allow public read on user_stats" ON user_stats
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert on user_stats" ON user_stats
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on user_stats" ON user_stats
  FOR UPDATE USING (true);

-- Waitlist: Allow public insert (for landing page signups)
DROP POLICY IF EXISTS "Allow waitlist signups" ON waitlist;

CREATE POLICY "Allow public read on waitlist" ON waitlist
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert on waitlist" ON waitlist
  FOR INSERT WITH CHECK (true);

-- ============================================
-- NOTE: Security Considerations
-- ============================================
-- This setup allows any client with the publishable key to read/write.
-- For production, consider:
-- 1. Using Supabase Edge Functions as an API layer with validation
-- 2. Adding rate limiting via Supabase's built-in features
-- 3. Validating TikTok tokens server-side before allowing writes
-- 
-- For MVP/development, this permissive policy is acceptable.

