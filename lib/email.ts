import { Resend } from "resend";

const FROM_ADDRESS = process.env.EMAIL_FROM || "DA Progress Tracker <no-reply@yourdomain.com>";

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  if (!process.env.RESEND_API_KEY) {
    console.error("[email] RESEND_API_KEY not set — email not sent:", { to, subject });
    throw new Error("Email service not configured");
  }

  // Constructed lazily (not at module load) so builds/imports don't crash when the key is unset.
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({ from: FROM_ADDRESS, to, subject, html });
  if (error) {
    console.error("[email] Resend send failed:", error);
    throw new Error("Failed to send email");
  }
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  await sendEmail({
    to,
    subject: "Reset your password",
    html: `
      <p>You requested a password reset for your DA Progress Tracker account.</p>
      <p><a href="${resetUrl}">Click here to reset your password</a>. This link expires in 1 hour.</p>
      <p>If you didn't request this, you can ignore this email.</p>
    `,
  });
}
