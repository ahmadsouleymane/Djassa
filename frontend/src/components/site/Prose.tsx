import { cn } from "@/lib/utils";

/** Shared typographic wrapper for editorial and legal content. */
export function Prose({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "max-w-2xl text-[0.975rem] leading-relaxed",
        "[&_h2]:mt-8 [&_h2]:mb-2 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-foreground",
        "[&_h3]:mt-6 [&_h3]:mb-1.5 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-foreground",
        "[&_p]:mb-4 [&_p]:text-muted-foreground",
        "[&_a]:font-semibold [&_a]:text-primary [&_a:hover]:underline",
        "[&_strong]:font-semibold [&_strong]:text-foreground",
        "[&_ul]:my-4 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-2 [&_ul]:pl-5",
        "[&_li]:list-disc [&_li]:text-muted-foreground [&_li]:marker:text-primary",
        className,
      )}
    >
      {children}
    </div>
  );
}
