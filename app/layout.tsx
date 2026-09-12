import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Care Follow-up Agent",
  description: "A safe, stateful healthcare follow-up assistant.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
