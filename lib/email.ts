import { Resend } from "resend";

const FROM_ADDRESS = process.env.EMAIL_FROM || "DA Progress Tracker <no-reply@yourdomain.com>";

export function isEmailConfigured() {
  return !!process.env.RESEND_API_KEY;
}

// Base URL for links in emails / shared links. NEXT_PUBLIC_BASE_URL wins; otherwise
// fall back to the incoming request's origin so links still work on Vercel previews.
// A NEXT_PUBLIC_BASE_URL copied from a local .env (http://localhost:3000) into production
// would hand people links that only work on the admin's laptop, so a localhost value is
// ignored whenever the request itself came from a real host.
export function appBaseUrl(req?: Request) {
  const configured = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "");
  const requestOrigin = req ? new URL(req.url).origin : "";
  const isLocal = (url: string) => /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:|\/|$)/.test(url);
  if (configured && !(isLocal(configured) && requestOrigin && !isLocal(requestOrigin))) return configured;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return requestOrigin;
}

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
      <p><a href="${resetUrl}">Click here to reset your password</a>. This link expires in 1 hour and works once.</p>
      <p>If you didn't request this, you can ignore this email.</p>
    `,
  });
}
