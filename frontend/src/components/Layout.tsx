import { type ReactNode } from "react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { MobileTabBar } from "@/components/site/MobileTabBar";

type LayoutProps = {
  children: ReactNode;
  /** When true (default) children sit in a centered max-width container with page padding. */
  contained?: boolean;
};

export function Layout({ children, contained = true }: LayoutProps) {
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <SiteHeader />
      {contained ? (
        <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 pt-6 pb-mobile-nav md:pb-8 md:pt-8">
          {children}
        </main>
      ) : (
        <main className="flex-1">{children}</main>
      )}
      <SiteFooter />
      {/* Spacer so the fixed mobile tab bar never covers footer content */}
      <div aria-hidden className="h-[4.75rem] bg-background md:hidden" />
      <MobileTabBar />
    </div>
  );
}
