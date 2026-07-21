import { useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";
import QRCode from "qrcode";
import { Download, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ReferralLevel } from "@/api/referrals";

type PosterConfig = {
  gradient: string;
  badge: string;
  headline: string;
  tagline: string;
  accentColor: string;
};

const POSTER: Record<ReferralLevel, PosterConfig> = {
  nouvo: {
    gradient: "from-blue-100 to-blue-50",
    badge: "🆕 NOUVEAU",
    headline: "Je viens de rejoindre Djassa.",
    tagline: "Achète sans être gaou. Ton djai est sécurisé.",
    accentColor: "#3b82f6",
  },
  kpata: {
    gradient: "from-amber-100 to-orange-50",
    badge: "🔥 KPATA",
    headline: "Mon crew ne se fait plus gaou.",
    tagline: "Rejoins-les. Paiement bloqué jusqu'à réception.",
    accentColor: "#d97706",
  },
  boss: {
    gradient: "from-slate-800 to-slate-700",
    badge: "💎 BOSS",
    headline: "BOSS LEVEL — Je protège mon réseau.",
    tagline: "X filleuls. Aucun gaou. Rejoins le mouvement.",
    accentColor: "#ffffff",
  },
  grand_choco: {
    gradient: "from-yellow-400 to-amber-500",
    badge: "👑 GRAND CHOCO",
    headline: "Le réseau le plus protégé de Côte d'Ivoire.",
    tagline: "Légende Djassa. Code exclusif ci-dessous.",
    accentColor: "#000000",
  },
};

const MESSAGES: Record<ReferralLevel, string[]> = {
  nouvo: [
    "Je viens de rejoindre Djassa. Achète sans être gaou 👉 [LIEN]",
    "Marre de me faire arnaquer sur WhatsApp. J'ai trouvé la solution. Code : [CODE]",
  ],
  kpata: [
    "[N] personnes utilisent déjà mon code DJASSA. Ils achètent sans stress. Rejoins-les 👉 [LIEN]",
    "Mon crew ne se fait plus gaou. Et toi ? Code : [CODE]",
  ],
  boss: [
    "BOSS LEVEL 🔥 [N] personnes protégées grâce à mon code. T'es le prochain ? 👉 [LIEN]",
    "Certifié BOSS — Je protège mon réseau des arnaques. Code : [CODE]",
  ],
  grand_choco: [
    "GRAND CHOCO 👑 Le réseau le plus protégé de Côte d'Ivoire. [N] filleuls. Aucun gaou. 👉 [LIEN]",
    "Grand Choco — Légende Djassa. Mon code est le plus partagé du pays : [CODE]",
  ],
};

type Props = {
  level: ReferralLevel;
  code: string;
  count: number;
};

export function PosterTemplate({ level, code, count }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [generating, setGenerating] = useState(false);
  const link = `${window.location.origin}/inscription?ref=${code}`;
  const config = POSTER[level];

  useEffect(() => {
    QRCode.toDataURL(link, { width: 256, margin: 2, color: { dark: "#000", light: "#fff" } }).then(setQrDataUrl);
  }, [link]);

  async function handleDownload() {
    if (!ref.current) return;
    setGenerating(true);
    try {
      const dataUrl = await toPng(ref.current, { quality: 0.95, pixelRatio: 2 });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `djassa-${level}.png`;
      a.click();
    } catch {
      // fallback silencieux
    } finally {
      setGenerating(false);
    }
  }

  const messages = MESSAGES[level].map((m) =>
    m.replace("[CODE]", code).replace("[LIEN]", link).replace("[N]", String(count)),
  );

  return (
    <div className="space-y-3">
      {/* Aperçu de l'affiche */}
      <div
        ref={ref}
        className={`mx-auto w-[380px] max-w-full rounded-2xl bg-gradient-to-br ${config.gradient} p-6 text-center shadow-lg`}
        style={{ color: config.accentColor === "#ffffff" ? "#fff" : undefined }}
      >
        <p className="text-sm font-bold tracking-wide uppercase" style={{ opacity: 0.7 }}>{config.badge}</p>
        <p className="mt-2 text-xl font-bold">{config.headline}</p>
        <p className="mt-1 text-sm opacity-80">{config.tagline}</p>

        {qrDataUrl && (
          <img src={qrDataUrl} alt="QR Code" className="mx-auto mt-4 w-32 rounded-lg" />
        )}

        <p className="mt-3 font-mono text-lg font-bold tracking-wide">{code}</p>
        <p className="mt-1 text-xs opacity-50 break-all font-mono">{link}</p>
        <p className="mt-4 text-[10px] opacity-40">djassa.ci — Achète sans être gaou</p>
      </div>

      <Button variant="outline" size="sm" onClick={handleDownload} disabled={generating} className="w-full">
        <Download className="size-4" />
        <span className="ml-1.5">{generating ? "Génération..." : "Télécharger l'affiche"}</span>
      </Button>

      {/* Messages à copier */}
      <div className="space-y-2">
        {messages.map((msg, i) => (
          <CopyMessage key={i} text={msg} />
        ))}
      </div>
    </div>
  );
}

function CopyMessage({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="group relative rounded-lg border border-border bg-card p-3 text-sm">
      <p className="text-muted-foreground">{text}</p>
      <Button size="icon" variant="ghost" className="absolute top-2 right-2 size-7 opacity-0 group-hover:opacity-100 transition-opacity" onClick={handleCopy}>
        {copied ? <Check className="size-3 text-green-500" /> : <Copy className="size-3" />}
      </Button>
    </div>
  );
}
