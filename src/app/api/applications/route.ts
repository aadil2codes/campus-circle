import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: Request) {
  try {
    // 1. Verify administrative credentials from authorization header
    const authHeader = req.headers.get("Authorization");
    const targetPassword = process.env.ADMIN_PASSWORD || "admin123";

    if (!authHeader || authHeader !== `Bearer ${targetPassword}`) {
      console.warn("Unauthorized API access attempt to applications list.");
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    console.log("Gated Admin API: Fetching pending applications using supabaseAdmin...");

    // 2. Fetch pending applications using admin client (bypasses RLS secure limits on server)
    const { data, error } = await supabaseAdmin
      .from("applications")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Database query failed inside admin API route:", error);
      throw error;
    }

    return NextResponse.json({ data: data || [] });
  } catch (error: any) {
    console.error("Failed to retrieve applications:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    // 1. Verify administrative credentials from authorization header
    const authHeader = req.headers.get("Authorization");
    const targetPassword = process.env.ADMIN_PASSWORD || "admin123";

    if (!authHeader || authHeader !== `Bearer ${targetPassword}`) {
      console.warn("Unauthorized API access attempt to update application.");
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { id, status } = await req.json();

    if (!id || !status) {
      return NextResponse.json(
        { error: "Missing required parameters (id, status)" },
        { status: 400 }
      );
    }

    console.log(`Gated Admin API: Updating application id: ${id} status to: ${status}...`);

    // 2. Update status in database using admin client (bypasses RLS secure limits on server)
    const { data, error } = await supabaseAdmin
      .from("applications")
      .update({ status })
      .eq("id", id)
      .select();

    if (error) {
      console.error("Database update failed inside admin API route:", error);
      throw error;
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Failed to update application:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

