import { useRef, useState, useCallback, useEffect } from "react";
import { Camera, RotateCcw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CameraCaptureProps = {
  onCapture: (file: File) => void;
  label: string;
  hint: string;
  capturedPreview?: string | null;
  className?: string;
};

export function CameraCapture({ onCapture, label, hint, capturedPreview, className }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setStreaming(false);
  }, []);

  const startCamera = useCallback(async () => {
    setError(null);
    try {
      stopStream();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStreaming(true);
    } catch {
      setError("Impossible d'accéder à la caméra. Vérifie les permissions.");
    }
  }, [facingMode, stopStream]);

  useEffect(() => () => stopStream(), [stopStream]);

  function takePhoto() {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      onCapture(new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" }));
      stopStream();
    }, "image/jpeg", 0.9);
  }

  function toggleCamera() {
    setFacingMode((f) => (f === "environment" ? "user" : "environment"));
    if (streaming) startCamera();
  }

  if (capturedPreview) {
    return (
      <div className={cn("relative overflow-hidden rounded-xl border-2 border-brand-400 bg-black", className)}>
        <img src={capturedPreview} alt={label} className="h-48 w-full object-contain" />
        <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-black/70 px-3 py-2">
          <Check className="size-4 text-brand-400" />
          <span className="text-sm font-medium text-white">{label} — capturée</span>
          <Button size="sm" variant="ghost" className="ml-auto text-white hover:bg-white/10" onClick={() => onCapture(null as unknown as File)}>
            <RotateCcw className="size-3.5" /> Refaire
          </Button>
        </div>
      </div>
    );
  }

  if (streaming) {
    return (
      <div className={cn("relative overflow-hidden rounded-xl bg-black", className)}>
        <video ref={videoRef} autoPlay playsInline muted className="h-48 w-full object-cover" />
        <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-black/70 px-3 py-2">
          <Button size="sm" onClick={takePhoto} className="gap-1.5">
            <Camera className="size-3.5" /> Capturer
          </Button>
          <Button size="sm" variant="ghost" className="text-white hover:bg-white/10" onClick={toggleCamera}>
            <RotateCcw className="size-3.5" />
          </Button>
          <span className="ml-auto text-xs text-white/60">{label}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-secondary/30 p-6", className)}>
      {error ? (
        <p className="text-center text-sm text-destructive">{error}</p>
      ) : (
        <>
          <Camera className="size-8 text-muted-foreground" />
          <div className="text-center">
            <p className="text-sm font-medium">{label}</p>
            <p className="text-xs text-muted-foreground">{hint}</p>
          </div>
        </>
      )}
      <Button type="button" size="sm" variant="outline" onClick={startCamera} className="gap-1.5">
        <Camera className="size-3.5" /> {error ? "Réessayer" : "Ouvrir la caméra"}
      </Button>
    </div>
  );
}
