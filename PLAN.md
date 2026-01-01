# Project: Uptime (v0) — Social Attendance for Creators

## Goal

Build a **React Native mobile app** called **Uptime** that helps creators commit to a **daily posting schedule**, tracks whether they met it, ranks users on a leaderboard, and runs a weekly job to pick and feature the best-performing video among eligible users. The reward is **visibility/promotion**, not money.

## Design Philosophy

- **Beautiful & Modern**: Design should appeal to TikTok creators with smooth animations, vibrant colors, and engaging visuals
- **User-Friendly**: Intuitive navigation, clear feedback, delightful micro-interactions
- **Performant**: Fast load times, smooth scrolling, optimized rendering, efficient data fetching
- **Mobile-First**: Built for iOS and Android with native feel

## Core Concept

- Users log in with their TikTok account via OAuth.
- Users commit to posting **daily** (v0 only - custom schedules coming later).
- The app automatically verifies posting by using TikTok APIs to fetch the user's posts and check for new daily content.
- If they meet their daily schedule, they keep their "uptime streak" / eligibility.
- Weekly, the system selects top content from users who met their commitment and features it publicly.

## v0 Constraints / Decisions

- **Daily posting only** - Custom schedules (2x/week, weekdays-only, etc.) will be added in future versions
- **TikTok OAuth integration** - Users authenticate with TikTok and grant permissions to access their video data
- Use TikTok APIs to fetch user posts and engagement metrics
- Handle API rate limits and token refresh properly
- If automatic verification fails, show "Needs verification" but do NOT immediately punish/reset (avoid false negatives).
- Keep the UI simple. No DMs, no payments, no complex analytics.

## User Stories (v0)

1. As a user, I can sign up/login with my TikTok account (OAuth).
2. As a user, I can set my timezone after connecting my TikTok account.
3. As a user, I commit to posting **daily** (v0 only).
4. As a user, I can see:
   - my current daily posting commitment
   - my current day progress (did I post today?)
   - my eligibility status
   - my "uptime" metric (% compliance over last 30 days) and consecutive successful days (streak)
5. As a visitor, I can view a leaderboard.
6. As a visitor, I can view the "Featured of the Week" video.

## Verification Approach (v0)

- Users authenticate with TikTok via OAuth and grant permissions to access their video data.
- Store TikTok OAuth tokens (access token, refresh token) securely for each user.
- A scheduled job runs (e.g. hourly or 2–4 times/day) to fetch each user's posts via TikTok API.
- Use TikTok API endpoints to get user's video list with publish dates, engagement metrics (likes, views).
- Store each detected post (url, posted_at, fetched_at, like_count, view_count).
- Determine if a post counts toward the user's current schedule window (daily check).
- Handle token refresh automatically when access tokens expire.

## Scheduling Model (v0)

- Schedule type: **DAILY only** (v0)
- Windows:
  - Use user timezone.
  - Daily schedules use calendar day in user timezone (midnight to midnight).
- Compliance:
  - For DAILY: must have ≥1 post per day.
  - Each day is evaluated independently.
  - Streak = consecutive days with ≥1 post.

## Leaderboard (v0)

- Rank by:
  1. Current “eligible” status (eligible users above ineligible)
  2. Uptime % over last 30 days (descending)
  3. Total successful periods (descending)
- Show: handle, schedule, uptime %, current streak/success count, last verified post time.

## Weekly Feature Job (v0)

- Every week (e.g. Sunday 8pm UK time):
  - Find users who met their schedule in that week (eligible).
  - For each eligible user, fetch their videos from that week via TikTok API.
  - Select their best video that week based on engagement metrics (likes, views) from the API.
  - Save the featured video and show it on homepage + dedicated page.

## Tech Stack

- **Frontend**: React Native (Expo) + TypeScript
- **Backend**: Node.js/Express or Supabase (backend-as-a-service)
- **Database**: Postgres (Supabase) + Prisma OR Supabase client
- **Auth**: TikTok OAuth + Supabase Auth or Clerk (for app user accounts)
- **TikTok Integration**: TikTok Login Kit SDK / TikTok API (for fetching user videos and data)
- **Cron**: Supabase scheduled functions or separate cron service
- **UI**: React Native components with beautiful animations (React Native Reanimated, React Native Gesture Handler)
- **Styling**: StyleSheet with design system, consider NativeWind (Tailwind for RN) or Styled Components
- **State Management**: React Context + hooks or Zustand/Redux Toolkit
- **Navigation**: React Navigation

## Data Model (v0)

- users: id, created_at
- profiles: user_id, tiktok_user_id, tiktok_handle, timezone, created_at, updated_at
- tiktok_tokens: user_id, access_token (encrypted), refresh_token (encrypted), expires_at, created_at, updated_at
- schedules: user_id, type (DAILY), active_from, active_to
- posts: id, user_id, platform, tiktok_video_id, url, posted_at, fetched_at, like_count, view_count, raw_json?
- compliance_days: id, user_id, date (date in user timezone), has_post (boolean), verified_at
- featured: id, period_start, period_end, user_id, post_id, created_at

## UI Screens (v0)

- **Onboarding Flow**: Welcome → Sign Up/Login → TikTok OAuth Login → Timezone Selection
- **Home/Dashboard**:
  - Today's status (did I post today?)
  - Current streak counter
  - Uptime % (last 30 days)
  - Quick access to featured video
- **Profile**: Personal stats, schedule info, recent verified posts
- **Leaderboard**: Ranked list of users (by eligibility, uptime %, streak)
- **Featured**: Weekly featured video detail view
- **Settings**: Reconnect TikTok account, timezone, account settings

## Non-goals (v0)

- No direct posting from app
- No custom schedules (daily only)
- No payments
- No social feeds
- No complex moderation (just basic reporting later)

## Build Plan - Video Segments

Each segment is designed to be demo-able in a 30-second TikTok video. Features can be bundled together or split into separate videos as needed.

### Segment 1: Project Setup & Design System

**Video Focus**: "Setting up our React Native app with a beautiful design system"

- Initialize React Native (Expo) project
- Set up TypeScript
- Create design system (colors, typography, spacing)
- Build reusable UI components (Button, Card, Input, etc.)
- Set up navigation structure
- **Demo**: Show beautiful component library and navigation flow

### Segment 2: Authentication Flow

**Video Focus**: "Building smooth auth with beautiful onboarding"

- Set up authentication (Supabase Auth or Clerk)
- Create welcome/onboarding screens
- Build sign up/login screens with smooth animations
- Add form validation and error handling
- **Demo**: Show onboarding flow and login/signup

### Segment 3: TikTok OAuth Integration

**Video Focus**: "Connecting TikTok accounts with OAuth"

- Integrate TikTok Login Kit SDK or OAuth flow
- Create TikTok login screen/button
- Handle OAuth callback and token storage
- Fetch user profile data (handle, user ID) from TikTok API
- Add timezone picker after TikTok connection
- Save tokens and profile to backend/database (encrypt tokens)
- **Demo**: Show TikTok OAuth flow and successful connection

### Segment 4: Daily Commitment & Dashboard UI

**Video Focus**: "Creating the main dashboard with daily tracking"

- Create dashboard/home screen layout
- Add daily commitment display (visual indicator)
- Build "Today's Status" card (did I post today?)
- Add streak counter with animations
- **Demo**: Show dashboard with daily commitment UI

### Segment 5: Backend Setup & Database Schema

**Video Focus**: "Setting up our backend and database"

- Set up backend service (Supabase or Express)
- Create database schema (users, profiles, schedules, posts, compliance_days)
- Set up API endpoints for profile CRUD
- **Demo**: Show database structure and API working

### Segment 6: TikTok API Integration & Post Fetching

**Video Focus**: "Fetching user posts via TikTok API"

- Set up TikTok API client/service
- Implement token refresh logic for expired access tokens
- Build service to fetch user's videos via TikTok API
- Parse video data (publish date, engagement metrics, URLs)
- Store posts in database with proper metadata
- Add rate limiting and error handling for API calls
- **Demo**: Show API fetching posts and storing them (can use mock data for video)

### Segment 7: Daily Compliance Tracking

**Video Focus**: "Tracking if users posted every day"

- Build compliance calculation logic (daily check)
- Update dashboard with real compliance status
- Calculate streak and uptime %
- Add visual indicators for compliance status
- **Demo**: Show dashboard updating with compliance data

### Segment 8: Leaderboard Screen

**Video Focus**: "Building a competitive leaderboard"

- Create leaderboard screen UI
- Implement ranking algorithm (eligibility → uptime % → streak)
- Add smooth scrolling and animations
- Connect to backend data
- **Demo**: Show leaderboard with rankings

### Segment 9: Weekly Featured Video System

**Video Focus**: "Picking and featuring the best video each week"

- Build weekly feature selection job/logic
- Create featured video screen
- Add featured video to homepage
- **Demo**: Show featured video selection and display

### Segment 10: Polish & Performance

**Video Focus**: "Making it fast and beautiful"

- Add loading states and skeletons
- Optimize rendering and data fetching
- Add smooth animations throughout
- Polish UI/UX details
- Performance testing and optimization
- **Demo**: Show smooth, polished app experience

---

## Video Bundling Options

**Quick Wins (Single Videos)**:

- Segment 1: Design system setup
- Segment 2: Auth flow
- Segment 3: Profile setup
- Segment 4: Dashboard UI

**Feature Completions (Can Bundle)**:

- Segments 2+3: "Complete onboarding flow" (auth + TikTok OAuth)
- Segments 4+7: "Daily tracking working" (UI + compliance logic)
- Segments 5+6: "Backend infrastructure" (database + TikTok API integration)

**Milestone Videos**:

- Segments 1-4: "MVP UI Complete"
- Segments 5-7: "Core functionality working"
- Segments 8-9: "Social features added"
- Segment 10: "Launch ready!"

## Important

- **Security**: Always encrypt TikTok OAuth tokens (access_token, refresh_token) in the database
- **Token Management**: Implement proper token refresh logic to handle expired access tokens automatically
- **API Rate Limits**: Respect TikTok API rate limits and implement proper queuing/backoff strategies
- **Error Handling**: Handle API failures gracefully - don't penalize users for temporary API issues
- **Abstraction**: Use an interface like `TikTokProvider` with `fetchLatestPosts(userId)` to keep API calls abstracted and testable
