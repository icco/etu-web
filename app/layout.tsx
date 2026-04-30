import type { Metadata } from "next"
import { Toaster } from "sonner"
import { Footer } from "@icco/react-common/Footer"
import { ThemeProvider } from "@icco/react-common/ThemeProvider"
import { WebVitals } from "@icco/react-common/WebVitals"
import "./globals.css"

export const metadata: Metadata = {
  title: "Etu - The Best Note-Taking App for Capturing Ideas",
  description: "The simplest, most powerful note-taking app. Capture fleeting ideas as blips and let them resurface when you need them. Turn scattered thoughts into finished work.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&family=Roboto+Mono:wght@400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col bg-base-200 antialiased">
        <ThemeProvider>
          <WebVitals analyticsPath="/analytics/etu-web" />
          {children}
          <Footer
            startYear={2026}
            sourceRepo="https://github.com/icco/etu-web"
            showRecurseCenter={false}
            showSocial={false}
            showRecurseRing={false}
            showXXIIVVRing={false}
            showPrivacyPolicy={true}
          />
          <Toaster position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  )
}
