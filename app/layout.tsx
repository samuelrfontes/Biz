import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "Bossman — The AI operator you can call",
  description:
    "Bossman is the human conversation layer for AI work. Call or text it like a real business operator; it plans, delegates to AI workers, and gets it done.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <div className="mx-auto flex max-w-[1400px]">
          <Sidebar />
          <main className="scroll-thin min-h-screen flex-1 px-5 py-6 md:px-8 md:py-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
