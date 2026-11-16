import type { ReactElement, SVGProps } from "react";
import Link from "next/link";
import { ShieldCheck, Tag } from "lucide-react";

import { APP, ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/layout/logo";
import {
  FacebookIcon,
  InstagramIcon,
  LinkedinIcon,
  SnapchatIcon,
  WhatsappIcon,
  YoutubeIcon,
} from "@/components/layout/social-icons";

// TODO: replace the `#` hrefs with your real profile links.
// `className` carries each platform's official brand color.
const SOCIAL_LINKS: Array<{
  label: string;
  href: string;
  Icon: (props: SVGProps<SVGSVGElement>) => ReactElement;
  className: string;
}> = [
  { label: "WhatsApp", href: "#", Icon: WhatsappIcon, className: "bg-[#25D366] text-white" },
  { label: "Facebook", href: "#", Icon: FacebookIcon, className: "bg-[#1877F2] text-white" },
  {
    label: "Instagram",
    href: "#",
    Icon: InstagramIcon,
    className: "bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white",
  },
  { label: "Snapchat", href: "#", Icon: SnapchatIcon, className: "bg-[#FFFC00] text-black" },
  { label: "LinkedIn", href: "#", Icon: LinkedinIcon, className: "bg-[#0A66C2] text-white" },
  { label: "YouTube", href: "#", Icon: YoutubeIcon, className: "bg-[#FF0000] text-white" },
];

const FOOTER_SECTIONS: Array<{ title: string; links: Array<{ label: string; href: string }> }> = [
  {
    title: "Marketplace",
    links: [
      { label: "Browse listings", href: ROUTES.marketplace },
      { label: "Categories", href: ROUTES.categories },
      { label: "Post an ad", href: ROUTES.sell },
    ],
  },
  {
    title: "Services",
    links: [
      { label: "Phone inspection", href: ROUTES.inspectionService },
      { label: "Sell your phone", href: ROUTES.sellPhone },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Sign in", href: ROUTES.signIn },
      { label: "Create account", href: ROUTES.signUp },
      { label: "Dashboard", href: ROUTES.dashboard },
    ],
  },
];

const TRUST = [
  { icon: ShieldCheck, label: "Buyer inspections available" },
  { icon: Tag, label: "Free to list, always" },
];

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-muted/30 mt-16 border-t">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          {/* Brand + blurb */}
          <div className="max-w-xs">
            <Logo />
            <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
              {APP.description}
            </p>
            <ul className="mt-4 space-y-1.5">
              {TRUST.map(({ icon: Icon, label }) => (
                <li
                  key={label}
                  className="text-muted-foreground flex items-center gap-2 text-xs"
                >
                  <Icon className="text-primary size-4 shrink-0" />
                  {label}
                </li>
              ))}
            </ul>

            {/* Follow us */}
            <div className="mt-5">
              <p className="text-xs font-semibold">Follow us</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {SOCIAL_LINKS.map(({ label, href, Icon, className }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    title={label}
                    className={cn(
                      "grid size-9 place-items-center rounded-lg shadow-sm transition-all hover:-translate-y-0.5 hover:opacity-90 hover:shadow-md",
                      className,
                    )}
                  >
                    <Icon className="size-4" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Link columns */}
          {FOOTER_SECTIONS.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold">{section.title}</h3>
              <ul className="mt-3 space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t pt-6 sm:flex-row">
          <p className="text-muted-foreground text-xs">
            © {year} {APP.name}. All rights reserved.
          </p>
          <p className="text-muted-foreground text-xs">
            Buy &amp; sell mobile phones across Pakistan 🇵🇰
          </p>
        </div>
      </div>
    </footer>
  );
}
