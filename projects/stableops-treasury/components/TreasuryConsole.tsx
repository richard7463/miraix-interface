'use client'

import { useEffect, useMemo, useState } from 'react'
import { createPublicClient, encodeFunctionData, erc20Abi, formatUnits, http } from 'viem'
import { arbitrum, base, mainnet } from 'viem/chains'
import {
  CHAINS,
  CHAIN_BY_ID,
  DEFAULT_POLICY,
  formatRate,
  formatUsd,
  type StableOpsRiskMode,
  type StableOpsVault,
  type TreasuryPlan,
  type TreasuryPolicy,
} from '@/lib/stableops'

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
    }
  }
}

type ComposerQuote = {
  action: {
    fromToken: { address: string; symbol: string; decimals: number }
    toToken: { symbol: string; decimals: number }
    fromAmount: string
  }
  estimate: {
    toAmount?: string
    approvalAddress?: string
  }
  transactionRequest: {
    to: string
    data?: string
    value?: string
    gasLimit?: string
    gas?: string
    gasPrice?: string
    maxFeePerGas?: string
    maxPriorityFeePerGas?: string
  }
}

const publicClients = {
  1: createPublicClient({ chain: mainnet, transport: http() }),
  8453: createPublicClient({ chain: base, transport: http() }),
  42161: createPublicClient({ chain: arbitrum, transport: http() }),
} as const

const riskModes: Array<{ value: StableOpsRiskMode; label: string; detail: string }> = [
  { value: 'conservative', label: 'Conservative', detail: 'Safe vaults only' },
  { value: 'balanced', label: 'Balanced', detail: 'Safe plus measured yield' },
  { value: 'open', label: 'Open', detail: 'Show every executable vault' },
]

function ensureHex(value?: string) {
  if (!value) return '0x'
  return value.startsWith('0x') ? value : `0x${value}`
}

function toRpcQuantity(value?: string | bigint | null) {
  if (typeof value === 'bigint') return `0x${value.toString(16)}`
  if (!value) return undefined
  if (value.startsWith('0x')) return value

  try {
    return `0x${BigInt(value).toString(16)}`
  } catch {
    return undefined
  }
}

function formatWalletError(error: unknown) {
  if (error instanceof Error) return error.message
  if (typeof error === 'object' && error && 'message' in error) {
    return String((error as { message?: unknown }).message)
  }
  return 'Wallet action failed.'
}

export default function TreasuryConsole() {
  const [policy, setPolicy] = useState<TreasuryPolicy>(DEFAULT_POLICY)
  const [plan, setPlan] = useState<TreasuryPlan | null>(null)
  const [selectedVaultId, setSelectedVaultId] = useState<string | null>(null)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [quote, setQuote] = useState<ComposerQuote | null>(null)
  const [approvalHash, setApprovalHash] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [isPlanning, setIsPlanning] = useState(false)
  const [isQuoting, setIsQuoting] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedVault = useMemo(() => {
    if (!plan) return null
    return (
      plan.approvedVaults.find((vault) => vault.id === selectedVaultId) ||
      plan.recommendedVault ||
      null
    )
  }, [plan, selectedVaultId])

  const selectedChain = selectedVault ? CHAIN_BY_ID[selectedVault.chainId] : null
  const explorerBaseUrl = selectedChain?.explorer || null

  useEffect(() => {
    void runPlan(DEFAULT_POLICY)
  }, [])

  useEffect(() => {
    if (plan?.recommendedVault) {
      setSelectedVaultId(plan.recommendedVault.id)
    }
  }, [plan?.recommendedVault?.id])

  const updatePolicy = (patch: Partial<TreasuryPolicy>) => {
    setPolicy((current) => ({ ...current, ...patch }))
    setQuote(null)
    setTxHash(null)
    setApprovalHash(null)
  }

  const toggleChain = (chainId: number) => {
    const exists = policy.allowedChainIds.includes(chainId)
    const next = exists
      ? policy.allowedChainIds.filter((item) => item !== chainId)
      : [...policy.allowedChainIds, chainId]

    updatePolicy({ allowedChainIds: next.length > 0 ? next : [chainId] })
  }

  async function runPlan(inputPolicy = policy) {
    setIsPlanning(true)
    setError(null)
    setQuote(null)
    setTxHash(null)
    setApprovalHash(null)

    try {
      const response = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ policy: inputPolicy }),
      })
      const payload = await response.json()

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || 'Failed to build treasury plan.')
      }

      setPlan(payload.plan)
    } catch (planError) {
      setError(planError instanceof Error ? planError.message : 'Failed to build treasury plan.')
    } finally {
      setIsPlanning(false)
    }
  }

  async function connectWallet() {
    if (!window.ethereum) {
      throw new Error('No EVM wallet found. Open this app in a wallet-enabled browser.')
    }

    const accounts = (await window.ethereum.request({ method: 'eth_requestAccounts' })) as string[]
    const account = accounts?.[0]
    if (!account) {
      throw new Error('Wallet connection did not return an account.')
    }

    setWalletAddress(account)
    return account
  }

  async function switchChain(chainId: number) {
    if (!window.ethereum) throw new Error('No EVM wallet found.')
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${chainId.toString(16)}` }],
    })
  }

  async function sendTransaction(chainId: number, tx: ComposerQuote['transactionRequest']) {
    if (!window.ethereum || !walletAddress) throw new Error('Connect wallet first.')

    const hash = (await window.ethereum.request({
      method: 'eth_sendTransaction',
      params: [
        {
          from: walletAddress,
          to: tx.to,
          data: ensureHex(tx.data),
          value: toRpcQuantity(tx.value) || '0x0',
          ...(toRpcQuantity(tx.gasLimit || tx.gas) ? { gas: toRpcQuantity(tx.gasLimit || tx.gas) } : {}),
          ...(toRpcQuantity(tx.gasPrice) ? { gasPrice: toRpcQuantity(tx.gasPrice) } : {}),
          ...(toRpcQuantity(tx.maxFeePerGas) ? { maxFeePerGas: toRpcQuantity(tx.maxFeePerGas) } : {}),
          ...(toRpcQuantity(tx.maxPriorityFeePerGas)
            ? { maxPriorityFeePerGas: toRpcQuantity(tx.maxPriorityFeePerGas) }
            : {}),
        },
      ],
    })) as `0x${string}`

    await publicClients[chainId as keyof typeof publicClients].waitForTransactionReceipt({ hash })
    return hash
  }

  async function prepareQuote() {
    if (!selectedVault) {
      setError('No policy-approved vault selected.')
      return
    }

    setIsQuoting(true)
    setError(null)
    setQuote(null)

    try {
      const account = walletAddress || (await connectWallet())
      const response = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chainId: selectedVault.chainId,
          vaultAddress: selectedVault.address,
          walletAddress: account,
          fromAmountUsd: plan?.policy.deployAmountUsd || policy.deployAmountUsd,
          fromTokenAddress: selectedVault.assetAddress,
          assetDecimals: selectedVault.assetDecimals,
        }),
      })
      const payload = await response.json()

      if (!response.ok || !payload?.success || !payload?.quote?.transactionRequest) {
        throw new Error(payload?.error || 'Failed to prepare LI.FI Composer quote.')
      }

      setQuote(payload.quote)
    } catch (quoteError) {
      setError(quoteError instanceof Error ? quoteError.message : 'Failed to prepare LI.FI Composer quote.')
    } finally {
      setIsQuoting(false)
    }
  }

  async function executeQuote() {
    if (!quote || !selectedVault || !walletAddress) {
      setError('Prepare a Composer quote first.')
      return
    }

    setIsExecuting(true)
    setError(null)

    try {
      await switchChain(selectedVault.chainId)

      const approvalAddress = quote.estimate.approvalAddress
      const fromTokenAddress = quote.action.fromToken.address
      const fromAmountRaw = quote.action.fromAmount
      const client = publicClients[selectedVault.chainId as keyof typeof publicClients]

      if (approvalAddress && fromTokenAddress) {
        const allowance = (await client.readContract({
          address: fromTokenAddress as `0x${string}`,
          abi: erc20Abi,
          functionName: 'allowance',
          args: [walletAddress as `0x${string}`, approvalAddress as `0x${string}`],
        })) as bigint

        if (allowance < BigInt(fromAmountRaw)) {
          const data = encodeFunctionData({
            abi: erc20Abi,
            functionName: 'approve',
            args: [approvalAddress as `0x${string}`, BigInt(fromAmountRaw)],
          })

          const hash = await sendTransaction(selectedVault.chainId, {
            to: fromTokenAddress,
            data,
            value: '0x0',
          })
          setApprovalHash(hash)
        }
      }

      const hash = await sendTransaction(selectedVault.chainId, quote.transactionRequest)
      setTxHash(hash)
    } catch (executeError) {
      setError(formatWalletError(executeError))
    } finally {
      setIsExecuting(false)
    }
  }

  const estimatedReceipt =
    quote?.estimate?.toAmount && quote.action?.toToken?.decimals != null
      ? Number(formatUnits(BigInt(quote.estimate.toAmount), quote.action.toToken.decimals))
      : null

  return (
    <main className="app-shell">
      <section className="hero">
        <div className="hero-card">
          <div className="eyebrow">StableOps Treasury · LI.FI Earn</div>
          <h1>Agentic treasury execution for stablecoin teams.</h1>
          <p className="hero-copy">
            StableOps turns a team treasury mandate into a governed LI.FI Earn action: discover
            USDC vaults, reject policy violations, prepare a Composer deposit, execute with a
            wallet, then produce a receipt-token report.
          </p>
          <div className="stat-row">
            <div className="stat">
              <div className="stat-label">Policy</div>
              <div className="stat-value">Reserve first</div>
            </div>
            <div className="stat">
              <div className="stat-label">Infra</div>
              <div className="stat-value">LI.FI Earn</div>
            </div>
            <div className="stat">
              <div className="stat-label">Execution</div>
              <div className="stat-value">Composer</div>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="eyebrow">Treasury Mandate</div>
          <h2 className="panel-title">Rules before routing</h2>
          <p className="panel-copy">
            Set treasury constraints first. The app only prepares a Composer transaction after
            reserve, execution cap, chain allowlist, TVL floor, and vault execution checks pass.
          </p>
          <div className="button-row" style={{ marginTop: 18 }}>
            <button className="primary" onClick={() => runPlan()} disabled={isPlanning}>
              {isPlanning ? 'Building plan...' : 'Run StableOps plan'}
            </button>
            <button className="secondary" onClick={prepareQuote} disabled={!selectedVault || isQuoting}>
              {isQuoting ? 'Preparing quote...' : 'Prepare Composer quote'}
            </button>
          </div>
        </div>
      </section>

      <section className="main-grid">
        <div className="panel">
          <div className="eyebrow">Policy Input</div>
          <h2 className="panel-title">Small-team treasury rules</h2>

          <div className="policy-grid">
            <label className="field">
              <span className="field-label">Treasury name</span>
              <input
                value={policy.treasuryName}
                onChange={(event) => updatePolicy({ treasuryName: event.target.value })}
              />
            </label>
            <label className="field">
              <span className="field-label">Treasury size</span>
              <input
                type="number"
                min="1"
                value={policy.treasurySizeUsd}
                onChange={(event) => updatePolicy({ treasurySizeUsd: Number(event.target.value) })}
              />
            </label>
            <label className="field">
              <span className="field-label">Deploy amount</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={policy.deployAmountUsd}
                onChange={(event) => updatePolicy({ deployAmountUsd: Number(event.target.value) })}
              />
            </label>
            <label className="field">
              <span className="field-label">Max per execution</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={policy.maxPerExecutionUsd}
                onChange={(event) => updatePolicy({ maxPerExecutionUsd: Number(event.target.value) })}
              />
            </label>
            <label className="field">
              <span className="field-label">Reserve target %</span>
              <input
                type="number"
                min="0"
                max="100"
                value={policy.reservePct}
                onChange={(event) => updatePolicy({ reservePct: Number(event.target.value) })}
              />
            </label>
            <label className="field">
              <span className="field-label">Minimum vault TVL</span>
              <input
                type="number"
                min="0"
                value={policy.minTvlUsd}
                onChange={(event) => updatePolicy({ minTvlUsd: Number(event.target.value) })}
              />
            </label>
          </div>

          <div style={{ marginTop: 18 }}>
            <div className="field-label">Allowed chains</div>
            <div className="chain-row" style={{ marginTop: 8 }}>
              {CHAINS.map((chain) => (
                <button
                  key={chain.id}
                  type="button"
                  className={`toggle ${policy.allowedChainIds.includes(chain.id) ? 'active' : ''}`}
                  onClick={() => toggleChain(chain.id)}
                >
                  {chain.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 18 }}>
            <div className="field-label">Risk mode</div>
            <div className="mode-row" style={{ marginTop: 8 }}>
              {riskModes.map((mode) => (
                <button
                  key={mode.value}
                  type="button"
                  className={`toggle ${policy.riskMode === mode.value ? 'active' : ''}`}
                  onClick={() => updatePolicy({ riskMode: mode.value })}
                  title={mode.detail}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          {plan?.fallbackReason && <div className="fallback-box">{plan.fallbackReason}</div>}
          {error && <div className="error-box">{error}</div>}
        </div>

        <div className="hero-stack">
          {plan && (
            <div className="panel">
              <div className="eyebrow">Agentic Workflow</div>
              <h2 className="panel-title">Treasury agents produce an execution decision</h2>
              <div className="agent-grid">
                {plan.agents.map((agent) => (
                  <div className="agent-card" key={agent.id}>
                    <div className="agent-role">{agent.role}</div>
                    <div className={`agent-verdict status-${agent.status}`}>{agent.verdict}</div>
                    <div className="agent-detail">{agent.detail}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {plan && (
            <div className="panel">
              <div className="eyebrow">Policy Checks</div>
              <h2 className="panel-title">Execution guardrails</h2>
              <div className="hero-stack" style={{ marginTop: 14 }}>
                {plan.checks.map((check) => (
                  <div className="stat" key={check.id}>
                    <div className="stat-label">{check.label}</div>
                    <div className={`metric-value status-${check.status}`}>{check.status.toUpperCase()}</div>
                    <div className="agent-detail">{check.detail}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {plan?.approvedVaults.map((vault) => (
            <VaultCard
              key={vault.id}
              vault={vault}
              selected={selectedVault?.id === vault.id}
              onSelect={() => {
                setSelectedVaultId(vault.id)
                setQuote(null)
                setTxHash(null)
                setApprovalHash(null)
              }}
            />
          ))}

          {plan && plan.rejectedVaults.length > 0 && (
            <div className="panel">
              <div className="eyebrow">Rejected by Policy</div>
              <div className="hero-stack" style={{ marginTop: 12 }}>
                {plan.rejectedVaults.slice(0, 4).map((vault) => (
                  <div className="stat" key={`${vault.vaultId}-${vault.reason}`}>
                    <div className="stat-label">
                      {vault.name} · {vault.chainName}
                    </div>
                    <div className="agent-detail">{vault.reason}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {quote && selectedVault && (
            <div className="quote-box">
              <div className="eyebrow">LI.FI Composer Quote</div>
              <div className="quote-grid" style={{ marginTop: 12 }}>
                <div>
                  <div className="metric-label">Route</div>
                  <div className="metric-value">
                    {quote.action.fromToken.symbol} to {quote.action.toToken.symbol}
                  </div>
                </div>
                <div>
                  <div className="metric-label">Estimated receipt</div>
                  <div className="metric-value">
                    {estimatedReceipt != null
                      ? `${estimatedReceipt.toFixed(4)} ${quote.action.toToken.symbol}`
                      : quote.action.toToken.symbol}
                  </div>
                </div>
                <div>
                  <div className="metric-label">Approval target</div>
                  <div className="metric-value">
                    {quote.estimate.approvalAddress
                      ? `${quote.estimate.approvalAddress.slice(0, 10)}...`
                      : 'No approval'}
                  </div>
                </div>
              </div>
              <div className="button-row" style={{ marginTop: 16 }}>
                <button className="primary" onClick={executeQuote} disabled={isExecuting}>
                  {isExecuting ? 'Executing...' : 'Execute treasury deposit'}
                </button>
                <button className="secondary" onClick={connectWallet}>
                  {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Connect wallet'}
                </button>
              </div>
            </div>
          )}

          {txHash && selectedVault && (
            <div className="report-card">
              <div className="eyebrow">Treasury Report</div>
              <h2 className="panel-title">Execution complete</h2>
              <p className="panel-copy">
                Deployed {formatUsd(plan?.policy.deployAmountUsd || policy.deployAmountUsd)} USDC
                into {selectedVault.name} on {selectedVault.chainName}. The treasury wallet now
                holds {quote?.action.toToken.symbol || selectedVault.symbol}, the vault receipt
                token representing this position.
              </p>
              <div className="tag-row">
                {approvalHash && (
                  <a className="tag" href={`${explorerBaseUrl}/tx/${approvalHash}`} target="_blank" rel="noreferrer">
                    Approval {approvalHash.slice(0, 10)}...
                  </a>
                )}
                <a className="tag" href={`${explorerBaseUrl}/tx/${txHash}`} target="_blank" rel="noreferrer">
                  Deposit {txHash.slice(0, 10)}...
                </a>
                <span className="tag">Receipt token: {quote?.action.toToken.symbol || selectedVault.symbol}</span>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

function VaultCard({
  vault,
  selected,
  onSelect,
}: {
  vault: StableOpsVault
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button type="button" className={`vault-card ${selected ? 'selected' : ''}`} onClick={onSelect}>
      <div className="vault-head">
        <div>
          <div className="eyebrow">
            {vault.protocolName} · {vault.chainName}
          </div>
          <div className="vault-name">{vault.name}</div>
          <div className="vault-sub">
            Treasury asset: {vault.assetSymbol} · Receipt token: {vault.symbol}
          </div>
        </div>
        <div className="stat" style={{ minWidth: 110 }}>
          <div className="stat-label">APY</div>
          <div className="stat-value">{formatRate(vault.apy)}</div>
        </div>
      </div>

      <div className="vault-metrics">
        <div>
          <div className="metric-label">30d avg</div>
          <div className="metric-value">{formatRate(vault.apy30d)}</div>
        </div>
        <div>
          <div className="metric-label">TVL</div>
          <div className="metric-value">{formatUsd(vault.tvlUsd)}</div>
        </div>
        <div>
          <div className="metric-label">Risk</div>
          <div className="metric-value">{vault.risk}</div>
        </div>
      </div>

      <div className="tag-row" style={{ marginTop: 16 }}>
        {vault.reasons.map((reason) => (
          <span className="tag" key={reason}>
            {reason}
          </span>
        ))}
      </div>
    </button>
  )
}
