'use client'

import { useState, useMemo } from 'react'
import { ISLAND_LABELS, CURRENCY_RATES } from '@/lib/utils'
import type { Island } from '@/types'

const ISLANDS: Island[] = ['BRB', 'KYD', 'JAM', 'TTD']

// Island-specific construction cost benchmarks (USD per sqft)
const ISLAND_BENCHMARKS: Record<Island, { low: number; mid: number; high: number; luxury: number; land_sqft: number }> = {
  BRB: { low: 180, mid: 260, high: 380, luxury: 550, land_sqft: 18 },
  KYD: { low: 220, mid: 320, high: 480, luxury: 700, land_sqft: 45 },
  JAM: { low: 120, mid: 185, high: 280, luxury: 420, land_sqft: 8 },
  TTD: { low: 140, mid: 210, high: 310, luxury: 460, land_sqft: 12 },
}

const PROJECT_TYPES = [
  { value: 'residential_villa', label: 'Luxury Villa', multiplier: 1.3 },
  { value: 'residential_gated', label: 'Gated Community / Villas', multiplier: 1.1 },
  { value: 'commercial', label: 'Commercial Office', multiplier: 0.95 },
  { value: 'hospitality', label: 'Resort / Hotel', multiplier: 1.5 },
  { value: 'mixed_use', label: 'Mixed-Use Development', multiplier: 1.15 },
]

const CONTRACT_TYPES = [
  { value: 'fixed', label: 'Fixed Price', feeRange: '0%', overhead: 0 },
  { value: 'cost_plus', label: 'Cost Plus (10–15%)', overhead: 0.12 },
  { value: 'management_fee', label: 'Management Fee (8–15%)', overhead: 0.10 },
  { value: 'joint_venture', label: 'Joint Venture', overhead: 0.08 },
]

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)
}
function fmtPct(n: number) { return `${n.toFixed(1)}%` }
function fmtK(n: number) { return n >= 1000000 ? `$${(n / 1000000).toFixed(2)}M` : `$${(n / 1000).toFixed(0)}K` }

export default function FeasibilityPage() {
  const [island, setIsland] = useState<Island>('BRB')
  const [projectType, setProjectType] = useState('residential_villa')
  const [contractType, setContractType] = useState('fixed')
  const [currency, setCurrency] = useState('USD')

  // Site inputs
  const [landArea, setLandArea] = useState('20000')        // sqft
  const [landCostSqft, setLandCostSqft] = useState('18')   // USD/sqft
  const [gfa, setGfa] = useState('6000')                    // gross floor area sqft
  const [costTier, setCostTier] = useState<'low' | 'mid' | 'high' | 'luxury'>('high')
  const [customRate, setCustomRate] = useState('')           // override build rate

  // Soft costs
  const [architectPct, setArchitectPct] = useState('8')
  const [engineeringPct, setEngineeringPct] = useState('4')
  const [permitsPct, setPermitsPct] = useState('2')
  const [contingencyPct, setContingencyPct] = useState('10')
  const [importDutyPct, setImportDutyPct] = useState('20')  // Caribbean import duty

  // Financing
  const [ltv, setLtv] = useState('65')       // loan-to-value %
  const [interestRate, setInterestRate] = useState('7.5')
  const [loanTermMonths, setLoanTermMonths] = useState('18')
  const [constructionMonths, setConstructionMonths] = useState('18')

  // Revenue
  const [salePricePerSqft, setSalePricePerSqft] = useState('600')
  const [rentalYield, setRentalYield] = useState('6')        // annual gross yield %
  const [occupancyPct, setOccupancyPct] = useState('72')     // for hospitality
  const [agentFeePct, setAgentFeePct] = useState('3')
  const [analysisMode, setAnalysisMode] = useState<'sale' | 'rental'>('sale')

  const benchmarks = ISLAND_BENCHMARKS[island]
  const typeMultiplier = PROJECT_TYPES.find(t => t.value === projectType)?.multiplier ?? 1
  const baseRate = parseFloat(customRate) || benchmarks[costTier]
  const effectiveRate = baseRate * typeMultiplier

  const results = useMemo(() => {
    const landAreaN = parseFloat(landArea) || 0
    const gfaN = parseFloat(gfa) || 0
    const landCostN = parseFloat(landCostSqft) || 0
    const archN = parseFloat(architectPct) / 100
    const engN = parseFloat(engineeringPct) / 100
    const permN = parseFloat(permitsPct) / 100
    const contN = parseFloat(contingencyPct) / 100
    const importN = parseFloat(importDutyPct) / 100
    const ltvN = parseFloat(ltv) / 100
    const rateN = parseFloat(interestRate) / 100
    const monthsN = parseFloat(loanTermMonths) || 18
    const constrMonths = parseFloat(constructionMonths) || 18
    const agentN = parseFloat(agentFeePct) / 100
    const contTypeOverhead = CONTRACT_TYPES.find(c => c.value === contractType)?.overhead ?? 0

    // --- COSTS ---
    const landCost = landAreaN * landCostN
    const hardCostBase = gfaN * effectiveRate
    const importDuty = hardCostBase * importN * 0.45 // ~45% of materials subject to import
    const hardCost = hardCostBase + importDuty
    const softCosts = hardCostBase * (archN + engN + permN)
    const contractorFee = hardCost * contTypeOverhead
    const subtotal = landCost + hardCost + softCosts + contractorFee
    const contingency = subtotal * contN
    const totalDevCost = subtotal + contingency

    // Financing
    const loanAmount = totalDevCost * ltvN
    const equityRequired = totalDevCost - loanAmount
    // Interest during construction (average drawn-down balance = 50% of loan)
    const financingCost = loanAmount * 0.5 * rateN * (monthsN / 12)
    const totalAllIn = totalDevCost + financingCost

    // Cost per sqft
    const costPerSqft = gfaN > 0 ? totalAllIn / gfaN : 0

    // --- REVENUE ---
    const salePriceN = parseFloat(salePricePerSqft) || 0
    const grossSaleValue = gfaN * salePriceN
    const agentFee = grossSaleValue * agentN
    const netSaleRevenue = grossSaleValue - agentFee

    const annualRent = grossSaleValue * (parseFloat(rentalYield) / 100)
    const occupiedRent = annualRent * (parseFloat(occupancyPct) / 100)
    const netYield = grossSaleValue > 0 ? (occupiedRent / totalAllIn) * 100 : 0

    // --- PROFIT METRICS ---
    const grossProfit = analysisMode === 'sale' ? netSaleRevenue - totalAllIn : occupiedRent - (totalAllIn * 0.06)
    const profitOnCost = totalAllIn > 0 ? (grossProfit / totalAllIn) * 100 : 0
    const profitOnGdv = grossSaleValue > 0 ? (grossProfit / grossSaleValue) * 100 : 0

    // Simplified IRR approximation (project-level)
    // Cash out: equity + financing over construction period
    // Cash in: sale proceeds at month = constructionMonths
    const cashOut = equityRequired + financingCost
    const cashIn = analysisMode === 'sale' ? netSaleRevenue - loanAmount : occupiedRent * 5 // 5yr hold
    const simpleROE = cashOut > 0 ? ((cashIn - cashOut) / cashOut) * 100 : 0
    const annualizedROE = constrMonths > 0 ? simpleROE / (constrMonths / 12) : 0

    // Break-even sale price
    const breakEvenPsf = gfaN > 0 ? (totalAllIn + agentFee) / gfaN : 0

    // Convert to selected currency
    const rate = CURRENCY_RATES[currency]?.rate ?? 1
    const cvt = (n: number) => n * rate

    return {
      landCost: cvt(landCost), hardCost: cvt(hardCost), softCosts: cvt(softCosts),
      contractorFee: cvt(contractorFee), contingency: cvt(contingency),
      totalDevCost: cvt(totalDevCost), financingCost: cvt(financingCost),
      loanAmount: cvt(loanAmount), equityRequired: cvt(equityRequired),
      totalAllIn: cvt(totalAllIn), costPerSqft: cvt(costPerSqft),
      grossSaleValue: cvt(grossSaleValue), netSaleRevenue: cvt(netSaleRevenue),
      agentFee: cvt(agentFee), annualRent: cvt(occupiedRent),
      grossProfit: cvt(grossProfit), breakEvenPsf: cvt(breakEvenPsf),
      importDuty: cvt(importDuty),
      profitOnCost, profitOnGdv, simpleROE, annualizedROE, netYield,
      effectiveRate: cvt(effectiveRate),
      isFeasible: profitOnCost >= 15,
    }
  }, [island, projectType, contractType, landArea, landCostSqft, gfa, effectiveRate,
    architectPct, engineeringPct, permitsPct, contingencyPct, importDutyPct,
    ltv, interestRate, loanTermMonths, constructionMonths,
    salePricePerSqft, rentalYield, occupancyPct, agentFeePct, analysisMode, currency])

  const currencyLabel = currency === 'USD' ? '$' : currency + ' '
  const fmtCurr = (n: number) => {
    if (currency === 'USD') return fmt(n)
    return `${currency} ${Math.round(n).toLocaleString()}`
  }

  const inputStyle = { background: 'var(--surface-2)', border: '1px solid var(--border-mid)', color: 'var(--cream)', padding: '6px 10px', fontSize: '12px', fontFamily: 'var(--font-space-mono)', width: '100%' }
  const selectStyle = { ...inputStyle, cursor: 'pointer' }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-bebas)', fontSize: '11px', letterSpacing: '3px', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '4px' }}>
            Development Intelligence
          </div>
          <div style={{ fontFamily: 'var(--font-bebas)', fontSize: '36px', color: 'var(--cream)', lineHeight: 1, letterSpacing: '0.04em' }}>
            Feasibility & ROI Engine
          </div>
          <div style={{ fontFamily: 'var(--font-space-mono)', fontSize: '10px', color: 'var(--muted)', marginTop: '4px' }}>
            Caribbean-calibrated cost benchmarks · Multi-currency · Real-time appraisal
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Currency</span>
          <select style={{ ...selectStyle, width: 'auto' }} value={currency} onChange={e => setCurrency(e.target.value)}>
            {Object.values(CURRENCY_RATES).map(c => <option key={c.code} value={c.code}>{c.code} — {c.name}</option>)}
          </select>
        </div>
      </div>

      {/* Feasibility Banner */}
      <div style={{
        padding: '12px 18px', marginBottom: '20px',
        background: results.isFeasible ? 'rgba(46,204,138,0.08)' : 'rgba(255,77,77,0.08)',
        border: `1px solid ${results.isFeasible ? 'rgba(46,204,138,0.3)' : 'rgba(255,77,77,0.3)'}`,
        display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '10px', height: '10px', borderRadius: '50%',
            background: results.isFeasible ? 'var(--green)' : 'var(--red)',
            boxShadow: `0 0 8px ${results.isFeasible ? 'var(--green)' : 'var(--red)'}`,
          }} />
          <span style={{ fontFamily: 'var(--font-bebas)', fontSize: '20px', color: results.isFeasible ? 'var(--green)' : 'var(--red)', letterSpacing: '0.06em' }}>
            {results.isFeasible ? 'FEASIBLE' : 'REVIEW REQUIRED'}
          </span>
        </div>
        {[
          ['Profit on Cost', fmtPct(results.profitOnCost), results.profitOnCost >= 20 ? 'var(--green)' : results.profitOnCost >= 15 ? 'var(--amber)' : 'var(--red)'],
          ['Profit on GDV', fmtPct(results.profitOnGdv), results.profitOnGdv >= 15 ? 'var(--green)' : 'var(--amber)'],
          ['Annualised ROE', fmtPct(results.annualizedROE), results.annualizedROE >= 20 ? 'var(--green)' : 'var(--amber)'],
          ['Total All-In', fmtCurr(results.totalAllIn), 'var(--cream)'],
          ['Break-Even PSF', fmtCurr(results.breakEvenPsf), 'var(--muted-2)'],
        ].map(([label, value, color]) => (
          <div key={label as string} style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-space-mono)', fontSize: '8px', color: 'var(--muted)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{label}</div>
            <div style={{ fontFamily: 'var(--font-bebas)', fontSize: '20px', color: color as string, letterSpacing: '0.04em', marginTop: '2px' }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '12px' }} className="grid-responsive-flip">

        {/* ── LEFT: Inputs ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Project Configuration */}
          <div className="panel">
            <div className="panel-header"><div className="panel-title">PROJECT CONFIGURATION</div></div>
            <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label className="form-label">Island Market</label>
                <select style={selectStyle} value={island} onChange={e => { setIsland(e.target.value as Island); setLandCostSqft(ISLAND_BENCHMARKS[e.target.value as Island].land_sqft.toString()) }}>
                  {ISLANDS.map(i => <option key={i} value={i}>{ISLAND_LABELS[i]}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Project Type</label>
                <select style={selectStyle} value={projectType} onChange={e => setProjectType(e.target.value)}>
                  {PROJECT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Contract Structure</label>
                <select style={selectStyle} value={contractType} onChange={e => setContractType(e.target.value)}>
                  {CONTRACT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="form-label">Land Area (sqft)</label>
                  <input style={inputStyle} type="number" value={landArea} onChange={e => setLandArea(e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Land Cost ($/sqft)</label>
                  <input style={inputStyle} type="number" value={landCostSqft} onChange={e => setLandCostSqft(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="form-label">Gross Floor Area (sqft)</label>
                <input style={inputStyle} type="number" value={gfa} onChange={e => setGfa(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Build Cost */}
          <div className="panel">
            <div className="panel-header"><div className="panel-title">BUILD COST BENCHMARKS</div><div style={{ fontFamily: 'var(--font-space-mono)', fontSize: '8px', color: 'var(--accent)' }}>{ISLAND_LABELS[island]}</div></div>
            <div className="panel-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '6px', marginBottom: '12px' }}>
                {(['low', 'mid', 'high', 'luxury'] as const).map(tier => (
                  <button key={tier} onClick={() => setCostTier(tier)} style={{
                    padding: '8px 4px', background: costTier === tier ? 'var(--accent-dim)' : 'var(--surface-2)',
                    border: `1px solid ${costTier === tier ? 'var(--accent-line)' : 'var(--border)'}`,
                    cursor: 'pointer', textAlign: 'center',
                  }}>
                    <div style={{ fontFamily: 'var(--font-space-mono)', fontSize: '7px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{tier}</div>
                    <div style={{ fontFamily: 'var(--font-bebas)', fontSize: '16px', color: costTier === tier ? 'var(--accent)' : 'var(--cream)', marginTop: '2px' }}>${benchmarks[tier]}</div>
                    <div style={{ fontFamily: 'var(--font-space-mono)', fontSize: '7px', color: 'var(--muted)' }}>per sqft</div>
                  </button>
                ))}
              </div>
              <div>
                <label className="form-label">Custom Build Rate ($/sqft) — overrides benchmark</label>
                <input style={inputStyle} type="number" value={customRate} onChange={e => setCustomRate(e.target.value)} placeholder={`Benchmark: $${benchmarks[costTier]}`} />
              </div>
              <div style={{ marginTop: '8px', padding: '8px', background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                <div style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px', color: 'var(--muted)', marginBottom: '4px' }}>EFFECTIVE RATE (with type multiplier ×{PROJECT_TYPES.find(t => t.value === projectType)?.multiplier})</div>
                <div style={{ fontFamily: 'var(--font-bebas)', fontSize: '22px', color: 'var(--amber)' }}>${results.effectiveRate.toFixed(0)} / sqft</div>
              </div>
            </div>
          </div>

          {/* Soft Costs */}
          <div className="panel">
            <div className="panel-header"><div className="panel-title">SOFT COSTS & DUTIES</div></div>
            <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                ['Architect & Design (%)', architectPct, setArchitectPct],
                ['Structural / MEP Engineering (%)', engineeringPct, setEngineeringPct],
                ['Permits & Fees (%)', permitsPct, setPermitsPct],
                ['Caribbean Import Duty (%)', importDutyPct, setImportDutyPct],
                ['Contingency (%)', contingencyPct, setContingencyPct],
              ].map(([label, val, setter]) => (
                <div key={label as string} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <label style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px', color: 'var(--muted)', flex: 1, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</label>
                  <input style={{ ...inputStyle, width: '70px' }} type="number" step="0.5" value={val as string} onChange={e => (setter as any)(e.target.value)} />
                </div>
              ))}
            </div>
          </div>

          {/* Financing */}
          <div className="panel">
            <div className="panel-header"><div className="panel-title">FINANCING STRUCTURE</div></div>
            <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                ['Loan-to-Value (%)', ltv, setLtv],
                ['Interest Rate (% p.a.)', interestRate, setInterestRate],
                ['Loan Term (months)', loanTermMonths, setLoanTermMonths],
                ['Construction Period (months)', constructionMonths, setConstructionMonths],
              ].map(([label, val, setter]) => (
                <div key={label as string} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <label style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px', color: 'var(--muted)', flex: 1, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</label>
                  <input style={{ ...inputStyle, width: '70px' }} type="number" step="0.5" value={val as string} onChange={e => (setter as any)(e.target.value)} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Results ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Revenue Mode Toggle */}
          <div className="panel">
            <div className="panel-header">
              <div><div className="panel-title">REVENUE ANALYSIS</div><div className="panel-sub">Switch between exit strategies</div></div>
              <div style={{ display: 'flex', gap: '4px' }}>
                {(['sale', 'rental'] as const).map(mode => (
                  <button key={mode} onClick={() => setAnalysisMode(mode)} style={{
                    padding: '4px 12px', background: analysisMode === mode ? 'var(--accent)' : 'var(--surface-2)',
                    border: `1px solid ${analysisMode === mode ? 'var(--accent)' : 'var(--border)'}`,
                    color: analysisMode === mode ? '#fff' : 'var(--muted-2)',
                    fontFamily: 'var(--font-space-mono)', fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer',
                  }}>{mode === 'sale' ? 'Sale Exit' : 'Rental Hold'}</button>
                ))}
              </div>
            </div>
            <div className="panel-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label">Sale Price ($/sqft)</label>
                  <input style={inputStyle} type="number" value={salePricePerSqft} onChange={e => setSalePricePerSqft(e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Agent / Legal Fee (%)</label>
                  <input style={inputStyle} type="number" step="0.5" value={agentFeePct} onChange={e => setAgentFeePct(e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Rental Yield (% of GDV)</label>
                  <input style={inputStyle} type="number" step="0.5" value={rentalYield} onChange={e => setRentalYield(e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Occupancy / Let Rate (%)</label>
                  <input style={inputStyle} type="number" step="1" value={occupancyPct} onChange={e => setOccupancyPct(e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          {/* Cost Breakdown */}
          <div className="panel">
            <div className="panel-header"><div className="panel-title">DEVELOPMENT COST BREAKDOWN</div><div style={{ fontFamily: 'var(--font-space-mono)', fontSize: '8px', color: 'var(--muted)' }}>All values in {currency}</div></div>
            <div className="panel-body">
              {[
                { label: 'Land Acquisition', value: results.landCost, pct: results.totalAllIn > 0 ? (results.landCost / results.totalAllIn) * 100 : 0, color: 'var(--accent)' },
                { label: 'Hard Construction Cost', value: results.hardCost, pct: results.totalAllIn > 0 ? (results.hardCost / results.totalAllIn) * 100 : 0, color: 'var(--green)' },
                { label: '  → incl. Import Duty', value: results.importDuty, pct: 0, color: 'var(--muted)', sub: true },
                { label: 'Soft Costs (Arch/Eng/Permits)', value: results.softCosts, pct: results.totalAllIn > 0 ? (results.softCosts / results.totalAllIn) * 100 : 0, color: 'var(--amber)' },
                { label: 'Contractor Fee / Overhead', value: results.contractorFee, pct: results.totalAllIn > 0 ? (results.contractorFee / results.totalAllIn) * 100 : 0, color: 'var(--amber)' },
                { label: 'Contingency', value: results.contingency, pct: results.totalAllIn > 0 ? (results.contingency / results.totalAllIn) * 100 : 0, color: 'var(--red)' },
                { label: 'Finance / Interest Cost', value: results.financingCost, pct: results.totalAllIn > 0 ? (results.financingCost / results.totalAllIn) * 100 : 0, color: 'var(--red)' },
              ].map((row, i) => (
                <div key={i} style={{ padding: `${row.sub ? '2px 0 2px 16px' : '8px 0'}`, borderBottom: row.sub ? 'none' : '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: row.sub ? 0 : '4px' }}>
                    <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: row.sub ? '8px' : '10px', color: row.sub ? 'var(--muted)' : 'var(--muted-2)', letterSpacing: '0.06em' }}>{row.label}</span>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      {!row.sub && row.pct > 0 && <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px', color: 'var(--muted)' }}>{row.pct.toFixed(1)}%</span>}
                      <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: row.sub ? '9px' : '11px', color: row.color }}>{fmtCurr(row.value)}</span>
                    </div>
                  </div>
                  {!row.sub && row.pct > 0 && (
                    <div style={{ height: '3px', background: 'var(--surface-3)', borderRadius: '2px' }}>
                      <div style={{ width: `${Math.min(100, row.pct)}%`, height: '100%', background: row.color, borderRadius: '2px', transition: 'width 0.4s' }} />
                    </div>
                  )}
                </div>
              ))}
              <div style={{ marginTop: '12px', padding: '12px', background: 'var(--surface-2)', border: '1px solid var(--border-mid)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-space-mono)', fontSize: '8px', color: 'var(--muted)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Total All-In Cost</div>
                  <div style={{ fontFamily: 'var(--font-bebas)', fontSize: '32px', color: 'var(--cream)', lineHeight: 1 }}>{fmtCurr(results.totalAllIn)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-space-mono)', fontSize: '8px', color: 'var(--muted)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Cost Per Sqft</div>
                  <div style={{ fontFamily: 'var(--font-bebas)', fontSize: '28px', color: 'var(--accent)', lineHeight: 1 }}>{fmtCurr(results.costPerSqft)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Returns & Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }} className="grid-responsive">
            {/* Financing Stack */}
            <div className="panel">
              <div className="panel-header"><div className="panel-title">FINANCING STACK</div></div>
              <div className="panel-body">
                {[
                  ['Total Development Cost', fmtCurr(results.totalDevCost), 'var(--cream)'],
                  ['Debt (Loan)', fmtCurr(results.loanAmount), 'var(--accent)'],
                  ['Equity Required', fmtCurr(results.equityRequired), 'var(--amber)'],
                  ['Interest During Construction', fmtCurr(results.financingCost), 'var(--red)'],
                  ['Total Capital Deployed', fmtCurr(results.totalAllIn), 'var(--cream)'],
                ].map(([label, value, color]) => (
                  <div key={label as string} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px', color: 'var(--muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</span>
                    <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '11px', color: color as string }}>{value}</span>
                  </div>
                ))}
                {/* LTV bar */}
                <div style={{ marginTop: '10px' }}>
                  <div style={{ fontFamily: 'var(--font-space-mono)', fontSize: '8px', color: 'var(--muted)', marginBottom: '4px' }}>DEBT vs EQUITY SPLIT</div>
                  <div style={{ height: '8px', background: 'var(--surface-3)', borderRadius: '2px', overflow: 'hidden', display: 'flex' }}>
                    <div style={{ width: `${ltv}%`, background: 'var(--accent)', transition: 'width 0.4s' }} />
                    <div style={{ flex: 1, background: 'var(--amber)' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3px' }}>
                    <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '8px', color: 'var(--accent)' }}>Debt {ltv}%</span>
                    <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '8px', color: 'var(--amber)' }}>Equity {100 - parseInt(ltv)}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Returns */}
            <div className="panel">
              <div className="panel-header">
                <div><div className="panel-title">RETURNS ANALYSIS</div><div className="panel-sub">{analysisMode === 'sale' ? 'Sale exit' : 'Rental hold'}</div></div>
              </div>
              <div className="panel-body">
                {analysisMode === 'sale' ? (
                  <>
                    {[
                      ['Gross Development Value (GDV)', fmtCurr(results.grossSaleValue), 'var(--green)'],
                      ['Agent / Legal Fee', `(${fmtCurr(results.agentFee)})`, 'var(--red)'],
                      ['Net Sale Revenue', fmtCurr(results.netSaleRevenue), 'var(--green)'],
                      ['Total All-In Cost', `(${fmtCurr(results.totalAllIn)})`, 'var(--red)'],
                      ['Gross Profit', fmtCurr(results.grossProfit), results.grossProfit >= 0 ? 'var(--green)' : 'var(--red)'],
                    ].map(([label, value, color]) => (
                      <div key={label as string} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                        <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px', color: 'var(--muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</span>
                        <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '11px', color: color as string }}>{value}</span>
                      </div>
                    ))}
                  </>
                ) : (
                  <>
                    {[
                      ['Gross Development Value', fmtCurr(results.grossSaleValue), 'var(--muted-2)'],
                      ['Gross Annual Rental Income', fmtCurr(results.annualRent), 'var(--green)'],
                      ['Net Yield on Cost', fmtPct(results.netYield), results.netYield >= 7 ? 'var(--green)' : 'var(--amber)'],
                    ].map(([label, value, color]) => (
                      <div key={label as string} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                        <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px', color: 'var(--muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</span>
                        <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '11px', color: color as string }}>{value}</span>
                      </div>
                    ))}
                  </>
                )}

                {/* KPI grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '8px', marginTop: '12px' }}>
                  {[
                    ['Profit on Cost', fmtPct(results.profitOnCost), results.profitOnCost >= 20 ? 'var(--green)' : results.profitOnCost >= 15 ? 'var(--amber)' : 'var(--red)'],
                    ['Profit on GDV', fmtPct(results.profitOnGdv), results.profitOnGdv >= 15 ? 'var(--green)' : 'var(--amber)'],
                    ['Equity ROE', fmtPct(results.simpleROE), results.simpleROE >= 25 ? 'var(--green)' : 'var(--amber)'],
                    ['Annualised ROE', fmtPct(results.annualizedROE), results.annualizedROE >= 20 ? 'var(--green)' : 'var(--amber)'],
                  ].map(([label, value, color]) => (
                    <div key={label as string} style={{ padding: '8px', background: 'var(--surface-2)', border: '1px solid var(--border)', textAlign: 'center' }}>
                      <div style={{ fontFamily: 'var(--font-space-mono)', fontSize: '7px', color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</div>
                      <div style={{ fontFamily: 'var(--font-bebas)', fontSize: '24px', color: color as string, lineHeight: 1, marginTop: '3px' }}>{value}</div>
                    </div>
                  ))}
                </div>

                {/* Break-even */}
                <div style={{ marginTop: '10px', padding: '10px', background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                  <div style={{ fontFamily: 'var(--font-space-mono)', fontSize: '8px', color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>MINIMUM SALE PRICE TO BREAK EVEN</div>
                  <div style={{ fontFamily: 'var(--font-bebas)', fontSize: '26px', color: 'var(--amber)', letterSpacing: '0.04em', marginTop: '2px' }}>
                    {fmtCurr(results.breakEvenPsf)} / sqft
                  </div>
                  {parseFloat(salePricePerSqft) > 0 && (
                    <div style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px', color: parseFloat(salePricePerSqft) > results.breakEvenPsf ? 'var(--green)' : 'var(--red)', marginTop: '3px' }}>
                      {parseFloat(salePricePerSqft) > results.breakEvenPsf
                        ? `✓ Sale price ${fmtPct(((parseFloat(salePricePerSqft) - results.breakEvenPsf) / results.breakEvenPsf) * 100)} above break-even`
                        : `✗ Sale price ${fmtPct(((results.breakEvenPsf - parseFloat(salePricePerSqft)) / results.breakEvenPsf) * 100)} below break-even`}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Island Benchmarks Reference */}
          <div className="panel">
            <div className="panel-header"><div className="panel-title">CARIBBEAN MARKET BENCHMARKS</div><div className="panel-sub">Construction cost reference · USD per sqft</div></div>
            <div className="panel-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '8px' }}>
                {ISLANDS.map(isl => (
                  <div key={isl} onClick={() => { setIsland(isl); setLandCostSqft(ISLAND_BENCHMARKS[isl].land_sqft.toString()) }}
                    style={{ padding: '12px', background: island === isl ? 'var(--accent-dim)' : 'var(--surface-2)', border: `1px solid ${island === isl ? 'var(--accent-line)' : 'var(--border)'}`, cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s' }}>
                    <div style={{ fontFamily: 'var(--font-bebas)', fontSize: '20px', color: island === isl ? 'var(--accent)' : 'var(--cream)' }}>{isl}</div>
                    <div style={{ fontFamily: 'var(--font-space-mono)', fontSize: '7px', color: 'var(--muted)', marginTop: '2px', marginBottom: '8px' }}>{ISLAND_LABELS[isl]}</div>
                    {(['low', 'mid', 'high', 'luxury'] as const).map(tier => (
                      <div key={tier} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                        <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '7px', color: 'var(--muted)', textTransform: 'uppercase' }}>{tier}</span>
                        <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '8px', color: 'var(--muted-2)' }}>${ISLAND_BENCHMARKS[isl][tier]}</span>
                      </div>
                    ))}
                    <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px solid var(--border)' }}>
                      <div style={{ fontFamily: 'var(--font-space-mono)', fontSize: '7px', color: 'var(--muted)' }}>Land est.</div>
                      <div style={{ fontFamily: 'var(--font-space-mono)', fontSize: '8px', color: 'var(--accent)' }}>${ISLAND_BENCHMARKS[isl].land_sqft}/sqft</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media(max-width:1100px){.grid-responsive-flip{grid-template-columns:1fr!important;}}
        @media(max-width:900px){.grid-responsive{grid-template-columns:1fr!important;}}
      `}</style>
    </div>
  )
}
