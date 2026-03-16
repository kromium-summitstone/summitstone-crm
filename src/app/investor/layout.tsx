import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'SummitStone — Investor Portal',
  description: 'SummitStone Developments — Confidential Investor Reporting Portal',
}

export default function InvestorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
