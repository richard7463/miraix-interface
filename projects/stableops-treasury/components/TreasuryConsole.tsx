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
  type PolicyCheck,
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
  { value: 'open', label: 'Open', detail: 'Every executable vault' },
]

const workflowLabels = ['Mandate', 'Discover', 'Gate', 'Quote', 'Execute', 'Report']

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
  const checksPassed = plan?.checks.filter((check) => check.status === 'pass').length || 0
  const checksTotal = plan?.checks.length || 5
  const hasBlockingCheck = Boolean(plan?.checks.some((check) => check.status === 'block'))
  const deployableCapacity = Math.max(0, policy.treasurySizeUsd * (1 - policy.reservePct / 100))

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
    <main className="ops-shell">
      <div className="atmosphere" aria-hidden="true">
        <span className="orbit orbit-one" />
        <span className="orbit orbit-two" />
        <span className="signal-grid" />
      </div>

      <header className="topbar">
        <div className="brand-lockup">
          <span className="brand-mark">S/O</span>
          <div>
            <div className="brand-name">StableOps Treasury</div>
            <div className="brand-subtitle">Agentic treasury execution with LI.FI Earn</div>
          </div>
        </div>
        <div className="topbar-actions">
          <span className="status-pill">
            <span className="status-dot" />
            {plan?.dataSource === 'live' ? 'Live Earn API' : 'Seeded review mode'}
          </span>
          <button className="ghost-button" type="button" onClick={connectWallet}>
            {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Connect wallet'}
          </button>
        </div>
      </header>

      <section className="hero-grid">
        <div className="hero-main reveal">
          <div className="deck-label">Treasury Ops Room / LI.FI Earn</div>
          <h1>
            Treasury rules in. Yield execution out.
          </h1>
          <p>
            StableOps is a control desk for small teams, DAOs, and builders: set the treasury
            mandate, discover USDC vaults, block policy violations, prepare a Composer route, and
            ship a receipt-token report.
          </p>
          <div className="hero-cta-row">
            <button className="primary-button" type="button" onClick={() => runPlan()} disabled={isPlanning}>
              {isPlanning ? 'Building policy route...' : 'Run StableOps plan'}
            </button>
            <button className="outline-button" type="button" onClick={prepareQuote} disabled={!selectedVault || isQuoting}>
              {isQuoting ? 'Preparing Composer...' : 'Prepare Composer quote'}
            </button>
          </div>
        </div>

        <aside className="mandate-card reveal reveal-delay-1">
          <div className="mandate-head">
            <span>Current Mandate</span>
            <strong>{hasBlockingCheck ? 'Blocked' : 'Authorized'}</strong>
          </div>
          <div className="mandate-amount">{formatUsd(policy.deployAmountUsd)}</div>
          <div className="mandate-copy">
            Deploy USDC while preserving {policy.reservePct}% reserves and capping each execution at{' '}
            {formatUsd(policy.maxPerExecutionUsd)}.
          </div>
          <div className="mandate-metrics">
            <Metric label="Capacity" value={formatUsd(deployableCapacity)} />
            <Metric label="Checks" value={`${checksPassed}/${checksTotal}`} />
            <Metric label="Routes" value={String(plan?.approvedVaults.length || 0)} />
          </div>
          <div className="workflow-strip" aria-label="StableOps workflow">
            {workflowLabels.map((label, index) => (
              <span key={label} className={index <= (quote ? 3 : plan ? 2 : 0) ? 'active' : ''}>
                {label}
              </span>
            ))}
          </div>
        </aside>
      </section>

      <section className="ops-grid">
        <section className="policy-console reveal reveal-delay-2" aria-label="Treasury policy input">
          <div className="section-kicker">Policy Console</div>
          <div className="section-head">
            <h2>Mandate rulebook</h2>
            <p>Every field below becomes a guardrail before LI.FI Composer is allowed to prepare a transaction.</p>
          </div>

          <div className="field-grid">
            <Field label="Treasury name">
              <input
                value={policy.treasuryName}
                onChange={(event) => updatePolicy({ treasuryName: event.target.value })}
              />
            </Field>
            <Field label="Treasury size">
              <input
                type="number"
                min="1"
                value={policy.treasurySizeUsd}
                onChange={(event) => updatePolicy({ treasurySizeUsd: Number(event.target.value) })}
              />
            </Field>
            <Field label="Deploy USDC">
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={policy.deployAmountUsd}
                onChange={(event) => updatePolicy({ deployAmountUsd: Number(event.target.value) })}
              />
            </Field>
            <Field label="Max per action">
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={policy.maxPerExecutionUsd}
                onChange={(event) => updatePolicy({ maxPerExecutionUsd: Number(event.target.value) })}
              />
            </Field>
            <Field label="Reserve target %">
              <input
                type="number"
                min="0"
                max="100"
                value={policy.reservePct}
                onChange={(event) => updatePolicy({ reservePct: Number(event.target.value) })}
              />
            </Field>
            <Field label="Minimum vault TVL">
              <input
                type="number"
                min="0"
                value={policy.minTvlUsd}
                onChange={(event) => updatePolicy({ minTvlUsd: Number(event.target.value) })}
              />
            </Field>
          </div>

          <div className="control-block">
            <div className="control-label">Allowed execution zones</div>
            <div className="segmented-row">
              {CHAINS.map((chain) => (
                <button
                  key={chain.id}
                  type="button"
                  className={policy.allowedChainIds.includes(chain.id) ? 'segment active' : 'segment'}
                  onClick={() => toggleChain(chain.id)}
                >
                  <span>{chain.label}</span>
                  <small>{chain.nativeToken} gas</small>
                </button>
              ))}
            </div>
          </div>

          <div className="control-block">
            <div className="control-label">Risk mode</div>
            <div className="segmented-row risk-row">
              {riskModes.map((mode) => (
                <button
                  key={mode.value}
                  type="button"
                  className={policy.riskMode === mode.value ? 'segment active' : 'segment'}
                  onClick={() => updatePolicy({ riskMode: mode.value })}
                >
                  <span>{mode.label}</span>
                  <small>{mode.detail}</small>
                </button>
              ))}
            </div>
          </div>

          {plan?.fallbackReason && <div className="notice warning">{plan.fallbackReason}</div>}
          {error && <div className="notice error">{error}</div>}
        </section>

        <section className="decision-console reveal reveal-delay-3">
          {plan ? (
            <>
              <div className="section-kicker">Execution Decision</div>
              <div className="section-head split">
                <div>
                  <h2>Execution rail</h2>
                  <p>Specialized operators turn policy into a signed execution path.</p>
                </div>
                <span className={hasBlockingCheck ? 'decision-badge blocked' : 'decision-badge'}>
                  {hasBlockingCheck ? 'Policy blocked' : 'Ready for Composer'}
                </span>
              </div>
              <div className="agent-lane">
                {plan.agents.map((agent, index) => (
                  <article className={`agent-node status-${agent.status}`} key={agent.id}>
                    <div className="node-index">{String(index + 1).padStart(2, '0')}</div>
                    <div>
                      <div className="node-role">{agent.role}</div>
                      <h3>{agent.verdict}</h3>
                      <p>{agent.detail}</p>
                    </div>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <div className="empty-state">
              <span>Awaiting mandate</span>
              <p>Run StableOps to discover LI.FI Earn vaults and assemble a treasury decision.</p>
            </div>
          )}
        </section>
      </section>

      {plan && (
        <section className="route-grid">
          <div className="checks-board reveal">
            <div className="section-kicker">Policy Gates</div>
            <div className="section-head">
              <h2>{checksPassed}/{checksTotal} guardrails passed</h2>
              <p>Composer quote remains gated until reserve, action cap, chain, TVL, and executability pass.</p>
            </div>
            <div className="check-list">
              {plan.checks.map((check) => (
                <PolicyCheckCard check={check} key={check.id} />
              ))}
            </div>
          </div>

          <div className="vault-board reveal reveal-delay-1">
            <div className="section-kicker">LI.FI Earn Routes</div>
            <div className="section-head split">
              <div>
                <h2>Approved vaults</h2>
                <p>Select the treasury route before requesting a Composer quote.</p>
              </div>
              <span className="source-chip">{plan.dataSource === 'live' ? 'Live discovery' : 'Seeded examples'}</span>
            </div>
            <div className="vault-stack">
              {plan.approvedVaults.map((vault) => (
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
            </div>
          </div>
        </section>
      )}

      {plan && plan.rejectedVaults.length > 0 && (
        <section className="rejection-strip reveal">
          <div>
            <div className="section-kicker">Rejected by Policy</div>
            <h2>Vaults that did not reach treasury standard</h2>
          </div>
          <div className="rejection-list">
            {plan.rejectedVaults.slice(0, 4).map((vault) => (
              <article key={`${vault.vaultId}-${vault.reason}`}>
                <strong>{vault.name}</strong>
                <span>{vault.chainName}</span>
                <p>{vault.reason}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {quote && selectedVault && (
        <section className="quote-panel reveal">
          <div className="quote-ribbon">LI.FI Composer Quote</div>
          <div className="quote-content">
            <div>
              <h2>Composer route prepared for treasury execution.</h2>
              <p>
                Route {quote.action.fromToken.symbol} into {quote.action.toToken.symbol} on {selectedVault.chainName}.
                Approval and deposit are executed from the connected treasury wallet.
              </p>
            </div>
            <div className="quote-metrics">
              <Metric label="Route" value={`${quote.action.fromToken.symbol} -> ${quote.action.toToken.symbol}`} />
              <Metric
                label="Estimated receipt"
                value={
                  estimatedReceipt != null
                    ? `${estimatedReceipt.toFixed(4)} ${quote.action.toToken.symbol}`
                    : quote.action.toToken.symbol
                }
              />
              <Metric
                label="Approval target"
                value={quote.estimate.approvalAddress ? `${quote.estimate.approvalAddress.slice(0, 10)}...` : 'None'}
              />
            </div>
          </div>
          <div className="hero-cta-row">
            <button className="primary-button" type="button" onClick={executeQuote} disabled={isExecuting}>
              {isExecuting ? 'Executing treasury deposit...' : 'Execute treasury deposit'}
            </button>
            <button className="outline-button" type="button" onClick={connectWallet}>
              {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Connect wallet'}
            </button>
          </div>
        </section>
      )}

      {txHash && selectedVault && (
        <section className="report-panel reveal">
          <div className="section-kicker">Treasury Report</div>
          <h2>Execution complete. Receipt token accounted for.</h2>
          <p>
            Deployed {formatUsd(plan?.policy.deployAmountUsd || policy.deployAmountUsd)} USDC into{' '}
            {selectedVault.name} on {selectedVault.chainName}. The treasury wallet now holds{' '}
            {quote?.action.toToken.symbol || selectedVault.symbol}, the receipt token representing this vault position.
          </p>
          <div className="receipt-row">
            {approvalHash && (
              <a href={`${explorerBaseUrl}/tx/${approvalHash}`} target="_blank" rel="noreferrer">
                Approval {approvalHash.slice(0, 10)}...
              </a>
            )}
            <a href={`${explorerBaseUrl}/tx/${txHash}`} target="_blank" rel="noreferrer">
              Deposit {txHash.slice(0, 10)}...
            </a>
            <span>Receipt token: {quote?.action.toToken.symbol || selectedVault.symbol}</span>
          </div>
        </section>
      )}
    </main>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function PolicyCheckCard({ check }: { check: PolicyCheck }) {
  return (
    <article className={`check-card status-${check.status}`}>
      <div>
        <span>{check.label}</span>
        <strong>{check.status.toUpperCase()}</strong>
      </div>
      <p>{check.detail}</p>
    </article>
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
    <button type="button" className={`vault-ticket ${selected ? 'selected' : ''}`} onClick={onSelect}>
      <div className="ticket-top">
        <div>
          <span className="ticket-route">{vault.protocolName} / {vault.chainName}</span>
          <h3>{vault.name}</h3>
          <p>
            Treasury asset {vault.assetSymbol}. Receipt token after deposit: {vault.symbol}.
          </p>
        </div>
        <div className="apy-dial">
          <span>APY</span>
          <strong>{formatRate(vault.apy)}</strong>
        </div>
      </div>

      <div className="ticket-metrics">
        <Metric label="30d avg" value={formatRate(vault.apy30d)} />
        <Metric label="TVL" value={formatUsd(vault.tvlUsd)} />
        <Metric label="Risk" value={vault.risk} />
      </div>

      <div className="reason-row">
        {vault.reasons.map((reason) => (
          <span key={reason}>{reason}</span>
        ))}
      </div>
    </button>
  )
}
