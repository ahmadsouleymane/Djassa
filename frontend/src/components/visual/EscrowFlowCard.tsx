import { useEffect, useState, type RefObject } from "react";
import { ShieldCheck, Truck, PackageCheck, BadgeCheck, Wallet } from "lucide-react";

/**
 * Animated hero card that *explains* the escrow flow: it auto-advances through
 * Payé → Expédié → Reçu → Confirmé so a first-time visitor immediately grasps
 * what happens between paying and receiving. Light 3D (CSS perspective + layered
 * translateZ + pointer tilt via `cardRef`), no Three.js — keeps it cheap on the
 * slow mobile connections Djassa targets. Freezes on a clear state under
 * prefers-reduced-motion.
 */

type Phase = {
  key: string;
  badge: string;
  Icon: typeof Truck;
  caption: string;
  held: boolean;
};

const PHASES: Phase[] = [
  {
    key: "paye",
    badge: "Payé",
    Icon: Wallet,
    caption: "L'acheteur paie — le djai part en séquestre chez Djassa.",
    held: true,
  },
  {
    key: "expedie",
    badge: "Expédié",
    Icon: Truck,
    caption: "Le vendeur expédie sous 72h, avec suivi du colis.",
    held: true,
  },
  {
    key: "recu",
    badge: "Reçu",
    Icon: PackageCheck,
    caption: "Colis livré — l'acheteur vérifie son article.",
    held: true,
  },
  {
    key: "confirme",
    badge: "Confirmé",
    Icon: BadgeCheck,
    caption: "L'acheteur confirme — le vendeur est payé, c'est carré.",
    held: false,
  },
];

const RAIL = ["Payé", "Expédié", "Reçu", "Confirmé"];

function reduced() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function EscrowFlowCard({
  cardRef,
}: {
  cardRef: RefObject<HTMLDivElement | null>;
}) {
  // Start on "Reçu" so the still frame (reduced-motion) shows a meaningful mid-flow state.
  const [step, setStep] = useState(2);

  useEffect(() => {
    if (reduced()) return;
    setStep(0);
    const id = setInterval(() => {
      setStep((s) => (s + 1) % PHASES.length);
    }, 1900);
    return () => clearInterval(id);
  }, []);

  const phase = PHASES[step];
  const revealed = step >= 2;

  return (
    <div className="[perspective:1100px]" data-parallax="-0.1">
      <div className="animate-float motion-reduce:animate-none">
        <div
          ref={cardRef}
          className="w-[19rem] rounded-2xl border border-white/10 bg-card p-5 shadow-[0_30px_80px_-24px_rgba(0,0,0,0.7),var(--shadow-glow)] will-change-transform [transform-style:preserve-3d] sm:w-[21rem]"
        >
          {/* Header */}
          <div className="flex items-center gap-3" style={{ transform: "translateZ(28px)" }}>
            <div className="grid size-11 place-items-center rounded-xl bg-[radial-gradient(circle_at_30%_20%,var(--brand-100),var(--secondary))]">
              <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden>
                <path d="M5 12.5 10 17.5 19.5 7" stroke="var(--brand-600)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">Sac à main cuir</p>
              <p className="text-xs text-muted-foreground">Commande #A48213</p>
            </div>
            <span
              key={phase.key}
              className="inline-flex items-center gap-1.5 rounded-full bg-brand-100 px-2.5 py-1 text-[0.7rem] font-bold text-brand-700 [animation:fadeStep_0.4s_ease]"
            >
              <phase.Icon className="size-3.5" />
              {phase.badge}
            </span>
          </div>

          {/* Progress rail */}
          <div className="mt-5 flex items-center justify-between" style={{ transform: "translateZ(18px)" }}>
            {RAIL.map((label, i) => {
              const done = i <= step;
              const current = i === step;
              return (
                <div key={label} className="flex flex-1 items-center last:flex-none">
                  <div className="flex flex-col items-center gap-1.5">
                    <span
                      className={
                        "grid size-6 place-items-center rounded-full text-white transition-all duration-500 " +
                        (done
                          ? "bg-primary"
                          : "bg-secondary") +
                        (current ? " ring-2 ring-primary/40 ring-offset-2 ring-offset-card scale-110" : "")
                      }
                    >
                      {done ? (
                        <svg viewBox="0 0 24 24" className="size-3.5" fill="none">
                          <path d="M5 12.5 10 17 19 7" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : null}
                    </span>
                    <span
                      className={
                        "text-[0.6rem] font-medium transition-colors " +
                        (current ? "text-foreground" : "text-muted-foreground")
                      }
                    >
                      {label}
                    </span>
                  </div>
                  {i < RAIL.length - 1 && (
                    <span className="mx-1 -mt-4 h-0.5 flex-1 overflow-hidden rounded-full bg-secondary">
                      <span
                        className="block h-full rounded-full bg-primary transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
                        style={{ width: i < step ? "100%" : "0%" }}
                      />
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Live caption — explains the current step */}
          <div className="mt-5 min-h-[3.25rem] rounded-xl bg-secondary/70 p-3.5" style={{ transform: "translateZ(24px)" }}>
            {revealed ? (
              <>
                <p className="text-[0.7rem] font-medium text-muted-foreground">Code de confirmation</p>
                <p className="mt-0.5 font-mono text-2xl font-bold tracking-[0.3em] text-foreground tabular">482913</p>
              </>
            ) : (
              <p key={phase.key} className="text-[0.82rem] leading-snug font-medium text-foreground [animation:fadeStep_0.4s_ease]">
                {phase.caption}
              </p>
            )}
          </div>

          {/* Money status */}
          <div
            key={phase.held ? "held" : "released"}
            className="mt-4 flex items-center gap-2 text-xs font-semibold text-primary [animation:fadeStep_0.4s_ease]"
            style={{ transform: "translateZ(14px)" }}
          >
            <ShieldCheck className="size-4" />
            {phase.held
              ? "22 000 FCFA protégés jusqu'à ta confirmation"
              : "22 000 FCFA versés au vendeur, c'est carré"}
          </div>
        </div>
      </div>
    </div>
  );
}
