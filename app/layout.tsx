import type { Metadata } from "next";
import { Suspense } from "react";
import { TopLoader } from "@/components/ui/top-loader";
import { ThemeProvider, ThemeScript } from "@/components/theme/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Care Follow-up Agent",
  description: "A safe, stateful healthcare follow-up assistant.",
  icons: {
    icon: "/careflowlogo.png",
    apple: "/careflowlogo.png",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body>
        <ThemeProvider>
          <Suspense fallback={null}>
            <TopLoader />
          </Suspense>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
