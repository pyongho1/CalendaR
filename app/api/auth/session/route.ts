import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

const SESSION_EXPIRY_MS = 60 * 60 * 24 * 5 * 1000; // 5 days

export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();

    // Verify the Firebase ID token
    const decoded = await adminAuth.verifyIdToken(idToken);

    // Create Firebase session cookie
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_EXPIRY_MS,
    });

    // Check if user already exists in Prisma
    const existingUser = await prisma.user.findUnique({ where: { id: decoded.uid } });

    // Upsert user using Firebase UID as the Prisma User.id
    await prisma.user.upsert({
      where: { id: decoded.uid },
      create: {
        id: decoded.uid,
        email: decoded.email!,
        name: decoded.name ?? null,
        image: decoded.picture ?? null,
      },
      update: {
        email: decoded.email!,
        name: decoded.name ?? null,
        image: decoded.picture ?? null,
      },
    });

    // Auto-accept any pending friend invites for this email
    await prisma.friendInvite.updateMany({
      where: { toEmail: decoded.email!, toId: null },
      data: { toId: decoded.uid, acceptedAt: new Date() },
    });

    // Create personal "My Calendar" for new users
    if (!existingUser) {
      await prisma.calendar.create({
        data: {
          name: "My Calendar",
          isPersonal: true,
          color: "#3B82F6",
          ownerId: decoded.uid,
          members: {
            create: { userId: decoded.uid, role: "owner" },
          },
        },
      });
    }

    // Set HttpOnly session cookie
    const cookieStore = await cookies();
    cookieStore.set("__session", sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_EXPIRY_MS / 1000,
      path: "/",
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Session creation failed:", message);
    return NextResponse.json(
      { error: "Unauthorized", detail: message },
      { status: 401 }
    );
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete("__session");
  return NextResponse.json({ ok: true });
}
