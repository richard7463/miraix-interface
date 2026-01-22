'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { HamburgerMenuIcon } from '@radix-ui/react-icons'
import { Avatar, Flex, Heading, IconButton, Select, Tooltip } from '@radix-ui/themes'
import cs from 'classnames'
import NextLink from 'next/link'
import { FaAdjust, FaGithub, FaMoon, FaRegSun } from 'react-icons/fa'
import { Link } from '../Link'
import { useTheme } from '../Themes'
import { ConnectButton } from './ConnectButton'
import { useSolanaWallets } from '@privy-io/react-auth/solana'
import { x402Client, wrapFetchWithPayment } from '@x402/fetch'
import { registerExactSvmScheme } from '@x402/svm/exact/client'
import { createKeyPairSignerFromBytes } from '@solana/kit'
import { base58 } from '@scure/base'

export const Header = () => {
  const { theme, setTheme } = useTheme()
  console.log('theme', theme)
  const [, setShow] = useState(false)

  const { wallets: solanaWallets, exportWallet: exportSolWallet } = useSolanaWallets()

  const embeddedSolanaWallet = useMemo(() => {
    const embedded = (solanaWallets || []).filter((w: any) => w.walletClientType === 'privy')
    return embedded.length > 0 ? embedded[0] : null
  }, [solanaWallets])

  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false)
  const [upgradeStatus, setUpgradeStatus] = useState<'idle' | 'paying' | 'success' | 'error'>('idle')
  const [premiumExpiresAt, setPremiumExpiresAt] = useState<string | null>(null)
  const [paymentTx, setPaymentTx] = useState<string | null>(null)
  const [upgradeError, setUpgradeError] = useState<string | null>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('premium_expires_at')
      if (stored) {
        setPremiumExpiresAt(stored)
      }
    } catch {
      // ignore
    }
  }, [])

  const isPremium = useMemo(() => {
    if (!premiumExpiresAt) return false
    const t = Date.parse(premiumExpiresAt)
    return Number.isFinite(t) && t > Date.now()
  }, [premiumExpiresAt])

  const apiBaseUrl = useMemo(() => {
    return process.env.NODE_ENV === 'production'
      ? 'https://langgraph-defai.vercel.app'
      : 'http://localhost:3009'
  }, [])

  const handleUpgradePremium = useCallback(async () => {
    setUpgradeStatus('paying')
    setUpgradeError(null)
    setPaymentTx(null)

    try {
      if (!embeddedSolanaWallet?.address) {
        throw new Error('Please connect your Solana wallet first.')
      }
      if (!exportSolWallet) {
        throw new Error('Wallet export is not available.')
      }

      const exportResult: any = await exportSolWallet({ address: embeddedSolanaWallet.address })
      const privateKey = exportResult?.privateKey
      if (!privateKey) {
        throw new Error('Failed to export Solana private key (required for x402 payment).')
      }

      const client = new x402Client()
      const svmSigner = await createKeyPairSignerFromBytes(base58.decode(privateKey))
      registerExactSvmScheme(client, { signer: svmSigner })

      const fetchWithPayment = wrapFetchWithPayment(fetch, client)

      const response = await fetchWithPayment(`${apiBaseUrl}/api/premium/upgrade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: embeddedSolanaWallet.address,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Upgrade failed: ${response.status} ${errorText}`)
      }

      const data = await response.json()

      try {
        const paymentHeader = response.headers.get('PAYMENT-RESPONSE')
        if (paymentHeader) {
          const decoded = typeof atob !== 'undefined'
            ? atob(paymentHeader)
            : Buffer.from(paymentHeader, 'base64').toString()
          const payment = JSON.parse(decoded)
          if (payment?.transaction) {
            setPaymentTx(payment.transaction)
          }
        }
      } catch (e) {
        console.warn('[Premium] Failed to decode PAYMENT-RESPONSE:', e)
      }

      if (data?.expiresAt) {
        setPremiumExpiresAt(data.expiresAt)
        try {
          localStorage.setItem('premium_expires_at', data.expiresAt)
        } catch {
          // ignore
        }
      }

      setUpgradeStatus('success')
    } catch (e: any) {
      setUpgradeStatus('error')
      setUpgradeError(e?.message || 'Unknown error')
    }
  }, [apiBaseUrl, embeddedSolanaWallet?.address, exportSolWallet])

  const toggleNavBar = useCallback(() => {
    setShow((state) => !state)
  }, [])

  return (
    <header
      className="self-stretch px-10 py-2.5 inline-flex justify-between items-center sticky top-0 z-50"
      style={{
        backgroundColor: '#27272a',
        borderBottom: '1px solid #3f3f46',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        minHeight: '46px'
      }}
    >
      {/* 左侧 Logo 和标题 */}
      <div className="flex justify-start items-center gap-1.5">
        <div className="w-5 h-5 relative overflow-hidden">
          <img 
            src="/favicon.png" 
            alt="Miraix AI Logo" 
            className="w-full h-full object-contain"
          />
        </div>
        <NextLink href="/">
          <div className="justify-start text-white/90 text-xl font-normal font-['Anonymous_Pro'] cursor-pointer hover:opacity-80 transition-opacity">
            Miraix AI
          </div>
        </NextLink>
      </div>

      {/* 右侧按钮区域 - 调整按钮尺寸 */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={() => {
            setIsPremiumModalOpen(true)
            setUpgradeStatus('idle')
            setUpgradeError(null)
            setPaymentTx(null)
          }}
          className={`flex items-center gap-2 text-sm py-1.5 px-3.5 rounded-md transition-all duration-200 border ${
            isPremium
              ? 'bg-amber-500/20 hover:bg-amber-500/25 text-amber-200 border-amber-400/30'
              : 'bg-white/10 hover:bg-white/20 text-white/90 border-white/20'
          }`}
        >
          <span>{isPremium ? 'Premium' : 'Upgrade Premium'}</span>
        </button>
          <ConnectButton />
        {/* <Tooltip content="Navigation">
          <IconButton
            size="3"
            variant="ghost"
            color="gray"
            className="md:hidden"
            onClick={toggleNavBar}
            style={{
              color: 'rgba(255, 255, 255, 0.9)',
              width: '23px',
              height: '23px'
            }}
          >
            <HamburgerMenuIcon width="14" height="14" />
          </IconButton>
        </Tooltip> */}
      </div>

      {isPremiumModalOpen ? (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#27272a] rounded-xl max-w-lg w-full overflow-hidden border border-[#3f3f46] shadow-2xl">
            <div className="flex items-start justify-between p-6 border-b border-[#3f3f46]">
              <div className="space-y-1">
                <h3 className="text-xl font-semibold text-white/90">Upgrade to Premium</h3>
                <div className="text-sm text-white/60">
                  Unlock priority infra and premium routing for the next 30 days.
                </div>
              </div>
              <button
                onClick={() => setIsPremiumModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-200 rounded-lg hover:bg-white/10 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="rounded-xl border border-white/10 bg-gradient-to-b from-white/10 to-transparent p-4">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-white/60">Premium Membership</div>
                    <div className="mt-1 text-2xl font-semibold text-white/90">19 USDC</div>
                    <div className="text-sm text-white/60">per 30 days</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-white/60">Instant activation</div>
                    <div className="text-sm text-white/80">One click via x402</div>
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-sm text-white/80">
                  <div className="flex items-start gap-2">
                    <span className="mt-[2px] inline-flex h-4 w-4 items-center justify-center rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-200">✓</span>
                    <div>
                      <div className="font-medium text-white/90">Priority infrastructure</div>
                      <div className="text-white/60">Faster API response during peak load.</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="mt-[2px] inline-flex h-4 w-4 items-center justify-center rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-200">✓</span>
                    <div>
                      <div className="font-medium text-white/90">Premium routing & quotes</div>
                      <div className="text-white/60">Better paths and tighter execution targets.</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="mt-[2px] inline-flex h-4 w-4 items-center justify-center rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-200">✓</span>
                    <div>
                      <div className="font-medium text-white/90">Lower fees (coming soon)</div>
                      <div className="text-white/60">Member-only fee tiers and priority support.</div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 text-xs text-white/50">
                  You’re paying only for membership access. Swaps remain user-signed and executed on-chain.
                </div>
              </div>

              {isPremium && premiumExpiresAt ? (
                <div className="rounded-lg border border-amber-400/30 bg-amber-500/10 p-3 text-amber-200 text-sm">
                  Premium active until: <span className="font-mono">{premiumExpiresAt}</span>
                </div>
              ) : null}

              {upgradeStatus === 'success' ? (
                <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-green-200 text-sm space-y-2">
                  <div>Upgrade successful.</div>
                  {premiumExpiresAt ? (
                    <div>
                      Expires at: <span className="font-mono">{premiumExpiresAt}</span>
                    </div>
                  ) : null}
                  {paymentTx ? (
                    <div>
                      X402 Payment Tx:
                      <div className="font-mono break-all">{paymentTx}</div>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {upgradeStatus === 'error' && upgradeError ? (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-red-200 text-sm break-words">
                  {upgradeError}
                </div>
              ) : null}

              <div className="flex items-center gap-3">
                <button
                  onClick={handleUpgradePremium}
                  disabled={upgradeStatus === 'paying'}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-gray-900 px-4 py-2 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed font-semibold text-sm"
                >
                  {upgradeStatus === 'paying' ? 'Processing payment...' : 'Upgrade now (x402)'}
                </button>
                <button
                  onClick={() => setIsPremiumModalOpen(false)}
                  className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white/90 px-4 py-2 rounded-lg transition-all duration-200 border border-white/10 font-medium text-sm"
                >
                  Close
                </button>
              </div>

              {!embeddedSolanaWallet?.address ? (
                <div className="text-xs text-white/50">
                  Connect your Solana wallet to continue. We’ll only request a signature for the x402 payment.
                </div>
              ) : (
                <div className="text-xs text-white/50">
                  Paying from wallet: <span className="font-mono">{embeddedSolanaWallet.address}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  )
}
