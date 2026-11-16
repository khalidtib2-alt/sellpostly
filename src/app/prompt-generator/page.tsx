import { pageMetadata } from "../site";
import { ContentPage } from "../site-shell";
import PromptForm from "./prompt-form";

const intro = "Build a prompt for product descriptions, short videos, ad hooks, or content planning. Copy it into ChatGPT, Claude, or Gemini.";

export const metadata = pageMetadata("/prompt-generator", "Free AI Prompt Generator | SellPostly", intro);

export default function PromptGeneratorPage() {
  return <ContentPage title="AI Prompt Generator" intro={intro}><PromptForm /></ContentPage>;
}
