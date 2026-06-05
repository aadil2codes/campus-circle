import nodemailer from "nodemailer";

const gmailUser = process.env.GMAIL_USER || "";
const gmailPass = process.env.GMAIL_PASS || "";
const resendApiKey = process.env.RESEND_API_KEY || "";
const resendFrom = process.env.RESEND_FROM || "onboarding@resend.dev";

// Centralized mock mode check when environment variables are omitted or placeholder
export const isMailMockMode =
  !resendApiKey &&
  (!gmailUser ||
    !gmailPass ||
    gmailUser.includes("your_gmail") ||
    gmailPass.includes("your_gmail_app_password"));

// Initialize Nodemailer SMTP transporter using Gmail service (fallback)
const transporter = (!resendApiKey && !isMailMockMode)
  ? nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailUser,
        pass: gmailPass,
      },
    })
  : null;

interface SendMailParams {
  to: string;
  subject: string;
  html: string;
  text: string;
  fromName?: string;
}

/**
 * Dispatches a transaction email using Resend API (primary), Gmail SMTP (fallback), or prints to logs (mock).
 */
export async function sendMail({ to, subject, html, text, fromName = "TechLeaders" }: SendMailParams) {
  if (isMailMockMode) {
    console.warn("Mailer: GMAIL_USER/PASS or RESEND_API_KEY is unconfigured. Operating in local Mock Mode.");
    console.log(`
    -------------------------------------------------------------
    [MAILER MOCK DELIVERY]
    From: "${fromName}" <${gmailUser || "mock@gmail.com"}>
    To: ${to}
    Subject: ${subject}
    Text Body: ${text}
    -------------------------------------------------------------
    `);
    return { success: true, messageId: "mock_msg_id_" + Math.random().toString(36).substring(7) };
  }

  // A. Resend API Flow (Primary)
  if (resendApiKey) {
    try {
      console.log(`Mailer: Dispatching email via Resend API to: ${to}...`);
      
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: fromName ? `"${fromName}" <${resendFrom}>` : resendFrom,
          to: [to],
          subject,
          html,
          text,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Resend API returned an error response");
      }

      console.log(`Mailer: Email successfully delivered via Resend to: ${to}! ID: ${data.id}`);
      return { success: true, messageId: data.id };
    } catch (error) {
      console.error("Mailer: Resend API delivery failed:", error);
      throw error;
    }
  }

  // B. Gmail SMTP Flow (Fallback)
  try {
    console.log(`Mailer: Dispatching SMTP email to: ${to} using Gmail account: ${gmailUser}...`);
    
    const info = await transporter!.sendMail({
      from: `"${fromName}" <${gmailUser}>`,
      to,
      subject,
      html,
      text,
    });

    console.log(`Mailer: Email successfully delivered to: ${to}! Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Mailer: SMTP delivery failed:", error);
    throw error;
  }
}

