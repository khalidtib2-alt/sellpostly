"use client";

import { useLanguage } from "./language-context";
import { ContentPage } from "./site-shell";
import type { Message } from "./translations";

export function Localized({ message }: { message: Message }) {
  return useLanguage().t(message);
}

export function LocalizedPage({ title, intro, children }: { title: Message; intro: Message; children: React.ReactNode }) {
  const { t } = useLanguage();
  return <ContentPage title={t(title)} intro={t(intro)}>{children}</ContentPage>;
}
