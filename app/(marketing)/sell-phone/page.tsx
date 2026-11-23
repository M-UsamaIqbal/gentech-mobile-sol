import type { Metadata } from "next";
import { Banknote, Camera, ClipboardList, MailCheck, Sparkles } from "lucide-react";

import { getCurrentUser } from "@/lib/session";
import { getCatalog } from "@/features/quotes/services/quote.service";
import { QuoteWizard } from "@/features/quotes/components/quote-wizard";

export const metadata: Metadata = {
  title: "Sell Your Phone — Get a Quote",
  description:
    "Tell us about your phone and upload 5 photos. Our team reviews it and emails you a firm offer — then we collect it from your door and pay on the spot.",
};

const STEPS = [
  { icon: ClipboardList, title: "Tell us about your phone", body: "Model, PTA status and condition — a few quick questions." },
  { icon: Camera, title: "Upload 5 guided photos", body: "Follow the samples so our team can assess it accurately." },
  { icon: MailCheck, title: "We review & email you", body: "Our team checks it and sends a firm offer, usually within a day." },
  { icon: Banknote, title: "Accept & we collect", body: "Accept your offer, we pick it up free and pay on the spot." },
];

export default async function SellPhonePage() {
  const [catalog, user] = await Promise.all([getCatalog(), getCurrentUser()]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <section className="text-center">
        <span className="bg-primary/10 text-primary inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium">
          <Sparkles className="size-4" />
          Free pickup · Pay on the spot
        </span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
          Sell your phone the easy way
        </h1>
        <p className="text-muted-foreground mx-auto mt-3 max-w-xl">
          Tell us about your phone and upload five photos. Our team reviews it and emails you a firm
          offer — then we collect it for free. چند سوالات کے جواب دیں، ہم آپ کو قیمت ای میل کریں گے۔
        </p>
      </section>

      <section className="mt-10 grid gap-3 sm:grid-cols-4">
        {STEPS.map((step) => (
          <div key={step.title} className="bg-card rounded-xl border p-4 text-center">
            <div className="bg-primary/10 text-primary mx-auto grid size-10 place-items-center rounded-xl">
              <step.icon className="size-5" />
            </div>
            <h3 className="mt-2 text-sm font-semibold">{step.title}</h3>
            <p className="text-muted-foreground mt-1 text-xs">{step.body}</p>
          </div>
        ))}
      </section>

      <section className="mt-10">
        <QuoteWizard catalog={catalog} isAuthenticated={Boolean(user)} />
      </section>
    </div>
  );
}
