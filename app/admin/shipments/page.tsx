import type { Metadata } from "next";
import { AlertTriangle, PackageCheck, Truck } from "lucide-react";

export const metadata: Metadata = {
  title: "Shipping & handover — Admin",
  robots: { index: false, follow: false },
};

export default function AdminShipmentsPage() {
  return (
    <div className="space-y-7">
      <header>
        <p className="text-xs font-semibold tracking-[0.16em] text-emerald-400 uppercase">
          Marketplace operations
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Shipping & handover</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
          Design delivery tracking for a future managed transaction flow, with clear pickup,
          courier, and in-person handover evidence.
        </p>
      </header>
      <div className="rounded-xl border border-amber-400/20 bg-amber-400/[0.06] p-4">
        <div className="flex gap-3">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-300" />
          <p className="text-xs leading-5 text-amber-100/80">
            <strong className="font-semibold text-amber-200">
              No shipment API or marketplace order model is connected.
            </strong>{" "}
            Do not create shipping labels or represent a listing as shipped without an order, seller
            agreement, and verified carrier integration.
          </p>
        </div>
      </div>
      <section className="grid gap-3 md:grid-cols-2">
        {[
          {
            icon: Truck,
            title: "Courier integrations",
            text: "Carrier account, service coverage, shipping quote, label lifecycle, tracking webhooks, delivery proof, and failed-delivery handling.",
          },
          {
            icon: PackageCheck,
            title: "In-person handover",
            text: "Order-linked handover code, buyer and seller confirmation, timestamps, dispute window, and privacy-conscious evidence retention.",
          },
        ].map(({ icon: Icon, title, text }) => (
          <article key={title} className="rounded-xl border border-white/10 bg-[#1F1F1F] p-5">
            <Icon className="size-5 text-emerald-400" />
            <h2 className="mt-3 text-sm font-semibold text-slate-100">{title}</h2>
            <p className="mt-2 text-xs leading-5 text-slate-400">{text}</p>
          </article>
        ))}
      </section>
      <section className="rounded-xl border border-white/10 bg-[#1F1F1F]">
        <div className="border-b border-white/[0.07] p-4">
          <h2 className="text-sm font-semibold text-slate-100">Shipment register</h2>
          <p className="mt-1 text-xs text-slate-500">
            Empty until order fulfilment and carrier APIs are implemented.
          </p>
        </div>
        <div className="px-4 py-12 text-center">
          <PackageCheck className="mx-auto size-6 text-slate-600" />
          <p className="mt-3 text-sm font-medium text-slate-300">No shipments connected</p>
        </div>
      </section>
    </div>
  );
}
