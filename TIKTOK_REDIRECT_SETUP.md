# TikTok OAuth Redirect URI Setup

TikTok requires **HTTPS redirect URIs** for iOS and Android (Universal Links/App Links). Custom schemes like `socialuptime://` are not accepted.

## Quick Setup Options

### Option 1: Use Environment Variable (Recommended for Testing)

1. Set up a simple HTTPS redirect endpoint that redirects to your app's custom scheme
2. Add to your `.env` file:
   ```
   EXPO_PUBLIC_TIKTOK_REDIRECT_URI=https://your-domain.com/tiktok/callback
   ```

### Option 2: Universal Links (Recommended for Production)

For production, set up Universal Links (iOS) and App Links (Android):

#### Step 1: Choose a Domain

Use a domain you control, e.g., `auth.rrtechsolutions.com`

#### Step 2: Set Up Redirect Endpoint

Create an HTTPS endpoint that:

1. Receives the TikTok OAuth callback with `code` and `state` parameters
2. Redirects to your app's custom scheme: `socialuptime://auth/callback?code=...&state=...`

Example Node.js/Express endpoint:

```javascript
app.get("/tiktok/callback", (req, res) => {
  const { code, state } = req.query;
  const redirectUrl = `socialuptime://auth/callback?code=${code}&state=${state}`;
  res.redirect(redirectUrl);
});
```

#### Step 3: Configure Universal Links (iOS)

1. **In `app.json`** (already configured):

   ```json
   "ios": {
     "associatedDomains": ["applinks:auth.rrtechsolutions.com"]
   }
   ```

2. **Serve Apple App Site Association (AASA) file**:

   - Create file: `https://auth.rrtechsolutions.com/.well-known/apple-app-site-association`
   - Content-Type: `application/json`
   - No redirects, must be directly accessible via HTTPS
   - Example content:

   ```json
   {
     "applinks": {
       "apps": [],
       "details": [
         {
           "appID": "TEAM_ID.com.rrtechsolutions.social-uptime",
           "paths": ["/tiktok/callback*"]
         }
       ]
     }
   }
   ```

   Replace `TEAM_ID` with your Apple Developer Team ID.

3. **Verify AASA file**:
   - Use Apple's validator: https://search.developer.apple.com/appsearch-validation-tool
   - Or test directly: `https://auth.rrtechsolutions.com/.well-known/apple-app-site-association`

#### Step 4: Configure App Links (Android)

1. **In `app.json`**, add:

   ```json
   "android": {
     "intentFilters": [
       {
         "action": "VIEW",
         "autoVerify": true,
         "data": [
           {
             "scheme": "https",
             "host": "auth.rrtechsolutions.com",
             "pathPrefix": "/tiktok/callback"
           }
         ],
         "category": ["BROWSABLE", "DEFAULT"]
       }
     ]
   }
   ```

2. **Serve Digital Asset Links file**:
   - Create file: `https://auth.rrtechsolutions.com/.well-known/assetlinks.json`
   - Example content:
   ```json
   [
     {
       "relation": ["delegate_permission/common.handle_all_urls"],
       "target": {
         "namespace": "android_app",
         "package_name": "com.rrtechsolutions.social-uptime",
         "sha256_cert_fingerprints": ["YOUR_SHA256_FINGERPRINT"]
       }
     }
   ]
   ```
   Get your SHA256 fingerprint from: `keytool -list -v -keystore your-keystore.jks`

#### Step 5: Register in TikTok Developer Portal

1. Go to TikTok Developer Portal → Your App → Login Kit Settings
2. For **iOS**, set Redirect URI: `https://auth.rrtechsolutions.com/tiktok/callback`
3. For **Android**, set Redirect URI: `https://auth.rrtechsolutions.com/tiktok/callback`
4. Save changes

#### Step 6: Update Environment Variable

Add to your `.env` file:

```
EXPO_PUBLIC_TIKTOK_REDIRECT_URI=https://auth.rrtechsolutions.com/tiktok/callback
```

## Quick Testing Solution (Temporary)

If you need to test immediately without setting up a full domain:

1. Use a service like:

   - **Firebase Hosting** (free): Host a simple redirect page
   - **Vercel** (free): Deploy a redirect endpoint
   - **Netlify** (free): Similar redirect setup

2. Example Vercel function (`api/tiktok/callback.js`):

   ```javascript
   export default function handler(req, res) {
     const { code, state } = req.query;
     const redirectUrl = `socialuptime://auth/callback?code=${code}&state=${state}`;
     res.redirect(redirectUrl);
   }
   ```

3. Register: `https://your-project.vercel.app/api/tiktok/callback` in TikTok portal

## Important Notes

- The HTTPS redirect URI **must** be registered in TikTok Developer Portal before use
- Universal Links require the AASA file to be publicly accessible via HTTPS
- App Links require the assetlinks.json file to be publicly accessible via HTTPS
- Both files must return proper Content-Type headers
- Test Universal Links on a real device (simulator may not work correctly)

## Current Configuration

- **App Scheme**: `socialuptime://`
- **Bundle ID (iOS)**: `com.rrtechsolutions.social-uptime`
- **Package (Android)**: `com.rrtechsolutions.social-uptime`
- **Associated Domain**: `applinks:auth.rrtechsolutions.com` (update if using different domain)
