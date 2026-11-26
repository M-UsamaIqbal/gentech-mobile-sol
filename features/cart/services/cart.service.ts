import "server-only";

import { prisma } from "@/lib/prisma";
import type { CountryCode } from "@/lib/countries/types";

export interface CartItemDto {
  id: string;
  listingId: string;
  title: string;
  price: number;
  currency: string;
  quantity: number;
  region: string;
  image?: string;
}

export interface CartSummary {
  items: CartItemDto[];
  subtotal: number;
  currency: string;
  region: string;
  itemCount: number;
}

/**
 * Get user's cart with current product details.
 */
export async function getCart(userId: string): Promise<CartSummary> {
  const items = await prisma.cartItem.findMany({
    where: {
      userId,
      listing: { status: "ACTIVE", deletedAt: null },
    },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          price: true,
          currency: true,
          region: true,
          images: { take: 1, select: { url: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const validItems: CartItemDto[] = [];
  let subtotal = 0;
  let currency = "PKR";
  let region = "PAKISTAN";

  for (const item of items) {
    if (!item.listing) continue;
    const price = Number(item.listing.price);
    validItems.push({
      id: item.id,
      listingId: item.listing.id,
      title: item.listing.title,
      price,
      currency: item.listing.currency,
      quantity: item.quantity,
      region: item.listing.region,
      image: item.listing.images[0]?.url,
    });
    subtotal += price * item.quantity;
    currency = item.listing.currency;
    region = item.listing.region;
  }

  return {
    items: validItems,
    subtotal,
    currency,
    region,
    itemCount: validItems.length,
  };
}

/**
 * Add item to cart.
 */
export async function addToCart(
  userId: string,
  listingId: string,
  quantity: number = 1,
): Promise<{ success: boolean; error?: string }> {
  try {
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { id: true, price: true, currency: true, region: true, status: true, deletedAt: true },
    });

    if (!listing || listing.status !== "ACTIVE" || listing.deletedAt) {
      return { success: false, error: "Listing not available" };
    }

    await prisma.cartItem.upsert({
      where: { userId_listingId: { userId, listingId } },
      update: { quantity: { increment: quantity }, price: listing.price },
      create: {
        userId,
        listingId,
        quantity,
        price: listing.price,
        currency: listing.currency,
        region: listing.region,
      },
    });

    return { success: true };
  } catch {
    return { success: false, error: "Failed to add to cart" };
  }
}

/**
 * Remove item from cart.
 */
export async function removeFromCart(userId: string, listingId: string): Promise<boolean> {
  try {
    await prisma.cartItem.delete({
      where: { userId_listingId: { userId, listingId } },
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Update cart item quantity.
 */
export async function updateCartItemQuantity(
  userId: string,
  listingId: string,
  quantity: number,
): Promise<boolean> {
  try {
    if (quantity <= 0) {
      await prisma.cartItem.delete({
        where: { userId_listingId: { userId, listingId } },
      });
      return true;
    }
    await prisma.cartItem.update({
      where: { userId_listingId: { userId, listingId } },
      data: { quantity },
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Clear user's cart.
 */
export async function clearCart(userId: string): Promise<boolean> {
  try {
    await prisma.cartItem.deleteMany({ where: { userId } });
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate cart items against current product state.
 * Returns list of unavailable items.
 */
export async function validateCart(userId: string): Promise<{
  valid: boolean;
  unavailableItems: string[];
  priceChanges: { listingId: string; oldPrice: number; newPrice: number }[];
}> {
  const cartItems = await prisma.cartItem.findMany({
    where: {
      userId,
      listing: { status: "ACTIVE", deletedAt: null },
    },
    include: {
      listing: {
        select: { id: true, price: true },
      },
    },
  });

  const unavailableItems: string[] = [];
  const priceChanges: { listingId: string; oldPrice: number; newPrice: number }[] = [];

  for (const item of cartItems) {
    if (!item.listing) {
      unavailableItems.push(item.listingId);
      continue;
    }
    const currentPrice = Number(item.listing.price);
    const cartPrice = Number(item.price);
    if (currentPrice !== cartPrice) {
      priceChanges.push({
        listingId: item.listingId,
        oldPrice: cartPrice,
        newPrice: currentPrice,
      });
    }
  }

  return {
    valid: unavailableItems.length === 0 && priceChanges.length === 0,
    unavailableItems,
    priceChanges,
  };
}