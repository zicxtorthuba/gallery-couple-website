import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('Auth callback error:', error);
        return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
      }
      
      // Successful authentication - redirect to home or next page
      const redirectUrl = next.startsWith('/') ? `${origin}${next}` : `${origin}/`;
      return NextResponse.redirect(redirectUrl);
    } catch (error) {
      console.error('Error in auth callback:', error);
      return NextResponse.redirect(`${origin}/login?error=auth_error`);
    }
  }

  // No code provided - redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=no_code`);
}