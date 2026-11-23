"use server";

import { revalidatePath } from "next/cache";

import { ROUTES } from "@/lib/constants";
import { getCurrentUser } from "@/lib/session";
import {
  acceptQuoteSchema,
  createQuoteSchema,
  type AcceptQuoteInput,
  type CreateQuoteInput,
} from "@/features/quotes/schemas/quote";
import { acceptMyQuote, createQuote } from "@/features/quotes/services/quote.service";

const SIGN_IN_REQUIRED = "Sign in to request a quote.";
const GENERIC_ERROR = "Something went wrong. Please try again.";

export type CreateQuoteActionResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

/** Submit answers + photos → saves a request for manual admin review (no instant price). */
export async function createQuoteAction(
  input: CreateQuoteInput,
): Promise<CreateQuoteActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: SIGN_IN_REQUIRED };

  const parsed = createQuoteSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please complete every question and all five photos." };
  }

  try {
    const quote = await createQuote(parsed.data, user.id);
    revalidatePath(ROUTES.quotes);
    return { ok: true, id: quote.id };
  } catch (error) {
    console.error("[quotes] submit failed:", error);
    return { ok: false, error: error instanceof Error ? error.message : GENERIC_ERROR };
  }
}

/** Accept an active quote with a pickup address + time slot (Step 6). */
export async function acceptQuoteAction(
  input: AcceptQuoteInput,
): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: SIGN_IN_REQUIRED };

  const parsed = acceptQuoteSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Enter a full pickup address and choose a time slot." };
  }

  try {
    const ok = await acceptMyQuote(parsed.data, user.id);
    if (!ok) return { ok: false, error: "This quote can no longer be accepted." };
    revalidatePath(ROUTES.quotes);
    revalidatePath(`${ROUTES.sellPhone}/${parsed.data.id}`);
    return { ok: true };
  } catch (error) {
    console.error("[quotes] accept failed:", error);
    return { ok: false, error: GENERIC_ERROR };
  }
}
