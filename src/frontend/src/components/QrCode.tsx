import { cn } from "@/lib/utils";
import { QRCodeSVG } from "qrcode.react";

/**
 * Renders a real, scannable QR code for an appointment verification token.
 *
 * The encoded payload is the opaque verification token issued by the backend —
 * never private customer data. The token is unpredictable and is the only
 * value the check-in scanner needs.
 */
export function QrCode({
  value,
  size = 208,
  className,
  title,
}: {
  value: string;
  size?: number;
  className?: string;
  title?: string;
}) {
  return (
    <div
      data-ocid="qr_code.canvas"
      className={cn(
        "inline-flex items-center justify-center rounded-xl border border-border bg-card p-4 shadow-subtle",
        className,
      )}
    >
      <QRCodeSVG
        value={value}
        size={size}
        level="M"
        marginSize={0}
        bgColor="transparent"
        fgColor="currentColor"
        title={title}
        className="text-foreground"
      />
    </div>
  );
}
