import { Check, CheckCheck } from "lucide-react";

import { cn } from "@/lib/utils";
import type { MessageDto } from "@/features/messaging/types";

function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

/** A single chat bubble. `seen` drives the double-tick read receipt on own messages. */
export function MessageBubble({
  message,
  isOwn,
  seen,
}: {
  message: MessageDto;
  isOwn: boolean;
  seen?: boolean;
}) {
  return (
    <div className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[78%] rounded-2xl px-3 py-2 text-sm shadow-sm",
          isOwn
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "bg-muted rounded-bl-sm",
        )}
      >
        {message.imageUrl ? (
          // Chat images come from arbitrary Cloudinary transforms; a plain img avoids
          // per-host next/image config and keeps the bubble simple.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={message.imageUrl}
            alt="Shared image"
            className="mb-1 max-h-64 rounded-lg object-cover"
          />
        ) : null}
        {message.body ? (
          <p className="break-words whitespace-pre-wrap">{message.body}</p>
        ) : null}
        <div
          className={cn(
            "mt-1 flex items-center gap-1 text-xs",
            isOwn ? "text-primary-foreground/70 justify-end" : "text-muted-foreground",
          )}
        >
          <span suppressHydrationWarning>{timeLabel(message.createdAt)}</span>
          {isOwn ? (
            seen ? (
              <CheckCheck className="size-3" aria-label="Seen" />
            ) : (
              <Check className="size-3" aria-label="Sent" />
            )
          ) : null}
        </div>
      </div>
    </div>
  );
}
