import { redirect } from "next/navigation";

import { ROUTES } from "@/lib/constants";
import { getCurrentUser } from "@/lib/session";
import { getCart, validateCart } from "@/features/cart/services/cart.service";
import { CheckoutClient } from "@/components/checkout/checkout-client";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ country: string; locale: string }>;
}) {
  const { country, locale } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(ROUTES.signIn);

  const cart = await getCart(user.id);
  const validation = await validateCart(user.id);

  if (cart.items.length === 0) {
    redirect(`/${country}/${locale}/dashboard/cart`);
  }

  if (!validation.valid) {
    redirect(`/${country}/${locale}/dashboard/cart`);
  }

  const currency = country.toUpperCase() === "BH" ? "BHD" : "PKR";

  return (
    <CheckoutClient
      country={country.toUpperCase()}
      locale={locale}
      cartItems={cart.items}
      subtotal={cart.subtotal}
      currency={currency}
    />
  );
}