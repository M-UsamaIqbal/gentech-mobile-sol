import { redirect } from "next/navigation";

import { ROUTES } from "@/lib/constants";
import { getCurrentUser } from "@/lib/session";

export default async function PaymentCancelledPage({
  params,
  searchParams,
}: {
  params: Promise<{ country: string; locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { country, locale } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(ROUTES.signIn);

  const sp = await searchParams;
  const orderId = sp.orderId as string;

  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-yellow-500/10">
        <svg className="size-8 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h1 className="mt-4 text-2xl font-bold text-white">Payment Cancelled</h1>
      <p className="mt-2 text-slate-400">
        Your payment was cancelled. You can try again or choose a different payment method.
      </p>
      {orderId && (
        <p className="mt-2 text-xs text-slate-500">Order: {orderId}</p>
      )}
      <div className="mt-6 flex gap-3">
        <a
          href={`/${country}/${locale}/dashboard/cart`}
          className="flex-1 rounded-lg bg-emerald-500 px-4 py-2 text-center text-sm font-medium text-white hover:bg-emerald-400"
        >
          Back to Cart
        </a>
        <a
          href={`/${country}/${locale}/dashboard/orders`}
          className="flex-1 rounded-lg border border-white/10 px-4 py-2 text-center text-sm font-medium text-slate-300 hover:bg-white/5"
        >
          View Orders
        </a>
      </div>
    </div>
  );
}