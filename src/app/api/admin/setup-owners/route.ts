import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// One-shot admin endpoint that:
//  1. Hard-deletes any user whose email is in EMAILS_TO_REMOVE
//  2. Creates (or upgrades) two OWNER accounts with the passwords supplied
//     in the POST body
//
// Protected with the AUTH_SECRET token via ?token=... in the URL.
// Idempotent — safe to re-run. Returns a summary of what changed.
//
// Usage from your own Terminal (so the passwords never go through chat):
//   curl -X POST \
//     "https://trainly-sg.vercel.app/api/admin/setup-owners?token=YOUR_AUTH_SECRET" \
//     -H "content-type: application/json" \
//     -d '{"cherrellePassword":"...", "bryanPassword":"..."}'

const EMAILS_TO_REMOVE = [
  "cherrelletqrwork@gmail.com",
  "bryanchang14@gmail.com",
  "cherrelletan1@gmail.com",
];

const OWNERS: { email: string; name: string; passwordKey: "cherrellePassword" | "bryanPassword" }[] = [
  { email: "cherrelletqrwork@gmail.com", name: "Cherrelle", passwordKey: "cherrellePassword" },
  { email: "bryanchang14@gmail.com", name: "Bryan", passwordKey: "bryanPassword" },
];

async function deleteUserCascade(userId: string) {
  const coach = await prisma.coach.findUnique({ where: { userId } });
  await prisma.$transaction(async (tx) => {
    if (coach) {
      await tx.review.deleteMany({ where: { coachId: coach.id } });
      await tx.booking.deleteMany({ where: { coachId: coach.id } });
    }
    await tx.review.deleteMany({ where: { authorId: userId } });
    await tx.booking.deleteMany({ where: { clientId: userId } });
    await tx.message.deleteMany({
      where: { OR: [{ senderId: userId }, { recipientId: userId }] },
    });
    await tx.user.delete({ where: { id: userId } });
  });
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token || token !== process.env.AUTH_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Need JSON body with cherrellePassword + bryanPassword" },
      { status: 400 }
    );
  }

  const cherrellePassword = typeof body.cherrellePassword === "string" ? body.cherrellePassword : "";
  const bryanPassword = typeof body.bryanPassword === "string" ? body.bryanPassword : "";
  if (cherrellePassword.length < 8 || bryanPassword.length < 8) {
    return NextResponse.json(
      { error: "Both passwords must be at least 8 characters." },
      { status: 400 }
    );
  }

  // 1. Remove all listed emails (any role)
  const removed: string[] = [];
  for (const email of EMAILS_TO_REMOVE) {
    const u = await prisma.user.findUnique({ where: { email } });
    if (u) {
      await deleteUserCascade(u.id);
      removed.push(email);
    }
  }

  // 2. (Re-)create the owner accounts
  const created: string[] = [];
  for (const o of OWNERS) {
    const passwordHash = await bcrypt.hash(
      o.passwordKey === "cherrellePassword" ? cherrellePassword : bryanPassword,
      10
    );
    await prisma.user.create({
      data: {
        email: o.email,
        name: o.name,
        passwordHash,
        role: "OWNER",
      },
    });
    created.push(o.email);
  }

  return NextResponse.json({
    ok: true,
    removed,
    created,
    note: "Owners can log in at /login with the passwords you supplied. Bryan should set his own password; Cherrelle the same. Keep them safe.",
  });
}

// Guard rail: GET tells you what this endpoint does so a stray browser
// hit doesn't error out.
export function GET() {
  return NextResponse.json({
    info:
      "POST with ?token=AUTH_SECRET and JSON body { cherrellePassword, bryanPassword } to delete the listed emails and (re)create owner accounts.",
    emailsToRemove: EMAILS_TO_REMOVE,
    ownersToCreate: OWNERS.map((o) => o.email),
  });
}
