import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaExchangeAlt } from 'react-icons/fa';
import { SelectTokenModal, TokenInfo } from './SelectTokenModal';

interface Token {
  symbol: string;
  name: string;
  logo: string;
  chain: string;
  chainLogo: string;
  address: string;
  balance?: number;
  price?: number;
  decimals: number;
}

interface RoutePlan {
  swapInfo: {
    ammKey: string;
    label: string;
    inputMint: string;
    outputMint: string;
    inAmount: string;
    outAmount: string;
    feeAmount: string;
    feeMint: string;
  };
  percent: number;
}

interface Quote {
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  platformFee: any;
  priceImpactPct: string;
  routePlan: RoutePlan[];
  contextSlot: number;
  timeTaken: number;
  swapUsdValue: string;
  simplerRouteUsed: boolean;
  inputMintLogo?: string;
  outputMintLogo?: string;
}

// 定义 chat-new 响应的数据结构
interface ResponseData {
  success: boolean;
  message: string;
  data?: {
    intent: string;
    entities: {
      amount: number;
      fromToken: string;
      toToken: string;
      network: string;
      sourceChain: string | null;
      destinationChain: string | null;
    };
    missingInfo: any;
    response: string;
    workflowId: string;
  };
  thoughts?: string[];
  quote?: Quote;
}

interface NewSwapProps {
  fromToken?: Token;
  toToken?: Token;
  fromAmount?: string;
  slippage?: number;
  className?: string;
  quote?: Quote;
  thoughts?: string[];
  responseData?: ResponseData;
}

const USDT_TOKEN: Token = {
  symbol: "USDT",
  name: "Tether USD",
  logo: "",
  chain: "SOLANA",
  chainLogo: "",
  address: "es9vmfrzacermjfrf4h2fyd4kconky11mcce8benwnyb",
  balance: 0,
  price: 1,
  decimals: 6
};

const SOL_TOKEN: Token = {
  symbol: "SOL",
  name: "Solana",
  logo: "",
  chain: "SOLANA",
  chainLogo: "",
  address: "so11111111111111111111111111111111111111112",
  balance: 0,
  price: 167.82,
  decimals: 9
};

const DECIMALS = 6;

export default function NewSwap({
  fromToken: fromTokenProp,
  toToken: toTokenProp,
  fromAmount: fromAmountProp,
  slippage: slippageProp = 50,
  className = '',
  quote,
  thoughts,
  responseData
}: NewSwapProps) {
  console.log("NewSwap props:", { quote, thoughts, responseData });
  
  // Extract quote from responseData if available
  const actualQuote = quote || (responseData?.quote);
  const actualThoughts = thoughts || (responseData?.thoughts || []);
  
  console.log("Actual quote:", actualQuote);
  console.log("Quote input logo:", actualQuote?.inputMintLogo);
  console.log("Quote output logo:", actualQuote?.outputMintLogo);

  const [fromAmount, setFromAmount] = useState<string>(fromAmountProp || "1");
  const [toAmount, setToAmount] = useState<string>("0");
  const [fromToken, setFromToken] = useState<Token>(fromTokenProp || SOL_TOKEN);
  const [toToken, setToToken] = useState<Token>(toTokenProp || {
    symbol: "BONK",
    name: "Bonk",
    logo: "",
    chain: "SOLANA",
    chainLogo: "",
    address: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
    balance: 0,
    price: 0.000001,
    decimals: 9
  });
  const [slippage, setSlippage] = useState<number>(slippageProp);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'from' | 'to'>('from');
  const [showThoughts, setShowThoughts] = useState<boolean>(true);
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    if (fromTokenProp) setFromToken(fromTokenProp);
  }, [fromTokenProp]);
  useEffect(() => {
    if (toTokenProp) setToToken(toTokenProp);
  }, [toTokenProp]);
  useEffect(() => {
    if (fromAmountProp !== undefined) setFromAmount(fromAmountProp);
  }, [fromAmountProp]);
  useEffect(() => {
    if (slippageProp !== undefined) setSlippage(slippageProp);
  }, [slippageProp]);

  // Handle quote data
  useEffect(() => {
    if (actualQuote) {
      console.log("Processing quote in useEffect:", actualQuote);
      
      // Update token information
      if (actualQuote.inputMint) {
        setFromToken(prev => ({
          ...prev,
          address: actualQuote.inputMint,
          logo: actualQuote.inputMintLogo || prev.logo,
          decimals: prev.decimals || 9
        }));
      }
      
      if (actualQuote.outputMint) {
        setToToken(prev => ({
          ...prev,
          address: actualQuote.outputMint,
          logo: actualQuote.outputMintLogo || prev.logo,
          decimals: prev.decimals || 6
        }));
      }

      // Update amounts with proper decimal handling
      if (actualQuote.inAmount) {
        const inputDecimals = fromToken.decimals || 9;
        const normalizedAmount = (parseInt(actualQuote.inAmount) / Math.pow(10, inputDecimals)).toString();
        setFromAmount(normalizedAmount);
      }
      
      if (actualQuote.outAmount) {
        const outputDecimals = toToken.decimals || 6;
        const normalizedAmount = (parseInt(actualQuote.outAmount) / Math.pow(10, outputDecimals)).toString();
        setToAmount(normalizedAmount);
      }

      if (actualQuote.slippageBps !== undefined) {
        setSlippage(actualQuote.slippageBps);
      }
    }
  }, [actualQuote]);

  const handleAmountChange = (value: string) => {
    if (!value) {
      setFromAmount("0");
      setToAmount("0");
      return;
    }
    
    let val = value.replace(/[^0-9.]/g, '');
    val = val.replace(/^([^.]*\.)|\./g, '$1');
    if (val.includes('.')) {
      const [int, dec] = val.split('.');
      val = int + '.' + dec.slice(0, fromToken.decimals);
    }
    setFromAmount(val);
    
    // 确保toAmount的计算正确
    if (val && !isNaN(parseFloat(val))) {
      const calculatedAmount = (parseFloat(val) * (toToken.price || 1)).toFixed(toToken.decimals);
      setToAmount(calculatedAmount);
    } else {
      setToAmount("0");
    }
  };

  const formatAddress = (address: string) => {
    if (address === SOL_TOKEN.address) return "...";
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  const handleTokenSelect = (token: TokenInfo) => {
    const fullToken: Token = {
      symbol: token.symbol,
      name: token.name,
      logo: token.image || '',
      chain: fromToken.chain || 'SOLANA',
      chainLogo: '',
      address: token.mint || '',
      balance: token.balance || 0,
      price: 0,
      decimals: 9
    };
    if (modalType === 'from') setFromToken(fullToken);
    else setToToken(fullToken);
  };

  async function fetchTokenInfoByAddress(address: string): Promise<TokenInfo | null> {
    // mock: you can replace with real API
    if (address.toLowerCase() === 'so11111111111111111111111111111111111111112') {
      return {
        symbol: 'SOL',
        name: 'Solana',
        logo: '',
        address,
        chain: 'SOLANA',
        mint: address,
        decimals: 9,
        image: '',
        balance: 0
      } as any;
    }
    if (address.toLowerCase() === 'dezxaz8z7pnrnjjz3wxborgixca6xjnb7yab1ppb263') {
      return {
        symbol: 'BONK',
        name: 'Bonk',
        logo: '',
        address,
        chain: 'SOLANA',
        mint: address,
        decimals: 9,
        image: '',
        balance: 0
      } as any;
    }
    if (address.toLowerCase() === 'es9vmfrzacermjfrf4h2fyd4kconky11mcce8benwnyb') {
      return {
        symbol: 'USDT',
        name: 'Tether USD',
        logo: '',
        address,
        chain: 'SOLANA',
        mint: address,
        decimals: 6,
        image: '',
        balance: 0
      } as any;
    }
    return null;
  }

  // Debug output for logos
  const fromLogoUrl = (actualQuote && actualQuote.inputMintLogo) ? actualQuote.inputMintLogo : (fromToken.logo || '/token-placeholder.svg');
  const toLogoUrl = (actualQuote && actualQuote.outputMintLogo) ? actualQuote.outputMintLogo : (toToken.logo || '/token-placeholder.svg');
  
  console.log("From logo URL:", fromLogoUrl);
  console.log("To logo URL:", toLogoUrl);

  const handleConfirm = async () => {
    if (isConfirming) return;
    
    try {
      setIsConfirming(true);
      const workflowId = responseData?.data?.workflowId || '';
      
      const response = await fetch('/api/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workflowId,
          operationType: 'swap'
        }),
      });

      const result = await response.json();
      
      if (result.error) {
        setError(result.error);
      } else {
        // Handle successful confirmation
        console.log('Confirmation successful:', result);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <>
      {/* Debug info */}
      {/* {process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-100 p-2 text-xs rounded mb-2 overflow-auto max-h-40">
          <p>Debug Info:</p>
          <pre>Quote: {JSON.stringify(actualQuote, null, 2)}</pre>
        </div>
      )} */}
    
      {actualThoughts && actualThoughts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className={`border shadow-lg rounded-2xl mt-2 flex flex-col items-center gap-4 max-w-[480px] mb-3 p-0 w-full text-gray-900 bg-white/90 backdrop-blur-md hover:shadow-xl transition-all duration-200 ${className}`}
          style={{ minWidth: 0 }}
        >
          <div className="flex justify-between items-center w-full px-4 py-2 border-b border-gray-100 bg-gradient-to-t from-primary/10 to-white rounded-t-2xl">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="font-medium text-sm">MiraiX Thoughts</span>
            </div>
            <button 
              onClick={() => setShowThoughts(!showThoughts)} 
              className="text-gray-500 hover:text-gray-700"
            >
              {showThoughts ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              )}
            </button>
          </div>
          {showThoughts && (
            <div className="w-full p-4 text-sm">
              <ul className="list-disc pl-5 space-y-1">
                {actualThoughts.map((thought: string, index: number) => (
                  <li key={index} className="text-gray-700">{thought}</li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>
      )}
      
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className={`border shadow-lg rounded-2xl mt-2 flex flex-col items-center gap-4 max-w-[480px] mb-3 p-0 w-full text-gray-900 bg-white/90 backdrop-blur-md hover:shadow-xl transition-all duration-200 ${className}`}
        style={{ minWidth: 0 }}
      >
        {/* Header with Icon */}
        <div className="flex flex-row items-center gap-1.5 w-full px-3 py-1.5 border-b border-gray-100 bg-gradient-to-t from-primary/10 to-white rounded-t-2xl">
          <div className="bg-gradient-to-tr from-blue-400 to-cyan-400 rounded-full p-1.5 shadow-md flex items-center justify-center">
            <FaExchangeAlt className="text-white w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-primary text-xs tracking-wide">Swap</span>
        </div>
        {/* Swap Main Block */}
        <div className="flex flex-col w-full gap-2 p-4 bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#e0e7ef] rounded-2xl mx-4 mt-2 shadow-sm">
          <p className="text-sm text-left font-bold text-primary">From</p>
          <div className="flex w-full justify-between relative mb-1">
            <div className="flex w-1/2 items-center gap-3 relative">
              <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center shadow">
                <img 
                  src={fromLogoUrl} 
                  alt={fromToken.symbol} 
                  className="w-5 h-5" 
                />
              </div>
              <span className="font-bold text-sm text-blue-600">{fromToken.symbol}</span>
            </div>
            <div className="flex flex-col items-end text-right">
              <span className="text-xs text-right font-normal text-gray-500">{fromToken.chain}</span>
              <button className="flex font-semibold text-sm tracking-tight hover:text-primary transition-colors items-center gap-1" onClick={() => { setModalType('from'); setModalOpen(true); }}>
                {fromToken.symbol}
                <svg className="w-2.5 h-2.5 ml-1 text-primary" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" /></svg>
              </button>
            </div>
          </div>
          <div className="flex w-full flex-row items-center justify-between flex-nowrap">
            <div className="relative group w-36 h-10 flex items-center gap-2 bg-white/80 border border-gray-200 rounded-lg px-3 shadow-inner">
              <input
                type="number"
                value={fromAmount}
                readOnly
                className="flex w-full bg-transparent border-0 outline-none font-semibold text-sm placeholder:text-gray-400 focus:ring-0"
                placeholder="Amount"
              />
            </div>
            <span className="text-sm text-right min-w-20 font-semibold text-gray-900 flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 1v22M5 6h14M5 18h14" /></svg>
              ${(parseFloat(fromAmount) * (fromToken.price || 1)).toFixed(2)}
            </span>
          </div>
        </div>
        {/* Arrow */}
        <div className="flex items-center justify-center cursor-pointer hover:opacity-80 rotate-90">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-up-down"><path d="m21 16-4 4-4-4"></path><path d="M17 20V4"></path><path d="m3 8 4-4 4 4"></path><path d="M7 4v16"></path></svg>
        </div>
        {/* To Block */}
        <div className="flex flex-col w-full gap-2 p-4 bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#e0e7ef] rounded-2xl mx-4 mb-2 shadow-sm">
          <p className="text-sm text-left font-bold text-primary">To</p>
          <div className="flex w-full justify-between relative mb-1">
            <div className="flex w-1/2 items-center gap-3 relative">
              <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center shadow">
                <img 
                  src={toLogoUrl} 
                  alt={toToken.symbol} 
                  className="w-5 h-5" 
                />
              </div>
              <span className="font-bold text-sm text-blue-600">{toToken.symbol}</span>
            </div>
            <div className="flex flex-col items-end text-right">
              <span className="text-xs text-right font-normal text-gray-500">{toToken.chain}</span>
              <button className="flex font-semibold text-sm tracking-tight hover:text-primary transition-colors items-center gap-1" onClick={() => { setModalType('to'); setModalOpen(true); }}>
                {toToken.symbol}
                <svg className="w-2.5 h-2.5 ml-1 text-primary" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" /></svg>
              </button>
            </div>
          </div>
          <div className="flex w-full flex-row items-center justify-between flex-nowrap">
            <div className="relative group w-36 h-10 flex items-center gap-2 bg-white/80 border border-gray-200 rounded-lg px-3 shadow-inner">
              <span className="font-semibold text-sm w-full h-8 flex items-center">
                {toAmount && !isNaN(parseFloat(toAmount)) ? Number(toAmount).toFixed(toToken.decimals) : "0"}
              </span>
            </div>
            <span className="text-sm text-right min-w-20 font-semibold text-gray-900 flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 1v22M5 6h14M5 18h14" /></svg>
              ${(parseFloat(toAmount) * (toToken.price || 1)).toFixed(2)}
            </span>
          </div>
        </div>
        
        {/* Divider */}
        <div className="w-full h-[1px] bg-gradient-to-r from-blue-200 via-cyan-200 to-transparent my-1 rounded-full" />
        {/* Details Section */}
        <div className="flex w-full p-4 pt-0 flex-col gap-3">
          <div className="flex flex-col items-center w-full">
            <div className="flex flex-row items-center w-full">
              <label className="text-xs text-gray-500 min-w-[80px]">Slippage:</label>
              <span className="text-xs text-gray-500 leading-6 ml-auto">{(slippage / 100).toFixed(2)} %</span>
            </div>
            {actualQuote && (
              <div className="flex flex-row items-center w-full">
                <label className="text-xs text-gray-500 min-w-[80px]">Price Impact:</label>
                <span className="text-xs text-gray-500 leading-6 ml-auto">
                  {actualQuote.priceImpactPct === "0" ? "< 0.01%" : `${parseFloat(actualQuote.priceImpactPct).toFixed(2)}%`}
                </span>
              </div>
            )}
            {actualQuote && actualQuote.swapUsdValue && (
              <div className="flex flex-row items-center w-full">
                <label className="text-xs text-gray-500 min-w-[80px]">Swap Value:</label>
                <span className="text-xs text-gray-500 leading-6 ml-auto">${parseFloat(actualQuote.swapUsdValue).toFixed(2)} USD</span>
              </div>
            )}
          </div>
        </div>
        {/* Action Button and Error */}
        <div className="items-center flex w-full p-4 pt-0 flex-col">
          <button
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold border-0 bg-gradient-to-r from-blue-500 to-cyan-400 text-white hover:from-blue-600 hover:to-cyan-500 h-10 px-4 py-1.5 w-full shadow-md hover:shadow-lg transition-all duration-150 active:scale-95 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!fromToken.balance || isConfirming}
            onClick={handleConfirm}
          >
            {isConfirming ? 'Confirming...' : 'Confirm'}
          </button>
          {error && (
            <div className="flex items-center gap-2 text-destructive text-xs mt-2">
              <span className="inline-block w-2 h-2 rounded-full bg-destructive"></span>
              <span>{error}</span>
            </div>
          )}
        </div>
      </motion.div>
      <SelectTokenModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSelect={handleTokenSelect}
      />
    </>
  );
} 