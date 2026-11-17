"use strict";

const messages = {
"Import From Current Page": {fr:"Importer depuis cette page",ar:"استيراد من الصفحة الحالية"},
"Page imported. Review the details.": {fr:"Page importée. Vérifiez les détails.",ar:"تم الاستيراد. راجع التفاصيل."},
"Could not read this page. Open a product page and try again.": {fr:"Lecture impossible. Ouvrez une page produit et réessayez.",ar:"تعذّرت قراءة الصفحة. افتح صفحة منتج وحاول مجددًا."},
  "Formatting mode": {
    "fr": "Mode de mise en forme",
    "ar": "وضع التنسيق"
  },
  "Seller Mode": {
    "fr": "Mode Vendeur",
    "ar": "وضع البائع"
  },
  "Creator Mode": {
    "fr": "Mode Créateur",
    "ar": "وضع صانع المحتوى"
  },
  "Product Name": {
    "fr": "Nom du produit",
    "ar": "اسم المنتج"
  },
  "Price": {
    "fr": "Prix",
    "ar": "السعر"
  },
  "$29": {
    "fr": "29 €",
    "ar": "29 درهمًا"
  },
  "Delivery / Location": {
    "fr": "Livraison / lieu de retrait",
    "ar": "التوصيل أو موقع الاستلام"
  },
  "Key Features": {
    "fr": "Caractéristiques principales",
    "ar": "أهم الميزات"
  },
  "One feature per line": {
    "fr": "Une caractéristique par ligne",
    "ar": "ميزة واحدة في كل سطر"
  },
  "Format Posts": {
    "fr": "Formater les publications",
    "ar": "نسّق المنشورات"
  },
  "Quick Post": {
    "fr": "Texte de départ",
    "ar": "نص المنشور"
  },
  "Paste your post or hook": {
    "fr": "Collez votre texte ou votre accroche",
    "ar": "الصق منشورك أو عبارتك الافتتاحية"
  },
  "Formatted posts": {
    "fr": "Publications mises en forme",
    "ar": "المنشورات المنسّقة"
  },
  "Platforms": {
    "fr": "Plateformes",
    "ar": "المنصات"
  },
  "Web Formatter": {
    "fr": "Outil web de mise en forme",
    "ar": "منسّق المنشورات على الويب"
  },
  "Seller Resources": {
    "fr": "Ressources pour les vendeurs",
    "ar": "موارد البائعين"
  },
  "Language": {
    "fr": "Langue",
    "ar": "اللغة"
  },
  "Delivery / pickup": {
    "fr": "Livraison / retrait",
    "ar": "التوصيل أو الاستلام"
  },
  "Message to order.": {
    "fr": "Envoyez un message pour commander.",
    "ar": "راسلنا للطلب."
  },
  "Meet": {
    "fr": "Découvrez",
    "ar": "تعرّف على"
  },
  "Product": {
    "fr": "Produit",
    "ar": "المنتج"
  },
  "Features": {
    "fr": "Caractéristiques",
    "ar": "الميزات"
  },
  "#ProductFinds #ShopNow": {
    "fr": "#BellesTrouvailles #AcheterEnLigne",
    "ar": "#منتجات_مختارة #تسوق_الآن"
  },
  "What has worked for you?": {
    "fr": "Qu’est-ce qui a fonctionné pour vous ?",
    "ar": "ما الذي نجح معكم؟"
  },
  "Your take?": {
    "fr": "Votre avis ?",
    "ar": "ما رأيكم؟"
  },
  "Share your experience below.": {
    "fr": "Partagez votre expérience en commentaire.",
    "ar": "شاركونا تجاربكم في التعليقات."
  },
  "formatted post": {
    "fr": "publication mise en forme",
    "ar": "منشور منسّق"
  },
  "Copy": {
    "fr": "Copier",
    "ar": "نسخ"
  },
  "Copied!": {
    "fr": "Copié !",
    "ar": "تم النسخ!"
  },
  "Text selected. Press Ctrl+C or Command+C to copy.": {
    "fr": "Texte sélectionné. Appuyez sur Ctrl+C ou Cmd+C pour le copier.",
    "ar": "تم تحديد النص. اضغط Ctrl+C أو Cmd+C لنسخه."
  },
  "Posts formatted.": {
    "fr": "Publications mises en forme.",
    "ar": "تم تنسيق المنشورات."
  },
  "Enter a product name.": {
    "fr": "Saisissez un nom de produit.",
    "ar": "أدخل اسم المنتج."
  },
  "Enter a post.": {
    "fr": "Saisissez un texte.",
    "ar": "أدخل نص المنشور."
  },
  "Wireless headphones": {
    "fr": "Casque sans fil",
    "ar": "سماعات لاسلكية"
  },
  "Local pickup or shipping": {
    "fr": "Retrait sur place ou livraison",
    "ar": "استلام محلي أو توصيل"
  }
};
const languageKey = "sellpostly-language";
let language = "en";
let lastRequest = null;
const t = (message) => messages[message]?.[language] ?? message;

function applyLanguage(next) {
  language = next;
  document.documentElement.lang = next;
  document.documentElement.dir = next === "ar" ? "rtl" : "ltr";
  for (const item of document.querySelectorAll("[data-message]")) item.textContent = t(item.dataset.message);
  for (const item of document.querySelectorAll("[data-placeholder]")) item.placeholder = t(item.dataset.placeholder);
  for (const item of document.querySelectorAll("[data-label]")) item.setAttribute("aria-label", t(item.dataset.label));
  for (const button of document.querySelectorAll("[data-language]")) {
    button.setAttribute("aria-pressed", String(button.dataset.language === next));
  }
  if (lastRequest) {
    const active = [...tabs.children].findIndex(tab => tab.getAttribute("aria-selected") === "true");
    renderPosts(lastRequest.seller ? sellerPosts(lastRequest.data) : creatorPosts(lastRequest.value), Math.max(0, active));
  } else {
    feedback.textContent = "";
  }
}


const feedback = document.querySelector("#status");
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
  const location = delivery && t("Delivery / pickup") + ": " + delivery;
  const cta = t("Message to order.");
  return [
    ["WhatsApp Business", lines("*" + name + "*", price && "*" + t("Price") + ":* " + price, location, bullets, cta)],
    ["Instagram", [features[0] ? name + " — " + features[0] : t("Meet") + " " + name, lines(price, location, bullets), cta, t("#ProductFinds #ShopNow")].filter(Boolean).join("\n\n")],
    ["Facebook Marketplace", lines(t("Product") + ": " + name, price && t("Price") + ": " + price, location, bullets && t("Features") + ":\n" + bullets, cta)],
    ["TikTok", lines([name, features[0], price].filter(Boolean).join(" · "), cta + " " + t("#ProductFinds #ShopNow"))],
  ];
}

function creatorPosts(post) {
  const compact = post.replace(/\s+/g, " ");
  const shorten = (limit, cta) => {
    limit -= Array.from(cta).length + 2;
    const characters = Array.from(compact);
    const text = characters.length > limit ? characters.slice(0, limit - 1).join("").trimEnd() + "…" : compact;
    return text + "\n\n" + cta;
  };
  return [
    ["LinkedIn", post.split(/\n+/).map((line) => line.trim()).filter(Boolean).join("\n\n") + "\n\n" + t("What has worked for you?")],
    ["X", shorten(140, t("Your take?"))],
    ["Threads", shorten(500, t("Share your experience below."))],
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
  feedback.textContent = "";
}

function renderPosts(posts, active = 0) {
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
      const targets = { ArrowLeft: (index + posts.length + (language === "ar" ? 1 : -1)) % posts.length, ArrowRight: (index + posts.length + (language === "ar" ? -1 : 1)) % posts.length, Home: 0, End: posts.length - 1 };
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
    output.dir = "auto";
    output.rows = 5;
    output.value = post;
    output.setAttribute("aria-label", platform + " · " + t("formatted post"));
    const copy = document.createElement("button");
    copy.type = "button";
    copy.className = "primary";
    copy.textContent = t("Copy");
    copy.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(post);
        feedback.textContent = t("Copied!");
      } catch {
        output.select();
        feedback.textContent = t("Text selected. Press Ctrl+C or Command+C to copy.");
      }
    });
    panel.append(output, copy);
    panels.append(panel);
  });
  results.hidden = false;
  selectTab(active);
  feedback.textContent = posts.length + " · " + t("Posts formatted.");
}

for (const button of modes) {
  button.addEventListener("click", () => {
    if (button.getAttribute("aria-pressed") === "true") return;
    for (const mode of modes) {
      const active = mode === button;
      mode.setAttribute("aria-pressed", String(active));
      document.getElementById(mode.dataset.mode).hidden = !active;
    }
    lastRequest = null;
    results.hidden = true;
    feedback.textContent = "";
  });
  const form = document.getElementById(button.dataset.mode);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const seller = form.id === "seller";
    const data = new FormData(form);
    const value = String(data.get(seller ? "name" : "post") ?? "").trim();
    if (!value) {
      feedback.textContent = seller ? t("Enter a product name.") : t("Enter a post.");
      return;
    }
    lastRequest = { seller, data, value };
    renderPosts(seller ? sellerPosts(data) : creatorPosts(value));
  });
}

let savedLanguage;
try {
  savedLanguage = localStorage.getItem(languageKey);
} catch {
  // The switcher can still be used for this session.
}
applyLanguage(savedLanguage === "fr" || savedLanguage === "ar" ? savedLanguage : "en");
for (const button of document.querySelectorAll("[data-language]")) {
  button.addEventListener("click", () => {
    const next = button.dataset.language;
    applyLanguage(next);
    try {
      localStorage.setItem(languageKey, next);
    } catch {
      // Keep the selection for the current popup.
    }
  });
}

document.querySelector("#import-page").addEventListener("click", async () => {
  const button = document.querySelector("#import-page");
  button.disabled = true;
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || !/^https?:/.test(tab.url || "")) throw Error();
    const [execution] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const text = (selector) => {
          const element = document.querySelector(selector);
          return (element?.getAttribute("content") || element?.textContent || "").replace(/\s+/g, " ").trim();
        };
        function findProduct(value, depth = 0) {
          if (!value || typeof value !== "object" || depth > 12) return;
          if (Array.isArray(value)) {
            for (const child of value) { const found = findProduct(child, depth + 1); if (found) return found; }
          } else {
            if ([value["@type"]].flat().includes("Product")) return value;
            for (const child of Object.values(value)) { const found = findProduct(child, depth + 1); if (found) return found; }
          }
        }
        let product;
        for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
          try { product = findProduct(JSON.parse(script.textContent)); if (product) break; } catch {}
        }
        const offer = [product?.offers].flat()[0];
        const price = offer?.price ?? offer?.lowPrice;
        const name = text('meta[property="og:title"]') || text("#productTitle") || text("h1");
        return {
          name: name.slice(0, 120),
          price: (price != null ? String(price) + " " + (offer.priceCurrency || "") : text(".a-price .a-offscreen") || text("[itemprop=price]")).trim().slice(0, 35),
          features: (text('meta[property="og:description"]') || text("#feature-bullets")).slice(0, 1200)
        };
      }
    });
    const product = execution?.result;
    if (!product?.name) throw Error();
    const form = document.querySelector("#seller");
    for (const key of ["name", "price", "features"]) form.elements.namedItem(key).value = product[key] || "";
    lastRequest = null;
    results.hidden = true;
    feedback.textContent = t("Page imported. Review the details.");
  } catch {
    feedback.textContent = t("Could not read this page. Open a product page and try again.");
  } finally {
    button.disabled = false;
  }
});
