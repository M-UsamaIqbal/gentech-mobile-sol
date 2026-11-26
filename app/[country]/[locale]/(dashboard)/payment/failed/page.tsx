import { redirect } from "next/navigation";

import { ROUTES } from "@/lib/constants";
import { getCurrentUser } from "@/lib/session";

export default async function PaymentFailedPage({
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
      <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-red-500/10">
        <svg className="size-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <h1 className="mt-4 text-2xl font-bold text-white">Payment Failed</h1>
      <p className="mt-2 text-slate-400">
        Your payment could not be processed. Please try again.
      </p>
      {orderId && (
        <p className="mt-2 text-xs text-slate-500">Order: {orderId}</p>
      )}
      <div className="mt-6 flex gap-3">
        <a
          href={`/${country}/${locale}/dashboard/orders`}
          className="flex-1 rounded-lg bg-emerald-500 px-4 py-2 text-center text-sm font-medium text-white hover:bg-emerald-400"
        >
          View Orders
        </a>
        <a
          href={`/${country}/${locale}/dashboard/cart`}
          className="flex-1 rounded-lg border border-white/10 px-4 py-2 text-center text-sm font-medium text-slate-300 hover:bg-white/5"
        >
          Back to Cart
        </a>
      </div>
    </div>
  );
}