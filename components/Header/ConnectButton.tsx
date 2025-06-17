// @ts-nocheck
import React, { useState } from 'react';
import { useEffect } from "react";
import { useLogin } from "@privy-io/react-auth";
import { getAccessToken, usePrivy, useWallets } from "@privy-io/react-auth";
import { useSolanaWallets } from '@privy-io/react-auth/solana';
import { useTheme } from '../Themes';
import { WalletPanel } from '../Wallet/WalletPanel';

interface WalletState {
  privateKey?: string;
  address?: string;
}

export const ConnectButton = () => {
  const { theme } = useTheme();
  const {
    ready,
    authenticated,
    user,
    logout: privyLogout,
    linkEmail,
    linkWallet,
    unlinkEmail,
    linkPhone,
    unlinkPhone,
    unlinkWallet,
    linkGoogle,
    unlinkGoogle,
    linkTwitter,
    unlinkTwitter,
    linkDiscord,
    unlinkDiscord,
    login,
  } = usePrivy();

  const { wallets, ready: walletsReady } = useWallets();
  const { wallets: solanaWallets } = useSolanaWallets();

  useEffect(() => {
    console.log('ready', ready, 'authenticated', authenticated)
    if (ready && !authenticated) {
      console.log('not authenticated')
    }
    if (ready && authenticated && walletsReady) {
      const embeddedWallets = wallets.filter((w) => w.walletClientType === 'privy');
      if (embeddedWallets.length > 0) {
        console.log('Embedded wallets:', embeddedWallets);
        setEvmEmbedded(embeddedWallets[0]);
      } else {
        console.log('No embedded wallets found');
      }
    }
  }, [ready, authenticated, walletsReady, wallets]);

  // Mirror effect for Solana wallets
  useEffect(() => {
    if (ready && authenticated && solanaWallets) {
      const embeddedSolanaWallets = solanaWallets.filter((w: any) => w.walletClientType === 'privy');
      if (embeddedSolanaWallets.length > 0) {
        console.log('Embedded Solana wallets:', embeddedSolanaWallets);
        setSolEmbedded(embeddedSolanaWallets[0]);
      } else {
        console.log('No embedded Solana wallets found');
      }
    }
  }, [ready, authenticated, solanaWallets]);
  // 直接使用 Privy 官方 ConnectButton 组件，自动处理连接和登录
  // Export EVM embedded wallet private key
  const { exportWallet: exportEvmWallet } = usePrivy();
  // Export Solana embedded wallet private key
  const { exportWallet: exportSolWallet } = useSolanaWallets();

  // State for embedded wallet addresses
  const [evmEmbedded, setEvmEmbedded] = useState<any | null>(null);
  const [solEmbedded, setSolEmbedded] = useState<any | null>(null);

  // 导出 EVM embedded wallet 私钥
  const handleExportEvm = async () => {
    console.log('Export EVM button clicked');
    if (!evmEmbedded) {
      console.log('No EVM embedded wallet found');
      return;
    }
    console.log('EVM embedded wallet address:', evmEmbedded.address);
    try {
      console.log('Invoking exportEvmWallet...');
      const res = await exportEvmWallet({ address: evmEmbedded.address });
      console.log('exportEvmWallet result:', res);
      if (res?.privateKey) {
        console.log('EVM embedded wallet private key:', res.privateKey);
      } else {
        console.log('EVM embedded wallet export result:', res);
      }
    } catch (err) {
      console.error('Failed to export EVM embedded wallet:', err);
    }
  };

  // 导出 Solana embedded wallet 私钥
  const handleExportSol = async () => {
    console.log('Export Solana button clicked');
    if (!solEmbedded) {
      console.log('No Solana embedded wallet found');
      return;
    }
    console.log('Solana embedded wallet address:', solEmbedded.address);
    try {
      console.log('Invoking exportSolWallet...');
      const res = await exportSolWallet({ address: solEmbedded.address });
      console.log('exportSolWallet result:', res);
      if (res?.privateKey) {
        console.log('Solana embedded wallet private key:', res.privateKey);
      } else {
        console.log('Solana embedded wallet export result:', res);
      }
    } catch (err) {
      console.error('Failed to export Solana embedded wallet:', err);
    }
  };

  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [walletState, setWalletState] = useState<WalletState>({});

  const logout = () => {
    privyLogout();
    setWalletState({});
  };

  const handleConnect = () => {
    login();
  };

  return (
    <div className="flex flex-row justify-between items-center">
      {ready && authenticated ? (
        <button
          onClick={() => setIsPanelOpen(true)}
          className="flex items-center gap-2 text-sm bg-violet-200 hover:text-violet-900 py-2 px-4 rounded-md text-violet-700 ml-4 transition-all duration-200 hover:bg-violet-300"
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M21 12V7H5C3.89543 7 3 6.10457 3 5C3 3.89543 3.89543 3 5 3H19C20.1046 3 21 3.89543 21 5V7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <rect
              x="3"
              y="7"
              width="18"
              height="14"
              rx="2"
              stroke="currentColor"
              strokeWidth="2"
            />
            <circle
              cx="16"
              cy="14"
              r="2"
              fill="currentColor"
            />
          </svg>
          <span>Wallet</span>
        </button>
      ) : (
        <button
          onClick={handleConnect}
          className="flex items-center gap-2 bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 text-white px-4 py-2 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <span className="font-medium">Connect</span>
        </button>
      )}

      <WalletPanel isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)} />
    </div>
  );
};

