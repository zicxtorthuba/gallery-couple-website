# 🔧 Google OAuth Setup Instructions

## ❌ **Current Issue:**
You're getting a `redirect_uri_mismatch` error because you need to add **BOTH** redirect URIs to your Google Cloud Console.

## ✅ **Solution:**

### **1. Add BOTH Redirect URIs to Google Cloud Console:**

Go to [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → Your OAuth 2.0 Client → Edit

Add these **EXACT** redirect URIs:

```
http://localhost:3000/auth/callback
https://pbpwdudejwopjndhbntd.supabase.co/auth/v1/callback
```

**Important:** You need BOTH URLs:
- `http://localhost:3000/auth/callback` - For local development
- `https://pbpwdudejwopjndhbntd.supabase.co/auth/v1/callback` - For Supabase Auth

### **2. Configure Supabase Authentication:**

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to **Authentication → Providers**
3. Enable **Google** provider
4. Add your Google OAuth credentials:
   - **Client ID**: `119966661714-50scvvad8kqus3i0vfb382relj3g3c9t.apps.googleusercontent.com`
   - **Client Secret**: (Your Google OAuth client secret)

### **3. Environment Variables:**

Make sure your `.env.local` file has:

```env
NEXT_PUBLIC_SUPABASE_URL=https://pbpwdudejwopjndhbntd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### **4. Test the Setup:**

1. **Save all Google OAuth settings**
2. **Restart your development server**: `npm run dev`
3. **Clear browser cache/cookies** for localhost:3000
4. **Try logging in again**

## 🎯 **Why This Happens:**

The error occurs because:
1. Your app redirects to Supabase for OAuth processing
2. Supabase then redirects to Google for authentication
3. Google tries to redirect back to Supabase's callback URL
4. But that URL isn't registered in your Google OAuth app

## 🚀 **After Setup:**

Once configured correctly, the flow will be:
1. User clicks "Login with Google"
2. Redirects to Google OAuth
3. Google redirects to Supabase callback
4. Supabase processes auth and redirects to your app
5. User is logged in! ✅

---

**Need help?** Make sure both redirect URIs are added to Google Cloud Console and Supabase Auth is properly configured with your Google OAuth credentials.