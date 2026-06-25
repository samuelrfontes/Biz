import { ReactNode } from "react";
import { RiskLevel } from "@/lib/types";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/8 bg-ink-900/70 bg-grain shadow-lift backdrop-blur-sm ${className}`}
    >
      {children}
    </div>
  );
}

export function SectionTitle({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-white">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-white/50">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

const riskStyles: Record<RiskLevel, string> = {
  low: "bg-signal-green/10 text-signal-green ring-signal-green/30",
  medium: "bg-signal-amber/10 text-signal-amber ring-signal-amber/30",
  high: "bg-signal-red/10 text-signal-red ring-signal-red/30",
};

export function RiskBadge({ risk }: { risk: RiskLevel }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide ring-1 ${riskStyles[risk]}`}
    >
      {risk} risk
    </span>
  );
}

export function Pill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "good" | "warn" | "bad" | "brass";
}) {
  const tones = {
    neutral: "bg-white/5 text-white/70 ring-white/10",
    good: "bg-signal-green/10 text-signal-green ring-signal-green/30",
    warn: "bg-signal-amber/10 text-signal-amber ring-signal-amber/30",
    bad: "bg-signal-red/10 text-signal-red ring-signal-red/30",
    brass: "bg-brass-500/10 text-brass-400 ring-brass-500/30",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function StatusDot({
  status,
}: {
  status: "idle" | "working" | "needs_input";
}) {
  const map = {
    idle: "bg-white/30",
    working: "bg-signal-green animate-pulse-dot",
    needs_input: "bg-signal-amber animate-pulse-dot",
  };
  return <span className={`inline-block h-2 w-2 rounded-full ${map[status]}`} />;
}

export function money(n: number) {
  const sign = n < 0 ? "-" : "";
  return `${sign}$${Math.abs(n).toLocaleString()}`;
}
