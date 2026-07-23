import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function sendWelcomeEmail(
  to: string,
  name: string,
  appUrl: string,
) {
  const from = process.env.RESEND_FROM_EMAIL || "AURA <noreply@auramis.com>";
  await resend.emails.send({
    from,
    to,
    subject: "Welcome to AURA — Automated MIS Intelligence",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #e8a5a5;">Welcome to AURA, ${name}!</h1>
        <p>Your account is ready. Start by creating an organization and adding your first branch.</p>
        <a href="${appUrl}/dashboard"
           style="background: #e8a5a5; color: #000; padding: 12px 24px;
                  border-radius: 6px; text-decoration: none; display: inline-block;">
          Go to Dashboard
        </a>
      </div>
    `,
  });
}

export async function sendAlertEmail(
  to: string,
  alertName: string,
  branchName: string,
  description: string,
  appUrl: string,
) {
  const from = process.env.RESEND_FROM_EMAIL || "AURA <alerts@auramis.com>";
  await resend.emails.send({
    from,
    to,
    subject: `AURA Alert: ${alertName} — ${branchName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #e8a5a5;">AURA Alert Triggered</h1>
        <p><strong>Alert:</strong> ${alertName}</p>
        <p><strong>Branch:</strong> ${branchName}</p>
        <p><strong>Details:</strong> ${description}</p>
        <a href="${appUrl}/dashboard/alerts"
           style="background: #e8a5a5; color: #000; padding: 12px 24px;
                  border-radius: 6px; text-decoration: none; display: inline-block;">
          View Alerts
        </a>
      </div>
    `,
  });
}
