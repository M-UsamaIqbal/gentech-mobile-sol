import { serializeJsonLd } from "@/lib/seo/structured-data";

/** Renders a single escaped JSON-LD document for server components. */
export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
