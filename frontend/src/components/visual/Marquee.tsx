import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Infinite horizontal marquee. Renders the items twice inside a single animated
 * track (the keyframe translates -50%, i.e. exactly one copy) for a seamless
 * loop. Pauses on hover, freezes under reduced-motion, fades at both edges.
 */
export function Marquee({
  items,
  reverse = false,
  className,
  gap = "gap-3",
}: {
  items: ReactNode[];
  reverse?: boolean;
  className?: string;
  gap?: string;
}) {
  const loop = [...items, ...items];
  return (
    <div
      className={cn(
        "group flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]",
        className,
      )}
    >
      <ul
        className={cn(
          "flex shrink-0 items-center",
          gap,
          reverse ? "animate-marquee-reverse" : "animate-marquee",
          "motion-reduce:animate-none group-hover:[animation-play-state:paused]",
        )}
      >
        {loop.map((item, i) => (
          <li key={i} aria-hidden={i >= items.length} className="shrink-0">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
