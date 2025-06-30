"use server"

import { signIn } from "@/auth"

export async function authenticate(provider: string) {
  await signIn(provider)
}