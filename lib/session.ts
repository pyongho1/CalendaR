import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase-admin";

export type AppSession = {
  userId: string;
  email: string;
  name: string | null;
  image: string | null;
};

export async function getSession(): Promise<AppSession | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("__session")?.value;
  if (!sessionCookie) return null;

  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    return {
      userId: decoded.uid,
      email: decoded.email ?? "",
      name: (decoded.name as string) ?? null,
      image: (decoded.picture as string) ?? null,
    };
  } catch {
    return null;
  }
}
