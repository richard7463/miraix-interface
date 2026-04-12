'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronDownIcon } from '@heroicons/react/24/outline'
import EarnDepositFlow from './EarnDepositFlow'
import {
  filterVaultsByRisk,
  formatEarnRate,
  formatEarnUsd,
  parseEarnRiskMode,
  type EarnRiskMode,
  type EarnVaultCard,
} from '@/lib/earn'

interface EarnVaultCardsProps {
  responseData?: {
    success?: boolean
    quote?: {
      vaults?: EarnVaultCard[]
      dataSource?: 'live' | 'fallback'
      usedFallback?: boolean
      fallbackReason?: string
    }
    data?: {
      filters?: {
        riskMode?: EarnRiskMode
      }
      action?: {
        mode?: 'discover' | 'deposit'
        amountInput?: string | null
        selectedVaultId?: string | null
        summary?: string
        rationale?: string[]
      }
    }
  }
}

const riskLabels: Array<{ key: EarnRiskMode; label: string; detail: string }> = [
  { key: 'safe', label: 'Safe', detail: 'Blue-chip stablecoin vaults only' },
  { key: 'balanced', label: 'Balanced', detail: 'Keep safer vaults, drop the spikiest ones' },
  { key: 'degen', label: 'Degen', detail: 'Show every Composer-compatible vault' },
]

export default function EarnVaultCards({ responseData }: EarnVaultCardsProps) {
  const vaults = responseData?.quote?.vaults || []
  const [isExpanded, setIsExpanded] = useState(true)
  const [selectedRisk, setSelectedRisk] = useState<EarnRiskMode>(
    parseEarnRiskMode(responseData?.data?.filters?.riskMode),
  )
  const [selectedVaultId, setSelectedVaultId] = useState<string | null>(
    responseData?.data?.action?.selectedVaultId || vaults[0]?.id || null,
  )
  const actionPlan = responseData?.data?.action

  useEffect(() => {
    setSelectedRisk(parseEarnRiskMode(responseData?.data?.filters?.riskMode))
  }, [responseData?.data?.filters?.riskMode])

  useEffect(() => {
    if (responseData?.data?.action?.selectedVaultId) {
      setSelectedVaultId(responseData.data.action.selectedVaultId)
    }
  }, [responseData?.data?.action?.selectedVaultId])

  useEffect(() => {
    if (vaults.length > 0 && !selectedVaultId) {
      setSelectedVaultId(vaults[0].id)
    }
  }, [vaults, selectedVaultId])

  const filteredVaults = useMemo(() => filterVaultsByRisk(vaults, selectedRisk), [vaults, selectedRisk])

  useEffect(() => {
    if (filteredVaults.length === 0) {
      setSelectedVaultId(null)
      return
    }

    if (!filteredVaults.some((vault) => vault.id === selectedVaultId)) {
      setSelectedVaultId(filteredVaults[0].id)
    }
  }, [filteredVaults, selectedVaultId])

  const selectedVault = filteredVaults.find((vault) => vault.id === selectedVaultId) || null

  if (!vaults.length) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="mt-2 mb-3 w-full max-w-[560px] overflow-hidden rounded-[28px] border border-emerald-400/20 bg-[#121216] text-[#f5f1e8] shadow-2xl"
    >
      <div className="border-b border-white/10 bg-[linear-gradient(135deg,rgba(16,185,129,0.18),rgba(7,7,10,0.94))] px-5 py-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200">
              LI.FI Earn
            </div>
            <h3 className="mt-2 text-lg font-semibold text-[#fff7e6]">
              USDC Vault Discovery
            </h3>
            <p className="mt-1 text-sm text-[#d7d1c4]">
              Composer-ready vaults across Arbitrum, Base, and Ethereum.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded((value) => !value)}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-[#f5f1e8]"
          >
            {isExpanded ? 'Collapse' : 'Expand'}
            <ChevronDownIcon className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      <div className={`transition-all duration-300 ${isExpanded ? 'max-h-[1600px] opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
        <div className="px-5 py-4">
          <div className="flex flex-wrap gap-2">
            {riskLabels.map((risk) => (
              <button
                key={risk.key}
                type="button"
                onClick={() => setSelectedRisk(risk.key)}
                className={`rounded-full border px-3 py-2 text-left transition ${
                  selectedRisk === risk.key
                    ? 'border-emerald-300/60 bg-emerald-400/15 text-emerald-100'
                    : 'border-white/10 bg-white/[0.03] text-[#d7d1c4]'
                }`}
              >
                <div className="text-sm font-medium">{risk.label}</div>
                <div className="text-[11px] text-[#b7af9d]">{risk.detail}</div>
              </button>
            ))}
          </div>

          {responseData?.quote?.usedFallback && (
            <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              Live Earn discovery was unavailable, so these are seeded Composer-compatible vaults.
              {responseData?.quote?.fallbackReason ? ` ${responseData.quote.fallbackReason}` : ''}
            </div>
          )}

          {actionPlan?.mode === 'deposit' && (
            <div className="mt-4 rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-4 text-sm text-emerald-100">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
                Agent Recommendation
              </div>
              {actionPlan.summary && <div className="mt-2 text-[#e0f7e9]">{actionPlan.summary}</div>}
              {actionPlan.rationale && actionPlan.rationale.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {actionPlan.rationale.map((reason) => (
                    <span
                      key={reason}
                      className="rounded-full border border-emerald-300/20 bg-black/20 px-3 py-1 text-xs text-emerald-100"
                    >
                      {reason}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="mt-4 grid gap-3">
            {filteredVaults.map((vault, index) => (
              <motion.button
                key={vault.id}
                type="button"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, delay: index * 0.05 }}
                onClick={() => setSelectedVaultId(vault.id)}
                className={`rounded-[24px] border p-4 text-left transition ${
                  selectedVaultId === vault.id
                    ? 'border-emerald-300/60 bg-emerald-400/10'
                    : 'border-white/10 bg-white/[0.03] hover:border-emerald-300/30 hover:bg-white/[0.05]'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-[#9e9683]">
                      {vault.protocolName} · {vault.chainName}
                    </div>
                    <div className="mt-1 text-base font-semibold text-[#fff7e6]">{vault.name}</div>
                    <div className="mt-1 text-sm text-[#c8c3b5]">
                      Deposit token: {vault.assetSymbol} · Position token: {vault.symbol}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-right">
                    <div className="text-xs uppercase tracking-[0.16em] text-[#9e9683]">APY</div>
                    <div className="mt-1 text-lg font-semibold text-emerald-200">
                      {formatEarnRate(vault.apy)}
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.16em] text-[#9e9683]">30d avg</div>
                    <div className="mt-1 text-sm text-[#fff7e6]">{formatEarnRate(vault.apy30d)}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.16em] text-[#9e9683]">TVL</div>
                    <div className="mt-1 text-sm text-[#fff7e6]">{formatEarnUsd(vault.tvlUsd)}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.16em] text-[#9e9683]">Risk</div>
                    <div className="mt-1 text-sm capitalize text-[#fff7e6]">{vault.risk}</div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {vault.reasons.map((reason) => (
                    <span
                      key={reason}
                      className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-[#d7d1c4]"
                    >
                      {reason}
                    </span>
                  ))}
                </div>
              </motion.button>
            ))}
          </div>

          {selectedVault && <EarnDepositFlow vault={selectedVault} initialAmount={actionPlan?.amountInput} />}
        </div>
      </div>
    </motion.div>
  )
}
