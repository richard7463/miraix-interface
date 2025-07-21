// @ts-nocheck - Privy configuration type compatibility
'use client';

import {PrivyProvider} from '@privy-io/react-auth';
import {toSolanaWalletConnectors} from "@privy-io/react-auth/solana";

export default function Providers({children}: {children: React.ReactNode}) {
  return (
    <PrivyProvider
      appId={"cm9o068p3010nky0lp4w3plj1"}
      clientId={process.env.NEXT_PUBLIC_PRIVY_APP_CLIENT_ID!}
      config={{
        // Create embedded wallets for users who don't have a wallet
        embeddedWallets: {
          ethereum: {
            createOnLogin: "all-users",
          },
          // @ts-ignore - Privy Solana chain configuration
          solana: {
            createOnLogin: "all-users",
            chain: "mainnet-beta"
          }
        },
        appearance: {
          walletChainType: 'ethereum-and-solana',
          theme: 'light'
        },
        externalWallets: {
          solana: {
            connectors: toSolanaWalletConnectors()
          }
        }
      }}
    >
      {children}
    </PrivyProvider>
  );
}