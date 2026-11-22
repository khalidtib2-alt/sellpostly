import { pageMetadata } from "../site";
import PromptForm from "./prompt-form";

const intro = "Turn keywords into an editable Gemini writing prompt, then create complete articles, social posts, video scripts or newsletters in English, French or Arabic.";

export const metadata = pageMetadata("/prompt-generator", "Content Creator — Keywords to Article | SellPostly", intro);

export default function PromptGeneratorPage() {
  return <PromptForm />;
}
