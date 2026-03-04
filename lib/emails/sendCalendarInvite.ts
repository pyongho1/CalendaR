import { resend, FROM_EMAIL } from "@/lib/resend";

interface SendCalendarInviteParams {
  to: string;
  inviteeName: string;
  calendarName: string;
  ownerName: string;
  token: string;
}

export async function sendCalendarInviteEmail({
  to,
  inviteeName,
  calendarName,
  ownerName,
  token,
}: SendCalendarInviteParams) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const acceptUrl = `${baseUrl}/api/invites/${token}?action=accept`;

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `You've been added to "${calendarName}"`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="margin-bottom: 8px;">🗓 You've been added to a calendar</h2>
        <p>Hi ${inviteeName},</p>
        <p><strong>${ownerName}</strong> has added you to the group calendar <strong>${calendarName}</strong>.</p>
        <p>You'll now see all events from this calendar in your Calendar app.</p>

        <a href="${acceptUrl}" style="background:#3B82F6; color:white; padding:10px 20px; border-radius:6px; text-decoration:none; display:inline-block; margin-top:16px;">
          View Calendar
        </a>

        <p style="color: #999; font-size: 12px; margin-top: 24px;">
          If you weren't expecting this, you can ignore this email.
        </p>
      </div>
    `,
  });
}
