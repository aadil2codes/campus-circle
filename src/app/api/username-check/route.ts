import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const { username } = await req.json();
    if (!username) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    const cleanUsername = username.trim().toLowerCase();

    // Basic regex validation for clean usernames (only alphanumeric, underscores, or periods)
    const usernameRegex = /^[a-z0-9_.]+$/;
    if (!usernameRegex.test(cleanUsername)) {
      return NextResponse.json({ 
        available: false, 
        error: "Username can only contain lowercase letters, numbers, underscores, and periods." 
      });
    }

    // If Supabase is operating in mock mode, check against local mock reserves
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const hasKeys = supabaseUrl && !supabaseUrl.includes("your_supabase_url");

    if (!hasKeys) {
      const takenUsernames = ["aadil", "rahul", "admin", "campus", "test", "iitb"];
      const available = !takenUsernames.includes(cleanUsername);
      return NextResponse.json({ available });
    }

    // Live query inside profiles database table
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("username")
      .eq("username", cleanUsername)
      .maybeSingle();

    if (error) {
      console.error("Username check query failed:", error);
      throw error;
    }

    // If data is null, it means the username doesn't exist and is available!
    return NextResponse.json({ available: !data });
  } catch (error: any) {
    console.error("Username check API endpoint failed:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error during verification" },
      { status: 500 }
    );
  }
}
