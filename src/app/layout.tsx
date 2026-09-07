import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "WinOX | Competitive gaming, reimagined",
    template: "%s | WinOX",
  },
  description:
    "Play skill-based competitions, track your performance, and climb the WinOX leaderboard.",
  metadataBase: new URL("https://winox.example"),
  openGraph: {
    title: "WinOX | Competitive gaming, reimagined",
    description:
      "Play skill-based competitions, track your performance, and climb the WinOX leaderboard.",
    type: "website",
    siteName: "WinOX",
  },
};

interface LayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: LayoutProps) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
