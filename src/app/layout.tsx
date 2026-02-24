import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Orbitron, Rajdhani, Exo_2, Share_Tech_Mono, Audiowide, Chakra_Petch } from "next/font/google";
import { LanguageProvider } from "@/lib/i18n/context";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const orbitron = Orbitron({ variable: "--font-orbitron", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const rajdhani = Rajdhani({ variable: "--font-rajdhani", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const exo2 = Exo_2({ variable: "--font-exo2", subsets: ["latin"] });
const shareTechMono = Share_Tech_Mono({ variable: "--font-share-tech-mono", subsets: ["latin"], weight: "400" });
const audiowide = Audiowide({ variable: "--font-audiowide", subsets: ["latin"], weight: "400" });
const chakraPetch = Chakra_Petch({ variable: "--font-chakra-petch", subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Gundamaxing — Custom Gunpla Builder Showcase Platform",
  description:
    "Gundamaxing is a community platform where Gunpla builders upload, showcase, and share custom Gundam builds.",
  keywords: ["Gundam", "Gunpla", "model kit", "custom build", "Build Passport", "Gundam builder", "Gunpla showcase"],
  metadataBase: new URL("https://www.gundamaxing.com"),
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Gundamaxing",
  },
  openGraph: {
    title: "Gundamaxing — Custom Gunpla Builder Showcase Platform",
    description: "Gundamaxing is a community platform where Gunpla builders upload, showcase, and share custom Gundam builds.",
    siteName: "Gundamaxing",
    type: "website",
    url: "https://www.gundamaxing.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gundamaxing — Custom Gunpla Builder Showcase Platform",
    description: "Gundamaxing is a community platform where Gunpla builders upload, showcase, and share custom Gundam builds.",
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
        className={`${geistSans.variable} ${geistMono.variable} ${orbitron.variable} ${rajdhani.variable} ${exo2.variable} ${shareTechMono.variable} ${audiowide.variable} ${chakraPetch.variable} antialiased bg-background text-foreground min-h-screen`}
      >
        <AuthSessionProvider>
          <LanguageProvider>
            {children}
            <Toaster
              theme="dark"
              toastOptions={{
                style: {
                  background: "var(--gx-surface-elevated)",
                  border: "1px solid hsl(var(--border) / 0.5)",
                  color: "hsl(var(--foreground))",
                },
              }}
            />
          </LanguageProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
