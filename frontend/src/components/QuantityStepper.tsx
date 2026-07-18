import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type QuantityStepperProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "md";
  className?: string;
  ariaLabel?: string;
};

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  size = "md",
  className,
  ariaLabel = "Quantité",
}: QuantityStepperProps) {
  const clamp = (n: number) => Math.max(min, Math.min(max, n));
  const btn = size === "sm" ? "size-8" : "size-10";
  const box = size === "sm" ? "w-9 text-sm" : "w-12 text-base";

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-border bg-card",
        className,
      )}
      role="group"
      aria-label={ariaLabel}
    >
      <button
        type="button"
        onClick={() => onChange(clamp(value - 1))}
        disabled={value <= min}
        aria-label="Diminuer la quantité"
        className={cn(
          "press grid shrink-0 place-items-center rounded-full text-foreground transition-colors hover:bg-secondary disabled:opacity-35 disabled:hover:bg-transparent",
          btn,
        )}
      >
        <Minus className="size-4" />
      </button>
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(e) => {
          const n = parseInt(e.target.value.replace(/\D/g, ""), 10);
          onChange(Number.isNaN(n) ? min : clamp(n));
        }}
        aria-label={ariaLabel}
        className={cn(
          "border-0 bg-transparent text-center font-semibold tabular focus:outline-none",
          box,
        )}
      />
      <button
        type="button"
        onClick={() => onChange(clamp(value + 1))}
        disabled={value >= max}
        aria-label="Augmenter la quantité"
        className={cn(
          "press grid shrink-0 place-items-center rounded-full text-foreground transition-colors hover:bg-secondary disabled:opacity-35 disabled:hover:bg-transparent",
          btn,
        )}
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}
