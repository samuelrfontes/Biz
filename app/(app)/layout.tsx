import { Sidebar } from "@/components/Sidebar";

// Layout for the signed-in app (dashboard, workers, approvals, …). The public
// landing page lives at the root and does NOT use this shell.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-[1400px]">
      <Sidebar />
      <main className="scroll-thin min-h-screen flex-1 px-5 py-6 md:px-8 md:py-8">
        {children}
      </main>
    </div>
  );
}
