"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { activeWorkspace } from "@/lib/workspaces";

const nav = [
  { href: "/", label: "Bossman", icon: "◎", hint: "Call & text" },
  { href: "/workers", label: "AI Workforce", icon: "▦", hint: "Agents" },
  { href: "/evolution", label: "Evolution", icon: "✦", hint: "Learning" },
  { href: "/intelligence", label: "Intelligence", icon: "◈", hint: "Models" },
  { href: "/approvals", label: "Approvals", icon: "✓", hint: "Needs you" },
  { href: "/memory", label: "Memory", icon: "❒", hint: "Conversations" },
  { href: "/playbooks", label: "Playbooks", icon: "❡", hint: "Guardrails" },
  { href: "/audit", label: "Audit Trail", icon: "≡", hint: "What got done" },
  { href: "/settings", label: "Settings", icon: "⚙", hint: "Integrations" },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-white/8 bg-ink-950/80 px-4 py-6 md:flex">
      <Link href="/" className="mb-8 flex items-center gap-3 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brass-500/15 text-lg font-black text-brass-400 ring-1 ring-brass-500/30">
          B
        </div>
        <div>
          <div className="text-sm font-bold tracking-tight text-white">Bossman</div>
          <div className="text-[11px] text-white/40">The operator you can call</div>
        </div>
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {nav.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                active
                  ? "bg-white/8 text-white ring-1 ring-white/10"
                  : "text-white/55 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span
                className={`text-base ${active ? "text-brass-400" : "text-white/40 group-hover:text-white/70"}`}
              >
                {item.icon}
              </span>
              <span className="flex-1 font-medium">{item.label}</span>
              <span className="text-[10px] uppercase tracking-wide text-white/25">
                {item.hint}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 rounded-xl border border-white/8 bg-ink-900/60 p-3">
        <div className="flex items-center justify-between">
          <div className="text-[11px] uppercase tracking-wide text-white/40">Workspace</div>
          <span className="text-[10px] text-brass-400/80">switch ▾</span>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-base">{activeWorkspace.emoji}</span>
          <div>
            <div className="text-sm font-semibold leading-tight text-white">
              {activeWorkspace.name}
            </div>
            <div className="text-xs text-white/45">{activeWorkspace.kind}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
