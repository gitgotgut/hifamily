import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Best-effort transactional email. Never throws — a delivery failure must not
// break the action that triggered it (invites work in-app without email).
export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  const from = process.env.EMAIL_FROM || "hifamily <onboarding@resend.dev>";
  try {
    const { error } = await resend.emails.send({
      from,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    });
    if (error) console.error("Email send failed:", error);
  } catch (e) {
    console.error("Email send threw:", e);
  }
}
