import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { ROUTES } from "@/lib/constants";
import { getCurrentUser } from "@/lib/session";
import { getThread, markRead } from "@/features/messaging/services/conversation.service";
import { MessageThread } from "@/features/messaging/components/message-thread";

export const metadata: Metadata = { title: "Conversation" };

type PageProps = { params: Promise<{ id: string }> };

export default async function ConversationPage({ params }: PageProps) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(ROUTES.signIn);

  const thread = await getThread(id, user.id);
  if (!thread) notFound();

  // Opening the thread clears its unread badge for the current user.
  await markRead(id, user.id);

  return <MessageThread thread={thread} />;
}
