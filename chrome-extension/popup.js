"use strict";

const status = document.querySelector("#status");
const results = document.querySelector("#results");
const tabs = document.querySelector("#tabs");
const panels = document.querySelector("#panels");
const modes = [...document.querySelectorAll("[data-mode]")];

const lines = (...parts) => parts.filter(Boolean).join("\n");

function sellerPosts(data) {
  const read = (field) => String(data.get(field) ?? "").trim();
  const name = read("name");
  const price = read("price");
  const delivery = read("delivery");
  const features = read("features").split(/\r?\n/)
    .map((line) => line.trim().replace(/^[-*•]\s+/, "")).filter(Boolean);
  const bullets = features.map((feature) => "• " + feature).join("\n");
  const location = delivery && "Delivery / pickup: " + delivery;
  const cta = "Message to order.";
  return [
    ["WhatsApp Business", lines("*" + name + "*", price && "*Price:* " + price, location, bullets, cta)],
    ["Instagram", [features[0] ? name + " — " + features[0] : "Meet " + name, lines(price, location, bullets), cta, "#ProductFinds #ShopNow"].filter(Boolean).join("\n\n")],
    ["Facebook Marketplace", lines("Product: " + name, price && "Price: " + price, location, bullets && "Features:\n" + bullets, cta)],
    ["TikTok", lines([name, features[0], price].filter(Boolean).join(" · "), cta + " #ProductFinds #ShopNow")],
  ];
}

function creatorPosts(post) {
  const compact = post.replace(/\s+/g, " ");
  const shorten = (limit) => {
    const characters = Array.from(compact);
    return characters.length > limit ? characters.slice(0, limit - 1).join("").trimEnd() + "…" : compact;
  };
  return [
    ["LinkedIn", post.split(/\n+/).map((line) => line.trim()).filter(Boolean).join("\n\n")],
    ["X", shorten(140)],
    ["Threads", shorten(500)],
  ];
}

function selectTab(index, focus = false) {
  [...tabs.children].forEach((tab, position) => {
    const selected = position === index;
    tab.setAttribute("aria-selected", String(selected));
    tab.tabIndex = selected ? 0 : -1;
    panels.children[position].hidden = !selected;
    if (selected && focus) tab.focus();
  });
  status.textContent = "";
}

function renderPosts(posts) {
  tabs.replaceChildren();
  panels.replaceChildren();
  posts.forEach(([platform, post], index) => {
    const tab = document.createElement("button");
    tab.type = "button";
    tab.id = "tab-" + index;
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-controls", "post-" + index);
    tab.textContent = platform;
    tab.addEventListener("click", () => selectTab(index));
    tab.addEventListener("keydown", (event) => {
      const targets = { ArrowLeft: (index + posts.length - 1) % posts.length, ArrowRight: (index + 1) % posts.length, Home: 0, End: posts.length - 1 };
      if (!Object.hasOwn(targets, event.key)) return;
      event.preventDefault();
      selectTab(targets[event.key], true);
    });
    tabs.append(tab);

    const panel = document.createElement("div");
    panel.id = "post-" + index;
    panel.setAttribute("role", "tabpanel");
    panel.setAttribute("aria-labelledby", tab.id);
    const output = document.createElement("textarea");
    output.readOnly = true;
    output.rows = 5;
    output.value = post;
    output.setAttribute("aria-label", platform + " formatted post");
    const copy = document.createElement("button");
    copy.type = "button";
    copy.className = "primary";
    copy.textContent = "Copy";
    copy.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(post);
        status.textContent = "Copied!";
      } catch {
        output.select();
        status.textContent = "Text selected. Press Ctrl+C or Command+C to copy.";
      }
    });
    panel.append(output, copy);
    panels.append(panel);
  });
  results.hidden = false;
  selectTab(0);
  status.textContent = posts.length + " posts formatted.";
}

for (const button of modes) {
  button.addEventListener("click", () => {
    if (button.getAttribute("aria-pressed") === "true") return;
    for (const mode of modes) {
      const active = mode === button;
      mode.setAttribute("aria-pressed", String(active));
      document.getElementById(mode.dataset.mode).hidden = !active;
    }
    results.hidden = true;
    status.textContent = "";
  });
  const form = document.getElementById(button.dataset.mode);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const seller = form.id === "seller";
    const data = new FormData(form);
    const value = String(data.get(seller ? "name" : "post") ?? "").trim();
    if (!value) {
      status.textContent = seller ? "Enter a product name." : "Enter a post.";
      return;
    }
    renderPosts(seller ? sellerPosts(data) : creatorPosts(value));
  });
}
