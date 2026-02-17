import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { LanguageProvider } from "@/lib/i18n/context";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Gundamaxing — Showcase Your Build. Earn Your Rank.",
  description:
    "The definitive platform for Gunpla builders. Create Build Passports, showcase custom builds, track your lineage, and earn your rank.",
  keywords: ["Gundam", "Gunpla", "model kit", "custom build", "Build Passport"],
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Gundamaxing",
  },
  openGraph: {
    title: "Gundamaxing — Showcase Your Build. Earn Your Rank.",
    description: "The definitive platform for Gunpla builders.",
    siteName: "Gundamaxing",
    type: "website",
    url: "https://www.gundamaxing.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gundamaxing",
    description: "The definitive platform for Gunpla builders.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground min-h-screen`}
      >
        <LanguageProvider>
          <Navbar />
          <main>{children}</main>
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  );
}
