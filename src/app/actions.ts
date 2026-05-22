"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { destroySession, getSession } from "@/lib/auth";

/**
 * Hard-deletes a user and everything that would otherwise dangle.
 * The Prisma schema cascades the Coach record + Favourite + ProgressEntry
 * automatically, but Booking / Review / Message rows have no cascade so
 * we delete them by hand before nuking the user.
 */
export async function deleteUserCascade(userId: string): Promise<void> {
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
    // Cascades: Coach, Favourite, ProgressEntry. MatchAnswer.userId is set null.
    await tx.user.delete({ where: { id: userId } });
  });
}

export async function createBooking(input: {
  coachId: string;
  packageId: string | null;
  startsAt: string;
  format: string;
  locationNote: string;
  priceSGD: number;
}): Promise<{ id: string } | { error: string }> {
  const session = await getSession();
  if (!session) return { error: "Please log in." };
  if (session.role !== "CLIENT") return { error: "Only clients can book." };

  const start = new Date(input.startsAt);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  try {
    const booking = await prisma.booking.create({
      data: {
        clientId: session.userId,
        coachId: input.coachId,
        packageId: input.packageId,
        startsAt: start,
        endsAt: end,
        format: input.format,
        locationNote: input.locationNote || null,
        status: "PENDING",
        priceSGD: input.priceSGD,
      },
    });
    revalidatePath("/dashboard");
    revalidatePath("/coach");
    return { id: booking.id };
  } catch (e) {
    return { error: "Couldn't create booking." };
  }
}

export async function sendMessage(input: { recipientId: string; body: string }) {
  const session = await getSession();
  if (!session) return { error: "Please log in." };
  if (!input.body.trim()) return { error: "Empty message." };

  await prisma.message.create({
    data: {
      senderId: session.userId,
      recipientId: input.recipientId,
      body: input.body.trim(),
    },
  });
  revalidatePath("/chat");
  return { ok: true };
}

export async function setBookingStatus(input: { bookingId: string; status: "CONFIRMED" | "DECLINED" | "COMPLETED" | "CANCELLED" }) {
  const session = await getSession();
  if (!session) return { error: "Please log in." };

  const booking = await prisma.booking.findUnique({ where: { id: input.bookingId }, include: { coach: true } });
  if (!booking) return { error: "Not found." };

  // Authorization
  if (input.status === "CONFIRMED" || input.status === "DECLINED") {
    if (booking.coach.userId !== session.userId) return { error: "Not your booking." };
  } else if (input.status === "CANCELLED") {
    if (booking.clientId !== session.userId && booking.coach.userId !== session.userId)
      return { error: "Not your booking." };
  }

  await prisma.booking.update({ where: { id: input.bookingId }, data: { status: input.status } });
  revalidatePath("/dashboard");
  revalidatePath("/coach");
  return { ok: true };
}

export async function toggleFavourite(coachId: string) {
  const session = await getSession();
  if (!session) return { error: "Please log in." };
  const existing = await prisma.favourite.findUnique({
    where: { userId_coachId: { userId: session.userId, coachId } },
  });
  if (existing) await prisma.favourite.delete({ where: { id: existing.id } });
  else await prisma.favourite.create({ data: { userId: session.userId, coachId } });
  revalidatePath("/dashboard");
  return { ok: true, favourited: !existing };
}

export async function logProgress(input: { metric: string; value: number; unit?: string; note?: string }) {
  const session = await getSession();
  if (!session) return { error: "Please log in." };
  await prisma.progressEntry.create({
    data: {
      userId: session.userId,
      metric: input.metric,
      value: input.value,
      unit: input.unit,
      note: input.note,
    },
  });
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function updateCoachProfile(input: {
  headline?: string;
  tagline?: string;
  longBio?: string;
  hourlyRate?: number;
  formats?: string;
  vibeTags?: string;
  languages?: string;
}) {
  const session = await getSession();
  if (!session || session.role !== "COACH") return { error: "Not a coach." };
  await prisma.coach.update({
    where: { userId: session.userId },
    data: input,
  });
  revalidatePath("/coach");
  return { ok: true };
}

// Anything bigger than this and the network round-trip + DB column gets unhappy.
// 200KB base64 ≈ ~150KB raw image, plenty for a 384x384 JPEG avatar.
const MAX_AVATAR_BYTES = 200_000;
const NAME_MAX = 80;
const BIO_MAX = 500;
const LOCATION_MAX = 80;

function isSafeImageUrl(url: string): boolean {
  if (!url) return true;
  // Accept resized data URLs (the avatar uploader produces these)
  if (url.startsWith("data:image/")) return url.length <= MAX_AVATAR_BYTES;
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

export async function updateUserProfile(input: {
  name?: string;
  bio?: string;
  location?: string;
  avatarUrl?: string;
}): Promise<{ ok: true } | { error: string }> {
  const session = await getSession();
  if (!session) return { error: "Please log in." };

  const data: Record<string, string | null> = {};

  if (input.name !== undefined) {
    const name = input.name.trim();
    if (!name) return { error: "Name can't be empty." };
    if (name.length > NAME_MAX) return { error: `Name too long (${NAME_MAX} char max).` };
    data.name = name;
  }
  if (input.bio !== undefined) {
    const bio = input.bio.trim();
    if (bio.length > BIO_MAX) return { error: `Bio too long (${BIO_MAX} char max).` };
    data.bio = bio || null;
  }
  if (input.location !== undefined) {
    const location = input.location.trim();
    if (location.length > LOCATION_MAX) return { error: `Location too long (${LOCATION_MAX} char max).` };
    data.location = location || null;
  }
  if (input.avatarUrl !== undefined) {
    const url = input.avatarUrl.trim();
    if (!isSafeImageUrl(url)) return { error: "That doesn't look like a valid image URL." };
    if (url.length > MAX_AVATAR_BYTES) return { error: "Avatar image is too large (try a smaller photo)." };
    data.avatarUrl = url || null;
  }

  if (Object.keys(data).length === 0) return { ok: true };

  try {
    await prisma.user.update({ where: { id: session.userId }, data });
  } catch (e) {
    return { error: "Couldn't save your profile. Try again." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profile");
  revalidatePath("/coach");
  revalidatePath("/coach/profile");
  return { ok: true };
}

/**
 * Self-service: the currently-logged-in user permanently deletes their own
 * account and everything connected to it. Requires retyping their email to
 * confirm — checked client-side, re-checked here.
 */
export async function deleteOwnAccount(confirmEmail: string): Promise<{ error: string } | never> {
  const session = await getSession();
  if (!session) return { error: "Please log in." };
  if (confirmEmail.trim().toLowerCase() !== session.email.toLowerCase()) {
    return { error: "Email confirmation didn't match — your account was not deleted." };
  }
  try {
    await deleteUserCascade(session.userId);
  } catch (e) {
    return { error: "Couldn't delete your account. Please try again." };
  }
  await destroySession();
  revalidatePath("/", "layout");
  redirect("/?deleted=1");
}

/**
 * Owner-only: delete any user by id. Owners can't delete themselves through
 * this action (use deleteOwnAccount instead) so we don't accidentally lock
 * the business out of its own admin panel.
 */
export async function adminDeleteUser(userId: string): Promise<{ ok: true } | { error: string }> {
  const session = await getSession();
  if (!session) return { error: "Please log in." };
  if (session.role !== "OWNER") return { error: "Not authorised." };
  if (userId === session.userId) {
    return { error: "Use 'Delete my account' for your own account — this is the admin tool." };
  }
  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) return { error: "User not found." };
  try {
    await deleteUserCascade(userId);
  } catch (e) {
    return { error: "Couldn't delete that user. Please try again." };
  }
  revalidatePath("/owner");
  return { ok: true };
}
