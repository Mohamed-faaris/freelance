import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Nunito_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import { ThemeProvider } from "../context/ThemeContext";
import { ThemeBackground } from "../components/ThemeBackground";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const nunitoSans = Nunito_Sans({
  subsets: ["latin"],
  variable: "--font-nunito-sans",
});

export const metadata: Metadata = {
  title: {
    default: "Argus - Background Verification Platform",
    template: "%s | Argus",
  },
  description:
    "Comprehensive background verification solutions for individuals and businesses. Streamline your identity verification process with multiple verification levels.",
  keywords: [
    "background verification",
    "identity verification",
    "personal verification",
    "business verification",
    "KYC",
    "digital identity",
    "mini verification",
    "lite verification",
    "advanced verification",
  ],
  authors: [{ name: "Argus Technology", url: "https://test.com" }],
  creator: "Argus Technology",
  publisher: "Argus Technology",
  applicationName: "Argus background Verification",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://test.com",
    title: "Argus - background Verification Platform",
    description:
      "Comprehensive background verification solutions for individuals and businesses",
    siteName: "Argus",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Argus background Verification Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Argus - background Verification Platform",
    description:
      "Comprehensive background verification solutions for individuals and businesses",
    creator: "@argustech",
    images: ["/twitter-image.png"],
  },
  metadataBase: new URL("https://test.com"),
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png" }],
    other: [
      {
        rel: "mask-icon",
        url: "/safari-pinned-tab.svg",
      },
    ],
  },
  manifest: "/site.webmanifest",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${nunitoSans.variable} antialiased h-full font-nunito`}
      >
        <AuthProvider>
          <ThemeProvider>
            <ThemeBackground>{children}</ThemeBackground>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
