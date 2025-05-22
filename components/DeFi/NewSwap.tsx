import React, { useState } from 'react';
import Image from 'next/image';
import { ChevronDown, AlertCircle, ArrowDownUp } from 'lucide-react';
import { motion } from 'framer-motion';

interface Token {
  symbol: string;
  name: string;
  logo: string;
  chain: string;
  chainLogo: string;
  address: string;
  balance?: number;
  price?: number;
}

interface SwapProps {
  className?: string;
}

const SOLANA_CHAIN_LOGO = "https://firebasestorage.googleapis.com/v0/b/sphereone-testing.appspot.com/o/images%2Fchainlogos%2FSolanaLogo64x64.png?alt=media&token=2de76040-d7b3-435d-85a0-0a973e6e2cf5";

const USDT_TOKEN: Token = {
  symbol: "USDT",
  name: "Tether USD",
  logo: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png",
  chain: "SOLANA",
  chainLogo: SOLANA_CHAIN_LOGO,
  address: "es9vmfrzacermjfrf4h2fyd4kconky11mcce8benwnyb",
  balance: 0,
  price: 1
};

const SOL_TOKEN: Token = {
  symbol: "SOL",
  name: "Solana",
  logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png",
  chain: "SOLANA",
  chainLogo: SOLANA_CHAIN_LOGO,
  address: "so11111111111111111111111111111111111111112",
  balance: 0,
  price: 167.82
};

export default function NewSwap({ className = '' }: SwapProps) {
  const [fromAmount, setFromAmount] = useState<string>("5");
  const [toAmount, setToAmount] = useState<string>("0.029804");
  const [fromToken, setFromToken] = useState<Token>(USDT_TOKEN);
  const [toToken, setToToken] = useState<Token>(SOL_TOKEN);
  const [slippage, setSlippage] = useState<number>(50);

  const handleAmountChange = (value: string) => {
    setFromAmount(value);
    // 这里可以添加价格计算逻辑
    const calculatedAmount = (parseFloat(value) / SOL_TOKEN.price!).toFixed(6);
    setToAmount(calculatedAmount);
  };

  const formatAddress = (address: string) => {
    if (address === SOL_TOKEN.address) return "...";
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  return (
    <div className={`text-card-foreground bg-background/95 backdrop-blur-sm border border-border/40 shadow-xl rounded-2xl mt-4 flex flex-col items-center gap-4 max-w-[550px] mb-6 ${className}`}>
      {/* Header with enhanced gradient */}
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-b border-border/40 rounded-t-2xl p-4 flex flex-row justify-between items-center gap-4 w-full">
        <div className="flex-1 w-full space-y-4">
          {/* From Token */}
          <motion.div 
            whileHover={{ scale: 1.01 }}
            className="flex flex-row bg-background/80 backdrop-blur-sm border border-border/40 shadow-lg items-start w-full p-4 rounded-xl transition-all duration-300 hover:shadow-xl hover:border-primary/20"
          >
            <div className="flex flex-col w-full justify-center gap-4">
              <p className="text-sm sm:text-lg text-left font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">From</p>
              <div className="flex w-full justify-between relative">
                <div className="flex w-1/2 items-center relative">
                  <div className="w-12 h-12 relative">
                    <Image
                      src={fromToken.logo}
                      alt={fromToken.symbol}
                      width={48}
                      height={48}
                      className="w-full h-full rounded-full border border-border/40 object-cover shadow-sm"
                    />
                    <Image
                      src={fromToken.chainLogo}
                      alt={fromToken.chain}
                      width={20}
                      height={20}
                      className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full object-cover border-2 border-background shadow-sm"
                    />
                  </div>
                </div>
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background/50 hover:bg-background/80 transition-colors duration-200">
                  <span className="text-xs text-muted-foreground">{fromToken.chain}</span>
                  <span className="font-semibold text-base tracking-tight">{fromToken.symbol}</span>
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <div className="flex w-full flex-row items-center justify-between flex-nowrap">
                <div className="relative group w-24 flex items-center gap-2">
                  <input
                    type="number"
                    value={fromAmount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    className="flex h-9 w-full border-input py-1 shadow-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-50 font-medium text-base bg-transparent border-0 border-b border-border/40 rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary transition-all hover:border-primary/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-primary/60 group-hover:w-full transition-all duration-300"></div>
                </div>
                <span className="text-base text-right min-w-16 font-medium text-muted-foreground">
                  ${(parseFloat(fromAmount) * (fromToken.price || 1)).toFixed(2)}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Swap Arrow with animation */}
          <motion.div 
            whileHover={{ scale: 1.1, rotate: 180 }}
            className="flex items-center justify-center cursor-pointer my-2"
          >
            <div className="p-2 rounded-full bg-background/80 border border-border/40 shadow-md hover:shadow-lg transition-all duration-300">
              <ArrowDownUp className="w-5 h-5 text-primary" />
            </div>
          </motion.div>

          {/* To Token */}
          <motion.div 
            whileHover={{ scale: 1.01 }}
            className="flex flex-row bg-background/80 backdrop-blur-sm border border-border/40 shadow-lg items-start w-full p-4 rounded-xl transition-all duration-300 hover:shadow-xl hover:border-primary/20"
          >
            <div className="flex flex-col w-full justify-center gap-4">
              <p className="text-sm sm:text-lg text-left font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">To</p>
              <div className="flex w-full justify-between relative">
                <div className="flex w-1/2 items-center relative">
                  <div className="w-12 h-12 relative">
                    <Image
                      src={toToken.logo}
                      alt={toToken.symbol}
                      width={48}
                      height={48}
                      className="w-full h-full rounded-full border border-border/40 object-cover shadow-sm"
                    />
                    <Image
                      src={toToken.chainLogo}
                      alt={toToken.chain}
                      width={20}
                      height={20}
                      className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full object-cover border-2 border-background shadow-sm"
                    />
                  </div>
                </div>
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background/50 hover:bg-background/80 transition-colors duration-200">
                  <span className="text-xs text-muted-foreground">{toToken.chain}</span>
                  <span className="font-semibold text-base tracking-tight">{toToken.symbol}</span>
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <div className="flex w-full flex-row items-center justify-between flex-nowrap">
                <span className="font-medium text-base w-24">{toAmount}</span>
                <span className="text-base text-right min-w-16 font-medium text-muted-foreground">
                  ${(parseFloat(toAmount) * (toToken.price || 1)).toFixed(2)}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Details Section with improved styling */}
      <div className="flex w-full p-4 pt-0 flex-col gap-3">
        <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-background/50 border border-border/40">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">From Token Address</span>
            <a 
              href={`https://solscan.io/token/${fromToken.address}`}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium hover:text-primary transition-colors duration-200"
            >
              {formatAddress(fromToken.address)}
            </a>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">To Token Address</span>
            <a 
              href={`https://solscan.io/token/${toToken.address}`}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium hover:text-primary transition-colors duration-200"
            >
              {formatAddress(toToken.address)}
            </a>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-background/50 border border-border/40">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"></path>
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Estimated Time</span>
              <span className="text-sm font-medium">0.00 min</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeWidth="2" d="M20 6H10m0 0a2 2 0 1 0-4 0m4 0a2 2 0 1 1-4 0m0 0H4m16 6h-2m0 0a2 2 0 1 0-4 0m4 0a2 2 0 1 1-4 0m0 0H4m16 6H10m0 0a2 2 0 1 0-4 0m4 0a2 2 0 1 1-4 0m0 0H4"></path>
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Slippage</span>
              <span className="text-sm font-medium">{slippage}%</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 p-3 rounded-xl bg-background/50 border border-border/40">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 12v4m0 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM8 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm0 0v2a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V8m0 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"></path>
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Exchange</span>
            <span className="text-sm font-medium">Jupiter Exchange</span>
          </div>
        </div>
      </div>

      {/* Action Button with enhanced styling */}
      <div className="items-center flex w-full p-4 pt-0 flex-col">
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-lg hover:shadow-xl h-12 px-6 py-2 w-full"
          disabled={!fromToken.balance}
        >
          Confirm Swap
        </motion.button>
        {!fromToken.balance && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-destructive text-sm mt-3 p-2 rounded-lg bg-destructive/10"
          >
            <AlertCircle className="w-4 h-4" />
            You don't have any balance for {fromToken.symbol} on {fromToken.chain}.
          </motion.div>
        )}
      </div>
    </div>
  );
} 