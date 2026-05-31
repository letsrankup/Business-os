import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Business OS — Ek Platform, Poora Business",
  description:
    "SEO audit, content generation, lead discovery, proposals, CRM — sab kuch ek jagah. Powered by AI.",
  keywords: "AI business, SEO audit, content generation, CRM, lead discovery",
  openGraph: {
    title: "AI Business OS",
    description: "Ek Platform. Poora Business.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
