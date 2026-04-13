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
  type AgentStep,
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
  const hasBlockingCheck = Boolean(plan?.checks.some((check) => check.status === 'block'))
  const deployableCapacity = Math.max(0, policy.treasurySizeUsd * (1 - policy.reservePct / 100))
  const readyLabel = hasBlockingCheck ? 'Blocked by policy' : quote ? 'Composer ready' : 'Policy ready'

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
    <main className="page-shell">
      <header className="nav">
        <a className="brand" href="#top" aria-label="StableOps Treasury home">
          <span>StableOps</span>
          <small>Treasury Executor</small>
        </a>
        <div className="nav-center">
          <span>LI.FI Earn</span>
          <span>Policy gated</span>
          <span>Composer ready</span>
        </div>
        <button className="wallet-button" type="button" onClick={connectWallet}>
          {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Connect wallet'}
        </button>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy-block">
          <div className="overline">Agentic Treasury Lite</div>
          <h1>Move team USDC into yield with rules, not guesswork.</h1>
          <p>
            StableOps turns a treasury mandate into a LI.FI Earn execution: define limits, approve a
            vault, prepare Composer, and leave with a receipt-token report.
          </p>
          <div className="hero-actions">
            <button className="primary-action" type="button" onClick={() => runPlan()} disabled={isPlanning}>
              {isPlanning ? 'Building plan...' : 'Run treasury plan'}
            </button>
            <button className="secondary-action" type="button" onClick={prepareQuote} disabled={!selectedVault || isQuoting}>
              {isQuoting ? 'Preparing quote...' : 'Prepare Composer'}
            </button>
          </div>
        </div>

        <aside className="hero-summary">
          <div className="summary-top">
            <span>{readyLabel}</span>
            <strong>{formatUsd(policy.deployAmountUsd)}</strong>
          </div>
          <div className="summary-meter">
            <span style={{ width: `${Math.min(100, (checksPassed / 5) * 100)}%` }} />
          </div>
          <div className="summary-grid">
            <Metric label="Reserve" value={`${policy.reservePct}%`} />
            <Metric label="Capacity" value={formatUsd(deployableCapacity)} />
            <Metric label="Vaults" value={String(plan?.approvedVaults.length || 0)} />
          </div>
        </aside>
      </section>

      <section className="flow-panel" aria-label="StableOps execution flow">
        <FlowStep number="01" title="Mandate" text="Team sets reserve, chain, TVL, and action caps." />
        <FlowStep number="02" title="Discover" text="LI.FI Earn returns Composer-compatible USDC vaults." />
        <FlowStep number="03" title="Execute" text="Wallet signs approval and deposit only after checks pass." />
      </section>

      <section className="workspace">
        <section className="policy-card">
          <SectionHeader eyebrow="Step 01" title="Treasury mandate" text="Rules are the product. The app cannot route around them." />

          <div className="form-grid">
            <Field label="Treasury name">
              <input value={policy.treasuryName} onChange={(event) => updatePolicy({ treasuryName: event.target.value })} />
            </Field>
            <Field label="Treasury size">
              <input type="number" min="1" value={policy.treasurySizeUsd} onChange={(event) => updatePolicy({ treasurySizeUsd: Number(event.target.value) })} />
            </Field>
            <Field label="Deploy USDC">
              <input type="number" min="0.01" step="0.01" value={policy.deployAmountUsd} onChange={(event) => updatePolicy({ deployAmountUsd: Number(event.target.value) })} />
            </Field>
            <Field label="Max action">
              <input type="number" min="0.01" step="0.01" value={policy.maxPerExecutionUsd} onChange={(event) => updatePolicy({ maxPerExecutionUsd: Number(event.target.value) })} />
            </Field>
            <Field label="Reserve target">
              <input type="number" min="0" max="100" value={policy.reservePct} onChange={(event) => updatePolicy({ reservePct: Number(event.target.value) })} />
            </Field>
            <Field label="Min TVL">
              <input type="number" min="0" value={policy.minTvlUsd} onChange={(event) => updatePolicy({ minTvlUsd: Number(event.target.value) })} />
            </Field>
          </div>

          <div className="choice-block">
            <span>Allowed chains</span>
            <div className="choice-row">
              {CHAINS.map((chain) => (
                <button
                  key={chain.id}
                  type="button"
                  className={policy.allowedChainIds.includes(chain.id) ? 'choice active' : 'choice'}
                  onClick={() => toggleChain(chain.id)}
                >
                  {chain.label}
                </button>
              ))}
            </div>
          </div>

          <div className="choice-block">
            <span>Risk mode</span>
            <div className="choice-row">
              {riskModes.map((mode) => (
                <button
                  key={mode.value}
                  type="button"
                  className={policy.riskMode === mode.value ? 'choice active' : 'choice'}
                  onClick={() => updatePolicy({ riskMode: mode.value })}
                >
                  <strong>{mode.label}</strong>
                  <small>{mode.detail}</small>
                </button>
              ))}
            </div>
          </div>

          {plan?.fallbackReason && <div className="notice warning">{plan.fallbackReason}</div>}
          {error && <div className="notice error">{error}</div>}
        </section>

        <section className="route-card">
          <SectionHeader
            eyebrow="Step 02"
            title="Approved route"
            text="Choose the vault that survives policy, then ask LI.FI Composer for the executable route."
          />

          {selectedVault ? (
            <FeaturedVault vault={selectedVault} />
          ) : (
            <div className="empty-card">Run a plan to select a policy-approved vault.</div>
          )}

          <div className="vault-list">
            {plan?.approvedVaults.map((vault) => (
              <button
                type="button"
                key={vault.id}
                className={selectedVault?.id === vault.id ? 'vault-row active' : 'vault-row'}
                onClick={() => {
                  setSelectedVaultId(vault.id)
                  setQuote(null)
                  setTxHash(null)
                  setApprovalHash(null)
                }}
              >
                <span>{vault.protocolName}</span>
                <strong>{vault.name}</strong>
                <em>{formatRate(vault.apy)}</em>
              </button>
            ))}
          </div>
        </section>

        <section className="execute-card">
          <SectionHeader
            eyebrow="Step 03"
            title="Execute"
            text="Composer quote and wallet execution sit behind the policy gate."
          />

          <div className="checks-list">
            {(plan?.checks || []).map((check) => (
              <CheckLine key={check.id} check={check} />
            ))}
          </div>

          {quote && selectedVault && (
            <div className="quote-box">
              <div>
                <span>Composer route</span>
                <strong>
                  {quote.action.fromToken.symbol} {'->'} {quote.action.toToken.symbol}
                </strong>
              </div>
              <div>
                <span>Estimated receipt</span>
                <strong>
                  {estimatedReceipt != null
                    ? `${estimatedReceipt.toFixed(4)} ${quote.action.toToken.symbol}`
                    : quote.action.toToken.symbol}
                </strong>
              </div>
              <div>
                <span>Approval target</span>
                <strong>{quote.estimate.approvalAddress ? `${quote.estimate.approvalAddress.slice(0, 10)}...` : 'None'}</strong>
              </div>
            </div>
          )}

          <div className="execute-actions">
            <button className="secondary-action" type="button" onClick={prepareQuote} disabled={!selectedVault || isQuoting}>
              {isQuoting ? 'Quoting...' : 'Prepare quote'}
            </button>
            <button className="primary-action" type="button" onClick={executeQuote} disabled={!quote || isExecuting}>
              {isExecuting ? 'Executing...' : 'Execute deposit'}
            </button>
          </div>
        </section>
      </section>

      {plan && (
        <section className="agent-strip">
          <SectionHeader eyebrow="Agent layer" title="What the agents decided" text="The AI layer is visible, auditable, and subordinate to treasury policy." />
          <div className="agent-row">
            {plan.agents.map((agent) => (
              <AgentPill key={agent.id} agent={agent} />
            ))}
          </div>
        </section>
      )}

      {plan && plan.rejectedVaults.length > 0 && (
        <section className="reject-section">
          <SectionHeader eyebrow="Rejected" title="Blocked vaults" text="Vaults that failed the mandate stay out of the execution path." />
          <div className="reject-row">
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

      {txHash && selectedVault && (
        <section className="receipt-card">
          <SectionHeader eyebrow="Treasury Report" title="Execution complete" text="The report explains where funds went and what receipt token represents the position." />
          <p>
            Deployed {formatUsd(plan?.policy.deployAmountUsd || policy.deployAmountUsd)} USDC into{' '}
            {selectedVault.name} on {selectedVault.chainName}. Treasury wallet now holds{' '}
            {quote?.action.toToken.symbol || selectedVault.symbol}.
          </p>
          <div className="receipt-links">
            {approvalHash && (
              <a href={`${explorerBaseUrl}/tx/${approvalHash}`} target="_blank" rel="noreferrer">
                Approval {approvalHash.slice(0, 10)}...
              </a>
            )}
            <a href={`${explorerBaseUrl}/tx/${txHash}`} target="_blank" rel="noreferrer">
              Deposit {txHash.slice(0, 10)}...
            </a>
            <span>Receipt: {quote?.action.toToken.symbol || selectedVault.symbol}</span>
          </div>
        </section>
      )}
    </main>
  )
}

function SectionHeader({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <div className="section-header">
      <span>{eyebrow}</span>
      <h2>{title}</h2>
      <p>{text}</p>
    </div>
  )
}

function FlowStep({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <article className="flow-step">
      <span>{number}</span>
      <strong>{title}</strong>
      <p>{text}</p>
    </article>
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
    <div className="mini-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function FeaturedVault({ vault }: { vault: StableOpsVault }) {
  return (
    <article className="featured-vault">
      <div>
        <span>{vault.protocolName} / {vault.chainName}</span>
        <h3>{vault.name}</h3>
        <p>Deposit {vault.assetSymbol}. Receive {vault.symbol} as the treasury receipt token.</p>
      </div>
      <div className="vault-stats">
        <Metric label="APY" value={formatRate(vault.apy)} />
        <Metric label="TVL" value={formatUsd(vault.tvlUsd)} />
        <Metric label="Risk" value={vault.risk} />
      </div>
    </article>
  )
}

function CheckLine({ check }: { check: PolicyCheck }) {
  return (
    <article className={`check-line ${check.status}`}>
      <div>
        <span>{check.label}</span>
        <strong>{check.status}</strong>
      </div>
      <p>{check.detail}</p>
    </article>
  )
}

function AgentPill({ agent }: { agent: AgentStep }) {
  return (
    <article className={`agent-pill ${agent.status}`}>
      <span>{agent.role}</span>
      <strong>{agent.verdict}</strong>
      <p>{agent.detail}</p>
    </article>
  )
}
