import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "katex/dist/katex.min.css";
import AppShell from "@/components/layout/AppShell";
import { Providers } from "@/app/providers";

const fontSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: {
    default: "Bank Digital Twin — Quantitative Risk & Stress Intelligence Platform",
    template: "%s | Bank Digital Twin",
  },
  description:
    "Enterprise synthetic financial simulation platform executing vectorized Vasicek Monte Carlo stress tests, IsolationForest ML fraud detection, and real-time Basel III/IV capital adequacy modeling.",
  keywords: [
    "Bank Digital Twin",
    "Quantitative Risk Modeling",
    "Monte Carlo Simulation",
    "Basel III Capital Adequacy",
    "Vasicek Model",
    "IsolationForest Anomaly Detection",
    "Financial Stress Testing",
    "Predictive Forecasting",
    "FastAPI",
    "Next.js",
  ],
  authors: [{ name: "Quantitative Risk & Platform Engineering Team" }],
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://bankdigitaltwin.com",
    siteName: "Bank Digital Twin",
    title: "Bank Digital Twin — Quantitative Risk & Stress Intelligence Engine",
    description:
      "Enterprise synthetic financial simulation platform executing vectorized Vasicek Monte Carlo stress tests, IsolationForest ML fraud detection, and real-time Basel III/IV capital adequacy modeling.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bank Digital Twin — Quantitative Financial Simulation",
    description: "Enterprise synthetic bank stress testing and ML risk engine.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${fontSans.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-slate-950 text-slate-100 antialiased font-sans min-h-screen relative overflow-x-hidden">
        {/* Background Ambient Digital Video Stream */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="fixed inset-0 w-full h-full object-cover opacity-10 pointer-events-none z-0 mix-blend-overlay"
        >
          <source
            src="https://assets.mixkit.co/videos/preview/mixkit-digital-animation-of-screens-and-data-40893-large.mp4"
            type="video/mp4"
          />
        </video>

        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}