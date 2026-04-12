'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { createPublicClient, encodeFunctionData, erc20Abi, formatUnits, http } from 'viem'
import { arbitrum, base, mainnet } from 'viem/chains'
import toast from 'react-hot-toast'
import { EARN_USDC_BY_CHAIN, formatEarnUsd, type EarnQuotePayload, type EarnVaultCard } from '@/lib/earn'

interface EarnDepositFlowProps {
  vault: EarnVaultCard
  initialAmount?: string | null
}

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const
const CHAIN_BY_ID = {
  1: mainnet,
  8453: base,
  42161: arbitrum,
} as const

const CHAIN_NATIVE_SYMBOL = {
  1: 'ETH',
  8453: 'ETH',
  42161: 'ETH',
} as const

const publicClients = {
  1: createPublicClient({ chain: mainnet, transport: http() }),
  8453: createPublicClient({ chain: base, transport: http() }),
  42161: createPublicClient({ chain: arbitrum, transport: http() }),
} as const

function ensureHexData(value?: string) {
  if (!value) return '0x'
  return value.startsWith('0x') ? value : `0x${value}`
}

function toRpcQuantity(value?: string) {
  if (!value) return undefined
  if (value.startsWith('0x')) return value

  try {
    return `0x${BigInt(value).toString(16)}`
  } catch {
    return undefined
  }
}

function toBigIntValue(value?: string | bigint | null) {
  if (typeof value === 'bigint') return value
  if (!value) return BigInt(0)

  try {
    return value.startsWith('0x') ? BigInt(value) : BigInt(value)
  } catch {
    return BigInt(0)
  }
}

function extractNestedErrorMessage(input: unknown): string {
  if (!input) return ''
  if (typeof input === 'string') return input
  if (input instanceof Error) return input.message
  if (typeof input !== 'object') return ''

  const candidate = input as Record<string, unknown>
  const direct =
    (typeof candidate.message === 'string' && candidate.message) ||
    (typeof candidate.shortMessage === 'string' && candidate.shortMessage) ||
    (typeof candidate.details === 'string' && candidate.details) ||
    (typeof candidate.reason === 'string' && candidate.reason) ||
    ''

  if (direct) {
    return direct
  }

  return (
    extractNestedErrorMessage(candidate.cause) ||
    extractNestedErrorMessage(candidate.error) ||
    extractNestedErrorMessage(candidate.data)
  )
}

function formatEarnExecutionError(error: unknown, chainId: number) {
  const rawMessage = extractNestedErrorMessage(error) || 'Failed to execute deposit'
  const normalized = rawMessage.replace(/\s+/g, ' ').trim()
  const nativeSymbol = CHAIN_NATIVE_SYMBOL[chainId as keyof typeof CHAIN_NATIVE_SYMBOL] || 'ETH'

  if (normalized.toLowerCase().includes('insufficient funds for gas * price + value')) {
    const balanceMatch = normalized.match(/balance\s+(\d+)/i)
    const txCostMatch = normalized.match(/tx cost\s+(\d+)/i)
    const balance = balanceMatch ? BigInt(balanceMatch[1]) : null
    const txCost = txCostMatch ? BigInt(txCostMatch[1]) : null

    if (balance != null && txCost != null) {
      return `Insufficient ${nativeSymbol} for gas on ${CHAIN_BY_ID[chainId as keyof typeof CHAIN_BY_ID]?.name || 'this network'}. Need about ${formatUnits(txCost, 18)} ${nativeSymbol}, but the wallet only has ${formatUnits(balance, 18)} ${nativeSymbol}.`
    }

    return `Insufficient ${nativeSymbol} for gas on ${CHAIN_BY_ID[chainId as keyof typeof CHAIN_BY_ID]?.name || 'this network'}. Fund the wallet with more ${nativeSymbol} and try again.`
  }

  if (
    normalized.toLowerCase().includes('missing or invalid parameters') &&
    normalized.toLowerCase().includes('insufficient funds')
  ) {
    return `Insufficient ${nativeSymbol} for gas on ${CHAIN_BY_ID[chainId as keyof typeof CHAIN_BY_ID]?.name || 'this network'}. Fund the wallet with more ${nativeSymbol} and try again.`
  }

  if (normalized.toLowerCase().includes('user rejected')) {
    return 'Transaction was rejected in the wallet.'
  }

  return normalized
}

async function ensureSufficientGasBalance(
  wallet: any,
  chainId: number,
  transaction: {
    to: string
    data?: string
    value?: string
    gasLimit?: string
    gas?: string
    gasPrice?: string
    maxFeePerGas?: string
  },
) {
  const client = publicClients[chainId as keyof typeof publicClients]
  const nativeSymbol = CHAIN_NATIVE_SYMBOL[chainId as keyof typeof CHAIN_NATIVE_SYMBOL] || 'ETH'
  const account = wallet.address as `0x${string}`
  const value = toBigIntValue(transaction.value)
  const gasLimit =
    toBigIntValue(transaction.gasLimit) ||
    toBigIntValue(transaction.gas) ||
    (await client.estimateGas({
      account,
      to: transaction.to as `0x${string}`,
      data: ensureHexData(transaction.data) as `0x${string}`,
      value,
    }))

  const feePerGas = toBigIntValue(transaction.maxFeePerGas) || toBigIntValue(transaction.gasPrice)

  let resolvedFeePerGas = feePerGas
  if (resolvedFeePerGas <= BigInt(0)) {
    const estimatedFees = await client.estimateFeesPerGas()
    resolvedFeePerGas =
      estimatedFees.maxFeePerGas ||
      estimatedFees.gasPrice ||
      estimatedFees.maxPriorityFeePerGas ||
      BigInt(0)
  }

  const balance = await client.getBalance({ address: account })
  const required = value + gasLimit * resolvedFeePerGas

  if (balance < required) {
    throw new Error(
      `Insufficient ${nativeSymbol} for gas on ${CHAIN_BY_ID[chainId as keyof typeof CHAIN_BY_ID]?.name || 'this network'}. Need about ${formatUnits(required, 18)} ${nativeSymbol}, but the wallet only has ${formatUnits(balance, 18)} ${nativeSymbol}.`,
    )
  }
}

async function parseJsonResponse(response: Response) {
  const raw = await response.text()

  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw)
  } catch {
    return {
      success: false,
      error: raw,
    }
  }
}

async function switchWalletChain(wallet: any, chainId: number) {
  if (!wallet) return

  if (typeof wallet.switchChain === 'function') {
    await wallet.switchChain(chainId)
    return
  }

  const provider = await wallet.getEthereumProvider?.()
  if (!provider?.request) return

  await provider.request({
    method: 'wallet_switchEthereumChain',
    params: [{ chainId: `0x${chainId.toString(16)}` }],
  })
}

async function sendEvmTransaction(wallet: any, chainId: number, transaction: any) {
  const provider = await wallet.getEthereumProvider()

  const hash = (await provider.request({
    method: 'eth_sendTransaction',
    params: [
      {
        from: wallet.address,
        to: transaction.to,
        data: ensureHexData(transaction.data),
        value: toRpcQuantity(transaction.value) || '0x0',
        ...(toRpcQuantity(transaction.gasLimit || transaction.gas)
          ? { gas: toRpcQuantity(transaction.gasLimit || transaction.gas) }
          : {}),
        ...(toRpcQuantity(transaction.gasPrice)
          ? { gasPrice: toRpcQuantity(transaction.gasPrice) }
          : {}),
        ...(toRpcQuantity(transaction.maxFeePerGas)
          ? { maxFeePerGas: toRpcQuantity(transaction.maxFeePerGas) }
          : {}),
        ...(toRpcQuantity(transaction.maxPriorityFeePerGas)
          ? { maxPriorityFeePerGas: toRpcQuantity(transaction.maxPriorityFeePerGas) }
          : {}),
      },
    ],
  })) as `0x${string}`

  await publicClients[chainId as keyof typeof publicClients].waitForTransactionReceipt({ hash })
  return hash
}

export default function EarnDepositFlow({ vault, initialAmount }: EarnDepositFlowProps) {
  const { ready, authenticated, login } = usePrivy()
  const walletState = useWallets() as { wallets?: any[] }
  const availableWallets = walletState.wallets || []
  const [amount, setAmount] = useState(initialAmount || '100')
  const [quote, setQuote] = useState<EarnQuotePayload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPreparing, setIsPreparing] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [approvalHash, setApprovalHash] = useState<string | null>(null)

  const wallet = useMemo(
    () =>
      availableWallets.find(
        (item) => item.walletClientType === 'privy' && (!item.type || item.type === 'ethereum'),
      ) ||
      availableWallets.find((item) => !item.type || item.type === 'ethereum') ||
      null,
    [availableWallets],
  )

  const amountInBaseUnits = useMemo(() => {
    const numeric = Number(amount)
    if (!Number.isFinite(numeric) || numeric <= 0) {
      return ''
    }

    return String(Math.round(numeric * 10 ** vault.assetDecimals))
  }, [amount, vault.assetDecimals])

  const explorerBaseUrl =
    CHAIN_BY_ID[vault.chainId as keyof typeof CHAIN_BY_ID]?.blockExplorers?.default.url || null

  useEffect(() => {
    setQuote(null)
    setError(null)
    setTxHash(null)
    setApprovalHash(null)
  }, [vault.id])

  useEffect(() => {
    if (initialAmount) {
      setAmount(initialAmount)
    }
  }, [initialAmount, vault.id])

  const prepareQuote = async () => {
    if (!amountInBaseUnits) {
      setError('Enter a valid USDC amount')
      return
    }

    if (!ready || !authenticated || !wallet?.address) {
      setError('Connect your embedded EVM wallet to prepare a deposit.')
      return
    }

    setIsPreparing(true)
    setError(null)

    try {
      const response = await fetch('/api/earn/quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chainId: vault.chainId,
          vaultAddress: vault.address,
          walletAddress: wallet.address,
          fromAmount: amountInBaseUnits,
          fromTokenAddress: vault.assetAddress || EARN_USDC_BY_CHAIN[vault.chainId]?.address,
        }),
      })

      const payload = await parseJsonResponse(response)
      if (!response.ok || !payload?.success || !payload?.quote?.transactionRequest) {
        throw new Error(payload?.error || 'Failed to prepare Composer quote')
      }

      setQuote(payload.quote as EarnQuotePayload)
      toast.success('Composer quote ready')
    } catch (prepareError) {
      const message =
        prepareError instanceof Error ? prepareError.message : 'Failed to prepare deposit quote'
      setError(message)
      toast.error(message)
    } finally {
      setIsPreparing(false)
    }
  }

  const executeDeposit = async () => {
    if (!quote || !wallet?.address) {
      setError('Prepare a Composer quote first.')
      return
    }

    setIsExecuting(true)
    setError(null)

    try {
      await switchWalletChain(wallet, vault.chainId)

      const fromTokenAddress = quote.action.fromToken.address
      const approvalAddress = quote.estimate.approvalAddress
      const fromAmountRaw = quote.action.fromAmount

      if (
        approvalAddress &&
        fromTokenAddress &&
        fromTokenAddress.toLowerCase() !== ZERO_ADDRESS.toLowerCase()
      ) {
        const owner = wallet.address as `0x${string}`
        const allowance = (await publicClients[
          vault.chainId as keyof typeof publicClients
        ].readContract({
          address: fromTokenAddress as `0x${string}`,
          abi: erc20Abi,
          functionName: 'allowance',
          args: [owner, approvalAddress as `0x${string}`],
        })) as bigint

        if (allowance < BigInt(fromAmountRaw)) {
          const approvalData = encodeFunctionData({
            abi: erc20Abi,
            functionName: 'approve',
            args: [approvalAddress as `0x${string}`, BigInt(fromAmountRaw)],
          })

          await ensureSufficientGasBalance(wallet, vault.chainId, {
            to: fromTokenAddress,
            data: approvalData,
            value: '0x0',
          })

          const hash = await sendEvmTransaction(wallet, vault.chainId, {
            to: fromTokenAddress,
            data: approvalData,
            value: '0x0',
          })

          setApprovalHash(hash)
          toast.success('USDC approval confirmed')
        }
      }

      await ensureSufficientGasBalance(wallet, vault.chainId, quote.transactionRequest)

      const hash = await sendEvmTransaction(wallet, vault.chainId, quote.transactionRequest)
      setTxHash(hash)
      toast.success('Earn deposit confirmed')
    } catch (executionError) {
      const message = formatEarnExecutionError(executionError, vault.chainId)
      setError(message)
      toast.error(message)
    } finally {
      setIsExecuting(false)
    }
  }

  const estimatedOutput =
    quote?.estimate?.toAmount && quote.action?.toToken?.decimals != null
      ? Number(formatUnits(BigInt(quote.estimate.toAmount), quote.action.toToken.decimals))
      : null

  const successSummary =
    txHash && quote
      ? `Deposited ${amount} ${quote.action.fromToken.symbol} into ${vault.name} on ${vault.chainName}. Expected receipt: ${
          estimatedOutput != null
            ? `${estimatedOutput.toFixed(4)} ${quote.action.toToken.symbol}`
            : quote.action.toToken.symbol
        } in the same wallet.`
      : null

  const walletAssetHint =
    txHash && quote
      ? `Look for ${quote.action.toToken.symbol} in your wallet on ${vault.chainName}. This is your vault position token for ${vault.name}.`
      : null

  return (
    <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-[#17171c] p-4 text-[#f5f1e8]">
      <div className="flex flex-col gap-1">
        <div className="text-sm font-semibold text-emerald-300">Composer Deposit Flow</div>
        <div className="text-sm text-[#c8c3b5]">
          Deposit USDC into <span className="font-medium text-[#fff7e6]">{vault.name}</span> on{' '}
          {vault.chainName}.
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
        <label className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-[0.18em] text-[#9e9683]">Amount</span>
          <input
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            inputMode="decimal"
            className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-base text-[#fff7e6] outline-none transition focus:border-emerald-400/50"
            placeholder="100"
          />
        </label>

        <button
          type="button"
          onClick={authenticated ? prepareQuote : login}
          disabled={isPreparing}
          className="rounded-xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-[#09110d] transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {authenticated ? (isPreparing ? 'Preparing...' : 'Prepare quote') : 'Connect wallet'}
        </button>
      </div>

      {quote && (
        <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <div className="text-xs uppercase tracking-[0.16em] text-[#9e9683]">Route</div>
              <div className="mt-1 text-sm text-[#fff7e6]">
                {quote.action.fromToken.symbol} to {quote.action.toToken.symbol}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.16em] text-[#9e9683]">Estimated output</div>
              <div className="mt-1 text-sm text-[#fff7e6]">
                {estimatedOutput != null
                  ? `${estimatedOutput.toFixed(4)} ${quote.action.toToken.symbol}`
                  : 'Available after signing'}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.16em] text-[#9e9683]">Approval target</div>
              <div className="mt-1 truncate text-sm text-[#fff7e6]">
                {quote.estimate.approvalAddress || 'No approval needed'}
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={executeDeposit}
              disabled={isExecuting}
              className="rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isExecuting ? 'Executing...' : `Deposit ${amount} USDC`}
            </button>
            <div className="text-xs text-[#9e9683]">
              Preview size: {formatEarnUsd(Number(amount) || 0)} on {vault.chainName}
            </div>
          </div>
        </div>
      )}

      {approvalHash && (
        <div className="mt-3 text-xs text-[#d7d1c4]">
          Approval confirmed:{' '}
          <a
            className="text-emerald-300 underline"
            href={explorerBaseUrl ? `${explorerBaseUrl}/tx/${approvalHash}` : '#'}
            target="_blank"
            rel="noreferrer"
          >
            {approvalHash.slice(0, 10)}...
          </a>
        </div>
      )}

      {txHash && (
        <div className="mt-3 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm text-[#d7f7e3]">
          <div className="font-medium text-emerald-200">Deposit completed</div>
          {successSummary && <div className="mt-1 text-[#d7f7e3]">{successSummary}</div>}
          {walletAssetHint && (
            <div className="mt-3 rounded-xl border border-emerald-300/20 bg-black/15 p-3 text-xs text-[#c8f3d6]">
              <div className="font-semibold uppercase tracking-[0.14em] text-emerald-200">
                Where to find it
              </div>
              <div className="mt-1">{walletAssetHint}</div>
            </div>
          )}
          <div className="mt-2 text-xs text-[#b9e8ca]">
            Deposit tx:{' '}
            <a
              className="text-emerald-300 underline"
              href={explorerBaseUrl ? `${explorerBaseUrl}/tx/${txHash}` : '#'}
              target="_blank"
              rel="noreferrer"
            >
              {txHash.slice(0, 10)}...
            </a>
          </div>
        </div>
      )}

      {error && <div className="mt-3 text-sm text-rose-300">{error}</div>}
    </div>
  )
}
