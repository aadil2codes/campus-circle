import nodemailer from "nodemailer";

const gmailUser = process.env.GMAIL_USER || "";
const gmailPass = process.env.GMAIL_PASS || "";

// Centralized mock mode check when environment variables are omitted or placeholder
export const isMailMockMode =
  !gmailUser ||
  !gmailPass ||
  gmailUser.includes("your_gmail") ||
  gmailPass.includes("your_gmail_app_password");

// Initialize Nodemailer SMTP transporter using Gmail service
const transporter = !isMailMockMode
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
 * Dispatches a transaction email using Gmail SMTP or prints to logs if unconfigured.
 */
export async function sendMail({ to, subject, html, text, fromName = "TechLeaders" }: SendMailParams) {
  if (isMailMockMode) {
    console.warn("Mailer: GMAIL_USER or GMAIL_PASS is unconfigured. Operating in local Mock Mode.");
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
