import type { Metadata } from 'next'
import '../globals.css'

export const metadata: Metadata = {
  title: 'SummitStone — Investor Portal',
  description: 'SummitStone Developments — Confidential Investor Reporting Portal',
}

export default function InvestorLayout({ children }: { children: React.ReactNode }) {
  return children
}
