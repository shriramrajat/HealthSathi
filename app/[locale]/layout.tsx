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
import { notFound } from "next/navigation"
import { locales } from "@/i18n"
import "../globals.css"
import "../../styles/accessibility.css"
import "../../styles/rtl.css"

export const metadata: Metadata = {
  title: "Rural Health Portal",
  description: "Connecting rural communities with quality healthcare",
  generator: "v0.app",
}

interface LocaleLayoutProps {
  children: React.ReactNode
  params: { locale: string }
}

export default async function LocaleLayout({
  children,
  params: { locale }
}: LocaleLayoutProps) {
  // Validate that the incoming locale parameter is valid
  if (!locales.includes(locale as any)) {
    notFound()
  }

  // Load messages for the current locale
  let messages
  try {
    messages = (await import(`@/messages/${locale}.json`)).default
  } catch (error) {
    console.error(`Failed to load messages for locale: ${locale}`, error)
    notFound()
  }

  // Get text direction for the locale
  const direction = locale === 'ar' || locale === 'he' || locale === 'fa' || locale === 'ur' ? 'rtl' : 'ltr'

  return (
    <html lang={locale} dir={direction}>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <QueryProvider>
          <FirebaseErrorBoundary>
            <AccessibilityProvider>
              <Suspense fallback={null}>
                <AuthProvider>
                  <LanguageProvider messages={messages} locale={locale}>
                    <RealTimeSyncProvider
                      enableAutoInit={true}
                      showNetworkToasts={true}
                      showConflictToasts={true}
                    >
                      {children}
                    </RealTimeSyncProvider>
                  </LanguageProvider>
                </AuthProvider>
              </Suspense>
            </AccessibilityProvider>
          </FirebaseErrorBoundary>
        </QueryProvider>
        <Analytics />
      </body>
    </html>
  )
}

// Generate static params for all supported locales
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}