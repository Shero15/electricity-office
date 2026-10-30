import { AppointmentStatus } from "@/backend";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

const statusStyles: Record<AppointmentStatus, string> = {
  [AppointmentStatus.requested]:
    "border-warning/30 bg-warning/10 text-warning-foreground",
  [AppointmentStatus.confirmed]:
    "border-success/30 bg-success/10 text-success-foreground",
  [AppointmentStatus.rescheduled]: "border-accent/30 bg-accent/10 text-accent",
  [AppointmentStatus.checkedIn]:
    "border-success/40 bg-success/15 text-success-foreground",
  [AppointmentStatus.cancelled]:
    "border-destructive/30 bg-destructive/10 text-destructive",
};

export function StatusBadge({
  status,
  className,
}: {
  status: AppointmentStatus;
  className?: string;
}) {
  const { t } = useLanguage();
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wider",
        statusStyles[status],
        className,
      )}
    >
      {t.status[status]}
    </Badge>
  );
}
