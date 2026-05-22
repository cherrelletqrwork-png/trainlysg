"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { destroySession, getSession, hashPassword } from "@/lib/auth";
import { setSiteContent, type SiteContent } from "@/lib/site-content";

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

// ───────────────────────────────────────────────────────────────────
// OWNER-ONLY: Editable site content (landing stats + footer)
// ───────────────────────────────────────────────────────────────────

export async function updateSiteContent(content: SiteContent): Promise<{ ok: true } | { error: string }> {
  const session = await getSession();
  if (!session || session.role !== "OWNER") return { error: "Not authorised." };

  // Light validation
  if (!Array.isArray(content.heroStats) || content.heroStats.length === 0)
    return { error: "Need at least one hero stat." };
  for (const s of content.heroStats) {
    if (typeof s.n !== "string" || typeof s.label !== "string")
      return { error: "Hero stats must have a number and a label." };
  }
  for (const col of [content.footer.clients, content.footer.coaches, content.footer.company]) {
    if (typeof col.title !== "string") return { error: "Footer column needs a title." };
    if (!Array.isArray(col.links)) return { error: "Footer column needs links." };
  }

  try {
    await setSiteContent(content);
  } catch (e) {
    return { error: "Couldn't save changes. Please try again." };
  }
  revalidatePath("/", "layout");
  revalidatePath("/owner");
  return { ok: true };
}

// ───────────────────────────────────────────────────────────────────
// OWNER-ONLY: Create new coach
// ───────────────────────────────────────────────────────────────────

export async function adminCreateCoach(input: {
  name: string;
  email: string;
  password: string;
  slug: string;
  location: string;
  headline: string;
  tagline: string;
  hourlyRate: number;
  specialtySlugs: string[];
  formats: string;
  vibeTags: string;
  languages: string;
}): Promise<{ ok: true; coachSlug: string } | { error: string }> {
  const session = await getSession();
  if (!session || session.role !== "OWNER") return { error: "Not authorised." };

  // Basic validation
  if (input.name.trim().length < 2) return { error: "Name is too short." };
  if (!/^\S+@\S+\.\S+$/.test(input.email)) return { error: "Invalid email." };
  if (input.password.length < 6) return { error: "Password must be at least 6 characters." };
  if (!/^[a-z0-9-]+$/.test(input.slug)) return { error: "Slug can only contain lowercase letters, numbers, and dashes." };
  if (input.hourlyRate < 10 || input.hourlyRate > 2000) return { error: "Hourly rate must be between S$10 and S$2000." };

  // Uniqueness
  const existingUser = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
  if (existingUser) return { error: "A user with that email already exists." };
  const existingSlug = await prisma.coach.findUnique({ where: { slug: input.slug } });
  if (existingSlug) return { error: "That slug is taken — pick another." };

  // Resolve specialties
  const specialties = await prisma.specialty.findMany({ where: { slug: { in: input.specialtySlugs } } });
  if (specialties.length === 0) return { error: "Pick at least one specialty." };

  try {
    const user = await prisma.user.create({
      data: {
        email: input.email.toLowerCase(),
        passwordHash: await hashPassword(input.password),
        name: input.name,
        role: "COACH",
        location: input.location,
        bio: input.tagline,
        avatarUrl: `https://i.pravatar.cc/200?u=${encodeURIComponent(input.email)}`,
      },
    });
    const coach = await prisma.coach.create({
      data: {
        userId: user.id,
        slug: input.slug,
        headline: input.headline,
        tagline: input.tagline,
        longBio: "Tell your story — what do you specialise in, who do you love working with, and what makes your sessions different?",
        heroImageUrl: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1200&h=800&fit=crop",
        galleryUrls: "[]",
        yearsExperience: 1,
        hourlyRate: input.hourlyRate,
        languages: input.languages || "English",
        formats: input.formats || "HOME,VIRTUAL",
        vibeTags: input.vibeTags || "Friendly,Patient",
        certifications: "[]",
        socials: "{}",
        isVerified: true,
      },
    });
    for (const s of specialties) {
      await prisma.coachSpecialty.create({ data: { coachId: coach.id, specialtyId: s.id } });
    }
    // Default packages
    await prisma.package.create({
      data: {
        coachId: coach.id,
        name: "Single Session",
        sessions: 1,
        priceSGD: input.hourlyRate,
        description: "Try-it-out session.",
      },
    });
    // Default availability: Mon–Sat, 7am–9pm
    for (let weekday = 1; weekday <= 6; weekday++) {
      await prisma.availability.create({ data: { coachId: coach.id, weekday, startMin: 7 * 60, endMin: 21 * 60 } });
    }
    revalidatePath("/coaches");
    revalidatePath("/owner");
    return { ok: true, coachSlug: coach.slug };
  } catch (e) {
    return { error: "Couldn't create coach. Please try again." };
  }
}

