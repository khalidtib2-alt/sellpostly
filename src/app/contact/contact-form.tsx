"use client";

import { Localized } from "../localized";
import { useState, type FormEvent } from "react";

const inputClass = "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2";

export default function ContactForm() {
  const [prepared, setPrepared] = useState(false);

  function compose(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const subject = encodeURIComponent(String(fields.get("subject")));
    const body = encodeURIComponent(
      String(fields.get("message")) + "\n\nFrom: " + fields.get("name") + " <" + fields.get("email") + ">"
    );
    setPrepared(true);
    window.location.href = "mailto:sellpostly.support@gmail.com?subject=" + subject + "&body=" + body;
  }

  return <form onSubmit={compose} className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-5">
    <label><Localized message={"Name"} /><input className={inputClass} name="name" autoComplete="name" maxLength={100} required /></label>
    <label><Localized message={"Email"} /><input className={inputClass} name="email" type="email" autoComplete="email" maxLength={254} required /></label>
    <label><Localized message={"Subject"} /><input className={inputClass} name="subject" maxLength={120} required /></label>
    <label><Localized message={"Message"} /><textarea className={inputClass} name="message" rows={6} maxLength={1500} required /></label>
    <button type="submit" className="justify-self-start rounded-lg bg-emerald-700 px-5 py-3 font-semibold text-white"><Localized message={"Open email draft"} /></button>
    {prepared && <p role="status"><Localized message={"Send the draft from your email app. If it did not open, email sellpostly.support@gmail.com directly."} /></p>}
  </form>;
}
