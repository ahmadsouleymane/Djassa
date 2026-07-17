import * as React from "react";
import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-24 w-full rounded-lg border border-input bg-white px-3.5 py-2.5 text-base shadow-[var(--shadow-xs)] transition-[color,box-shadow,border-color] outline-none resize-y",
        "placeholder:text-muted-foreground/70",
        "focus-visible:border-brand-400 focus-visible:ring-[3.5px] focus-visible:ring-accent",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
        "disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
