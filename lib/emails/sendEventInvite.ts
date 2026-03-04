import { resend, FROM_EMAIL } from "@/lib/resend";
import { format } from "date-fns";

interface SendEventInviteParams {
  to: string;
  inviteeName: string;
  eventTitle: string;
  startTime: Date;
  endTime: Date;
  timezone: string;
  token: string;
}

export async function sendEventInviteEmail({
  to,
  inviteeName,
  eventTitle,
  startTime,
  endTime,
  timezone,
  token,
}: SendEventInviteParams) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const acceptUrl = `${baseUrl}/api/invites/${token}?action=accept`;
  const declineUrl = `${baseUrl}/api/invites/${token}?action=decline`;

  const dateStr = format(startTime, "EEEE, MMMM d, yyyy");
  const timeStr = `${format(startTime, "h:mm a")} – ${format(endTime, "h:mm a")} (${timezone})`;

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `You're invited: ${eventTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="margin-bottom: 8px;">📅 You're invited to an event</h2>
        <p>Hi ${inviteeName},</p>
        <p>You've been invited to <strong>${eventTitle}</strong>.</p>

        <div style="background: #f5f5f5; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0 0 4px;"><strong>${eventTitle}</strong></p>
          <p style="margin: 0; color: #666;">${dateStr}<br/>${timeStr}</p>
        </div>

        <div style="display: flex; gap: 12px; margin-top: 16px;">
          <a href="${acceptUrl}" style="background:#3B82F6; color:white; padding:10px 20px; border-radius:6px; text-decoration:none; display:inline-block; margin-right:8px;">
            ✓ Accept
          </a>
          <a href="${declineUrl}" style="background:#ef4444; color:white; padding:10px 20px; border-radius:6px; text-decoration:none; display:inline-block;">
            ✗ Decline
          </a>
        </div>

        <p style="color: #999; font-size: 12px; margin-top: 24px;">
          This invite expires in 7 days.
        </p>
      </div>
    `,
  });
}
