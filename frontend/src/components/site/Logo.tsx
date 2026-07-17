import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  variant?: "default" | "light";
  to?: string;
};

/** Jassa wordmark: a green seal with an escrow checkmark. */
export function Logo({ className, variant = "default", to = "/" }: LogoProps) {
  return (
    <Link
      to={to}
      aria-label="Jassa, accueil"
      className={cn("inline-flex items-center gap-2.5 no-underline", className)}
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-[11px] bg-primary shadow-[var(--shadow-brand)]">
        <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden="true">
          <path
            d="M5 12.5 10 17.5 19.5 7"
            stroke="#fff"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span
        className={cn(
          "font-display text-[1.35rem] font-semibold leading-none tracking-tight",
          variant === "light" ? "text-white" : "text-ink",
        )}
      >
        Jassa
      </span>
    </Link>
  );
}
