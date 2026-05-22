import { prisma } from "./prisma";

export type HeroStat = { n: string; label: string };
export type FooterLink = { label: string; href: string };
export type FooterColumn = { title: string; links: FooterLink[] };

export type SiteContent = {
  heroStats: HeroStat[];
  footer: {
    clients: FooterColumn;
    coaches: FooterColumn;
    company: FooterColumn;
  };
};

export const DEFAULT_SITE_CONTENT: SiteContent = {
  heroStats: [
    { n: "2,400+", label: "verified coaches" },
    { n: "4.9★", label: "avg rating" },
    { n: "48hr", label: "money-back guarantee" },
  ],
  footer: {
    clients: {
      title: "For clients",
      links: [
        { label: "Browse coaches", href: "/coaches" },
        { label: "AI Match", href: "/match" },
        { label: "Trainly+", href: "/coaches" },
        { label: "Gift cards", href: "/coaches" },
      ],
    },
    coaches: {
      title: "For coaches",
      links: [
        { label: "Become a Trainly coach", href: "/signup" },
        { label: "Coach Academy", href: "/coaches" },
        { label: "Insurance & trust", href: "/" },
        { label: "Pricing", href: "/" },
      ],
    },
    company: {
      title: "Company",
      links: [
        { label: "About", href: "/" },
        { label: "Press", href: "/" },
        { label: "Careers", href: "/" },
        { label: "Contact", href: "/" },
      ],
    },
  },
};

/** Read site content. Falls back to defaults if no row exists yet. */
export async function getSiteContent(): Promise<SiteContent> {
  try {
    const row = await prisma.siteContent.findUnique({ where: { id: "singleton" } });
    if (!row) return DEFAULT_SITE_CONTENT;
    const parsed = JSON.parse(row.data) as Partial<SiteContent>;
    // Merge with defaults so missing keys don't blow up the UI
    return {
      heroStats: parsed.heroStats?.length ? parsed.heroStats : DEFAULT_SITE_CONTENT.heroStats,
      footer: {
        clients: parsed.footer?.clients ?? DEFAULT_SITE_CONTENT.footer.clients,
        coaches: parsed.footer?.coaches ?? DEFAULT_SITE_CONTENT.footer.coaches,
        company: parsed.footer?.company ?? DEFAULT_SITE_CONTENT.footer.company,
      },
    };
  } catch {
    return DEFAULT_SITE_CONTENT;
  }
}

/** Upsert site content. */
export async function setSiteContent(content: SiteContent) {
  await prisma.siteContent.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", data: JSON.stringify(content) },
    update: { data: JSON.stringify(content) },
  });
}
