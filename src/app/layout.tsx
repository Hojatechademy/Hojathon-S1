import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ShopAgent — Autonomous Local Business Ops Agent",
  description:
    "An agentic AI system that autonomously manages inventory, campaigns, and customer broadcasts for local shopkeepers.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">{children}</div>
      </body>
    </html>
  );
}

