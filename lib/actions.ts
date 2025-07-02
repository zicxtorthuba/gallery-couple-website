"use server"

import { signInWithGoogle } from "@/lib/auth"

export async function authenticate(provider: string) {
  if (provider === 'google') {
    await signInWithGoogle();
  } else {
    throw new Error(`Unsupported provider: ${provider}`);
  }
}