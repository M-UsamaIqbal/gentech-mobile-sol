import { redirect } from "next/navigation";

import { ROUTES } from "@/lib/constants";
import { getCurrentUser } from "@/lib/session";
import { getCart, validateCart } from "@/features/cart/services/cart.service";
import { CartItems } from "@/components/cart/cart-items";

export default async function CartPage({
  params,
}: {
  params: Promise<{ country: string; locale: string }>;
}) {
  const { country, locale } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(ROUTES.signIn);

  const cart = await getCart(user.id);
  const validation = await validateCart(user.id);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold">Shopping Cart</h1>

      {validation.unavailableItems.length > 0 && (
        <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-4">
          <p className="text-sm font-medium text-red-400">
            Some items in your cart are no longer available and have been removed.
          </p>
        </div>
      )}

      {validation.priceChanges.length > 0 && (
        <div className="mt-4 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4">
          <p className="text-sm font-medium text-yellow-400">
            Prices have changed for some items. Please review before checkout.
          </p>
          <ul className="mt-2 text-xs text-yellow-300">
            {validation.priceChanges.map((pc) => (
              <li key={pc.listingId}>
                Price changed from {pc.oldPrice} to {pc.newPrice}
              </li>
            ))}
          </ul>
        </div>
      )}

      <CartItems
        items={cart.items}
        country={country}
        locale={locale}
        currency={cart.currency}
        onCartChange={() => {}}
      />
    </div>
  );
}