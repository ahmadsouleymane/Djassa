import type { ReferralLevel } from "@/api/referrals";

const LEVEL_CONFIG: Record<ReferralLevel, { label: string; emoji: string; className: string }> = {
  nouvo:       { label: "Nouvo",       emoji: "🆕", className: "bg-muted text-muted-foreground" },
  kpata:       { label: "Kpata",       emoji: "🔥", className: "bg-amber-100 text-amber-800" },
  boss:        { label: "Boss",        emoji: "💎", className: "bg-slate-700 text-white" },
  grand_choco: { label: "Grand Choco", emoji: "👑", className: "bg-yellow-500 text-yellow-900" },
};

export function StatusBadge({ level }: { level: ReferralLevel }) {
  const config = LEVEL_CONFIG[level];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${config.className}`}
    >
      {config.emoji} {config.label}
    </span>
  );
}

export function StatusBadgeSmall({ level }: { level: ReferralLevel }) {
  const config = LEVEL_CONFIG[level];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${config.className}`}>
      {config.emoji} {config.label}
    </span>
  );
}
