import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

function redirectWithCookies(
  request: Request,
  path: string,
  setCookies: Array<{ name: string; value: string; options?: Record<string, unknown> }>,
) {
  const response = NextResponse.redirect(new URL(path, request.url), { status: 303 });
  for (const { name, value, options } of setCookies) {
    response.cookies.set(name, value, {
      ...options,
      path: (options?.path as string | undefined) ?? "/",
      sameSite: (options?.sameSite as "lax" | "strict" | "none" | undefined) ?? "lax",
      secure: true,
    });
  }
  return response;
}

async function createSupabaseForRedirect(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("Missing Supabase env");
  }

  const cookieStore = await cookies();
  const pending: Array<{ name: string; value: string; options?: Record<string, unknown> }> = [];

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        pending.length = 0;
        for (const cookie of cookiesToSet) {
          pending.push(cookie);
        }
      },
    },
  });

  return { supabase, pending, url: request.url };
}

export async function POST(request: Request) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");

  if (!email || !password) {
    return NextResponse.redirect(
      new URL("/login?error=" + encodeURIComponent("Email and password are required"), request.url),
      { status: 303 },
    );
  }

  try {
    const { supabase, pending } = await createSupabaseForRedirect(request);
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return NextResponse.redirect(
        new URL("/login?error=" + encodeURIComponent(error.message), request.url),
        { status: 303 },
      );
    }

    return redirectWithCookies(request, "/", pending);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sign in failed";
    return NextResponse.redirect(
      new URL("/login?error=" + encodeURIComponent(message), request.url),
      { status: 303 },
    );
  }
}
