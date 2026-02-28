import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SummitStone CRM — Construction Operations Platform',
  description: 'Caribbean premium construction management system',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
