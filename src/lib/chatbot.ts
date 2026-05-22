// Trainly chatbot logic.
// Works in two modes:
//   1. CANNED (default): keyword-matched responses about Trainly. Zero setup, zero cost.
//   2. CLAUDE (optional): real LLM answers if `ANTHROPIC_API_KEY` is set in the env.
//
// To enable real AI, add ANTHROPIC_API_KEY to .env locally and to your Vercel project
// (Settings → Environment Variables → Production). Get a key at https://console.anthropic.com

export const TRAINLY_SYSTEM_PROMPT = `You are the Trainly assistant — a friendly, brief, helpful support agent on Trainly's website.

Trainly is Singapore's verified marketplace for freelance fitness and wellness professionals. Facts to use when answering:
- 2,400+ verified coaches: personal trainers, physios, yoga, pilates, nutritionists, kids sports, seniors, rehab, boxing, running
- Train at home, virtually over video, outdoors, or at partner gyms
- Pay per session, packages, or monthly memberships — typical range S$60–S$150 per session
- Coaches verified via Singpass MyInfo, certification cross-check (NASM, ACE, MOH, RYT, etc.), 1-on-1 onboarding interview, and annual background screens
- S$1M public liability insurance on every verified session
- 48-hour first-session money-back guarantee, no questions asked
- Two-sided reviews tied to confirmed bookings, SOS button on home-visit sessions
- Coaches keep 80–88% of every booking
- AI Match: 60-second quiz that shortlists suitable coaches
- Support email: hello@trainly.sg

Voice rules:
- Friendly, slightly warm, never robotic. Sound like a smart Singaporean friend.
- 2–4 short sentences. Lists only when really helpful.
- If you don't know something, say so and point them to hello@trainly.sg.
- Never invent prices, coach names, or policies that aren't above.
- Never give medical advice — recommend booking a physio coach instead.
- Don't promise features Trainly doesn't have.`;

type Faq = { keywords: string[]; reply: string };

const FAQS: Faq[] = [
  {
    keywords: ["how does", "how do you", "how it works", "how trainly works", "what is trainly", "what's trainly", "explain trainly"],
    reply:
      "Trainly is Singapore's verified marketplace for freelance fitness and wellness coaches. Three steps: (1) match with a coach via filters or our 60-second AI quiz, (2) chat and book — at home, online, outdoors, or partner gyms, (3) train. Pay per session, pack, or monthly. 🏋️",
  },
  {
    keywords: ["price", "cost", "how much", "fee", "pricing", "expensive", "cheap"],
    reply:
      "Pricing depends on the coach — most sit between S$60 and S$150 per session. You can pay per session, buy a package, or subscribe monthly. Your first session with any coach is fully refundable within 48 hours if it isn't a fit.",
  },
  {
    keywords: ["verif", "trust", "safe", "real", "background", "scam", "legit", "certif"],
    reply:
      "Every coach passes Singpass MyInfo identity verification, certification cross-checks with the issuing body (NASM, ACE, MOH-registered physios, RYT yoga, etc.), a 1-on-1 onboarding interview, and an annual background screen. Sessions are covered by S$1M public liability insurance.",
  },
  {
    keywords: ["cancel", "refund", "money back", "money-back", "guarantee"],
    reply:
      "Your first session with any coach is fully refundable within 48 hours — no questions asked. After that, each coach's own cancellation policy applies (shown on their profile before you book).",
  },
  {
    keywords: ["where", "location", "home visit", "online", "virtual", "outdoor", "park", "gym"],
    reply:
      "Train wherever fits your life — at home, in a park, at a partner gym, or virtually over video. Use the format filter on Browse Coaches, or pick a session type when you book.",
  },
  {
    keywords: ["become a coach", "be a coach", "join as coach", "i'm a trainer", "i am a trainer", "coach signup", "list myself", "apply as coach", "sign up as coach"],
    reply:
      "Yes! Click 'Get started' top-right, choose Coach, and you'll go through verification (Singpass + certs). Coaches keep 80–88% of every booking, no website needed. We handle discovery, payments, and reviews so you can focus on training.",
  },
  {
    keywords: ["insurance", "covered", "liability", "injured"],
    reply:
      "Every verified session on Trainly is covered by S$1M public liability insurance. You don't pay anything extra — it's built into the booking.",
  },
  {
    keywords: ["payment", "pay", " card", "paynow", "stripe", "credit"],
    reply:
      "We accept cards (Visa / Mastercard / Amex) and PayNow. Payment is held in escrow until the session is complete, so you're protected if anything goes wrong.",
  },
  {
    keywords: ["specialty", "specialties", "type of coach", "kinds of coach", "what coaches", "what kinds", "what do you offer"],
    reply:
      "We cover personal training, yoga, pilates, physiotherapy, sports coaching (incl. kids), nutrition, boxing, running, seniors mobility, prenatal, and more. Browse the full list on the Coaches page.",
  },
  {
    keywords: ["ai match", "match wizard", "quiz", "find a coach", "match me", "recommend"],
    reply:
      "Take our 60-second AI Match quiz — answer a few questions about your goal, vibe, location, and budget, and we'll shortlist suitable coaches with a fit score. Click 'AI Match' in the top nav, or hit the Start AI Match button on the homepage.",
  },
  {
    keywords: ["contact", "support", "help me", "speak to human", "real person"],
    reply:
      "You can email us anytime at hello@trainly.sg — a real human replies within 24 hours, usually faster. For urgent in-session issues, tap the SOS button in your booking.",
  },
  {
    keywords: ["email"],
    reply: "Drop us a line at hello@trainly.sg — we reply within 24 hours, usually a lot faster.",
  },
  {
    keywords: ["physio", "injury", "injured", "pain", "rehab", "recovery", "knee", "back pain", "shoulder"],
    reply:
      "We have MOH-registered physios on Trainly who do rehab, post-op recovery, and chronic pain — at home, online, or in-clinic. Search 'Physiotherapy' on the Coaches page, or use AI Match to shortlist. (I can't give medical advice, but a physio coach can.)",
  },
  {
    keywords: ["kid", "child", "children", "son", "daughter", "napfa", "ipptt"],
    reply:
      "Yes — we have qualified kids' sports coaches and ex-MOE PE teachers, including NAPFA prep specialists. Filter by 'Kids sports' on the Coaches page.",
  },
  {
    keywords: ["senior", "elderly", "old", "mum", "mom", "dad", "grandparent", "mobility"],
    reply:
      "We have coaches who specialise in senior mobility, falls prevention, and gentle strength. Search 'Seniors' on the Coaches page — many do home visits, which is usually best for older clients.",
  },
  {
    keywords: ["hello", "hi there", "hey", "yo", "good morning", "good evening", "good afternoon"],
    reply:
      "Hi! 👋 I'm the Trainly assistant. Ask me anything — coaches, pricing, how it works, becoming a coach, or anything else.",
  },
  { keywords: ["hi"], reply: "Hey! 👋 What would you like to know about Trainly?" },
  { keywords: ["thank", "thx", "thanks", "tq", "ty"], reply: "You're very welcome! Anything else you'd like to know?" },
  { keywords: ["bye", "goodbye", "see you"], reply: "Take care! Train how you live. 🌱" },
];

export function cannedReply(message: string): string {
  const m = message.toLowerCase().trim();
  if (!m) return "What would you like to know about Trainly?";
  for (const faq of FAQS) {
    if (faq.keywords.some((k) => m.includes(k))) return faq.reply;
  }
  return "Good question — I don't have a clean answer for that one off the top of my head. I can help with: how Trainly works, pricing, coach verification, cancellation, becoming a coach, payment, or specialties. You can also email hello@trainly.sg and a real human will get back to you within a day.";
}

async function claudeReply(message: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      // Cheap + fast. Swap to "claude-sonnet-4-5" for higher quality.
      model: "claude-haiku-4-5",
      max_tokens: 400,
      system: TRAINLY_SYSTEM_PROMPT,
      messages: [{ role: "user", content: message.slice(0, 800) }],
    }),
  });
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`Claude API ${r.status}: ${text.slice(0, 200)}`);
  }
  const data = await r.json();
  const text = data?.content?.[0]?.text;
  if (typeof text !== "string" || !text.trim()) {
    throw new Error("Empty Claude response");
  }
  return text.trim();
}

export async function chatbotReply(
  message: string
): Promise<{ reply: string; source: "claude" | "canned" }> {
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const reply = await claudeReply(message);
      return { reply, source: "claude" };
    } catch (e) {
      // Fall back to canned on any API error
      console.warn("[trainly chatbot] Claude failed, falling back to canned:", e);
    }
  }
  return { reply: cannedReply(message), source: "canned" };
}
