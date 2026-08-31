import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

type PendingCookie = { name: string; value: string; options: CookieOptions };

function applyCookies(
  response: NextResponse,
  pending: PendingCookie[],
) {
  for (const { name, value, options } of pending) {
    // Only pass fields Next.js accepts — spreading full Supabase options can 500.
    response.cookies.set(name, value, {
      path: options.path ?? "/",
      domain: options.domain,
      maxAge: options.maxAge,
      expires: options.expires,
      httpOnly: options.httpOnly,
      secure: true,
      sameSite: (options.sameSite as "lax" | "strict" | "none" | undefined) ?? "lax",
    });
  }
}

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.redirect(
      new URL("/login?error=" + encodeURIComponent("Invalid form submission"), request.url),
      { status: 303 },
    );
  }

  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");

  if (!email || !password) {
    return NextResponse.redirect(
      new URL("/login?error=" + encodeURIComponent("Email and password are required"), request.url),
      { status: 303 },
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return NextResponse.redirect(
      new URL("/login?error=" + encodeURIComponent("Server misconfigured"), request.url),
      { status: 303 },
    );
  }

  try {
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
          }
        },
      },
    });

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return NextResponse.redirect(
        new URL("/login?error=" + encodeURIComponent(error.message), request.url),
        { status: 303 },
      );
    }

    const response = NextResponse.redirect(new URL("/", request.url), { status: 303 });
    applyCookies(response, pending);
    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sign in failed";
    return NextResponse.redirect(
      new URL("/login?error=" + encodeURIComponent(message), request.url),
      { status: 303 },
    );
  }
}
