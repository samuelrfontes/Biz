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
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-white/[0.07] bg-ink-950/70 px-4 py-6 backdrop-blur-xl md:flex">
      <Link href="/" className="mb-8 flex items-center gap-3 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-b from-brass-400 to-brass-600 text-lg font-black text-ink-950 shadow-md">
          B
        </div>
        <div>
          <div className="text-[15px] font-semibold tracking-tight text-white">Bossman</div>
          <div className="text-[11px] text-white/40">The operator you can call</div>
        </div>
      </Link>

      <nav className="flex flex-1 flex-col gap-0.5">
        {nav.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition ${
                active
                  ? "bg-white/[0.08] text-white shadow-sm ring-1 ring-white/10"
                  : "text-white/55 hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              <span
                className={`text-base ${active ? "text-brass-400" : "text-white/40 group-hover:text-white/70"}`}
              >
                {item.icon}
              </span>
              <span className="flex-1 font-medium">{item.label}</span>
              {active && <span className="h-1.5 w-1.5 rounded-full bg-brass-400" />}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 rounded-xl border border-white/8 bg-ink-900/60 p-3">
        <div className="flex items-center justify-between">
          <div className="text-[11px] uppercase tracking-wide text-white/40">Workspace</div>
          <Link href="/onboarding" className="text-[10px] text-brass-400/80 hover:text-brass-400">
            + new
          </Link>
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
