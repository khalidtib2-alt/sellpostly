"use client";

import { useState, type FormEvent } from "react";

type Post = { platform: string; text: string; url?: string };
type Mode = "seller" | "creator";

function sellerPosts(data: FormData): Post[] {
  const read = (key: string) => String(data.get(key) ?? "").trim();
  const name = read("name");
  const price = [read("price"), read("currency")].filter(Boolean).join(" ");
  const delivery = read("delivery");
  const features = read("features").split("\n").map(line => line.trim().replace(/^[-•*]\s+/, "")).filter(Boolean);
  const bullets = features.map(feature => "• " + feature).join("\n");
  const contact = read("contact");
  const order = contact ? "Order: " + contact : "Message to order.";
  const location = delivery && "Delivery / pickup: " + delivery;
  const tag = name.replace(/[^\p{L}\p{N}]/gu, "").slice(0, 35);
  const join = (...parts: string[]) => parts.filter(Boolean).join("\n");
  const caption = [name, price, features[0]].filter(Boolean).join(" · ");
  return [
    { platform: "WhatsApp Business", url: "https://web.whatsapp.com/", text: join("*" + name + "*", price && "*Price:* " + price, location, bullets, order) },
    { platform: "Instagram", url: "https://www.instagram.com/", text: [features[0] ? name + " — " + features[0] : "Meet " + name, join(price, location, bullets), order, [tag && "#" + tag, "#ShopNow", "#ProductFinds"].filter(Boolean).join(" ")].filter(Boolean).join("\n\n") },
    { platform: "Facebook Marketplace", url: "https://www.facebook.com/marketplace/", text: join("Product: " + name, price && "Price: " + price, location, bullets && "Features:\n" + bullets, order) },
    { platform: "TikTok", url: "https://www.tiktok.com/", text: join(caption, order.replace(/\s+/g, " ") + " #ShopNow #ProductFinds") },
  ];
}

function creatorPosts(hook: string): Post[] {
  const normalized = hook.replace(/\s+/g, " ").trim();
  const truncate = (limit: number) => {
    const characters = Array.from(normalized);
    return characters.length <= limit ? normalized : characters.slice(0, limit - 1).join("").trimEnd() + "…";
  };
  return [
    { platform: "LinkedIn", text: hook.split(/\n+/).map(line => line.trim()).filter(Boolean).join("\n\n") },
    { platform: "X (Twitter)", text: truncate(140) },
    { platform: "Threads", text: truncate(500) },
  ];
}

const fieldStyle = "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900";

function PostCard({ post }: { post: Post }) {
  const [status, setStatus] = useState("");
  async function copy() {
    try {
      await navigator.clipboard.writeText(post.text);
      setStatus("Copied!");
    } catch {
      setStatus("Copy failed. Select the text to copy it manually.");
    }
  }
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="font-bold">{post.platform}</h3>
      <p className="my-3 whitespace-pre-wrap break-words text-sm text-slate-700">{post.text}</p>
      <div className="flex flex-wrap gap-3 text-sm font-semibold">
        <button type="button" onClick={copy} className="rounded-md bg-emerald-50 px-3 py-2 text-emerald-800">Copy Text</button>
        {post.url && <a className="rounded-md border border-slate-200 px-3 py-2" href={post.url} target="_blank" rel="noopener noreferrer">Open Platform</a>}
      </div>
      <p role="status" className="mt-1 text-sm text-emerald-800">{status}</p>
    </article>
  );
}

export default function Formatter() {
  const [mode, setMode] = useState<Mode>("seller");
  const [results, setResults] = useState<{ posts: Post[]; version: number }>({ posts: [], version: 0 });
  const [error, setError] = useState("");
  function generate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const required = String(data.get(mode === "seller" ? "name" : "hook") ?? "").trim();
    if (!required) {
      setError(mode === "seller" ? "Enter a product name." : "Enter a post or hook.");
      return;
    }
    setError("");
    setResults(previous => ({ posts: mode === "seller" ? sellerPosts(data) : creatorPosts(required), version: previous.version + 1 }));
  }
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-8">
      <h2 className="text-3xl font-bold tracking-tight">Post Formatter</h2>
      <div role="group" aria-label="Formatter mode" className="mt-5 inline-flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-white p-1">
        {(["seller", "creator"] as const).map(option => (
          <button key={option} type="button" aria-pressed={mode === option} onClick={() => {
            if (mode === option) return;
            setMode(option);
            setError("");
            setResults(previous => ({ posts: [], version: previous.version + 1 }));
          }} className={"rounded-md px-4 py-2 text-sm font-semibold " + (mode === option ? "bg-emerald-700 text-white" : "text-slate-700")}>
            {option === "seller" ? "Seller Mode" : "Creator Mode"}
          </button>
        ))}
      </div>
      <form key={mode} onSubmit={generate} className="mt-6 grid gap-4 text-sm font-medium sm:grid-cols-2">
        {mode === "seller" ? <>
          <label>Product Name<input className={fieldStyle} name="name" required maxLength={120} /></label>
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <label>Price<input className={fieldStyle} name="price" inputMode="decimal" maxLength={30} /></label>
            <label>Currency<select className={fieldStyle} name="currency" defaultValue="USD">{["USD", "CAD", "EUR", "GBP", "AUD", "MAD", "INR", "NGN", "MXN"].map(currency => <option key={currency}>{currency}</option>)}</select></label>
          </div>
          <label>Delivery / Location Info<input className={fieldStyle} name="delivery" maxLength={240} /></label>
          <label>Contact / Order Link<input className={fieldStyle} name="contact" maxLength={300} /></label>
          <label className="sm:col-span-2">Key Features <span className="font-normal text-slate-600">(one per line)</span><textarea className={fieldStyle} name="features" rows={4} maxLength={1500} /></label>
        </> : <label className="sm:col-span-2">Core Post or Hook<textarea className={fieldStyle} name="hook" rows={6} required maxLength={3000} /></label>}
        <div className="sm:col-span-2">
          <button className="rounded-lg bg-emerald-700 px-5 py-3 font-semibold text-white" type="submit">Generate Posts</button>
          {error && <p role="alert" className="mt-2 text-red-700">{error}</p>}
        </div>
      </form>
      <p role="status" className="sr-only">{results.posts.length ? results.posts.length + " posts generated." : ""}</p>
      {results.posts.length > 0 && <div className="mt-7 grid gap-4 sm:grid-cols-2">{results.posts.map(post => <PostCard key={results.version + post.platform} post={post} />)}</div>}
    </div>
  );
}
