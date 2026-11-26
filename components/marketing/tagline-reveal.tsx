"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/** Large tagline whose words activate in reading order as they enter the viewport. */
export function TaglineReveal({ text }: { text: string }) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [activeWords, setActiveWords] = React.useState<ReadonlySet<number>>(new Set());
  const words = React.useMemo(() => text.split(/\s+/).filter(Boolean), [text]);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const elements = Array.from(container.querySelectorAll<HTMLElement>("[data-word]"));

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setActiveWords(new Set(elements.map((_, index) => index)));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = Number((entry.target as HTMLElement).dataset.word);
          setActiveWords((current) =>
            current.has(index) ? current : new Set(current).add(index),
          );
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.6, rootMargin: "0px 0px -10% 0px" },
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [text]);

  return (
    <section aria-label={text} className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
      <div
        ref={containerRef}
        className="heading-2 max-w-[680px]"
      >
        {words.map((word, index) => (
          <span
            key={`${word}-${index}`}
            data-word={index}
            className={cn(
              "transition-colors duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
              activeWords.has(index) ? "text-foreground" : "text-foreground/30",
            )}
          >
            {word}{" "}
          </span>
        ))}
      </div>
    </section>
  );
}
