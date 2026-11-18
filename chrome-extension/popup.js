"use strict";

const messages = {
"Shop Category":{"fr":"Catégorie de boutique","ar":"فئة المتجر"},"Gender / Audience":{"fr":"Genre / Public","ar":"الجنس أو الجمهور"},"All / Unisex":{"fr":"Tous / Mixte","ar":"الكل / للجنسين"},"Men":{"fr":"Hommes","ar":"رجال"},"Women":{"fr":"Femmes","ar":"نساء"},"Unisex":{"fr":"Mixte","ar":"للجنسين"},"Edit Product":{"fr":"Modifier le produit","ar":"تعديل المنتج"},
"Category":{"fr":"Catégorie","ar":"الفئة"},"Tech & Gadgets":{"fr":"Tech et gadgets","ar":"التقنية والأجهزة"},"Fashion":{"fr":"Mode","ar":"الأزياء"},"Home & Kitchen":{"fr":"Maison et cuisine","ar":"المنزل والمطبخ"},"Beauty":{"fr":"Beauté","ar":"الجمال"},"Fitness":{"fr":"Fitness","ar":"اللياقة"},"Top Deals":{"fr":"Meilleures offres","ar":"أفضل العروض"},"Other":{"fr":"Autre","ar":"أخرى"},
"Open Full Studio": {fr:"Ouvrir le studio complet",ar:"فتح الاستوديو الكامل"},
"Website": {fr:"Site web",ar:"Ø§Ù„Ù…ÙˆÙ‚Ø¹"},
"Prompt Generator": {fr:"GÃ©nÃ©rateur de prompts",ar:"Ù…ÙˆÙ„Ù‘Ø¯ Ø§Ù„ØªØ¹Ù„ÙŠÙ…Ø§Øª"},
"Seller Guides": {fr:"Guides pour les vendeurs",ar:"Ø£Ø¯Ù„Ø© Ø§Ù„Ø¨Ø§Ø¦Ø¹ÙŠÙ†"},
"Text & Image copied! Paste (Ctrl+V) directly into your post or chat.":{"fr":"Texte et image copiÃ©s ! Collez-les (Ctrl+V) dans votre publication ou conversation.","ar":"ØªÙ… Ù†Ø³Ø® Ø§Ù„Ù†Øµ ÙˆØ§Ù„ØµÙˆØ±Ø©! Ø§Ù„ØµÙ‚ (Ctrl+V) ÙÙŠ Ø§Ù„Ù…Ù†Ø´ÙˆØ± Ø£Ùˆ Ø§Ù„Ù…Ø­Ø§Ø¯Ø«Ø©."},"Send to My Shop":{"fr":"Envoyer vers ma boutique","ar":"Ø¥Ø±Ø³Ø§Ù„ Ø¥Ù„Ù‰ Ù…ØªØ¬Ø±ÙŠ"},
"Upload or import a product photo first.":{"fr":"Importez dâ€™abord une photo produit.","ar":"Ø§Ø±ÙØ¹ Ø£Ùˆ Ø§Ø³ØªÙˆØ±Ø¯ ØµÙˆØ±Ø© Ø§Ù„Ù…Ù†ØªØ¬ Ø£ÙˆÙ„Ù‹Ø§."},"Please paste a specific product page URL (not a store homepage), or use the SellPostly Chrome Extension on the product page.":{"fr":"Collez lâ€™URL dâ€™une fiche produit prÃ©cise, ou utilisez lâ€™extension Chrome SellPostly sur cette fiche.","ar":"Ø§Ù„ØµÙ‚ Ø±Ø§Ø¨Ø· ØµÙØ­Ø© Ù…Ù†ØªØ¬ Ù…Ø­Ø¯Ø¯ Ø¨Ø¯Ù„ Ø§Ù„ØµÙØ­Ø© Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠØ© Ù„Ù„Ù…ØªØ¬Ø±ØŒ Ø£Ùˆ Ø§Ø³ØªØ®Ø¯Ù… Ø¥Ø¶Ø§ÙØ© SellPostly Ø¹Ù„Ù‰ ØµÙØ­Ø© Ø§Ù„Ù…Ù†ØªØ¬."},"Image copied! Press Ctrl+V in chat to attach the photo.":{"fr":"Image copiÃ©e ! Appuyez sur Ctrl+V dans la conversation pour joindre la photo.","ar":"ØªÙ… Ù†Ø³Ø® Ø§Ù„ØµÙˆØ±Ø©! Ø§Ø¶ØºØ· Ctrl+V ÙÙŠ Ø§Ù„Ù…Ø­Ø§Ø¯Ø«Ø© Ù„Ø¥Ø±ÙØ§Ù‚Ù‡Ø§."},"Send Text":{"fr":"Envoyer le texte","ar":"Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„Ù†Øµ"},"Send Image + Text":{"fr":"Envoyer lâ€™image et le texte","ar":"Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„ØµÙˆØ±Ø© ÙˆØ§Ù„Ù†Øµ"},"Image downloaded. Attach it and paste the caption.":{"fr":"Image tÃ©lÃ©chargÃ©e. Joignez-la et collez la lÃ©gende.","ar":"ØªÙ… ØªÙ†Ø²ÙŠÙ„ Ø§Ù„ØµÙˆØ±Ø©. Ø£Ø±ÙÙ‚Ù‡Ø§ ÙˆØ§Ù„ØµÙ‚ Ø§Ù„Ù†Øµ."},"Sharing failed. Copy the text or download the image.":{"fr":"Ã‰chec du partage. Copiez le texte ou tÃ©lÃ©chargez lâ€™image.","ar":"ØªØ¹Ø°Ù‘Ø±Øª Ø§Ù„Ù…Ø´Ø§Ø±ÙƒØ©. Ø§Ù†Ø³Ø® Ø§Ù„Ù†Øµ Ø£Ùˆ Ù†Ø²Ù‘Ù„ Ø§Ù„ØµÙˆØ±Ø©."},
"Delivery":{"fr":"Livraison","ar":"Ø§Ù„ØªÙˆØµÙŠÙ„"},"Reply *ORDER* now to claim yours!":{"fr":"RÃ©pondez *COMMANDER* pour passer commande !","ar":"Ø£Ø±Ø³Ù„ *Ø·Ù„Ø¨* Ø§Ù„Ø¢Ù† Ù„Ø·Ù„Ø¨ Ù…Ù†ØªØ¬Ùƒ!"},
"Import From Current Page": {fr:"Importer depuis cette page",ar:"Ø§Ø³ØªÙŠØ±Ø§Ø¯ Ù…Ù† Ø§Ù„ØµÙØ­Ø© Ø§Ù„Ø­Ø§Ù„ÙŠØ©"},
"Page imported. Review the details.": {fr:"Page importÃ©e. VÃ©rifiez les dÃ©tails.",ar:"ØªÙ… Ø§Ù„Ø§Ø³ØªÙŠØ±Ø§Ø¯. Ø±Ø§Ø¬Ø¹ Ø§Ù„ØªÙØ§ØµÙŠÙ„."},
"Could not read this page. Open a product page and try again.": {fr:"Lecture impossible. Ouvrez une page produit et rÃ©essayez.",ar:"ØªØ¹Ø°Ù‘Ø±Øª Ù‚Ø±Ø§Ø¡Ø© Ø§Ù„ØµÙØ­Ø©. Ø§ÙØªØ­ ØµÙØ­Ø© Ù…Ù†ØªØ¬ ÙˆØ­Ø§ÙˆÙ„ Ù…Ø¬Ø¯Ø¯Ù‹Ø§."},
  "Formatting mode": {
    "fr": "Mode de mise en forme",
    "ar": "ÙˆØ¶Ø¹ Ø§Ù„ØªÙ†Ø³ÙŠÙ‚"
  },
  "Seller Mode": {
    "fr": "Mode Vendeur",
    "ar": "ÙˆØ¶Ø¹ Ø§Ù„Ø¨Ø§Ø¦Ø¹"
  },
  "Creator Mode": {
    "fr": "Mode CrÃ©ateur",
    "ar": "ÙˆØ¶Ø¹ ØµØ§Ù†Ø¹ Ø§Ù„Ù…Ø­ØªÙˆÙ‰"
  },
  "Product Name": {
    "fr": "Nom du produit",
    "ar": "Ø§Ø³Ù… Ø§Ù„Ù…Ù†ØªØ¬"
  },
  "Price": {
    "fr": "Prix",
    "ar": "Ø§Ù„Ø³Ø¹Ø±"
  },
  "$29": {
    "fr": "29 â‚¬",
    "ar": "29 Ø¯Ø±Ù‡Ù…Ù‹Ø§"
  },
  "Delivery / Location": {
    "fr": "Livraison / lieu de retrait",
    "ar": "Ø§Ù„ØªÙˆØµÙŠÙ„ Ø£Ùˆ Ù…ÙˆÙ‚Ø¹ Ø§Ù„Ø§Ø³ØªÙ„Ø§Ù…"
  },
  "Key Features": {
    "fr": "CaractÃ©ristiques principales",
    "ar": "Ø£Ù‡Ù… Ø§Ù„Ù…ÙŠØ²Ø§Øª"
  },
  "One feature per line": {
    "fr": "Une caractÃ©ristique par ligne",
    "ar": "Ù…ÙŠØ²Ø© ÙˆØ§Ø­Ø¯Ø© ÙÙŠ ÙƒÙ„ Ø³Ø·Ø±"
  },
  "Format Posts": {
    "fr": "Formater les publications",
    "ar": "Ù†Ø³Ù‘Ù‚ Ø§Ù„Ù…Ù†Ø´ÙˆØ±Ø§Øª"
  },
  "Quick Post": {
    "fr": "Texte de dÃ©part",
    "ar": "Ù†Øµ Ø§Ù„Ù…Ù†Ø´ÙˆØ±"
  },
  "Paste your post or hook": {
    "fr": "Collez votre texte ou votre accroche",
    "ar": "Ø§Ù„ØµÙ‚ Ù…Ù†Ø´ÙˆØ±Ùƒ Ø£Ùˆ Ø¹Ø¨Ø§Ø±ØªÙƒ Ø§Ù„Ø§ÙØªØªØ§Ø­ÙŠØ©"
  },
  "Formatted posts": {
    "fr": "Publications mises en forme",
    "ar": "Ø§Ù„Ù…Ù†Ø´ÙˆØ±Ø§Øª Ø§Ù„Ù…Ù†Ø³Ù‘Ù‚Ø©"
  },
  "Platforms": {
    "fr": "Plateformes",
    "ar": "Ø§Ù„Ù…Ù†ØµØ§Øª"
  },
  "Web Formatter": {
    "fr": "Outil web de mise en forme",
    "ar": "Ù…Ù†Ø³Ù‘Ù‚ Ø§Ù„Ù…Ù†Ø´ÙˆØ±Ø§Øª Ø¹Ù„Ù‰ Ø§Ù„ÙˆÙŠØ¨"
  },
  "Seller Resources": {
    "fr": "Ressources pour les vendeurs",
    "ar": "Ù…ÙˆØ§Ø±Ø¯ Ø§Ù„Ø¨Ø§Ø¦Ø¹ÙŠÙ†"
  },
  "Language": {
    "fr": "Langue",
    "ar": "Ø§Ù„Ù„ØºØ©"
  },
  "Delivery / pickup": {
    "fr": "Livraison / retrait",
    "ar": "Ø§Ù„ØªÙˆØµÙŠÙ„ Ø£Ùˆ Ø§Ù„Ø§Ø³ØªÙ„Ø§Ù…"
  },
  "Message to order.": {
    "fr": "Envoyez un message pour commander.",
    "ar": "Ø±Ø§Ø³Ù„Ù†Ø§ Ù„Ù„Ø·Ù„Ø¨."
  },
  "Meet": {
    "fr": "DÃ©couvrez",
    "ar": "ØªØ¹Ø±Ù‘Ù Ø¹Ù„Ù‰"
  },
  "Product": {
    "fr": "Produit",
    "ar": "Ø§Ù„Ù…Ù†ØªØ¬"
  },
  "Features": {
    "fr": "CaractÃ©ristiques",
    "ar": "Ø§Ù„Ù…ÙŠØ²Ø§Øª"
  },
  "#ProductFinds #ShopNow": {
    "fr": "#BellesTrouvailles #AcheterEnLigne",
    "ar": "#Ù…Ù†ØªØ¬Ø§Øª_Ù…Ø®ØªØ§Ø±Ø© #ØªØ³ÙˆÙ‚_Ø§Ù„Ø¢Ù†"
  },
  "What has worked for you?": {
    "fr": "Quâ€™est-ce qui a fonctionnÃ© pour vous ?",
    "ar": "Ù…Ø§ Ø§Ù„Ø°ÙŠ Ù†Ø¬Ø­ Ù…Ø¹ÙƒÙ…ØŸ"
  },
  "Your take?": {
    "fr": "Votre avis ?",
    "ar": "Ù…Ø§ Ø±Ø£ÙŠÙƒÙ…ØŸ"
  },
  "Share your experience below.": {
    "fr": "Partagez votre expÃ©rience en commentaire.",
    "ar": "Ø´Ø§Ø±ÙƒÙˆÙ†Ø§ ØªØ¬Ø§Ø±Ø¨ÙƒÙ… ÙÙŠ Ø§Ù„ØªØ¹Ù„ÙŠÙ‚Ø§Øª."
  },
  "formatted post": {
    "fr": "publication mise en forme",
    "ar": "Ù…Ù†Ø´ÙˆØ± Ù…Ù†Ø³Ù‘Ù‚"
  },
  "Copy": {
    "fr": "Copier",
    "ar": "Ù†Ø³Ø®"
  },
  "Copied!": {
    "fr": "CopiÃ© !",
    "ar": "ØªÙ… Ø§Ù„Ù†Ø³Ø®!"
  },
  "Text selected. Press Ctrl+C or Command+C to copy.": {
    "fr": "Texte sÃ©lectionnÃ©. Appuyez sur Ctrl+C ou Cmd+C pour le copier.",
    "ar": "ØªÙ… ØªØ­Ø¯ÙŠØ¯ Ø§Ù„Ù†Øµ. Ø§Ø¶ØºØ· Ctrl+C Ø£Ùˆ Cmd+C Ù„Ù†Ø³Ø®Ù‡."
  },
  "Posts formatted.": {
    "fr": "Publications mises en forme.",
    "ar": "ØªÙ… ØªÙ†Ø³ÙŠÙ‚ Ø§Ù„Ù…Ù†Ø´ÙˆØ±Ø§Øª."
  },
  "Enter a product name.": {
    "fr": "Saisissez un nom de produit.",
    "ar": "Ø£Ø¯Ø®Ù„ Ø§Ø³Ù… Ø§Ù„Ù…Ù†ØªØ¬."
  },
  "Enter a post.": {
    "fr": "Saisissez un texte.",
    "ar": "Ø£Ø¯Ø®Ù„ Ù†Øµ Ø§Ù„Ù…Ù†Ø´ÙˆØ±."
  },
  "Wireless headphones": {
    "fr": "Casque sans fil",
    "ar": "Ø³Ù…Ø§Ø¹Ø§Øª Ù„Ø§Ø³Ù„ÙƒÙŠØ©"
  },
  "Local pickup or shipping": {
    "fr": "Retrait sur place ou livraison",
    "ar": "Ø§Ø³ØªÙ„Ø§Ù… Ù…Ø­Ù„ÙŠ Ø£Ùˆ ØªÙˆØµÙŠÙ„"
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
  const features = featureLines(read("features"));
  const bullets = features.map(feature => "âœ… " + feature).join("\n");
  const location = delivery && t("Delivery / pickup") + ": " + delivery;
  const cta = "ðŸ‘‰ " + t("Reply *ORDER* now to claim yours!");
  return [
    ["WhatsApp Business", lines("*" + name + "*", price && "ðŸ’° *" + t("Price") + ":* " + price, delivery && "ðŸšš *" + t("Delivery") + ":* " + delivery) + "\n\n" + bullets + "\n\n" + cta],
    ["Instagram", [features[0] ? name + " â€” " + features[0] : t("Meet") + " " + name, lines(price, location, bullets), cta, t("#ProductFinds #ShopNow")].filter(Boolean).join("\n\n")],
    ["Facebook Marketplace", lines(t("Product") + ": " + name, price && t("Price") + ": " + price, location, bullets && t("Features") + ":\n" + bullets, cta)],
    ["TikTok", lines([name, features[0], price].filter(Boolean).join(" Â· "), cta + " " + t("#ProductFinds #ShopNow"))],
  ];
}

function creatorPosts(post) {
  const compact = post.replace(/\s+/g, " ");
  const shorten = (limit, cta) => {
    limit -= Array.from(cta).length + 2;
    const characters = Array.from(compact);
    const text = characters.length > limit ? characters.slice(0, limit - 1).join("").trimEnd() + "â€¦" : compact;
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
    output.setAttribute("aria-label", platform + " Â· " + t("formatted post"));
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

    const sendText = document.createElement("button");
    sendText.type="button";sendText.textContent=t("Send Text");
    sendText.addEventListener("click",()=>sendPost(platform,post,false));
    const sendImage = document.createElement("button");
    sendImage.type="button";sendImage.className="primary";sendImage.textContent=t("Send Image + Text");
    sendImage.addEventListener("click",()=>sendPost(platform,post,true));
    const actions=document.createElement("div");actions.className="send-actions";actions.append(copy,sendText,sendImage);
    panel.append(output,actions);
    panels.append(panel);
  });
  results.hidden = false;
  selectTab(active);
  feedback.textContent = posts.length + " Â· " + t("Posts formatted.");
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
        const schemaPrice = offer?.price ?? offer?.lowPrice;
        let price = schemaPrice != null ? String(schemaPrice) + " " + (offer.priceCurrency || "") : "";
        for (const selector of ['[itemprop="price"]', ".a-price .a-offscreen", ".price-item", '[data-testid*="price"]']) {
          if (!price) price = text(selector);
        }
        if (!price) {
          const pattern = /(?:[$â‚¬Â£]|MAD|AED|SAR)\s*\d[\d.,]*(?:\s*\d{3})*(?:[.,]\d{2})?/i;
          for (const element of [...document.querySelectorAll("span,p,strong,b")].slice(0,6000)) {
            if (!element.getClientRects().length || getComputedStyle(element).visibility === "hidden") continue;
            const value = (element.textContent || "").trim();
            if (value.length > 100) continue;
            const match = value.match(pattern);
            if (match) { price = match[0]; break; }
          }
        }
        const bullets = [...document.querySelectorAll("#feature-bullets li")].map(item => item.textContent.replace(/\s+/g," ").trim()).filter(Boolean);
        const description = bullets.length ? bullets : [
          text('[data-testid*="description"]') || text(".product__description") ||
          text('meta[property="og:description"]') || text('meta[name="description"]')
        ];
        const image = document.querySelector('meta[property="og:image"]')?.content ||
          document.querySelector("#landingImage, .product__media img, [itemprop=image]")?.src || "";
        return {
          name: (text('meta[property="og:title"]') || text("#productTitle") || text("h1")).slice(0,120),
          price: price.trim().slice(0,35),
          features: description.filter(Boolean).flatMap(line=>line.split(/(?<=[.!?])\s+/)).filter(line=>!/^about this item$/i.test(line) && !/our wide selection|free shipping and free returns|buy .+ at amazon\.com/i.test(line)).slice(0,4).join("\n").slice(0,1200),
          image: /^https?:/.test(image) ? image : ""
        };
      }
    });
    const product = execution?.result;
    if (!product?.name) throw Error();
    const form = document.querySelector("#seller");
    for (const key of ["name", "price", "features"]) form.elements.namedItem(key).value = product[key] || "";
    const preview = document.querySelector("#imported-image");
    preview.hidden = !product.image;
    preview.onerror = () => { preview.hidden = true; };
    if(product.image) preview.src = product.image;
    lastRequest = null;
    results.hidden = true;
    feedback.textContent = t("Page imported. Review the details.");
  } catch {
    feedback.textContent = t("Could not read this page. Open a product page and try again.");
  } finally {
    button.disabled = false;
  }
});

function featureLines(value) {
  return String(value).replace(/\*\*/g,"").split(/\n+|(?<=[.!?])\s+/)
    .map(line=>line.replace(/^[-â€¢âœ…\s]+/u,"").trim())
    .filter(line=>line && !/^about this item$/i.test(line) && !/our wide selection|free shipping and free returns|buy .+ at amazon\.com/i.test(line))
    .flatMap(line=>line.match(/.{1,100}(?:\s|$)|.{1,100}/g)||[]).map(line=>line.trim()).slice(0,4);
}

function shareUrl(platform, post) {
  const text=encodeURIComponent(post);
  if(platform==="WhatsApp Business")return whatsappUrl(post);
  if(platform==="X")return "https://twitter.com/intent/tweet?text="+text;
  if(platform==="Threads")return "https://threads.net/intent/post?text="+text;
  if(platform==="Pinterest")return "https://pinterest.com/pin/create/button/?description="+text;
  return {"Instagram":"https://instagram.com/","Facebook Marketplace":"https://facebook.com/marketplace/","TikTok":"https://tiktok.com/","LinkedIn":"https://linkedin.com/"}[platform];
}
async function sendPost(platform,post,withImage) {
  const preview=document.querySelector("#imported-image");
  if(withImage && (!preview || preview.hidden || !preview.complete || !preview.naturalWidth)) {
    feedback.textContent=t("Upload or import a product photo first.");return;
  }
  window.open(shareUrl(platform,post),"_blank","noopener,noreferrer");
  try {
    await navigator.clipboard.writeText(post);
    if(withImage) {
      const blobPromise=new Promise((resolve,reject)=>{
        const image=new Image();image.crossOrigin="anonymous";
        image.onload=()=>{
          try {
            const scale=Math.min(1,2048/Math.max(image.width,image.height));
            const canvas=document.createElement("canvas");canvas.width=Math.round(image.width*scale);canvas.height=Math.round(image.height*scale);
            canvas.getContext("2d").drawImage(image,0,0,canvas.width,canvas.height);
            canvas.toBlob(blob=>blob?resolve(blob):reject(Error()),"image/png");
          } catch(error){reject(error);}
        };
        image.onerror=()=>reject(Error());image.src=preview.src;
      });
      try {
        await navigator.clipboard.write([new ClipboardItem({"image/png":blobPromise,"text/plain":new Blob([post],{type:"text/plain"})})]);
        feedback.textContent=t("Text & Image copied! Paste (Ctrl+V) directly into your post or chat.");
      } catch {
        try {
          const blob=await blobPromise;const url=URL.createObjectURL(blob);
          const link=document.createElement("a");link.href=url;link.download="sellpostly-product.png";link.click();
          setTimeout(()=>URL.revokeObjectURL(url),10000);
        } catch {
          const link=document.createElement("a");link.href=preview.src;link.download="sellpostly-product";link.click();
        }
        await navigator.clipboard.writeText(post);
        feedback.textContent=t("Image downloaded. Attach it and paste the caption.");
      }
    } else {await navigator.clipboard.writeText(post);feedback.textContent=t("Copied!");}

  } catch {feedback.textContent=t("Sharing failed. Copy the text or download the image.");}
}

document.querySelector("#send-shop").addEventListener("click",async()=>{
  const form=document.querySelector("#seller");
  const data=new FormData(form);
  const [tab]=await chrome.tabs.query({active:true,currentWindow:true});
  const preview=document.querySelector("#imported-image");
  const query=new URLSearchParams({addGender:document.querySelector("#shop-gender").value,addCategory:document.querySelector("#shop-category").value,addTitle:String(data.get("name")||""),addPrice:String(data.get("price")||""),addImage:preview && !preview.hidden?preview.src:"",addUrl:tab?.url||""});
  window.open("https://sellpostly-git-main-usidk-it.vercel.app/shop?"+query,"_blank","noopener,noreferrer");
});


document.querySelector("#open-studio").addEventListener("click",async()=>{
  const form=document.querySelector("#seller");
  const data=new FormData(form);
  const preview=document.querySelector("#imported-image");
  let link="";
  try {
    const [tab]=await chrome.tabs.query({active:true,currentWindow:true});
    if(/^https?:/.test(tab?.url||""))link=tab.url;
  }catch{}
  const query=new URLSearchParams({
    title:String(data.get("name")||""),
    price:String(data.get("price")||""),
    delivery:String(data.get("delivery")||""),
    features:String(data.get("features")||""),
    image:preview&&!preview.hidden?preview.src:"",
    link
  });
  chrome.tabs.create({url:"https://sellpostly-git-main-usidk-it.vercel.app/?"+query+"#formatter"});
});



function whatsappUrl(message) {
  let preview=message.slice(0,800).replace(/[\uD800-\uDBFF]$/,"").trimEnd();
  if(message.length>800) {
    const boundary=preview.search(/\s+\S*$/u);
    if(boundary>0)preview=preview.slice(0,boundary).trimEnd();
  }
  return "https://wa.me/?text="+encodeURIComponent(preview);
}
