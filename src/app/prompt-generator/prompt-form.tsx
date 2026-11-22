"use client";

import { useLanguage } from "../language-context";
import GeminiWriterPanel from '../generation/gemini-writer-panel';
import { ContentPage } from "../site-shell";
import type { Message } from "../translations";
import { useState, type FormEvent } from "react";

const goals = {
  pinterest: { label: "Pinterest Pin & Viral Board Marketing Strategy", brief: "Act as a Pinterest strategist. Create five keyword-focused Pin titles, two descriptions with six relevant search hashtags each, three board names with descriptions, image alt text based only on supplied visual details, and a four-week publishing plan. Avoid invented performance guarantees." },
  description: {
    label: "High-Converting Product Description",
    brief: "Act as an ecommerce copywriter. Produce a benefit-led headline, a 60–100 word description, four feature-to-benefit bullets, and a clear call to action. Address one likely buyer objection using only supplied facts. Make the result easy to skim on mobile.",
  },
  video: {
    label: "TikTok & Reels Viral Video Script",
    brief: "Act as a short-form video strategist. Write three opening hooks and a 20–30 second script using the strongest hook. Provide a table with timestamps, shot direction, spoken lines, and on-screen text. Show the product or idea in action, then close with one call to action. Include a two-line caption.",
  },
  ads: {
    label: "Facebook & Instagram Ad Hooks",
    brief: "Act as a paid social copywriter. Write six distinct first-line hooks, two each for the problem, demonstration, and benefit angles. Pair each with a matching visual and a short CTA. Finish with two A/B test variants that change the hook while keeping the offer and CTA fixed.",
  },
  plan: {
    label: "SEO Blog & Social Content Plan",
    brief: "Act as an SEO editor and social strategist. Identify the likely search intent, propose a title and meta description, and outline the article with H2s and the questions each should answer. Then create a one-week repurposing plan with platform, format, opening hook, and CTA. Label keyword ideas as hypotheses and omit unverified search-volume figures.",
  },
} as const;

const targetPresets = [
  "Everyday Online Shoppers — Friendly & Clear",
  "Impulse Buyers — Energetic & Urgent (TikTok/Reels)",
  "Value-Conscious Buyers — Trustworthy & Practical (WhatsApp/FB)",
  "Premium / Luxury Shoppers — Polished & Elegant",
  "Tech & Gadget Enthusiasts — Sharp & Spec-Focused",
  "B2B / Startup Founders — Professional & Authority-Driven",
] as const;

type Goal = keyof typeof goals;
const inputClass = "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5";

export default function PromptForm() {
  const { t } = useLanguage();
  const [writerKeyword,setWriterKeyword]=useState('');
  const [targetPreset, setTargetPreset] = useState("0");
  const [request, setRequest] = useState<{ goal: Goal; topic: string; selection: string; custom: string }>();
  const [status, setStatus] = useState<Message | "">("");

  function generate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const topic = String(data.get("topic") ?? "").trim();
    const custom = String(data.get("customTarget") ?? "").trim();
    const goal = data.get("goal") as Goal;
    if (!topic || (targetPreset === "custom" && !custom)) {
      setStatus("Enter a topic and a target tone or audience.");
      return;
    }
    setRequest({ goal, topic, selection: targetPreset, custom });
    setStatus("Prompt generated.");
  }

  const prompt = request ? [
      t(goals[request.goal].brief),
      t("Product or topic: ") + request.topic,
      t("Target tone and audience: ") + (request.selection === "custom" ? request.custom : t(targetPresets[Number(request.selection)])),
      t("Use the supplied details as context. Keep claims specific and verifiable. Never invent prices, specs, testimonials, or results. Ask up to three focused questions if missing facts would materially change the draft. Otherwise use clearly marked placeholders and return the requested deliverables in order."),
    ].join("\n\n") : "";

  async function copy() {
    try {
      await navigator.clipboard.writeText(prompt);
      setStatus("Copied!");
    } catch {
      setStatus("Select the prompt and copy it manually.");
    }
  }

  return <ContentPage title={t("AI Prompt Generator")} intro={t("Build a prompt for product descriptions, short videos, ad hooks, or content planning. Copy it into ChatGPT, Claude, or Gemini.")}><div className="grid gap-5">
    <form onSubmit={generate} className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-5">
      <label className="font-semibold">{t("Keyword or Product/Topic")}
        <input onChange={e=>setWriterKeyword(e.target.value)} name="topic" className={inputClass} dir="auto" placeholder={t("Wireless headphones")} maxLength={300} required />
      </label>
      <label className="font-semibold">{t("Goal")}
        <select name="goal" className={inputClass}>
          {Object.entries(goals).map(([value, goal]) => <option key={value} value={value}>{t(goal.label)}</option>)}
        </select>
      </label>
      <label className="font-semibold">{t("Target Tone / Audience")}
        <select name="target" className={inputClass} value={targetPreset} onChange={(event) => setTargetPreset(event.target.value)}>
          {targetPresets.map((preset, index) => <option key={preset} value={index}>{t(preset)}</option>)}
          <option value="custom">{t("Custom (Type your own)...")}</option>
        </select>
      </label>
      {targetPreset === "custom" && (
        <label className="font-semibold">{t("Custom Tone / Audience")}
          <input name="customTarget" className={inputClass} dir="auto" placeholder={t("Practical and friendly for commuters")} maxLength={300} required />
        </label>
      )}
      <button type="submit" className="justify-self-start rounded-lg bg-emerald-700 px-5 py-3 font-semibold text-white">{t("Generate AI Prompt")}</button>
    </form>
    {prompt && <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
      <label htmlFor="generated-prompt" className="font-bold text-slate-900">{t("Generated prompt")}</label>
      <textarea id="generated-prompt" dir="auto" readOnly value={prompt} rows={12} className={inputClass + " text-sm"} />
      <button type="button" onClick={copy} className="mt-3 rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white">{t("Copy Prompt")}</button>
    </section>}
    <p role="status" className="text-sm text-emerald-800">{status && t(status)}</p>
  </div><GeminiWriterPanel initialKeyword={writerKeyword}/></ContentPage>;
}
