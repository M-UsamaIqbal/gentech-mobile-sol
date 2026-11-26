"use client"

import Link from "next/link"
import type { ComponentProps } from "react"

import { useLocalizedRouteInfo, withLocalizedPrefix } from "@/lib/localized-routing"

/** Next.js Link that preserves the current `/{country}/{locale}` route prefix. */
export function LocalizedLink({ href, ...props }: ComponentProps<typeof Link>) {
  const { prefix } = useLocalizedRouteInfo()
  const resolvedHref = typeof href === "string" ? withLocalizedPrefix(href, prefix) : href
  return <Link href={resolvedHref} {...props} />
}
