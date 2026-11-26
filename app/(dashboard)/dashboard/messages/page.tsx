import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MessagesSquare } from "lucide-react";

import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { getCurrentUser } from "@/lib/session";
import { getConversations } from "@/features/messaging/services/conversation.service";
import { ConversationList } from "@/features/messaging/components/conversation-list";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { 
  title: "Messages",
  robots: { index: false, follow: false },
};

export default async function MessagesPage() {
  const user = await getCurrentUser();
  if (!user) redirect(ROUTES.signIn);

  const conversations = await getConversations(user.id);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
        <p className="text-muted-foreground text-sm">
          {conversations.length} {conversations.length === 1 ? "conversation" : "conversations"}
        </p>
      </header>

      {conversations.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-12 text-center">
          <MessagesSquare className="text-muted-foreground size-10" />
          <p className="text-muted-foreground text-sm">
            No conversations yet. Start one from any listing by tapping “Chat with seller”.
          </p>
          <Link href={ROUTES.marketplace} className={cn(buttonVariants({ variant: "outline" }))}>
            Browse the marketplace
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <ConversationList conversations={conversations} />
        </div>
      )}
    </div>
  );
}
