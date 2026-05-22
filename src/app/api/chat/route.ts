import { NextRequest } from "next/server";
import { chatbotReply } from "@/lib/chatbot";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let message: unknown;
  try {
    const body = await req.json();
    message = body?.message;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof message !== "string" || !message.trim()) {
    return Response.json({ error: "Message is required" }, { status: 400 });
  }
  if (message.length > 800) {
    return Response.json({ error: "Message too long (800 char max)" }, { status: 400 });
  }

  try {
    const result = await chatbotReply(message);
    return Response.json(result);
  } catch (e) {
    console.error("[trainly chatbot] unexpected error", e);
    return Response.json(
      {
        reply:
          "Sorry, I'm having trouble right now. You can email hello@trainly.sg and a real human will reply within a day.",
        source: "error",
      },
      { status: 200 }
    );
  }
}
