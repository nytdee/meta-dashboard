import type { ReactNode } from "react";
import { isImprovement } from "@/lib/format";

export function cn(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(" ");
}

export function Section({
  title,
  subtitle,
  right,
  children,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="mt-8">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 className="label-mono text-fg">{title}</h2>
          {subtitle ? (
            <span className="text-xs text-muted">{subtitle}</span>
          ) : null}
        </div>
        {right}
      </div>
      <div className="mb-4 h-px bg-line" />
      {children}
    </section>
  );
}

export function DeltaBadge({
  change,
  invert = false,
}: {
  change: number | null;
  invert?: boolean;
}) {
  if (change === null || Number.isNaN(change)) return null;
  const good = isImprovement(change, invert);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 font-mono text-[10px] font-bold",
        good ? "bg-good/10 text-good" : "bg-bad/10 text-bad",
      )}
    >
      {change > 0 ? "↑" : "↓"}
      {Math.abs(change).toFixed(0)}%
    </span>
  );
}

const pillStyles = {
  good: "border-good/30 bg-good/10 text-good",
  warn: "border-warn/30 bg-warn/10 text-warn",
  bad: "border-bad/30 bg-bad/10 text-bad",
} as const;

export function HealthPill({
  level,
  message,
}: {
  level: keyof typeof pillStyles;
  message: string;
}) {
  return (
    <span
      title={message}
      className={cn(
        "inline-flex max-w-[520px] items-center gap-2 truncate rounded-full border px-3 py-1 text-xs font-medium",
        pillStyles[level],
      )}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
      <span className="truncate">{message}</span>
    </span>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="panel px-4 py-6 text-center text-sm text-muted">
      {children}
    </div>
  );
}
