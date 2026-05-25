---
description: Product context for Claude Reflect — what we're building, why, who it's for, the design bar, and the non-negotiables an evaluator will check.
alwaysApply: true
---

# Claude Reflect — Product Context

This document is the *why* behind every implementation decision. Read it before generating any code or visual choice. If something you're about to build doesn't serve the principles below, stop and ask.

## Product Name

**Claude Reflect**

## What It Is

A reasoning-transparency layer for AI chat interfaces. Claude Reflect replicates Claude's chat UI and adds a Reflect panel that, for every response, shows the user:

1. **Reasoning skeleton with honesty labels** — the 3–5 reasoning steps that produced the response, each labeled as one of: *From your input*, *General knowledge*, *Inference*, or *Assumption*.
2. **Uncertainty flags** — specific sentences in the response where confidence is lower, each with a reason and a severity (low / medium / high).
3. **Gap disclosure** — what the AI deliberately did not cover, and why.
4. **Critical question gate** — one sharp question that challenges the user to think before acting on the response, with two interactive buttons: *I've considered this* and *Help me think through this* (the latter triggers a follow-up AI call).

The main response itself shows inline colored dots (green / amber / red) on individual sentences, mirroring the labels in the Reflect panel. Clicking a flagged sentence pulses its flag in the Reflect panel; clicking a flag pulses the sentence. The two surfaces are visibly linked.

## Why It Exists

Research findings from the PM project that drove this product:

- **60%** of AI users don't fully verify outputs — they trust polish as a proxy for quality.
- **85%** have received wrong AI outputs or wouldn't know if they had.
- **5 of 8** interview participants couldn't point to the specific part of a response they were least sure about when asked directly.
- The most damaging AI failures aren't the ones users catch — they're the ones users *build on* before discovering the error. One participant executed half a system architecture on wrong AI assumptions before catching it.
- **90%** of surveyed users said uncertainty flagging would change how they use AI responses.
- Users don't have a single trust relationship with AI — they trust its technical output but distrust its reasoning, and they can't tell where one ends and the other begins.

Claude Reflect addresses this by making AI reasoning visible *at the moment of output, before the user acts*. The user is given the structure they need to decide which parts of the response to trust, which to question, and which to verify.

## Who It's For

Early-career professionals using AI for high-stakes tasks where being wrong has real consequences — research, job applications, financial decisions, technical work, legal-adjacent questions, product decisions. People who are smart enough to know AI can be wrong, but don't have the time or the heuristics to verify everything.

## Design Philosophy (the bar is high)

Three senior PMs from established companies will evaluate this prototype live. If it looks like a hackathon project or a generic chatbot template, it fails the eval. The bar:

- **Looks and feels like a real product feature**, not a demo. Specifically, looks and feels like a feature Anthropic might actually ship inside Claude.
- **Visually mirrors Claude's actual chat interface** — warm off-white background in light mode, deep neutral in dark mode, Inter font, generous whitespace, soft borders, calm color palette. The Reflect panel feels native, not bolted on.
- **Polished in both light and dark mode.** Dark mode is not an afterthought.
- **Mobile is fully functional**, not a degraded desktop layout.
- **Microinteractions sell the product.** The pulse-on-cross-link, the dimming after "I've considered this," the gentle Reflect-panel glow on first use — these are the moments evaluators notice and remember.
- **Copy is precise and humane.** No filler. No "Welcome to my app!" energy. Every line of UI text earns its place.

## The Key UX Principle (memorize this)

The Reflect panel must do three things for the user, in this order:

1. **Create curiosity** — the inline colored dots in the main response pull the user's eye toward sentences that are uncertain. The user *wants* to know why.
2. **Enable exploration** — the cross-linking between response and panel rewards engagement. It feels interactive, not static.
3. **Force a pause** — the critical question gate sits at the bottom of the panel, encountered *after* the user has read the reasoning and flags. It's the last thing before they act. The "Help me think through this" button rewards engagement with immediate value.

If any of these three is weak, the product fails to do its job.

## The Four Reflect Components (the deliverable spec)

1. **Reasoning skeleton with honesty labels** — 3–5 steps, each with a colored tag (green = *From your input*, blue = *General knowledge*, amber = *Inference*, red = *Assumption*), the step description, and a brief detail.
2. **Uncertainty flags** — flagged sentences with left amber border, a one-line reason, a severity badge. Clickable to cross-link with the main response.
3. **Gap disclosure** — muted gray list of what was not covered and why, each item with a subtle "eye-off" icon.
4. **Critical question gate** — purple-highlighted box with the question, context underneath, and two buttons: *I've considered this* (ghost) and *Help me think through this* (primary, purple).

## Non-Negotiables (evaluator checklist)

- ✅ Works on mobile and desktop
- ✅ Supports dark and light mode
- ✅ Handles errors gracefully — never crashes the app
- ✅ Deployable on Vercel free tier
- ✅ Uses Groq free API only
- ✅ API key never exposed to the browser
- ✅ Loads fast — sub-2-second first paint, sub-3-second to first main response on a normal connection
- ✅ The inline confidence dots actually render and align to real sentences
- ✅ The cross-linking actually works in both directions
- ✅ The "Help me think through this" button actually fires a third API call and renders the result inline
- ✅ First-time callout shows once and never again (localStorage)
- ✅ Theme toggle persists across reloads
- ✅ Multi-turn conversation works — second and third user messages produce fresh Reflect panels

## What "Done" Looks Like (the demo I'll show evaluators)

I open the live URL on a clean browser. The first-time callout shows once. I type a non-trivial question — something like *"Should I take a fixed-rate or floating-rate home loan in India right now?"*. The main response streams in, with colored dots on several sentences. The Reflect panel populates: a 4-step reasoning skeleton (one *From your input*, two *General knowledge*, one *Inference*), two uncertainty flags (one *medium*, one *high*), three gaps, and a critical question. I click an amber-dotted sentence — the corresponding flag in the panel pulses. I click *Help me think through this* — a follow-up reasoning appears inline below the question. I toggle dark mode — everything stays beautiful. I open the URL on my phone — the Reflect panel becomes a clean accordion, everything still works.

That's the bar. Build to it.

## Voice & Copy Guidelines

- The app's own UI copy (button labels, empty states, error messages) is calm, plainspoken, slightly warm. Not corporate, not chirpy, not over-explained.
- Specific phrasings to use verbatim where applicable:
  - First-time callout: *"Claude Reflect shows you how this response was built so you can decide what to trust."*
  - Empty chat state: *"What can I help you with?"*
  - Reflect panel reflection-failure fallback: *"Reflect couldn't analyze this response. The panel will try again on your next message."*
  - All-confident state for uncertainty flags: *"No specific concerns flagged for this response."*
  - Rate limit message after 3 retries: *"High demand right now. Please try again in a minute."*
  - Network error: *"Connection lost. Check your internet and try again."* with a Retry button.
- Honesty labels are: *From your input*, *General knowledge*, *Inference*, *Assumption*. Exactly those four phrases. No variation.