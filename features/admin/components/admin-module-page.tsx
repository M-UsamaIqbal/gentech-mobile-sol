import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, ArrowUpRight, CircleDashed, LockKeyhole, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type AdminModulePageProps = {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  metrics: { label: string; value: string; detail: string }[];
  workflows: { title: string; description: string }[];
  connectedTo: string[];
  relatedHref: string;
  relatedLabel: string;
};

export function AdminModulePage({
  eyebrow,
  title,
  description,
  icon: Icon,
  metrics,
  workflows,
  connectedTo,
  relatedHref,
  relatedLabel,
}: AdminModulePageProps) {
  return (
    <div className="space-y-6 sm:space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-5">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.16em] text-emerald-300 uppercase">
            <Icon className="size-3.5" />
            {eyebrow}
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
        </div>
        <span className="inline-flex min-h-8 items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/[0.08] px-3 py-1.5 text-xs font-medium text-amber-200">
          <CircleDashed className="size-3.5" aria-hidden="true" />
          Not connected
        </span>
      </header>

      <section
        aria-label={`${title} metrics`}
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        {metrics.map((metric) => (
          <Card
            key={metric.label}
            className="border-white/[0.08] bg-[#1F1F1F] shadow-sm shadow-black/20"
          >
            <CardHeader className="flex-row items-start justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-slate-400">{metric.label}</CardTitle>
              <span className="flex size-8 items-center justify-center rounded-lg bg-amber-400/[0.08] text-amber-300">
                <CircleDashed className="size-4" aria-hidden="true" />
              </span>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold tracking-tight text-slate-200">{metric.value}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">{metric.detail}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.85fr]">
        <Card className="overflow-hidden border-white/[0.08] bg-[#1F1F1F] shadow-sm shadow-black/20">
          <CardHeader className="flex-row items-center gap-3 border-b border-white/[0.07] pb-4">
            <span className="flex size-9 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-400">
              <Icon className="size-4" aria-hidden="true" />
            </span>
            <div>
              <CardTitle className="text-sm font-semibold text-slate-100">
                Workflows in this workspace
              </CardTitle>
              <p className="mt-0.5 text-xs text-slate-500">Operational areas ready to configure</p>
            </div>
          </CardHeader>
          <div className="divide-y divide-white/[0.07]">
            {workflows.map((workflow) => (
              <article
                key={workflow.title}
                className="flex items-start justify-between gap-4 px-4 py-4 sm:px-5"
              >
                <div>
                  <p className="text-sm font-medium text-slate-100">{workflow.title}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-400">{workflow.description}</p>
                </div>
                <span
                  className="mt-0.5 flex shrink-0 items-center gap-1.5 rounded-full bg-white/[0.04] px-2 py-1 text-xs font-medium text-slate-500"
                  title="Requires a connected data source"
                >
                  <LockKeyhole className="size-3" aria-hidden="true" />
                  Planned
                </span>
              </article>
            ))}
          </div>
        </Card>

        <Card className="border-white/[0.08] bg-[#1F1F1F] shadow-sm shadow-black/20">
          <CardHeader className="border-b border-white/[0.07] pb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-emerald-300" aria-hidden="true" />
              <CardTitle className="text-sm font-semibold text-slate-100">
                Connect your operations
              </CardTitle>
            </div>
            <p className="text-xs leading-5 text-slate-400">
              This workspace is a planning view. Metrics and actions remain unavailable until each
              source is securely connected.
            </p>
          </CardHeader>
          <CardContent className="pt-4">
            <ul className="space-y-3">
              {connectedTo.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2.5 text-xs leading-5 text-slate-300"
                >
                  <CircleDashed
                    className="mt-0.5 size-3.5 shrink-0 text-amber-300"
                    aria-hidden="true"
                  />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href={relatedHref}
              className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/10 px-3.5 text-xs font-semibold text-emerald-300 transition-colors hover:border-emerald-300/30 hover:bg-emerald-300/[0.06]"
            >
              {relatedLabel} <ArrowRight className="size-3.5" />
            </Link>
          </CardContent>
        </Card>
      </div>

      <p className="flex items-start gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3.5 py-3 text-xs leading-5 text-slate-500">
        <ArrowUpRight className="mt-0.5 size-3.5 shrink-0 text-slate-500" aria-hidden="true" />
        This page does not create, change, or estimate operational records. Values remain marked
        unavailable rather than showing sample data.
      </p>
    </div>
  );
}
