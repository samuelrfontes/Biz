import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bossman — The AI operator you can call",
  description:
    "Bossman is the human conversation layer for AI work. Call or text it like a real business operator; it plans, picks the best AI model, delegates to a workforce of agents, and gets it done.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
