import type React from "react"
import type { Metadata } from "next"
import { Outfit } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { SessionProvider } from "@/components/providers/session-provider"
import { Toaster } from "sonner"
import { Toaster as ShadcnToaster } from "@/components/ui/toaster"
import { OfflineIndicator } from "@/components/offline-indicator"
import { OfflineInit } from "@/lib/offline/init"

const outfit = Outfit({ 
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-outfit"
})

export const metadata: Metadata = {
  title: "DropDrive - Modern File Manager",
  description: "A beautiful, modern file manager interface with authentication"
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={outfit.className}>
        <SessionProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <OfflineInit />
            {children}
            <Toaster position="top-right" richColors />
            <ShadcnToaster />
            <OfflineIndicator />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
