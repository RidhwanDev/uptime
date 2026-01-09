# Uptime - Development Progress

**Last Updated:** Current Session  
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

### Profile

- ✅ User avatar and display name from TikTok
- ✅ Logout functionality

### Configuration

- ✅ App scheme configured (`uptime://`) for deep linking
- ✅ iOS bundle identifier set (`com.uptime.app`)
- ✅ Environment variables setup for TikTok credentials

---

## 🟡 In Progress

### Leaderboard

**Status:** 🟡 UI Design Phase

- Currently has placeholder content
- Need to design leaderboard UI with rankings
- Using mock data initially

---

## 📋 Next Steps

### Immediate (This Session)

1. **Design Leaderboard UI** 🟡
   - Create mock user data
   - Design ranking cards
   - Show streak, uptime %, position

### Short Term

2. **Design Featured Page UI**

   - Weekly featured video display
   - Video player/embed

3. **Enhance Profile Page**
   - Show user stats
   - Settings options

### Medium Term - Backend (Supabase)

4. **Supabase Integration** 📊

   **Why Supabase:**

   - Need to store user data persistently
   - Leaderboard requires aggregated data from all users
   - Can't hit TikTok API for every user on leaderboard (rate limits + auth required)
   - Need scheduled jobs to verify daily posts

   **Database Schema (Planned):**

   ```sql
   -- Users table
   users (
     id uuid PRIMARY KEY,
     tiktok_user_id text UNIQUE,
     tiktok_handle text,
     avatar_url text,
     timezone text,
     created_at timestamp,
     updated_at timestamp
   )

   -- Daily posts tracking
   daily_posts (
     id uuid PRIMARY KEY,
     user_id uuid REFERENCES users,
     date date,
     posted boolean,
     video_id text,
     verified_at timestamp
   )

   -- Cached stats for leaderboard
   user_stats (
     user_id uuid PRIMARY KEY REFERENCES users,
     current_streak int,
     longest_streak int,
     uptime_30d decimal,
     total_posts int,
     last_post_date date,
     updated_at timestamp
   )
   ```

   **Data Flow:**

   1. User logs in → Save to `users` table
   2. User opens app → Fetch their TikTok videos
   3. Sync post dates to `daily_posts` table
   4. Calculate and cache stats in `user_stats`
   5. Leaderboard reads from `user_stats` (fast, no API calls)

   **Implementation Steps:**

   - [ ] Create Supabase project
   - [ ] Design and create tables
   - [ ] Add Supabase client to app
   - [ ] Sync user data on login
   - [ ] Sync video data on dashboard load
   - [ ] Build leaderboard query

5. **Scheduled Jobs (Supabase Edge Functions)**
   - Daily verification of posts
   - Streak calculation
   - Stats aggregation

### Long Term

6. **Featured Content System**

   - Algorithm to select featured video
   - Weekly rotation

7. **Notifications**
   - Daily reminders to post
   - Streak milestone celebrations

---

## 🏗️ Architecture

### Current (Client-Only)

```
┌─────────────────┐
│   React Native  │
│   (Expo Go)     │
├─────────────────┤
│ TikTok OAuth    │──────► TikTok Auth
│ TikTok API      │──────► TikTok Video List
│ Secure Store    │──────► Local tokens
└─────────────────┘
```

### Planned (With Supabase)

```
┌─────────────────┐         ┌─────────────────┐
│   React Native  │         │    Supabase     │
│   (Expo)        │◄───────►│    Database     │
├─────────────────┤         ├─────────────────┤
│ TikTok OAuth    │         │ users           │
│ Supabase Client │         │ daily_posts     │
│ Secure Store    │         │ user_stats      │
└─────────────────┘         └─────────────────┘
         │                           │
         │                   ┌───────┴───────┐
         ▼                   │ Edge Functions│
    TikTok API               │ (Scheduled)   │
                             └───────────────┘
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

---

## 📝 Key Files

### Screens

- `app/(tabs)/dashboard.tsx` - Home with stats & calendar
- `app/(tabs)/leaderboard.tsx` - Rankings (WIP)
- `app/(tabs)/featured.tsx` - Featured video (placeholder)
- `app/(tabs)/profile.tsx` - User profile
- `app/login.tsx` - Login screen

### Services

- `src/services/tiktokAuth.ts` - TikTok OAuth
- `src/services/tiktokVideos.ts` - Video fetching & stats

### Context

- `src/contexts/AuthContext.tsx` - Auth state

### Theme

- `src/theme/colors.ts` - Deep Indigo palette
- `src/theme/typography.ts` - Font sizes
- `src/theme/spacing.ts` - Spacing scale

---

## 🎯 Current Focus

**Primary:** Design Leaderboard UI with mock data  
**Next:** Featured page UI  
**Backend:** Plan Supabase schema and integration

---

_This document should be updated as progress is made._
