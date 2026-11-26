import "server-only";

import { prisma } from "@/lib/prisma";
import { NOTIFICATION_TYPES, ROUTES } from "@/lib/constants";
import type {
  ConversationSummary,
  ConversationThread,
  MessageDto,
  ThreadUpdate,
} from "@/features/messaging/types";
import {
  countUnreadForUser,
  createMessage,
  getConversationForUser,
  getMessageNotificationTarget,
  getOrCreateConversation,
  getThreadDelta,
  isParticipant,
  listConversationsForUser,
  markConversationRead,
} from "@/features/messaging/repositories/conversation.repository";
import { isOtherTyping, markTyping } from "@/features/messaging/lib/typing-store";
import { dispatchNotification } from "@/features/notifications/services/notification.service";

export class MessagingError extends Error {}

/**
 * Starts (or reuses) a conversation between the current user and a listing's seller.
 * Throws {@link MessagingError} for rule violations (e.g. messaging your own listing).
 */
export async function startConversationForListing(
  listingId: string,
  buyerId: string,
): Promise<string> {
  const listing = await prisma.listing.findFirst({
    where: { id: listingId, deletedAt: null },
    select: { id: true, sellerId: true, dealerId: true },
  });
  if (!listing) throw new MessagingError("This listing is no longer available.");
  if (listing.sellerId === buyerId) {
    throw new MessagingError("You can't start a chat on your own listing.");
  }

  const conversationId = await getOrCreateConversation({
    listingId: listing.id,
    buyerId,
    sellerId: listing.sellerId,
  });

  // Create dealer lead if this is a dealer listing
  if (listing.dealerId) {
    await prisma.dealerLead.create({
      data: {
        dealerId: listing.dealerId,
        buyerId,
        listingId: listing.id,
        conversationId,
        status: "NEW",
      },
    }).catch((error) => {
      // Ignore duplicate key errors (lead already exists)
      if (error instanceof Error && !error.message.includes("unique constraint")) {
        console.warn("[messaging] failed to create dealer lead:", error);
      }
    });
  }

  return conversationId;
}

/** A user's conversations. Returns an empty list if the database is unavailable. */
export async function getConversations(userId: string): Promise<ConversationSummary[]> {
  try {
    return await listConversationsForUser(userId);
  } catch (error) {
    console.warn(
      "[messaging] Could not load conversations.",
      error instanceof Error ? error.message : error,
    );
    return [];
  }
}

/** A thread for a participant, or `null` (not found / not a participant). */
export async function getThread(
  conversationId: string,
  userId: string,
): Promise<ConversationThread | null> {
  return getConversationForUser(conversationId, userId);
}

/** Sends a message after verifying the sender participates in the conversation. */
export async function sendMessage(input: {
  conversationId: string;
  senderId: string;
  body?: string;
  imageUrl?: string;
}): Promise<MessageDto> {
  const allowed = await isParticipant(input.conversationId, input.senderId);
  if (!allowed) throw new MessagingError("You are not part of this conversation.");

  const message = await createMessage(input);
  await notifyNewMessage(input.conversationId, input.senderId, input.body);
  return message;
}

/** Notifies the recipient of a new message (best-effort; never fails the send). */
async function notifyNewMessage(
  conversationId: string,
  senderId: string,
  body?: string,
): Promise<void> {
  try {
    const target = await getMessageNotificationTarget(conversationId, senderId);
    if (!target) return;

    const preview = body
      ? body.length > 80
        ? `${body.slice(0, 80)}…`
        : body
      : "Sent you a photo";

    await dispatchNotification({
      userId: target.recipientId,
      type: NOTIFICATION_TYPES.MESSAGE,
      title: `New message from ${target.senderName}`,
      body: preview,
      url: `${ROUTES.messages}/${conversationId}`,
      email: true,
    });
  } catch (error) {
    console.error("[messaging] notify failed:", error);
  }
}

/** Marks the other party's messages as read for the current user. */
export async function markRead(conversationId: string, userId: string): Promise<void> {
  const allowed = await isParticipant(conversationId, userId);
  if (!allowed) return;
  await markConversationRead(conversationId, userId);
}

/** Records a transient "typing" signal from a participant (best-effort). */
export async function notifyTyping(conversationId: string, userId: string): Promise<void> {
  const allowed = await isParticipant(conversationId, userId);
  if (allowed) markTyping(conversationId, userId);
}

/**
 * Incremental update for an open thread: new messages since `since`, read receipts,
 * and the other party's typing state. Consumed by the realtime transport.
 */
export async function getThreadUpdate(
  conversationId: string,
  userId: string,
  since: Date,
): Promise<ThreadUpdate> {
  const allowed = await isParticipant(conversationId, userId);
  if (!allowed) return { messages: [], lastReadAt: null, typing: false };

  const delta = await getThreadDelta(conversationId, userId, since);
  return { ...delta, typing: isOtherTyping(conversationId, userId) };
}

/** Total unread count for the current user (header badge). 0 on any failure. */
export async function getUnreadCount(userId: string): Promise<number> {
  try {
    return await countUnreadForUser(userId);
  } catch {
    return 0;
  }
}
