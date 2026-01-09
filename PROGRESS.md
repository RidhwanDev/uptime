# Uptime - Development Progress

**Last Updated:** Jan 9, 2026  
**Status:** 🟡 In Development

---

## ✅ Completed

### Foundation & Setup

- ✅ Project initialized with Expo and React Native
- ✅ TypeScript configuration set up
- ✅ Design system implemented:
  - Color palette - Deep Indigo theme (`src/theme/colors.ts`)
  - Typography system (`src/theme/typography.ts`)
  - Spacing system (`src/theme/spacing.ts`)
- ✅ Basic component library started:
  - Button component
  - Card component
  - Input component

### Navigation & Routing

- ✅ Migrated from React Navigation to **Expo Router** (file-based routing)
- ✅ Root layout with authentication-based routing (`app/_layout.tsx`)
- ✅ Tab navigation structure created:
  - Dashboard tab
  - Leaderboard tab
  - Featured tab
  - Profile tab
- ✅ Tab bar icons changed from emojis to actual icons (Ionicons)
- ✅ Login screen separated from tab navigation (full-page)

### Authentication

- ✅ AuthContext created for global authentication state management
- ✅ Secure token storage using `expo-secure-store`
- ✅ Login screen UI implemented (`app/login.tsx`)
- ✅ TikTok OAuth flow with PKCE (`src/services/tiktokAuth.ts`)
- ✅ Manual URL paste fallback for Expo Go development
- ✅ **DEV ONLY**: Bypass login button added for development/testing

### Dashboard (Home)

- ✅ Personalized greeting with dynamic messages based on streak
- ✅ Hero streak card with gradient design
- ✅ **Activity calendar** - 3-week grid showing posting history
- ✅ Quick stats row (Uptime %, Days Posted, Best Streak)
- ✅ Recent posts horizontal scroll with video thumbnails
- ✅ Tap videos to open in TikTok app
- ✅ Pull-to-refresh functionality
- ✅ TikTok Video List API integration (`src/services/tiktokVideos.ts`)

### Leaderboard UI

- ✅ Podium for top 3 creators (gold/silver/bronze)
- ✅ Sort options (Streak, Uptime, Posts)
- ✅ Ranking list for positions 4-10
- ✅ "Your Position" card at bottom
- ✅ Mock data for testing

### Featured Page UI

- ✅ "Video of the Week" placeholder section
- ✅ "How to Get Featured" guide
- ✅ "Creator Interviews" (Coming Soon) teaser cards
- ✅ "Hall of Fame" for past featured creators
- ✅ "Notify Me" button for interview launches

### Profile Page UI

- ✅ User avatar with rank badge
- ✅ 2x2 stats grid (gradient cards)
- ✅ Achievements section (horizontal scroll, locked/unlocked)
- ✅ Settings menu with navigation items
- ✅ Logout with confirmation dialog

### Supabase Integration ✅

- ✅ Database schema created (`supabase/schema.sql`)
  - `users` table with TikTok OAuth tokens
  - `daily_posts` for tracking post dates
  - `user_stats` for cached leaderboard data
  - `waitlist` for landing page signups
  - `leaderboard` view with rankings
  - `calculate_user_stats` function
- ✅ Supabase client setup (`src/lib/supabase.ts`)
- ✅ Database types (`src/lib/database.types.ts`)
- ✅ Sync service (`src/services/supabaseSync.ts`)
  - `upsertUser` - saves user on login
  - `syncVideosToDatabase` - syncs TikTok videos to daily_posts
  - `recalculateUserStats` - triggers stats calculation
  - `fetchLeaderboard` - gets ranked users
  - `getUserRank` - gets current user's position
- ✅ AuthContext integration - saves users to Supabase on login
- ✅ Dashboard sync - syncs videos to Supabase when loaded

### Landing Page (ridhwan.io/uptime)

- ✅ Beautiful landing page with app theme
- ✅ App screenshots (Dashboard, Leaderboard, Profile)
- ✅ Feature cards
- ✅ "How it Works" section
- ✅ Waitlist form (Formspree integration)
- ✅ Responsive design (mobile + desktop)
- ✅ Dark theme matching app

---

## 🟡 In Progress

### Supabase Configuration

**Status:** 🟡 Needs Supabase Project Setup

**To Do:**

1. ✅ Create Supabase project at supabase.com
2. Run `supabase/schema.sql` in SQL Editor
3. ✅ Add credentials to `.env`:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your-project-url
   EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
   ```
4. Test login → user should appear in `users` table
5. Test dashboard → posts should sync to `daily_posts`

---

## 📋 Next Steps

### Immediate

1. **Configure Supabase Project** 🔴

   - Create project
   - Run schema
   - Add env vars
   - Test sync

2. **Connect Leaderboard to Real Data**
   - Replace mock data with `fetchLeaderboard()`
   - Show real user rankings
   - Add "last synced" indicator

### Short Term

3. **Data Freshness Solution**

   **Problem:** If User B doesn't log in, their data gets stale on leaderboard.

   **Options:**

   - A) Show "last synced" per user (quick fix)
   - B) Edge Function for server-side refresh (robust)
   - C) Incentivize daily app opens (product fix)

   **Current approach:** Start with (A), plan for (B)

4. **Profile Stats from Supabase**
   - Replace mock stats with real data
   - Show rank from leaderboard

### Medium Term

5. **Supabase Edge Functions**

   - Scheduled job to refresh all users
   - Token refresh handling
   - Stats recalculation

6. **Push Notifications**
   - Daily posting reminders
   - Streak milestones

### Long Term

7. **Featured Video System**

   - Selection algorithm
   - Weekly rotation

8. **Creator Interviews**
   - Video/audio content
   - Featured creator profiles

---

## 🏗️ Architecture

### Current (With Supabase)

```
┌─────────────────┐         ┌─────────────────┐
│   React Native  │         │    Supabase     │
│   (Expo)        │◄───────►│    Database     │
├─────────────────┤         ├─────────────────┤
│ TikTok OAuth    │         │ users           │
│ Supabase Client │         │ daily_posts     │
│ Secure Store    │         │ user_stats      │
│                 │         │ leaderboard view│
└─────────────────┘         └─────────────────┘
         │
         │
         ▼
    TikTok API
    (Video List)
```

### Data Flow

```
1. User logs in with TikTok
   └─► Save to local SecureStore
   └─► Upsert to Supabase `users` table

2. User opens Dashboard
   └─► Fetch videos from TikTok API
   └─► Calculate local stats
   └─► Background sync to Supabase:
       └─► Insert to `daily_posts` (one per day)
       └─► Recalculate `user_stats`

3. User opens Leaderboard
   └─► Fetch from `leaderboard` view
   └─► Show rankings from all users
   └─► Show "last synced" timestamp
```

---

## 🐛 Known Issues

1. **TikTok OAuth in Expo Go** 🟡

   - `auth.expo.io` proxy shows "Forbidden"
   - Workaround: Manual URL paste implemented
   - Long-term: Use development build with custom scheme

2. **Node.js Version**

   - Some packages require Node 20+
   - Current: Node 18.16.1
   - Recommend upgrading to Node 20 LTS

3. **Data Freshness** 🟡
   - Users who don't log in daily have stale leaderboard data
   - Solution: Edge Function for server-side refresh (planned)

---

## 📝 Key Files

### Screens

- `app/(tabs)/dashboard.tsx` - Home with stats & calendar
- `app/(tabs)/leaderboard.tsx` - Rankings UI (mock data)
- `app/(tabs)/featured.tsx` - Featured video & interviews
- `app/(tabs)/profile.tsx` - User profile & settings
- `app/login.tsx` - Login screen

### Services

- `src/services/tiktokAuth.ts` - TikTok OAuth
- `src/services/tiktokVideos.ts` - Video fetching & stats
- `src/services/supabaseSync.ts` - Supabase data sync

### Database

- `supabase/schema.sql` - Full database schema
- `src/lib/supabase.ts` - Supabase client
- `src/lib/database.types.ts` - TypeScript types

### Context

- `src/contexts/AuthContext.tsx` - Auth state (+ Supabase sync)

### Theme

- `src/theme/colors.ts` - Deep Indigo palette
- `src/theme/typography.ts` - Font sizes
- `src/theme/spacing.ts` - Spacing scale

---

## 🔐 Environment Variables

```env
# TikTok OAuth
EXPO_PUBLIC_TIKTOK_CLIENT_KEY=your-client-key
EXPO_PUBLIC_TIKTOK_CLIENT_SECRET=your-client-secret

# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

---

## 🎯 Current Focus

**Primary:** Configure Supabase project and test sync  
**Next:** Connect leaderboard to real Supabase data  
**Later:** Edge Functions for server-side data refresh

---

_Last updated: Jan 9, 2026_
