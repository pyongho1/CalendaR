import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const action = request.nextUrl.searchParams.get("action") ?? "accept";
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  const invite = await prisma.inviteToken.findUnique({ where: { token } });

  if (!invite) {
    return NextResponse.redirect(`${baseUrl}/calendar?invite=invalid`);
  }
  if (invite.expiresAt < new Date()) {
    return NextResponse.redirect(`${baseUrl}/calendar?invite=expired`);
  }
  if (invite.usedAt) {
    return NextResponse.redirect(`${baseUrl}/calendar?invite=already-used`);
  }

  // Mark token as used
  await prisma.inviteToken.update({
    where: { token },
    data: { usedAt: new Date() },
  });

  if (invite.type === "event") {
    const status = action === "decline" ? "declined" : "accepted";
    await prisma.eventAttendee.updateMany({
      where: { eventId: invite.targetId, userId: invite.inviteeId },
      data: { status },
    });
    return NextResponse.redirect(`${baseUrl}/calendar?invite=${status}`);
  }

  if (invite.type === "calendar") {
    // Add user as calendar member if not already
    await prisma.calendarMember.upsert({
      where: {
        calendarId_userId: {
          calendarId: invite.targetId,
          userId: invite.inviteeId,
        },
      },
      update: {},
      create: {
        calendarId: invite.targetId,
        userId: invite.inviteeId,
        role: "member",
      },
    });
    return NextResponse.redirect(`${baseUrl}/calendar?invite=accepted`);
  }

  return NextResponse.redirect(`${baseUrl}/calendar`);
}
