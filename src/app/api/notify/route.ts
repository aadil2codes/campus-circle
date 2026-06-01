import { NextResponse } from "next/server";
import { sendMail } from "@/lib/mailer";

export async function POST(req: Request) {
  try {
    // 1. Parse incoming Supabase Webhook payload
    const body = await req.json();
    console.log("Supabase INSERT Webhook received:", body);

    // Supabase inserts the new row inside the 'record' property
    const app = body.record;

    if (!app) {
      console.error("Invalid Webhook Payload: Missing 'record' object.");
      return NextResponse.json({ error: "Missing record data" }, { status: 400 });
    }

    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || "you@gmail.com";

    // 2. Dispatch email to your administrator inbox via Nodemailer SMTP or Mock
    console.log(`Sending email alert to admin inbox: ${adminEmail}...`);
    
    const { messageId } = await sendMail({
      to: adminEmail,
      subject: `New Application: ${app.full_name} — ${app.title} @ ${app.company_name}`,
      fromName: "TechLeaders Alerts",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>New Founding Membership Application</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; padding: 30px 15px;">
            <tr>
              <td align="center">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 540px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 30px; box-shadow: 0 10px 25px rgba(15, 23, 42, 0.04); text-align: left;">
                  <tr>
                    <td>
                      <span style="display: inline-block; padding: 4px 10px; font-size: 9px; font-weight: bold; color: #2563eb; background-color: rgba(37, 99, 235, 0.08); border: 1px solid rgba(37, 99, 235, 0.15); border-radius: 100px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px;">
                        System Notification
                      </span>
                      <h2 style="margin: 0; font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">
                        New Membership Application
                      </h2>
                      <p style="font-size: 13px; color: #475569; margin-top: 5px; margin-bottom: 25px;">
                        A new founding leader has submitted their verification details.
                      </p>
                      
                      <!-- Table Details -->
                      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; margin-bottom: 25px;">
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                          <td style="padding: 10px 0; font-size: 13px; font-weight: bold; color: #475569; width: 120px;">Full Name</td>
                          <td style="padding: 10px 0; font-size: 13px; color: #0f172a;">${app.full_name}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                          <td style="padding: 10px 0; font-size: 13px; font-weight: bold; color: #475569;">Work Email</td>
                          <td style="padding: 10px 0; font-size: 13px; color: #3b82f6;"><a href="mailto:${app.work_email}" style="color: #3b82f6; text-decoration: none;">${app.work_email}</a></td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                          <td style="padding: 10px 0; font-size: 13px; font-weight: bold; color: #475569;">Current Title</td>
                          <td style="padding: 10px 0; font-size: 13px; color: #0f172a;">${app.title}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                          <td style="padding: 10px 0; font-size: 13px; font-weight: bold; color: #475569;">Company Name</td>
                          <td style="padding: 10px 0; font-size: 13px; color: #0f172a;">${app.company_name}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                          <td style="padding: 10px 0; font-size: 13px; font-weight: bold; color: #475569;">Company Size</td>
                          <td style="padding: 10px 0; font-size: 13px; color: #0f172a;">${app.company_size || "N/A"} employees</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                          <td style="padding: 10px 0; font-size: 13px; font-weight: bold; color: #475569;">LinkedIn URL</td>
                          <td style="padding: 10px 0; font-size: 13px; color: #3b82f6;"><a href="${app.linkedin_url}" target="_blank" style="color: #3b82f6; text-decoration: none;">View LinkedIn Profile &rarr;</a></td>
                        </tr>
                      </table>

                      <!-- CTA button -->
                      <table border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td align="center" style="padding-top: 10px;">
                            <a href="https://techleaders.in/admin" target="_blank" style="display: inline-block; background-color: #185FA5; color: #ffffff; font-size: 13px; font-weight: bold; text-decoration: none; padding: 12px 24px; border-radius: 6px; box-shadow: 0 4px 10px rgba(24, 95, 165, 0.15);">
                              Click to Review Application
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      text: `New Application Received!\n\nName: ${app.full_name}\nTitle: ${app.title}\nCompany: ${app.company_name}\nEmail: ${app.work_email}\nLinkedIn: ${app.linkedin_url}\n\nReview: https://techleaders.in/admin`,
    });

    console.log("Notification email successfully sent!");
    return NextResponse.json({ ok: true, messageId });
  } catch (error: any) {
    console.error("Supabase notification webhook failed:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
