import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";
import { Camera, CameraOff, Loader2, ScanLine } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type BarcodeDetectorResult = { rawValue: string };
type BarcodeDetectorLike = {
  detect: (source: HTMLVideoElement) => Promise<BarcodeDetectorResult[]>;
};
type BarcodeDetectorCtor = new (options?: {
  formats?: string[];
}) => BarcodeDetectorLike;

function getBarcodeDetectorCtor(): BarcodeDetectorCtor | null {
  const globalWithDetector = window as unknown as {
    BarcodeDetector?: BarcodeDetectorCtor;
  };
  return globalWithDetector.BarcodeDetector ?? null;
}

type ScannerState = "idle" | "starting" | "scanning" | "unsupported" | "denied";

/**
 * Real device-camera QR scanner. Decodes QR codes with the browser's native
 * BarcodeDetector API and reports the raw token to the caller. It never
 * fabricates a result: if the camera or decoder is unavailable it says so.
 */
export function QrScanner({
  onDetected,
  disabled = false,
}: {
  onDetected: (token: string) => void;
  disabled?: boolean;
}) {
  const { t } = useLanguage();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);
  const lastTokenRef = useRef<string | null>(null);
  const [state, setState] = useState<ScannerState>("idle");

  const stop = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setState("idle");
  }, []);

  useEffect(() => stop, [stop]);

  const scanLoop = useCallback(
    (detector: BarcodeDetectorLike) => {
      const tick = async () => {
        const video = videoRef.current;
        if (!video || video.readyState < 2) {
          frameRef.current = requestAnimationFrame(() => void tick());
          return;
        }
        try {
          const codes = await detector.detect(video);
          const value = codes[0]?.rawValue?.trim();
          if (value && value !== lastTokenRef.current) {
            lastTokenRef.current = value;
            onDetected(value);
          }
        } catch {
          // Transient decode errors are expected between frames; keep scanning.
        }
        frameRef.current = requestAnimationFrame(() => void tick());
      };
      frameRef.current = requestAnimationFrame(() => void tick());
    },
    [onDetected],
  );

  const start = useCallback(async () => {
    const DetectorCtor = getBarcodeDetectorCtor();
    if (!DetectorCtor) {
      setState("unsupported");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setState("unsupported");
      return;
    }
    setState("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) {
        stop();
        return;
      }
      video.srcObject = stream;
      await video.play();
      lastTokenRef.current = null;
      setState("scanning");
      scanLoop(new DetectorCtor({ formats: ["qr_code"] }));
    } catch {
      stop();
      setState("denied");
    }
  }, [scanLoop, stop]);

  const isActive = state === "scanning" || state === "starting";

  return (
    <div className="flex flex-col gap-3">
      <div
        data-ocid="admin.scanner_camera_viewport"
        className="relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-primary/95"
      >
        <video
          ref={videoRef}
          className="size-full object-cover"
          playsInline
          muted
          aria-label={t.admin.scannerCameraLabel}
        />
        {!isActive ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
            <ScanLine
              className="size-9 text-primary-foreground/70"
              aria-hidden="true"
            />
            <p className="text-sm text-primary-foreground/80">
              {state === "unsupported"
                ? t.admin.scannerUnsupported
                : state === "denied"
                  ? t.admin.scannerDenied
                  : t.admin.scannerCameraIdle}
            </p>
          </div>
        ) : (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
          >
            <div className="size-40 rounded-xl border-2 border-accent/80 shadow-[0_0_0_9999px_oklch(0.28_0.088_258_/_0.35)]" />
          </div>
        )}
        {state === "starting" ? (
          <div className="absolute inset-0 flex items-center justify-center bg-primary/70">
            <Loader2
              className="size-7 animate-spin text-primary-foreground"
              aria-hidden="true"
            />
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        {isActive ? (
          <Button
            type="button"
            variant="outline"
            data-ocid="admin.scanner_stop_button"
            onClick={stop}
            className="h-11 flex-1 rounded-lg"
          >
            <CameraOff className="size-4" aria-hidden="true" />
            {t.admin.scannerStop}
          </Button>
        ) : (
          <Button
            type="button"
            data-ocid="admin.scanner_start_button"
            onClick={() => void start()}
            disabled={disabled}
            className="h-11 flex-1 rounded-lg bg-accent text-accent-foreground hover:bg-accent/90"
          >
            <Camera className="size-4" aria-hidden="true" />
            {t.admin.scannerStart}
          </Button>
        )}
      </div>
    </div>
  );
}
