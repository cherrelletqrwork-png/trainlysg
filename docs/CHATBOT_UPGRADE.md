# Upgrading the Trainly Chatbot from Canned → Real AI

Trainly's chatbot currently runs in **canned mode** (keyword-matched FAQ responses,
zero cost, ships out of the box).

There are two upgrade paths when you want real AI. Both take ~10 minutes.

---

## Option A — Free: Google Gemini Flash

Best if you want real AI without paying.

1. Get a free Gemini API key at <https://aistudio.google.com/app/apikey>
2. In `src/lib/chatbot.ts`, replace the `claudeReply()` function with a Gemini call
   (free tier: ~1,500 requests/day on Flash — plenty for Trainly's scale).
3. Add `GEMINI_API_KEY` to:
   - Local `.env`
   - Vercel → Project Settings → Environment Variables (Production)
4. Update the env-detection branch in `chatbotReply()` to check for `GEMINI_API_KEY`.
5. Push — Vercel auto-deploys.

Ask Claude to do the code swap — it's a 10-minute job.

---

## Option B — Paid: Anthropic Claude

Best if you want Claude-branded AI and don't mind paying.

1. Sign up at <https://console.anthropic.com> (Individual is fine).
2. Add a payment method and top up at least **$5 USD** in credits.
3. Create an API key (name it `trainly-prod`), copy it (starts with `sk-ant-...`).
4. **Before pasting it anywhere**, verify the model name in
   `src/lib/chatbot.ts` (line ~140) matches a currently-available Claude model.
   Check at <https://docs.anthropic.com/en/docs/about-claude/models>.
5. Add `ANTHROPIC_API_KEY` to:
   - Local `.env`
   - Vercel → Project Settings → Environment Variables (Production)
6. Redeploy.

Cost estimate at Trainly's scale:
- Haiku-class models: ~$0.0003 per conversation
- $5 of credits ≈ ~15,000 conversations

---

## How to know the upgrade worked

The `/api/chat` endpoint returns a `source` field in its JSON response:

```json
{ "reply": "...", "source": "canned" }   // FAQ keyword matched
{ "reply": "...", "source": "claude" }   // Real Claude AI used
{ "reply": "...", "source": "gemini" }   // Real Gemini AI used (after Option A)
```

Test by curling:
```bash
curl -X POST https://trainly-sg.vercel.app/api/chat \
  -H "content-type: application/json" \
  -d '{"message":"will trainly help me lose 10kg?"}'
```

If `source` is still `canned` after setting the key, check:
- The env var name spelled correctly
- The env var is set to "Production" (not just Preview/Development)
- You redeployed after adding the var (Vercel needs a fresh build to pick it up)

---

## Why we deferred

As of project kickoff, Trainly's chatbot answered ~20 well-targeted Singapore-
specific FAQs cleanly via canned mode, and the project had no live users testing
it. The cost-to-value of real AI was low. Revisit when:

- Real users start hitting the chatbot frequently (check Vercel logs)
- Investor or partner feedback specifically mentions chatbot limitations
- You're adding an Anthropic key anyway for other features
