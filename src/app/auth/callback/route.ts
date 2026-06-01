import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(req: Request) {
  try {
    const { searchParams, origin } = new URL(req.url);
    const code = searchParams.get("code");
    const email = searchParams.get("email") || "";
    const next = searchParams.get("next") || "/dashboard";

    console.log(`Auth Callback received. Code: ${code}, Email: ${email}`);

    if (code) {
      // 1. Graceful support for Mock Code logins during offline development preview
      if (code.includes("mock_token_")) {
        console.log(
          "Auth Callback: Processing mock auth token. Redirecting with preview hooks."
        );
        const mockRedirect = new URL(next, origin);
        mockRedirect.searchParams.set("mock_login", "true");
        mockRedirect.searchParams.set("email", email);
        return NextResponse.redirect(mockRedirect);
      }

      // 2. Live Supabase Server Client Cookie Exchange
      const cookieStore = await cookies();
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

      const isValidUrl = (url: string) => {
        if (!url) return false;
        try {
          new URL(url);
          return true;
        } catch (_) {
          return false;
        }
      };

      if (isValidUrl(supabaseUrl) && supabaseAnonKey && !supabaseUrl.includes("your_supabase_url")) {
        const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
          cookies: {
            getAll() {
              return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
              try {
                cookiesToSet.forEach(({ name, value, options }) =>
                  cookieStore.set(name, value, options)
                );
              } catch (err) {
                // The `setAll` method was called from a Server Component.
                // This can be ignored safely in Next.js App Router.
              }
            },
          },
        });

        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          console.error("Supabase Auth Code Exchange failed:", error);
          throw error;
        }

        console.log("Auth Callback: Session successfully exchanged and persisted via cookies!");
      } else {
        console.warn(
          "Auth Callback: Supabase URL/Anon Key unconfigured. Redirecting in mock mode."
        );
        const mockRedirect = new URL(next, origin);
        mockRedirect.searchParams.set("mock_login", "true");
        mockRedirect.searchParams.set("email", email);
        return NextResponse.redirect(mockRedirect);
      }
    }

    // Success redirect to dashboard
    return NextResponse.redirect(`${origin}${next}`);
  } catch (error: any) {
    console.error("Auth Onboarding Callback Route failed:", error);
    // Redirect to root with error query parameter
    return NextResponse.redirect(
      `${new URL(req.url).origin}?auth_error=${encodeURIComponent(
        error.message || "Authentication failed"
      )}`
    );
  }
}
