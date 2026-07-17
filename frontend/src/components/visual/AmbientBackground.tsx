import { cn } from "@/lib/utils";

/**
 * Ambient backdrop for dark immersive sections: a masked blueprint grid, a few
 * slow green aurora blobs and a fine film grain. Purely decorative — aria-hidden,
 * pointer-events-none. Aurora + grain freeze under prefers-reduced-motion.
 */
export function AmbientBackground({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      <div className="absolute inset-0 grid-lines [mask-image:radial-gradient(80%_65%_at_50%_0%,#000_15%,transparent_78%)]" />

      <div
        className="aurora-blob -left-[12%] -top-[22%] size-[42rem]"
        style={{ background: "var(--aurora-1)" }}
      />
      <div
        className="aurora-blob -right-[14%] top-[6%] size-[38rem]"
        style={{ background: "var(--aurora-2)", animationDelay: "-6s" }}
      />
      <div
        className="aurora-blob left-[24%] -bottom-[30%] size-[46rem]"
        style={{ background: "var(--aurora-3)", animationDelay: "-12s" }}
      />

      <div className="grain absolute inset-0" />
    </div>
  );
}
