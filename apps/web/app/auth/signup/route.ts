import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { applySupabaseCookies } from "@/lib/supabase/cookies";

export const dynamic = "force-dynamic";

type PendingCookie = { name: string; value: string; options: CookieOptions };

function htmlContinueResponse(request: Request, pending: PendingCookie[]) {
  const target = new URL("/", request.url).toString();
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="refresh" content="0;url=${target}">
  <title>Creating account…</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 2rem; text-align: center; color: #0f172a; }
    a { color: #2563eb; }
  </style>
</head>
<body>
  <p>Setting up your account…</p>
  <p><a href="${target}">Continue to Timewise</a></p>
  <script>location.replace("${target}")</script>
</body>
</html>`;

  const response = new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
  applySupabaseCookies(response, pending);
  return response;
}

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.redirect(
      new URL("/signup?error=" + encodeURIComponent("Invalid form submission"), request.url),
      { status: 303 },
    );
  }

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

  const cookieStore = await cookies();
  const pending: PendingCookie[] = [];

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        pending.length = 0;
        for (const cookie of cookiesToSet) {
          pending.push({
            name: cookie.name,
            value: cookie.value,
            options: cookie.options ?? {},
          });
          try {
            cookieStore.set(cookie.name, cookie.value, cookie.options);
          } catch {
            // Applied on the HTML response below.
          }
        }
      },
    },
  });

  try {
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

    const { error: sessionError } = await supabase.auth.setSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    });

    if (sessionError) {
      return NextResponse.redirect(
        new URL("/signup?error=" + encodeURIComponent(sessionError.message), request.url),
        { status: 303 },
      );
    }

    return htmlContinueResponse(request, pending);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sign up failed";
    return NextResponse.redirect(
      new URL("/signup?error=" + encodeURIComponent(message), request.url),
      { status: 303 },
    );
  }
}
