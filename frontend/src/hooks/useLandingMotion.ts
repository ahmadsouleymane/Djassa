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
      // Entrée hero : stagger au chargement des éléments [data-hero].
      const heroEls = gsap.utils.toArray<HTMLElement>("[data-hero]");
      if (heroEls.length) {
        gsap.from(heroEls, {
          opacity: 0,
          y: 26,
          duration: 0.8,
          ease: "power3.out",
          stagger: 0.09,
          delay: 0.05,
        });
      }

      // Reveals au scroll.
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

      // Count-up des chiffres [data-count] (ex : stats hero).
      gsap.utils.toArray<HTMLElement>("[data-count]").forEach((el) => {
        const target = Number(el.dataset.count ?? 0);
        const suffix = el.dataset.countSuffix ?? "";
        const counter = { v: 0 };
        el.textContent = `0${suffix}`;
        gsap.to(counter, {
          v: target,
          duration: 1.4,
          ease: "power2.out",
          delay: 0.3,
          scrollTrigger: { trigger: el, start: "top 92%" },
          onUpdate: () => {
            el.textContent = `${Math.round(counter.v)}${suffix}`;
          },
        });
      });

      // Parallax léger scroll-linked sur [data-parallax].
      gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((el) => {
        const depth = Number(el.dataset.parallax ?? -0.1);
        gsap.to(el, {
          yPercent: depth * 100,
          ease: "none",
          scrollTrigger: {
            trigger: el.closest("section") ?? el,
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
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
