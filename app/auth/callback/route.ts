import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  const next = searchParams.get('next') ?? '/';

  console.log('Auth callback received:', { code: !!code, error, errorDescription });

  // Handle OAuth errors from Google
  if (error) {
    console.error('OAuth error:', error, errorDescription);
    const errorParam = error === 'access_denied' ? 'user_cancelled' : 'oauth_error';
    return NextResponse.redirect(`${origin}/login?error=${errorParam}&message=${encodeURIComponent(errorDescription || error)}`);
  }

  if (code) {
    try {
      // Create a new Supabase client for server-side auth
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false
        }
      });

      const { data, error: authError } = await supabase.auth.exchangeCodeForSession(code);
      
      if (authError) {
        console.error('Supabase auth error:', authError);
        return NextResponse.redirect(`${origin}/login?error=auth_callback_error&message=${encodeURIComponent(authError.message)}`);
      }

      if (!data.session) {
        console.error('No session created');
        return NextResponse.redirect(`${origin}/login?error=no_session`);
      }

      console.log('Auth successful, user:', data.user?.email);
      
      // Create response with session cookies
      const response = NextResponse.redirect(`${origin}${next.startsWith('/') ? next : '/'}`);
      
      // Set session cookies manually for better reliability
      if (data.session) {
        response.cookies.set('sb-access-token', data.session.access_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: data.session.expires_in
        });
        
        response.cookies.set('sb-refresh-token', data.session.refresh_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 30 // 30 days
        });
      }
      
      return response;
    } catch (error) {
      console.error('Error in auth callback:', error);
      return NextResponse.redirect(`${origin}/login?error=callback_exception&message=${encodeURIComponent(String(error))}`);
    }
  }

  // No code provided
  console.error('No authorization code received');
  return NextResponse.redirect(`${origin}/login?error=no_code`);
}