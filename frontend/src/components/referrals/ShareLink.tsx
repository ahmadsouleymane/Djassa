import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Copy, Check, Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  code: string;
};

export function ShareLink({ code }: Props) {
  const referralLink = `${window.location.origin}/inscription?ref=${code}`;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, referralLink, {
        width: 180,
        margin: 2,
        color: { dark: "#000000", light: "#ffffff" },
      });
    }
  }, [referralLink]);

  async function handleCopy() {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleDownloadQR() {
    const url = await QRCode.toDataURL(referralLink, { width: 512, margin: 2 });
    const a = document.createElement("a");
    a.href = url;
    a.download = `djassa-qr-${code}.png`;
    a.click();
  }

  async function handleShare() {
    if (navigator.share) {
      await navigator.share({
        title: "Rejoins-moi sur Djassa",
        text: `Achète sans être gaou avec mon code ${code} ! Ton djai est sécurisé.`,
        url: referralLink,
      });
    } else {
      await handleCopy();
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Ton lien de parrainage</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <canvas
          ref={canvasRef}
          className="rounded-xl border border-border"
          width={180}
          height={180}
        />

        <div className="flex flex-1 flex-col gap-3">
          <div className="flex items-center gap-2">
            <Input
              readOnly
              value={code}
              className="max-w-[200px] font-mono text-sm"
            />
            <Button size="sm" variant="outline" onClick={handleCopy}>
              {copied ? <Check className="size-4 text-green-500" /> : <Copy className="size-4" />}
              <span className="ml-1.5">{copied ? "Copié" : "Copier"}</span>
            </Button>
          </div>

          <p className="text-xs text-muted-foreground break-all font-mono">{referralLink}</p>

          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={handleDownloadQR}>
              <Download className="size-4" />
              <span className="ml-1.5">QR Code</span>
            </Button>
            <Button size="sm" variant="secondary" onClick={handleShare}>
              <Share2 className="size-4" />
              <span className="ml-1.5">Partager</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
