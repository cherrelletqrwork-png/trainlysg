"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession, hashPassword, verifyPassword, homePathFor, type UserRole } from "@/lib/auth";

const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["CLIENT", "COACH"]),
  location: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type AuthState = { error?: string };

export async function signup(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Please check your details." };
  const { name, email, password, role, location } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "That email is already registered." };

  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash: await hashPassword(password),
      role,
      location,
      avatarUrl: `https://i.pravatar.cc/200?u=${encodeURIComponent(email)}`,
    },
  });

  if (role === "COACH") {
    const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const slug = `${baseSlug}-${user.id.slice(0, 4)}`;
    await prisma.coach.create({
      data: {
        userId: user.id,
        slug,
        headline: "New Trainly coach",
        tagline: "Help your clients move better.",
        longBio: "Tell your story — what do you specialise in, who do you love working with, and what makes your sessions different?",
        heroImageUrl: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1200&h=800&fit=crop",
        galleryUrls: "[]",
        yearsExperience: 1,
        hourlyRate: 80,
        languages: "English",
        formats: "HOME,VIRTUAL",
        vibeTags: "Friendly,Patient",
        certifications: "[]",
        socials: "{}",
        isVerified: false,
      },
    });
  }

  await createSession({ userId: user.id, role: user.role as UserRole, email: user.email, name: user.name });
  redirect(role === "COACH" ? "/coach" : "/coaches");
}

export async function login(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Enter a valid email and password." };
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { error: "Invalid login." };
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return { error: "Invalid login." };

  const role = user.role as UserRole;
  await createSession({ userId: user.id, role, email: user.email, name: user.name });
  redirect(homePathFor(role));
}

export async function logout() {
  await destroySession();
  redirect("/");
}
