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
import { Suspense } from "react"
import "./globals.css"
import "../styles/accessibility.css"

export const metadata: Metadata = {
  title: "Rural Health Portal",
  description: "Connecting rural communities with quality healthcare",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
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
        <Analytics />
      </body>
    </html>
  )
}
