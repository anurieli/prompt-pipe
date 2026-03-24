import type { Metadata } from 'next'
import { DM_Serif_Display, Outfit, JetBrains_Mono } from 'next/font/google'
import { ConvexClientProvider } from '@/components/providers/convex-client-provider'
import { AppShell } from '@/components/layout/app-shell'
import './globals.css'

const dmSerifDisplay = DM_Serif_Display({
  variable: '--font-display',
  subsets: ['latin'],
  weight: '400',
})

const outfit = Outfit({
  variable: '--font-body',
  subsets: ['latin'],
})

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'PromptPipe',
  description: 'Prompt lifecycle manager and pipeline orchestration',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${dmSerifDisplay.variable} ${outfit.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <ConvexClientProvider>
          <AppShell>{children}</AppShell>
        </ConvexClientProvider>
      </body>
    </html>
  )
}
