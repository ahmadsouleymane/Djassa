import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/35 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[var(--shadow-brand)] hover:bg-brand-600 hover:-translate-y-0.5",
        secondary:
          "bg-secondary text-secondary-foreground border border-border shadow-[var(--shadow-xs)] hover:bg-white hover:-translate-y-0.5",
        outline:
          "border border-input bg-transparent hover:bg-secondary/70 hover:border-brand-300",
        ghost: "hover:bg-secondary/70",
        link: "text-primary underline-offset-4 hover:underline",
        destructive:
          "bg-destructive text-destructive-foreground shadow-[var(--shadow-xs)] hover:brightness-95",
        ink: "bg-ink text-white shadow-[var(--shadow-md)] hover:bg-ink-soft hover:-translate-y-0.5",
        soft: "bg-accent text-accent-foreground hover:bg-brand-100",
      },
      size: {
        sm: "h-9 px-3.5 text-[0.8125rem]",
        default: "h-11 px-5",
        lg: "h-12 px-6 text-[0.95rem]",
        xl: "h-14 px-8 text-base",
        icon: "size-11",
        "icon-sm": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
