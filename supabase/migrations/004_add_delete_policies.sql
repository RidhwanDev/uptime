-- Migration: Add secure account deletion function
-- Since we use TikTok OAuth (not Supabase Auth), we need a function-based approach
-- to ensure users can only delete their own accounts

-- ============================================
-- SECURE ACCOUNT DELETION FUNCTION
-- ============================================

-- Function to delete user account with validation
-- This ensures users can only delete their own account by requiring both
-- user_id and tiktok_user_id, and validating they match
CREATE OR REPLACE FUNCTION delete_user_account(
  p_user_id UUID,
  p_tiktok_user_id TEXT
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_record RECORD;
BEGIN
  -- Verify that the user_id exists in the database
  -- and fetch the tiktok_user_id for validation
  SELECT id, tiktok_user_id INTO v_user_record
  FROM users
  WHERE id = p_user_id;

  -- If user doesn't exist (by ID), return unauthorized
  IF v_user_record.id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized code: 1';
  END IF;

  -- Verify the database ID exists and matches (double-check the record exists)
  IF v_user_record.id != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized code: 2';
  END IF;

  -- Verify the tiktok_user_id matches the record in the database
  IF v_user_record.tiktok_user_id IS NULL OR v_user_record.tiktok_user_id != p_tiktok_user_id THEN
    RAISE EXCEPTION 'Unauthorized code: 3';
  END IF;

  -- If all validations pass, delete the user
  -- This will cascade delete:
  -- - daily_posts (via ON DELETE CASCADE)
  -- - user_stats (via ON DELETE CASCADE)
  -- - user_achievements (via ON DELETE CASCADE)
  -- The user will also be removed from the leaderboard view automatically
  DELETE FROM users WHERE id = p_user_id;

  -- Return true if deletion was successful
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error internally but return generic unauthorized message
    RAISE WARNING 'Error deleting user account: %', SQLERRM;
    RAISE EXCEPTION 'Unauthorized code: 4';
END;
$$;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Note: Since we're using a function with SECURITY DEFINER, the function
-- bypasses RLS. The function itself validates ownership before deletion.
-- 
-- Cascade deletion of related records (daily_posts, user_stats, user_achievements)
-- happens at the database constraint level, not through RLS, so no DELETE policies
-- are needed for those tables.
--
-- The users table doesn't need a DELETE policy because:
-- 1. The function uses SECURITY DEFINER to bypass RLS
-- 2. The function validates ownership before deletion
-- 3. Direct DELETE operations on users table are not allowed (no public policy)

-- ============================================
-- NOTE: Security Model
-- ============================================
-- Since we use TikTok OAuth (not Supabase Auth), we can't use auth.uid() in RLS.
-- Instead, we use a SECURITY DEFINER function that:
-- 1. Requires both user_id and tiktok_user_id as parameters
-- 2. Validates they match before allowing deletion
-- 3. Only deletes the user's own account
--
-- The client must provide both IDs, ensuring users can only delete their own accounts.
-- The leaderboard is a VIEW, so deleting the user automatically removes them from it.

