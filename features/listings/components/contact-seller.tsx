"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, MessageCircle, MessageSquare } from "lucide-react";
import { toast } from "sonner";

import { ROUTES } from "@/lib/constants";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { trackStartChat } from "@/features/analytics/lib/events";
import { startConversationAction } from "@/features/messaging/actions/messaging.actions";
import { buildWhatsAppLink } from "@/features/messaging/lib/whatsapp";

/**
 * Contact actions on a listing. "Chat with seller" opens (or reuses) a conversation
 * and navigates to the thread; guests are routed to sign-in first.
 */
export function ContactSeller({
  listingId,
  listingTitle,
  phone,
  isAuthenticated,
}: {
  listingId: string;
  listingTitle: string;
  phone?: string;
  isAuthenticated: boolean;
}) {
  const router = useRouter();
  const [starting, setStarting] = React.useState(false);

  async function handleChat() {
    if (!isAuthenticated) {
      router.push(ROUTES.signIn);
      return;
    }
    setStarting(true);
    trackStartChat(listingId);
    const result = await startConversationAction({ listingId });
    if (!result.ok) {
      setStarting(false);
      toast.error(result.error);
      return;
    }
    router.push(`${ROUTES.messages}/${result.conversationId}`);
  }

  const whatsappHref = buildWhatsAppLink(phone, `Hi, I'm interested in: ${listingTitle}`);

  return (
    <div className="grid gap-2">
      <Button onClick={handleChat} disabled={starting} className="w-full">
        {starting ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <MessageSquare className="size-4" />
        )}
        Chat with seller
      </Button>
      {whatsappHref ? (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonVariants({ variant: "outline" }), "w-full")}
        >
          <MessageCircle className="size-4" />
          WhatsApp seller
        </a>
      ) : null}
    </div>
  );
}
