import { useEffect, type RefObject } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

function reduced() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Scroll-reveals every [data-reveal] element inside rootRef (staggered by
 * shared [data-reveal-group]), and applies a pointer-tracked 3D tilt + float
 * to the optional hero card. Respects reduced-motion and coarse pointers.
 */
export function useLandingMotion(
  rootRef: RefObject<HTMLElement | null>,
  tiltRef?: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || reduced()) return;

    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
        const delay = Number(el.dataset.revealDelay ?? 0);
        gsap.from(el, {
          opacity: 0,
          y: 34,
          duration: 0.7,
          ease: "power3.out",
          delay,
          scrollTrigger: { trigger: el, start: "top 88%" },
        });
      });
    }, root);

    return () => ctx.revert();
  }, [rootRef]);

  useEffect(() => {
    const card = tiltRef?.current;
    const container = card?.parentElement;
    if (
      !card ||
      !container ||
      reduced() ||
      window.matchMedia("(pointer: coarse)").matches
    )
      return;

    gsap.set(card, { transformPerspective: 900, transformStyle: "preserve-3d" });
    const rx = gsap.quickTo(card, "rotateX", { duration: 0.5, ease: "power3.out" });
    const ry = gsap.quickTo(card, "rotateY", { duration: 0.5, ease: "power3.out" });

    function onMove(e: PointerEvent) {
      const r = container!.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      ry(px * 14);
      rx(-py * 14);
    }
    function onLeave() {
      rx(0);
      ry(0);
    }

    container.addEventListener("pointermove", onMove);
    container.addEventListener("pointerleave", onLeave);
    return () => {
      container.removeEventListener("pointermove", onMove);
      container.removeEventListener("pointerleave", onLeave);
    };
  }, [tiltRef]);
}
