import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { getCart, addToCart, removeFromCart, updateCartItemQuantity, clearCart, validateCart } from "@/features/cart/services/cart.service";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cart = await getCart(user.id);
    const validation = await validateCart(user.id);

    return NextResponse.json({ cart, validation });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load cart" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { listingId, quantity } = body;

    if (!listingId) {
      return NextResponse.json({ error: "Listing ID is required" }, { status: 400 });
    }

    const result = await addToCart(user.id, listingId, quantity || 1);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to add to cart" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const listingId = url.searchParams.get("listingId");

    if (listingId) {
      await removeFromCart(user.id, listingId);
    } else {
      await clearCart(user.id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to remove from cart" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { listingId, quantity } = body;

    if (!listingId || typeof quantity !== "number") {
      return NextResponse.json({ error: "Listing ID and quantity are required" }, { status: 400 });
    }

    await updateCartItemQuantity(user.id, listingId, quantity);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update cart" }, { status: 500 });
  }
}