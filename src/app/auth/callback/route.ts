import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { type EmailOtpType } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  let next = searchParams.get('next') ?? '/dashboard';

  if (type === 'recovery') {
    next = '/reset-password';
  }

  // 1. Support PKCE code exchange
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error('exchangeCodeForSession error:', error);
  }

  // 2. Support token_hash OTP verification
  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type,
    });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error('verifyOtp error:', error);
  }

  // 3. If recovery flow was triggered, don't fail immediately because tokens might be in URL hash fragment
  // (hash fragments like #access_token=... are client-only and preserved across 302 redirects)
  if (type === 'recovery' || next === '/reset-password') {
    return NextResponse.redirect(`${origin}/reset-password`);
  }

  // Return the user to login with error instructions
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
