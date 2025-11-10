import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/components/auth-provider"
import { FirebaseErrorBoundary } from "@/components/firebase-error-boundary"
import { QueryProvider } from "@/lib/providers/query-provider"
import { RealTimeSyncProvider } from "@/components/providers/real-time-sync-provider"
import { AccessibilityProvider } from "@/components/accessibility/accessibility-provider"
import { LanguageProvider } from "@/components/providers/language-provider"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { Suspense } from "react"
import "./globals.css"
import "../styles/accessibility.css"

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://neuranovaa.vercel.app'),
  title: {
    default: "NeuraNovaa - Rural Healthcare Platform",
    template: "%s | NeuraNovaa"
  },
  description: "Connecting rural communities with quality healthcare through telemedicine, blockchain verification, and AI-powered diagnostics",
  keywords: ["healthcare", "telemedicine", "rural health", "blockchain", "AI diagnostics", "medical platform", "healthcare access", "remote healthcare"],
  authors: [{ name: "NeuraNovaa Team" }],
  creator: "NeuraNovaa",
  publisher: "NeuraNovaa",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "NeuraNovaa - Rural Healthcare Platform",
    description: "Connecting rural communities with quality healthcare through telemedicine, blockchain verification, and AI-powered diagnostics",
    siteName: "NeuraNovaa",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "NeuraNovaa Healthcare Platform"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "NeuraNovaa - Rural Healthcare Platform",
    description: "Connecting rural communities with quality healthcare through telemedicine, blockchain verification, and AI-powered diagnostics",
    images: ["/og-image.png"],
    creator: "@neuranovaa"
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" }
    ]
  },
  manifest: "/manifest.json",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <ThemeProvider>
          <LanguageProvider>
            <QueryProvider>
              <FirebaseErrorBoundary>
                <AccessibilityProvider>
                  <Suspense fallback={null}>
                    <AuthProvider>
                      <RealTimeSyncProvider
                        enableAutoInit={true}
                        showNetworkToasts={true}
                        showConflictToasts={true}
                      >
                        {children}
                      </RealTimeSyncProvider>
                    </AuthProvider>
                  </Suspense>
                </AccessibilityProvider>
              </FirebaseErrorBoundary>
            </QueryProvider>
          </LanguageProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
