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

export async function POST(request: Request) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");

  if (!email || !password) {
    return NextResponse.redirect(
      new URL("/signup?error=" + encodeURIComponent("Email and password are required"), request.url),
      { status: 303 },
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return NextResponse.redirect(
      new URL("/signup?error=" + encodeURIComponent("Server misconfigured"), request.url),
      { status: 303 },
    );
  }

  try {
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

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      return NextResponse.redirect(
        new URL("/signup?error=" + encodeURIComponent(error.message), request.url),
        { status: 303 },
      );
    }

    if (!data.session) {
      return NextResponse.redirect(
        new URL(
          "/login?info=" +
            encodeURIComponent("Check your email to confirm your account, then sign in."),
          request.url,
        ),
        { status: 303 },
      );
    }

    return redirectWithCookies(request, "/", pending);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sign up failed";
    return NextResponse.redirect(
      new URL("/signup?error=" + encodeURIComponent(message), request.url),
      { status: 303 },
    );
  }
}
