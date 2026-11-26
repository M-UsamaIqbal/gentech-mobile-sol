"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { ROUTES } from "@/lib/constants";
import { getCurrentUser } from "@/lib/session";
import { checkRateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";
import type { MessageDto, ThreadUpdate } from "@/features/messaging/types";
import { sendMessageSchema, startConversationSchema } from "@/features/messaging/schemas/message";
import {
  MessagingError,
  getThreadUpdate,
  markRead,
  notifyTyping,
  sendMessage,
  startConversationForListing,
} from "@/features/messaging/services/conversation.service";

type ActionResult<T> = ({ ok: true } & T) | { ok: false; error: string };

const SIGN_IN_REQUIRED = "Sign in to send messages.";
const GENERIC_ERROR = "Something went wrong. Please try again.";

/** Starts (or reuses) a conversation about a listing; returns its id for navigation. */
export async function startConversationAction(input: {
  listingId: string;
}): Promise<ActionResult<{ conversationId: string }>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: SIGN_IN_REQUIRED };

  // Rate limiting for contact seller
  const headersList = await headers();
  const forwardedFor = headersList.get("x-forwarded-for");
  const realIp = headersList.get("x-real-ip");
  const ipAddress = forwardedFor 
    ? forwardedFor.split(",")[0]?.trim() ?? null
    : (realIp?.trim() ?? null);
  
  const identifier = getRateLimitIdentifier(ipAddress ?? "unknown", user.id);
  const rateLimitResult = checkRateLimit(identifier, "contactSeller");
  
  if (!rateLimitResult.allowed) {
    return { ok: false, error: "You're contacting sellers too frequently. Please wait a moment." };
  }

  const parsed = startConversationSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid listing." };

  try {
    const conversationId = await startConversationForListing(parsed.data.listingId, user.id);
    revalidatePath(ROUTES.messages);
    return { ok: true, conversationId };
  } catch (error) {
    if (error instanceof MessagingError) return { ok: false, error: error.message };
    console.error("[messaging] startConversation failed:", error);
    return { ok: false, error: GENERIC_ERROR };
  }
}

/** Sends a text and/or image message into a conversation. */
export async function sendMessageAction(input: {
  conversationId: string;
  body?: string;
  imageUrl?: string;
}): Promise<ActionResult<{ message: MessageDto }>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: SIGN_IN_REQUIRED };

  // Rate limiting for messaging
  const headersList = await headers();
  const forwardedFor = headersList.get("x-forwarded-for");
  const realIp = headersList.get("x-real-ip");
  const ipAddress = forwardedFor 
    ? forwardedFor.split(",")[0]?.trim() ?? null
    : (realIp?.trim() ?? null);
  
  const identifier = getRateLimitIdentifier(ipAddress ?? "unknown", user.id);
  const rateLimitResult = checkRateLimit(identifier, "messaging");
  
  if (!rateLimitResult.allowed) {
    return { ok: false, error: "You're sending messages too quickly. Please wait a moment." };
  }

  const parsed = sendMessageSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid message." };
  }

  try {
    const message = await sendMessage({
      conversationId: parsed.data.conversationId,
      senderId: user.id,
      body: parsed.data.body,
      imageUrl: parsed.data.imageUrl,
    });
    revalidatePath(ROUTES.messages);
    return { ok: true, message };
  } catch (error) {
    if (error instanceof MessagingError) return { ok: false, error: error.message };
    console.error("[messaging] sendMessage failed:", error);
    return { ok: false, error: GENERIC_ERROR };
  }
}

/** Marks the other party's messages in a conversation as read. */
export async function markReadAction(conversationId: string): Promise<{ ok: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false };
  try {
    await markRead(conversationId, user.id);
    return { ok: true };
  } catch (error) {
    console.error("[messaging] markRead failed:", error);
    return { ok: false };
  }
}

/** Records a transient typing signal (best-effort, no error surfaced). */
export async function notifyTypingAction(conversationId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  try {
    await notifyTyping(conversationId, user.id);
  } catch {
    /* typing is best-effort */
  }
}

/** Polls for new messages, read receipts and typing state in an open thread. */
export async function pollThreadAction(
  conversationId: string,
  sinceIso: string,
): Promise<ThreadUpdate> {
  const user = await getCurrentUser();
  if (!user) return { messages: [], lastReadAt: null, typing: false };

  const since = new Date(sinceIso);
  const safeSince = Number.isNaN(since.getTime()) ? new Date(0) : since;
  try {
    return await getThreadUpdate(conversationId, user.id, safeSince);
  } catch (error) {
    console.error("[messaging] pollThread failed:", error);
    return { messages: [], lastReadAt: null, typing: false };
  }
}
