import { NextResponse } from "next/server";
import crypto from "crypto";
import { sendMail } from "@/lib/mailer";

const SECRET = process.env.ADMIN_PASSWORD || "techleaders-fallback-secret-key-123456";

// Generate secure HMAC signature of email + otp + expiration
function generateSignature(email: string, otp: string, expiresAt: number): string {
  const data = `${email.toLowerCase().trim()}:${otp.trim()}:${expiresAt}`;
  return crypto.createHmac("sha256", SECRET).update(data).digest("hex");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === "send") {
      const { email } = body;
      if (!email) {
        return NextResponse.json({ error: "Email is required" }, { status: 400 });
      }

      // Generate a secure 6-digit OTP code
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes lifespan

      // Sign the OTP details
      const signature = generateSignature(email, otp, expiresAt);
      const token = `${expiresAt}.${signature}`;

      // Dispatches verification email via Nodemailer SMTP or Mock
      await sendMail({
        to: email,
        subject: `${otp} is your TechLeaders verification code`,
        fromName: "TechLeaders Verification",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Verify your email address</title>
          </head>
          <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; padding: 40px 15px;">
              <tr>
                <td align="center">
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 480px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 30px; box-shadow: 0 10px 25px rgba(15, 23, 42, 0.04); text-align: center;">
                    <tr>
                      <td>
                        <span style="display: inline-block; padding: 4px 10px; font-size: 9px; font-weight: bold; color: #2563eb; background-color: rgba(37, 99, 235, 0.08); border: 1px solid rgba(37, 99, 235, 0.15); border-radius: 100px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 20px;">
                          Email Verification Required
                        </span>
                        
                        <h2 style="margin: 0; font-size: 22px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">
                          Confirm your email address
                        </h2>
                        
                        <p style="font-size: 14px; color: #475569; line-height: 1.5; margin-top: 10px; margin-bottom: 25px;">
                          Please enter the following 6-digit One-Time Password to confirm your email and submit your founding member application:
                        </p>
                        
                        <!-- OTP Box -->
                        <div style="font-size: 30px; font-weight: bold; letter-spacing: 4px; padding: 18px 24px; background: rgba(24, 95, 165, 0.05); border: 1px solid rgba(24, 95, 165, 0.15); border-radius: 10px; display: inline-block; margin-bottom: 25px; color: #185FA5; font-family: monospace;">
                          ${otp}
                        </div>
                        
                        <p style="font-size: 11px; color: #94a3b8; line-height: 1.5; margin: 0; border-top: 1px solid #e2e8f0; padding-top: 20px;">
                          Note: This verification code will expire in 10 minutes. If you did not request this, you can safely ignore this email.
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
        text: `Confirm your email address\n\nEnter the following 6-digit verification code to complete your founding member application:\n\n${otp}\n\nThis code will expire in 10 minutes.`,
      });

      return NextResponse.json({ success: true, token });
    }

    if (action === "verify") {
      const { email, otp, token } = body;
      if (!email || !otp || !token) {
        return NextResponse.json(
          { error: "Missing required parameters (email, otp, token)" },
          { status: 400 }
        );
      }

      const [expiresAtStr, signature] = token.split(".");
      const expiresAt = parseInt(expiresAtStr, 10);

      if (isNaN(expiresAt) || !signature) {
        return NextResponse.json({ error: "Invalid verification token format." }, { status: 400 });
      }

      // Check lifespan expiration
      if (Date.now() > expiresAt) {
        return NextResponse.json(
          { error: "Verification code has expired. Please click resend code." },
          { status: 400 }
        );
      }

      // Verify HMAC cryptographically
      const expectedSignature = generateSignature(email, otp, expiresAt);
      if (signature !== expectedSignature) {
        return NextResponse.json(
          { error: "Invalid verification code. Please try again." },
          { status: 400 }
        );
      }

      console.log(`Email successfully verified: ${email}`);
      return NextResponse.json({ success: true, message: "Email successfully verified!" });
    }

    return NextResponse.json({ error: "Invalid action parameter." }, { status: 400 });
  } catch (error: any) {
    console.error("OTP API Route failed:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
