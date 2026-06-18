import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { SmoothScroll } from "@/components/providers/smooth-scroll";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com";

// Production-grade SEO metadata (Open Graph, Twitter, canonical, robots).
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Elite Frontend Starter",
    template: "%s — Elite Frontend Starter",
  },
  description:
    "Next.js + TypeScript + Tailwind + Three.js + Framer Motion + GSAP. Production-ready, accessible, SEO-optimized.",
  keywords: ["Next.js", "Three.js", "WebGL", "Framer Motion", "GSAP", "Tailwind"],
  openGraph: {
    type: "website",
    url: siteUrl,
    title: "Elite Frontend Starter",
    description: "Awwwards-grade frontend stack, ready to ship.",
    siteName: "Elite Frontend Starter",
  },
  twitter: {
    card: "summary_large_image",
    title: "Elite Frontend Starter",
    description: "Awwwards-grade frontend stack, ready to ship.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider>
          <SmoothScroll>{children}</SmoothScroll>
        </ThemeProvider>
      </body>
    </html>
  );
}
