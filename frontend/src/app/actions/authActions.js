'use server'

import { cookies } from 'next/headers'

export async function setFrontendCookie(tokenName, token) {
  const cookieStore = await cookies();
  cookieStore.set(tokenName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 3 * 24 * 60 * 60, // 3 days
  });
}

export async function deleteFrontendCookie(tokenName) {
  const cookieStore = await cookies();
  cookieStore.delete(tokenName);
}
