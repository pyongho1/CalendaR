import { resend, FROM_EMAIL } from "@/lib/resend";

interface SendFriendInviteParams {
  to: string;
  inviteeName: string;
  fromName: string;
}

export async function sendFriendInviteEmail({
  to,
  inviteeName,
  fromName,
}: SendFriendInviteParams) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `${fromName} added you as a friend on Calendar`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="margin-bottom: 8px;">👋 You have a new friend request</h2>
        <p>Hi ${inviteeName},</p>
        <p><strong>${fromName}</strong> has added you as a friend on Calendar App.</p>
        <p>When you sign in, you'll both appear in each other's friends list and can easily share calendars and events.</p>

        <a href="${baseUrl}/login" style="background:#3B82F6; color:white; padding:10px 20px; border-radius:6px; text-decoration:none; display:inline-block; margin-top:16px;">
          Sign in to Calendar
        </a>

        <p style="color: #999; font-size: 12px; margin-top: 24px;">
          If you weren't expecting this, you can ignore this email.
        </p>
      </div>
    `,
  });
}
