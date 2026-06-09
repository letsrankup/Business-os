import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"]
});

export const metadata: Metadata = {
  title: "LETSRANKUP AI",
  description:
    "Enterprise AI Business OS for SEO, GEO, CRM, Automation and Analytics",
  keywords: [
    "AI",
    "SEO",
    "GEO",
    "CRM",
    "Automation",
    "Analytics"
  ]
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
