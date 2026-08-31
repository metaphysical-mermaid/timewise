import type { CookieOptions } from "@supabase/ssr";
import type { NextResponse } from "next/server";

/** Next.js-safe cookie options (avoid spreading unknown Supabase fields). */
export function toNextCookieOptions(options: CookieOptions): {
  path: string;
  domain?: string;
  maxAge?: number;
  expires?: Date;
  httpOnly?: boolean;
  secure: boolean;
  sameSite: "lax" | "strict" | "none";
} {
  return {
    path: options.path ?? "/",
    domain: options.domain,
    maxAge: options.maxAge,
    expires: options.expires,
    httpOnly: options.httpOnly,
    secure: process.env.NODE_ENV === "production" ? true : options.secure ?? false,
    sameSite: (options.sameSite as "lax" | "strict" | "none" | undefined) ?? "lax",
  };
}

export function applySupabaseCookies(
  response: NextResponse,
  cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>,
) {
  for (const { name, value, options } of cookiesToSet) {
    response.cookies.set(name, value, toNextCookieOptions(options));
  }
}
