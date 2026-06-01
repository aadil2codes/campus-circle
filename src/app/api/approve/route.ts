import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendMail } from "@/lib/mailer";

export async function POST(req: Request) {
  try {
    // Verify administrative credentials from authorization header
    const authHeader = req.headers.get("Authorization");
    const targetPassword = process.env.ADMIN_PASSWORD || "admin123";

    if (!authHeader || authHeader !== `Bearer ${targetPassword}`) {
      console.warn("Unauthorized API access attempt to approve application.");
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { id, email, name } = await req.json();

    if (!id || !email || !name) {
      return NextResponse.json({ error: "Missing required parameters (id, email, name)" }, { status: 400 });
    }

    console.log(`Approving application id: ${id}, email: ${email}, name: ${name}...`);

    // 1. Update status in database to 'approved'
    const { error: updateError } = await supabaseAdmin
      .from("applications")
      .update({ status: "approved" })
      .eq("id", id);

    if (updateError) {
      console.error("Database status update failed:", updateError);
      throw updateError;
    }

    // 2. Generate magic link using Supabase Admin Client
    const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback`;
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo },
    });

    if (authError || !authData?.properties?.action_link) {
      console.error("Supabase Admin Auth generation failed:", authError);
      throw authError || new Error("Auth link generation returned empty values.");
    }

    const magicLink = authData.properties.action_link;
    console.log("Magic link generated successfully:", magicLink);

    // 3. Send welcome email via Nodemailer SMTP or Mock
    const { messageId } = await sendMail({
      to: email,
      subject: "Welcome to CampusCircle",
      fromName: "CampusCircle",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Welcome to CampusCircle</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; padding: 40px 15px;">
            <tr>
              <td align="center">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 540px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; padding: 40px 30px; box-shadow: 0 10px 25px rgba(15, 23, 42, 0.04);">
                  <tr>
                    <td align="left">
                      <span style="display: inline-block; padding: 4px 10px; font-size: 10px; font-weight: bold; color: #2563eb; background-color: rgba(37, 99, 235, 0.08); border: 1px solid rgba(37, 99, 235, 0.15); border-radius: 100px; text-transform: uppercase; letter-spacing: 1.2px; margin-bottom: 20px; select-none;">
                        Welcome to CampusCircle
                      </span>
                      
                      <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; line-height: 1.2; margin-bottom: 20px;">
                        Hi ${name},
                      </h1>
                      
                      <p style="font-size: 15px; color: #334155; line-height: 1.6; font-weight: 600; margin-bottom: 16px;">
                        Your account is now active and you're ready to explore CampusCircle.
                      </p>
                      
                      <p style="font-size: 15px; color: #475569; line-height: 1.6; margin-bottom: 25px;">
                        CampusCircle is a student network designed to help you connect with students from colleges across India, discover communities that match your interests, and participate in meaningful discussions about academics, placements, projects, internships, startups, technology, and much more.
                      </p>
 
                      <!-- CTA Button -->
                      <table border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td align="center" style="padding-bottom: 25px;">
                            <a href="${magicLink}" target="_blank" style="display: inline-block; background-color: #185FA5; color: #ffffff; font-size: 14px; font-weight: bold; text-decoration: none; padding: 14px 28px; border-radius: 8px; box-shadow: 0 4px 12px rgba(24, 95, 165, 0.2); border: 1px solid rgba(255,255,255,0.08);">
                              Enter Your Campus Circle &rarr;
                            </a>
                          </td>
                        </tr>
                      </table>

                      <p style="font-size: 15px; color: #334155; line-height: 1.5; margin-top: 20px; font-weight: 600; margin-bottom: 0;">
                        The CampusCircle Team
                      </p>
 
                      <p style="font-size: 11px; color: #94a3b8; line-height: 1.5; margin-top: 25px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
                        Note: This one-time access link logs you in automatically without needing a password. The link is secure, individual to your profile, and expires in 24 hours.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      text: `Welcome to CampusCircle\n\nHi ${name},\n\nYour account is now active and you're ready to explore CampusCircle.\n\nCampusCircle is a student network designed to help you connect with students from colleges across India, discover communities that match your interests, and participate in meaningful discussions about academics, placements, projects, internships, startups, technology, and much more.\n\nClick below to access your account:\n${magicLink}\n\nThe CampusCircle Team`,
    });

    console.log("Onboarding welcome email successfully dispatched to approved member!");
    return NextResponse.json({ ok: true, messageId });
  } catch (error: any) {
    console.error("Approve API endpoint failed:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
