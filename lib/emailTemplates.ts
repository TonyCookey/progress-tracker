// Branded HTML emails. Table layout + inline styles only — that is what mail clients
// (Gmail, Outlook, Apple Mail) render reliably; no <style> blocks, flexbox or web fonts.

const BRAND = "#4f46e5";
const BRAND_DARK = "#3730a3";

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function layout({ preheader, emoji, heading, bodyHtml, footer }: { preheader: string; emoji: string; heading: string; bodyHtml: string; footer: string }) {
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><title>${esc(heading)}</title></head>
<body style="margin:0;padding:0;background:#f4f4f7;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        <tr><td align="center" style="background:${BRAND};background-image:linear-gradient(135deg,${BRAND} 0%,${BRAND_DARK} 100%);padding:40px 24px;">
          <div style="font-size:56px;line-height:1;">${emoji}</div>
          <h1 style="margin:16px 0 0;font-size:26px;line-height:1.25;color:#ffffff;font-weight:800;">${heading}</h1>
        </td></tr>
        <tr><td style="padding:32px 32px 8px;font-size:16px;line-height:1.65;color:#374151;">${bodyHtml}</td></tr>
        <tr><td style="padding:8px 32px 32px;font-size:16px;line-height:1.65;color:#374151;">
          With love,<br /><strong style="color:#111827;">The DA Teens Ministry</strong>
        </td></tr>
        <tr><td align="center" style="background:#f9fafb;padding:16px 24px;font-size:12px;color:#9ca3af;">${esc(footer)}</td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function birthdayEmail(name: string) {
  const first = esc(name.trim().split(/\s+/)[0] || name);
  return {
    subject: `Happy Birthday, ${name.trim().split(/\s+/)[0] || name}! 🎂`,
    html: layout({
      preheader: "Wishing you a blessed new year of life!",
      emoji: "🎂",
      heading: `Happy Birthday, ${first}!`,
      bodyHtml: `
        <p style="margin:0 0 16px;">Dear ${first},</p>
        <p style="margin:0 0 16px;">Today we celebrate <strong>you</strong>! Thank you for the time, love and energy you pour into our teens. Your service makes a real difference in their lives.</p>
        <p style="margin:0 0 16px;">We're praying that this new year of your life brings abundant joy, good health, favour and fresh grace for everything ahead.</p>
        <p style="margin:0;font-style:italic;color:#4b5563;">“The Lord bless you and keep you; the Lord make his face shine on you and be gracious to you.” — Numbers 6:24-25</p>`,
      footer: "You're receiving this because you're a valued member of the DA Teens Ministry team.",
    }),
  };
}

export function anniversaryEmail(name: string, years: number | null) {
  const first = esc(name.trim().split(/\s+/)[0] || name);
  const yearsLine = years && years > 0 ? ` on <strong>${years} ${years === 1 ? "year" : "years"}</strong> in the ministry` : "";
  return {
    subject: `Happy Anniversary, ${name.trim().split(/\s+/)[0] || name}! 🎉`,
    html: layout({
      preheader: "Thank you for another year of faithful service.",
      emoji: "🎉",
      heading: `Happy Anniversary, ${first}!`,
      bodyHtml: `
        <p style="margin:0 0 16px;">Dear ${first},</p>
        <p style="margin:0 0 16px;">Congratulations${yearsLine}! We're so grateful for your faithfulness, commitment and heart for the next generation.</p>
        <p style="margin:0 0 16px;">May God keep strengthening you and reward every seed you've sown. We can't wait to see all He has ahead for you.</p>
        <p style="margin:0;font-style:italic;color:#4b5563;">“Well done, good and faithful servant!” — Matthew 25:21</p>`,
      footer: "You're receiving this because you're a valued member of the DA Teens Ministry team.",
    }),
  };
}
