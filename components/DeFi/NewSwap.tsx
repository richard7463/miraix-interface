import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaExchangeAlt } from 'react-icons/fa';
import { SelectTokenModal, TokenInfo } from './SelectTokenModal';
import { usePrivy } from '@privy-io/react-auth';
import { useSolanaWallets } from '@privy-io/react-auth/solana';
import { Connection, Transaction, PublicKey, VersionedTransaction, VersionedMessage } from '@solana/web3.js';
import toast from 'react-hot-toast';

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
  error?: string;
  result?: {
    quote?: {
      value?: Quote;
    };
    [key: string]: any;
  };
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
  onTransactionSuccess?: (txid: string, fromToken: Token, toToken: Token, fromAmount: string, toAmount: string) => void;
}

// 移除硬编码的 token 定义和 getTokenDecimals 函数
// 所有 token 信息都将从 Jupiter API 动态获取

export default function NewSwap({
  fromToken: fromTokenProp,
  toToken: toTokenProp,
  fromAmount: fromAmountProp,
  slippage: slippageProp = 50,
  className = '',
  quote,
  thoughts,
  responseData,
  onTransactionSuccess
}: NewSwapProps) {
  console.log("🚀 NewSwap component rendered!");
  console.log("NewSwap props:", { quote, thoughts, responseData });
  console.log("NewSwap fromAmountProp:", fromAmountProp);
  console.log("NewSwap fromTokenProp:", fromTokenProp);
  console.log("NewSwap toTokenProp:", toTokenProp);
  console.log("NewSwap responseData details:", {
    success: responseData?.success,
    error: responseData?.error,
    hasQuote: !!responseData?.quote,
    message: responseData?.message
  });
  
  // Extract quote from responseData if available
  const actualQuote = quote || (responseData?.quote) || (responseData?.result?.quote?.value);
  const actualThoughts = thoughts || (responseData?.thoughts || []);
  
  console.log("Actual quote:", actualQuote);
  console.log("Quote input logo:", actualQuote?.inputMintLogo);
  console.log("Quote output logo:", actualQuote?.outputMintLogo);
  console.log("Quote inAmount:", actualQuote?.inAmount);
  console.log("Quote outAmount:", actualQuote?.outAmount);

  const [fromAmount, setFromAmount] = useState<string>(fromAmountProp || "0");
  const [toAmount, setToAmount] = useState<string>("0");
  
  // 使用动态获取的 token 信息，不再硬编码默认值
  const [fromToken, setFromToken] = useState<Token>(() => {
    if (fromTokenProp) {
      // 如果 fromTokenProp 的 address 是 symbol，转换为正确的地址
      let address = fromTokenProp.address;
      if (fromTokenProp.address === 'SOL') {
        address = 'So11111111111111111111111111111111111111112';
      } else if (fromTokenProp.address === 'USDC') {
        address = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
      } else if (fromTokenProp.address === 'USDT') {
        address = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB';
      } else if (fromTokenProp.address === 'BONK') {
        address = 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263';
      } else if (fromTokenProp.address === 'JUP') {
        address = 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN';
      }
      
      return {
        ...fromTokenProp,
        address
      };
    }
    return {
      symbol: "SOL",
      name: "Solana",
      logo: "",
      chain: "SOLANA",
      chainLogo: "",
      address: "So11111111111111111111111111111111111111112",
      balance: 0,
      price: 0,
      decimals: 9
    };
  });
  
  const [toToken, setToToken] = useState<Token>(() => {
    if (toTokenProp) {
      // 如果 toTokenProp 的 address 是 symbol，转换为正确的地址
      let address = toTokenProp.address;
      if (toTokenProp.address === 'SOL') {
        address = 'So11111111111111111111111111111111111111112';
      } else if (toTokenProp.address === 'USDC') {
        address = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
      } else if (toTokenProp.address === 'USDT') {
        address = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB';
      } else if (toTokenProp.address === 'BONK') {
        address = 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263';
      } else if (toTokenProp.address === 'JUP') {
        address = 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN';
      }
      
      return {
        ...toTokenProp,
        address
      };
    }
    return {
      symbol: "USDC",
      name: "USD Coin",
      logo: "",
      chain: "SOLANA",
      chainLogo: "",
      address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      balance: 0,
      price: 0,
      decimals: 6
    };
  });
  
  const [slippage, setSlippage] = useState<number>(slippageProp);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'from' | 'to'>('from');
  const [showThoughts, setShowThoughts] = useState<boolean>(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const { wallets } = useSolanaWallets();
  const { getAccessToken } = usePrivy();

  // 处理 responseData 中的错误信息
  useEffect(() => {
    console.log('[NewSwap] responseData changed:', responseData);
    console.log('[NewSwap] Current error state:', error);
    if (responseData && !responseData.success && responseData.error) {
      console.log('[NewSwap] Setting error from responseData:', responseData.error);
      setError(responseData.error);
    } else if (responseData && responseData.success) {
      console.log('[NewSwap] Clearing error - success response');
      setError(null); // 清除之前的错误
    }
  }, [responseData]);

  useEffect(() => {
    if (fromTokenProp) {
      // 确保 address 字段使用正确的地址而不是 symbol
      let address = fromTokenProp.address;
      if (fromTokenProp.address === 'SOL') {
        address = 'So11111111111111111111111111111111111111112';
      } else if (fromTokenProp.address === 'USDC') {
        address = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
      } else if (fromTokenProp.address === 'USDT') {
        address = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB';
      } else if (fromTokenProp.address === 'BONK') {
        address = 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263';
      } else if (fromTokenProp.address === 'JUP') {
        address = 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN';
      }
      
      setFromToken(prev => ({
        ...fromTokenProp,
        address
      }));
    }
  }, [fromTokenProp]);
  useEffect(() => {
    if (toTokenProp) {
      // 确保 address 字段使用正确的地址而不是 symbol
      let address = toTokenProp.address;
      if (toTokenProp.address === 'SOL') {
        address = 'So11111111111111111111111111111111111111112';
      } else if (toTokenProp.address === 'USDC') {
        address = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
      } else if (toTokenProp.address === 'USDT') {
        address = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB';
      } else if (toTokenProp.address === 'BONK') {
        address = 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263';
      } else if (toTokenProp.address === 'JUP') {
        address = 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN';
      }
      
      setToToken(prev => ({
        ...toTokenProp,
        address
      }));
    }
  }, [toTokenProp]);
  useEffect(() => {
    if (fromAmountProp !== undefined) {
      console.log('[NewSwap] Setting fromAmount from fromAmountProp:', fromAmountProp);
      setFromAmount(fromAmountProp);
    }
  }, [fromAmountProp]);
  useEffect(() => {
    if (slippageProp !== undefined) setSlippage(slippageProp);
  }, [slippageProp]);

  // 使用 Jupiter API 获取 token 信息
  const getTokenInfoFromJupiter = async (mintAddress: string) => {
    try {
      console.log(`🔍 从 Jupiter API 获取 token 信息: ${mintAddress}`);
      const response = await fetch(`https://tokens.jup.ag/token/${mintAddress}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const tokenData = await response.json();
      console.log(`✅ Jupiter API 返回的 token 信息:`, {
        symbol: tokenData.symbol,
        name: tokenData.name,
        decimals: tokenData.decimals,
        logoURI: tokenData.logoURI
      });
      
      return tokenData;
    } catch (error) {
      console.error(`❌ 从 Jupiter API 获取 token 信息失败: ${mintAddress}`, error);
      return null;
    }
  };

  // Handle quote data
  useEffect(() => {
    if (actualQuote) {
      console.log("🔄 Processing quote in useEffect:", actualQuote);
      console.log("🔄 Current toToken state before processing:", {
        symbol: toToken.symbol,
        decimals: toToken.decimals,
        address: toToken.address
      });
      
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
        // 异步获取 token decimals
        const processOutputMint = async () => {
          // 使用 Jupiter API 获取 token 信息来确定正确的 decimals
          const getTokenDecimalsFromAPI = async (mintAddress: string) => {
            try {
              const response = await fetch(`https://tokens.jup.ag/token/${mintAddress}`);
              if (response.ok) {
                const tokenData = await response.json();
                return tokenData.decimals;
              }
            } catch (error) {
              console.warn(`⚠️ 无法从 API 获取 ${mintAddress} 的 decimals`);
            }
            return 6; // 默认 fallback
          };
          
          const correctDecimals = await getTokenDecimalsFromAPI(actualQuote.outputMint);
          console.log("🔄 Setting toToken with correct decimals:", {
            currentSymbol: toToken.symbol,
            correctDecimals: correctDecimals,
            outputMint: actualQuote.outputMint
          });
          
          setToToken(prev => {
            const newToToken = {
              ...prev,
              address: actualQuote.outputMint,
              logo: actualQuote.outputMintLogo || prev.logo,
              decimals: correctDecimals
            };
            console.log("🔄 New toToken state:", newToToken);
            return newToToken;
          });
        };
        
        processOutputMint();
      }

      // Update amounts with proper decimal handling
      if (fromAmountProp) {
        // 优先使用传入的 fromAmountProp，不依赖 Jupiter API 的 inAmount
        console.log('[NewSwap] Using fromAmountProp:', fromAmountProp);
        setFromAmount(fromAmountProp);
      } else {
        // 只有在没有 fromAmountProp 时才使用 quote 中的金额
        console.log('[NewSwap] No fromAmountProp provided, using quote inAmount');
        console.log('[NewSwap] Quote inAmount:', actualQuote.inAmount);
        
        // 异步获取 input token decimals
        const processInputMint = async () => {
          const getTokenDecimalsFromAPI = async (mintAddress: string) => {
            try {
              const response = await fetch(`https://tokens.jup.ag/token/${mintAddress}`);
              if (response.ok) {
                const tokenData = await response.json();
                return tokenData.decimals;
              }
            } catch (error) {
              console.warn(`⚠️ 无法从 API 获取 ${mintAddress} 的 decimals`);
            }
            return 9; // 默认 fallback
          };
          
          const inputDecimals = await getTokenDecimalsFromAPI(actualQuote.inputMint);
          const normalizedAmount = (parseInt(actualQuote.inAmount) / Math.pow(10, inputDecimals)).toString();
          setFromAmount(normalizedAmount);
          
          // 同时更新 fromToken 的 decimals
          setFromToken(prev => ({
            ...prev,
            decimals: inputDecimals
          }));
        };
        
        processInputMint();
      }
      
      if (actualQuote.outAmount) {
        // 异步获取 token 信息并计算 toAmount
        const processToAmount = async () => {
          // 获取 output token 信息
          const outputTokenInfo = await getTokenInfoFromJupiter(actualQuote.outputMint);
          
          if (outputTokenInfo) {
            const correctSymbol = outputTokenInfo.symbol;
            const correctDecimals = outputTokenInfo.decimals;
            
            // 🔍 添加详细的调试信息
            console.log('🔍 toAmount 计算调试信息:');
            console.log('  - actualQuote.outputMint:', actualQuote.outputMint);
            console.log('  - toToken.symbol (before):', toToken.symbol);
            console.log('  - correctSymbol (from Jupiter):', correctSymbol);
            console.log('  - toToken.decimals (before):', toToken.decimals);
            console.log('  - correctDecimals (from Jupiter):', correctDecimals);
            console.log('  - actualQuote.outAmount:', actualQuote.outAmount);
            console.log('  - 计算过程: parseInt(actualQuote.outAmount) / Math.pow(10, correctDecimals)');
            console.log('  - parseInt(actualQuote.outAmount):', parseInt(actualQuote.outAmount));
            console.log('  - Math.pow(10, correctDecimals):', Math.pow(10, correctDecimals));
            console.log('  - 除法结果:', parseInt(actualQuote.outAmount) / Math.pow(10, correctDecimals));
            
            const normalizedAmount = (parseInt(actualQuote.outAmount) / Math.pow(10, correctDecimals)).toString();
            console.log('  - 最终 normalizedAmount:', normalizedAmount);
            
            setToAmount(normalizedAmount);
            
            // 同时更新 toToken 的 symbol 和 decimals 确保一致性
            setToToken(prev => ({
              ...prev,
              symbol: correctSymbol,
              decimals: correctDecimals,
              name: outputTokenInfo.name,
              logo: outputTokenInfo.logoURI || prev.logo
            }));
          } else {
            // 如果 Jupiter API 失败，使用 fallback 方法
            console.warn('⚠️ Jupiter API 获取 token 信息失败，使用 fallback 方法');
            
            // 尝试从 Jupiter API 获取 decimals 作为 fallback
            const getFallbackDecimals = async (mintAddress: string) => {
              try {
                const response = await fetch(`https://tokens.jup.ag/token/${mintAddress}`);
                if (response.ok) {
                  const tokenData = await response.json();
                  return tokenData.decimals;
                }
              } catch (error) {
                console.warn(`⚠️ Fallback API 也失败了: ${mintAddress}`);
              }
              return 6; // 最后的 fallback
            };
            
            const fallbackDecimals = await getFallbackDecimals(actualQuote.outputMint);
            const normalizedAmount = (parseInt(actualQuote.outAmount) / Math.pow(10, fallbackDecimals)).toString();
            setToAmount(normalizedAmount);
          }
        };
        
        processToAmount();
      }

      if (actualQuote.slippageBps !== undefined) {
        setSlippage(actualQuote.slippageBps);
      }
    }
  }, [actualQuote]);

  // 自动查询 embedded wallet 余额
  useEffect(() => {
    const fetchBalance = async () => {
      const embeddedWallet = wallets?.find(wallet => wallet.walletClientType === 'privy');
      console.log('[NewSwap] embeddedWallet:', embeddedWallet);
      console.log('[NewSwap] fromToken:', fromToken);
      if (!embeddedWallet?.address) {
        setFromToken(prev => ({ ...prev, balance: 0 }));
        return;
      }
      
      // 如果没有地址，但代币是 SOL，仍然可以查询余额
      if (!fromToken?.address && fromToken?.symbol !== 'SOL') {
        setFromToken(prev => ({ ...prev, balance: 0 }));
        return;
      }
      
      // 使用项目中已有的 RPC 端点
      const connection = new Connection('https://summer-wider-road.solana-mainnet.quiknode.pro/a2075ac578a82df2b00d14546fd7bb29c15d8ba3/', 'confirmed');
      const userPublicKey = new PublicKey(embeddedWallet.address);
      console.log('[NewSwap] 查询钱包地址:', userPublicKey.toBase58());
      try {
        let balance: number | undefined = 0;
        if (!fromToken.address || fromToken.address.toLowerCase() === 'So11111111111111111111111111111111111111112') {
          // 查询 SOL 余额
          const lamports = await connection.getBalance(userPublicKey);
          balance = lamports / 1e9;
          console.log('[NewSwap] lamports:', lamports, 'SOL:', balance);
        } else {
          // 查询 SPL Token 余额
          console.log('[NewSwap] 检查 fromToken.address:', fromToken.address);
          
          // 验证地址格式，如果不是有效的Solana地址，尝试使用quote中的inputMint
          let tokenMintAddress: PublicKey;
          try {
            tokenMintAddress = new PublicKey(fromToken.address);
          } catch (addressError) {
            console.warn('[NewSwap] fromToken.address 不是有效的Solana地址:', fromToken.address);
            
            // 尝试使用quote中的inputMint
            if (actualQuote && actualQuote.inputMint) {
              console.log('[NewSwap] 使用 quote.inputMint:', actualQuote.inputMint);
              try {
                tokenMintAddress = new PublicKey(actualQuote.inputMint);
              } catch (quoteAddressError) {
                console.error('[NewSwap] quote.inputMint 也不是有效的地址:', actualQuote.inputMint);
                throw new Error(`Invalid token address: ${fromToken.address}`);
              }
            } else {
              throw new Error(`Invalid token address: ${fromToken.address}`);
            }
          }
          
          const tokenAccounts = await connection.getParsedTokenAccountsByOwner(userPublicKey, {
            mint: tokenMintAddress,
          });
          console.log('[NewSwap] tokenAccounts:', tokenAccounts);
          if (tokenAccounts.value.length > 0 && tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount) {
            balance = tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount;
          }
        }
        console.log('[NewSwap] 查询到余额:', balance);
        setFromToken(prev => ({ ...prev, balance }));
      } catch (error) {
        console.error('[NewSwap] 查询余额失败:', error);
        
        // 提供更友好的错误信息
        if (error instanceof Error) {
          if (error.message.includes('Invalid public key input')) {
            console.error('[NewSwap] Token地址无效，无法查询余额');
          } else if (error.message.includes('Invalid token address')) {
            console.error('[NewSwap] Token地址格式错误');
          }
        }
        
        setFromToken(prev => ({ ...prev, balance: 0 }));
      }
    };
    fetchBalance();
  }, [fromToken.address, fromToken.symbol, wallets]);

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
    
    // 移除错误的toAmount计算，让toAmount只通过quote数据来设置
    // toAmount应该由Jupiter API的quote数据决定，而不是通过简单的价格计算
  };

  const formatAddress = (address: string) => {
    if (address === 'So11111111111111111111111111111111111111112') return "...";
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
    try {
      console.log(`🔍 fetchTokenInfoByAddress: 获取地址 ${address} 的 token 信息`);
      
      // 使用 Jupiter API 获取 token 信息
      const response = await fetch(`https://tokens.jup.ag/token/${address}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const tokenData = await response.json();
      console.log(`✅ fetchTokenInfoByAddress: 成功获取 token 信息:`, {
        symbol: tokenData.symbol,
        name: tokenData.name,
        decimals: tokenData.decimals,
        logoURI: tokenData.logoURI
      });
      
      return {
        symbol: tokenData.symbol,
        name: tokenData.name,
        logo: tokenData.logoURI || '',
        address,
        chain: 'SOLANA',
        mint: address,
        decimals: tokenData.decimals,
        image: tokenData.logoURI || '',
        balance: 0
      } as any;
    } catch (error) {
      console.error(`❌ fetchTokenInfoByAddress: 获取 token 信息失败: ${address}`, error);
      return null;
    }
  }

  // Debug output for logos
  const getLocalLogoUrl = (symbol: string) => {
    const tokenSymbol = symbol.toLowerCase();
    if (tokenSymbol === 'bonk') return '/tokens/bonk.png';
    if (tokenSymbol === 'jup') return '/tokens/jup.png';
    if (tokenSymbol === 'usdt') return '/tokens/usdt.png';
    if (tokenSymbol === 'usdc') return '/tokens/usdc.png';
    if (tokenSymbol === 'sol') return '/tokens/sol.png';
    return null;
  };
  
  const fromLogoUrl = fromToken.logo || 
                     (actualQuote && actualQuote.inputMintLogo) || 
                     getLocalLogoUrl(fromToken.symbol) || 
                     'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png';
  const toLogoUrl = toToken.logo || 
                   (actualQuote && actualQuote.outputMintLogo) || 
                   getLocalLogoUrl(toToken.symbol) || 
                   'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png';
  
  console.log("From logo URL:", fromLogoUrl);
  console.log("To logo URL:", toLogoUrl);
  console.log("From token info:", {
    symbol: fromToken.symbol,
    logo: fromToken.logo,
    quoteLogo: actualQuote?.inputMintLogo,
    localLogo: getLocalLogoUrl(fromToken.symbol)
  });
  console.log("To token info:", {
    symbol: toToken.symbol,
    logo: toToken.logo,
    quoteLogo: actualQuote?.outputMintLogo,
    localLogo: getLocalLogoUrl(toToken.symbol)
  });

  const handleConfirm = async () => {
    console.log('🔘 handleConfirm clicked!');
    console.log('Current state:', {
      isConfirming,
      fromTokenBalance: fromToken.balance,
      hasError: !!error,
      hasQuote: !!actualQuote,
      walletsCount: wallets?.length,
      embeddedWallet: wallets?.find(wallet => wallet.walletClientType === 'privy')
    });

    if (isConfirming) {
      console.log('❌ Already confirming, returning early');
      return;
    }

    // 1. 检查钱包
    const embeddedWallet = wallets?.find(wallet => wallet.walletClientType === 'privy');
    console.log('🔍 Checking wallet:', embeddedWallet);
    
    if (!embeddedWallet) {
      console.log('❌ No embedded wallet found');
      setError('Embedded wallet not found, please connect your wallet');
      return;
    }
    
    if (!actualQuote) {
      console.log('❌ No quote available');
      setError('Missing quote information');
      return;
    }

    // 2. 重新检查余额（确保获取最新余额）
    console.log('💰 Checking balance before transaction...');
    const connection = new Connection('https://summer-wider-road.solana-mainnet.quiknode.pro/a2075ac578a82df2b00d14546fd7bb29c15d8ba3/', 'confirmed');
    const userPublicKey = new PublicKey(embeddedWallet.address);
    console.log('💰 Checking balance for address:', userPublicKey.toBase58());
    console.log('💰 From token:', fromToken.symbol, 'Address:', fromToken.address);
    console.log('💰 From amount:', fromAmount);
    
    try {
      // 检查 SOL 余额（用于支付交易费用）
      const solBalance = await connection.getBalance(userPublicKey);
      const solBalanceInSol = solBalance / 1e9;
      console.log('💰 SOL balance:', solBalanceInSol, 'lamports:', solBalance);
      
      if (solBalanceInSol < 0.01) {
        setError('Insufficient SOL balance. Need at least 0.01 SOL for transaction fees');
        return;
      }

      // 检查是否有包装的 SOL 账户
      if (fromToken.address.toLowerCase() === 'So11111111111111111111111111111111111111112') {
        console.log('🔍 Checking for wrapped SOL accounts...');
        try {
          // 检查 wSOL 账户 (So11111111111111111111111111111111111111112)
          const wsolMint = new PublicKey('So11111111111111111111111111111111111111112');
          const wsolAccounts = await connection.getParsedTokenAccountsByOwner(userPublicKey, {
            mint: wsolMint,
          });
          
          if (wsolAccounts.value.length > 0) {
            const wsolBalance = wsolAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount || 0;
            console.log('🔍 Found wSOL account with balance:', wsolBalance);
            if (wsolBalance > 0) {
              console.log('🔍 Total available SOL (native + wrapped):', solBalanceInSol + wsolBalance);
            }
          }
        } catch (wsolError: any) {
          console.log('🔍 wSOL check failed:', wsolError.message);
        }
      }

      // 检查交易代币余额
      if ((fromToken.address && fromToken.address.toLowerCase() === 'So11111111111111111111111111111111111111112') || !fromToken.address || fromToken.symbol === 'SOL') {
        // 如果是 SOL，直接检查原生 SOL 余额
        const requiredAmount = parseFloat(fromAmount) + 0.01; // 交易金额 + 费用
        console.log('💰 Required SOL amount:', requiredAmount, 'Available:', solBalanceInSol);
        console.log('💰 Transaction amount:', parseFloat(fromAmount), 'Fee estimate: 0.01');
        if (solBalanceInSol < requiredAmount) {
          setError(`Insufficient SOL balance. Need ${requiredAmount.toFixed(4)} SOL (${parseFloat(fromAmount).toFixed(4)} SOL for transaction + 0.01 SOL for fees). Current balance: ${solBalanceInSol.toFixed(4)} SOL`);
          return;
        }
      } else {
        // 如果是 SPL Token，检查 Token 余额
        // 确保使用正确的地址
        const tokenAddress = fromToken.address === 'SOL' ? 'So11111111111111111111111111111111111111112' : fromToken.address;
        
        if (!tokenAddress || tokenAddress === 'SOL') {
          setError(`Invalid token address: ${fromToken.symbol}`);
          return;
        }
        
        try {
          const tokenMintAddress = new PublicKey(tokenAddress);
          const tokenAccounts = await connection.getParsedTokenAccountsByOwner(userPublicKey, {
            mint: tokenMintAddress,
          });
          
          if (tokenAccounts.value.length === 0) {
            setError(`No ${fromToken.symbol} token account found. Please ensure you hold this token`);
            return;
          }
          
          const tokenBalance = tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount || 0;
          console.log(`💰 ${fromToken.symbol} balance:`, tokenBalance);
          
          if (tokenBalance < parseFloat(fromAmount)) {
            setError(`Insufficient ${fromToken.symbol} balance. Need ${fromAmount}, current balance: ${tokenBalance}`);
            return;
          }
        } catch (tokenError: any) {
          console.error('❌ Error checking token balance:', tokenError);
          setError(`Failed to check ${fromToken.symbol} balance: ${tokenError.message}`);
          return;
        }
      }
    } catch (balanceError) {
      console.error('❌ Error checking balance:', balanceError);
      setError('Failed to check balance, please try again later');
      return;
    }

    console.log('✅ Balance check passed, starting confirmation process');

    // 检查 Jupiter quote 中的余额信息
    console.log('🔍 Jupiter quote analysis:');
    console.log('🔍 Quote input mint:', actualQuote.inputMint);
    console.log('🔍 Quote in amount (raw):', actualQuote.inAmount);
    console.log('🔍 Quote in amount (normalized):', (parseInt(actualQuote.inAmount) / Math.pow(10, fromToken.decimals)));
    console.log('🔍 Quote context slot:', actualQuote.contextSlot);
    console.log('🔍 Quote time taken:', actualQuote.timeTaken);
    
    // 检查 quote 是否过期
    const currentSlot = await connection.getSlot();
    const slotDifference = currentSlot - actualQuote.contextSlot;
    console.log('🔍 Current slot:', currentSlot, 'Quote slot:', actualQuote.contextSlot, 'Difference:', slotDifference);
    
    if (slotDifference > 100) {
      console.warn('⚠️ Quote might be stale, slot difference is large');
    }

    try {
      setIsConfirming(true);
      console.log('🔄 Setting isConfirming to true');

      // 3. 获取 swap 交易指令
      console.log('📡 Fetching swap transaction...');
      
      // 在调用 Jupiter API 前，再次确认余额
      console.log('🔍 Pre-Jupiter API balance check:');
      console.log('🔍 Wallet address:', embeddedWallet.address);
      console.log('🔍 From token address:', fromToken.address);
      console.log('🔍 From amount:', fromAmount);
      
      // 使用多个 RPC 端点检查余额
      const rpcEndpoints = [
        'https://summer-wider-road.solana-mainnet.quiknode.pro/a2075ac578a82df2b00d14546fd7bb29c15d8ba3/',
        'https://api.mainnet-beta.solana.com',
        'https://solana-api.projectserum.com'
      ];
      
      for (let i = 0; i < rpcEndpoints.length; i++) {
        try {
          const testConnection = new Connection(rpcEndpoints[i], 'confirmed');
          const testBalance = await testConnection.getBalance(userPublicKey);
          const testBalanceInSol = testBalance / 1e9;
          console.log(`🔍 RPC ${i + 1} (${rpcEndpoints[i]}): ${testBalanceInSol} SOL`);
        } catch (error: any) {
          console.log(`🔍 RPC ${i + 1} failed:`, error.message);
        }
      }
      
      const response = await fetch('https://quote-api.jup.ag/v6/swap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAccessToken()}`
        },
        body: JSON.stringify({
          quoteResponse: actualQuote,
          userPublicKey: embeddedWallet.address,
          wrapAndUnwrapSol: true,
        }),
      });

      console.log('📡 Swap API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('❌ Swap API error response:', errorText);
        
        // 解析 Jupiter API 的错误信息
        let errorMessage = 'Failed to get swap transaction instructions';
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error) {
            errorMessage = errorData.error;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (parseError) {
          // 如果无法解析 JSON，使用原始错误文本
          if (errorText.includes('Insufficient balance')) {
            errorMessage = `Insufficient balance: ${errorText}`;
          } else {
            errorMessage = errorText;
          }
        }
        
        throw new Error(errorMessage);
      }
      
      const { swapTransaction } = await response.json();
      console.log('✅ Got swap transaction:', !!swapTransaction);

      // 4. 反序列化交易 - 修复版本化消息问题
      console.log('🔧 Deserializing transaction...');
      let transaction: Transaction | VersionedTransaction;
      
      try {
        // 首先尝试作为版本化交易反序列化
        transaction = VersionedTransaction.deserialize(Buffer.from(swapTransaction, 'base64'));
        console.log('✅ Versioned transaction deserialized');
      } catch (versionedError) {
        console.log('⚠️ Not a versioned transaction, trying legacy format...');
        // 如果不是版本化交易，尝试传统格式
        transaction = Transaction.from(Buffer.from(swapTransaction, 'base64'));
        console.log('✅ Legacy transaction deserialized');
      }

      // 5. 模拟交易
      console.log('🧪 Simulating transaction...');
      try {
        let simulation;
        if (transaction instanceof VersionedTransaction) {
          simulation = await connection.simulateTransaction(transaction);
        } else {
          simulation = await connection.simulateTransaction(transaction);
        }
        console.log('✅ Transaction simulation result:', simulation);
        
        if (simulation.value.err) {
          console.error('❌ Transaction simulation failed:', simulation.value.err);
          throw new Error(`Transaction simulation failed: ${JSON.stringify(simulation.value.err)}`);
        }
      } catch (simulationError: any) {
        console.error('❌ Transaction simulation error:', simulationError);
        if (simulationError.message.includes('Attempt to debit an account but found no record of a prior credit')) {
          throw new Error('Insufficient balance or account not initialized, please check your wallet balance');
        }
        throw new Error(`Transaction simulation failed: ${simulationError.message}`);
      }

      // 6. 使用 Privy 钱包签名
      console.log('✍️ Signing transaction with Privy wallet...');
      let signedTransaction: Transaction | VersionedTransaction;
      
      if (transaction instanceof VersionedTransaction) {
        // 对于版本化交易，需要特殊处理
        const signedTx = await embeddedWallet.signTransaction(transaction);
        signedTransaction = signedTx;
      } else {
        // 对于传统交易
        const signedTx = await embeddedWallet.signTransaction(transaction);
        signedTransaction = signedTx;
      }
      
      const rawTransaction = signedTransaction.serialize();
      console.log('✅ Transaction signed');

      // 7. 发送交易
      console.log('📤 Sending transaction to Solana network...');
      const txid = await connection.sendRawTransaction(rawTransaction, {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
        maxRetries: 3
      });
      console.log('✅ Transaction sent, txid:', txid);

      // 8. 确认交易
      console.log('⏳ Confirming transaction...');
      const confirmation = await connection.confirmTransaction(txid, 'confirmed');
      console.log('✅ Transaction confirmation result:', confirmation);
      
      if (confirmation.value.err) {
        throw new Error(`Transaction confirmation failed: ${JSON.stringify(confirmation.value.err)}`);
      }

      // 9. UI 提示
      console.log('🎉 Transaction successful!');
      toast.success('Transaction confirmed!');
      setError(null);
      
      // 10. 刷新余额
      console.log('🔄 Refreshing balance...');
      // 触发余额重新查询
      const event = new CustomEvent('refreshBalance');
      window.dispatchEvent(event);
      
      if (onTransactionSuccess) {
        onTransactionSuccess(txid, fromToken, toToken, fromAmount, toAmount);
      }
      
    } catch (error: any) {
      console.error('❌ Error in handleConfirm:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      // 更详细的错误处理
      let errorMessage = error.message || 'Transaction failed';
      
      // 处理 Jupiter API 特定的错误信息
      if (error.message.includes('Insufficient balance')) {
        // 解析 Jupiter API 的余额不足错误
        const match = error.message.match(/You have ([\d.]+) SOL but need ([\d.]+) SOL/);
        if (match) {
          const [_, currentBalance, requiredBalance] = match;
          errorMessage = `Insufficient balance: You have ${currentBalance} SOL, but need ${requiredBalance} SOL. Please check your wallet balance or reduce the transaction amount.`;
        } else {
          errorMessage = 'Insufficient balance, please check your wallet balance or reduce the transaction amount';
        }
      } else if (error.message.includes('Attempt to debit an account but found no record of a prior credit')) {
        errorMessage = 'Insufficient balance or account not initialized, please check your wallet balance and ensure you have enough SOL for transaction fees';
      } else if (error.message.includes('insufficient funds')) {
        errorMessage = 'Insufficient balance, please check your wallet balance';
      } else if (error.message.includes('Invalid account data')) {
        errorMessage = 'Invalid account data, please ensure the token account is correctly initialized';
      } else if (error.message.includes('Failed to get swap transaction instructions')) {
        errorMessage = 'Failed to get swap transaction instructions, please try again later';
      }
      
      setError(errorMessage);
      toast.error(`Transaction failed: ${errorMessage}`);
    } finally {
      console.log('🏁 Setting isConfirming to false');
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
    
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className={`border border-gray-200 shadow-xl rounded-2xl mt-2 flex flex-col items-center gap-4 max-w-[480px] mb-3 p-0 w-full text-gray-900 bg-white/95 backdrop-blur-md hover:shadow-2xl transition-all duration-300 ${className}`}
        style={{ minWidth: 0 }}
      >
        {/* Header with Icon */}
        <div className="flex flex-row items-center gap-1.5 w-full px-4 py-2 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-t-2xl">
          <div className="bg-gradient-to-tr from-blue-500 to-cyan-500 rounded-full p-2 shadow-lg flex items-center justify-center">
            <FaExchangeAlt className="text-white w-4 h-4" />
          </div>
          <span className="font-bold text-blue-600 text-sm tracking-wide">Swap</span>
        </div>
        {/* Swap Main Block */}
        <div className="flex flex-col w-full gap-3 p-4 bg-gradient-to-br from-gray-50 via-blue-50/30 to-cyan-50/30 rounded-xl mx-4 mt-2 shadow-sm border border-gray-100">
          <p className="text-sm text-left font-semibold text-gray-700">From</p>
          <div className="flex w-full justify-between relative mb-2">
            <div className="flex w-1/2 items-center gap-3 relative">
              <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                <img 
                  src={fromLogoUrl} 
                  alt={fromToken.symbol} 
                  className="w-6 h-6" 
                  onError={(e) => {
                    console.log('Failed to load from token logo:', fromLogoUrl);
                    e.currentTarget.src = 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png';
                  }}
                />
              </div>
              <span className="font-bold text-sm text-gray-800">{fromToken.symbol}</span>
            </div>
            <div className="flex flex-col items-end text-right">
              <span className="text-xs text-right font-normal text-gray-500">{fromToken.chain}</span>
              <button className="flex font-semibold text-sm tracking-tight hover:text-blue-600 transition-colors items-center gap-1 cursor-pointer" onClick={() => { setModalType('from'); setModalOpen(true); }}>
                {fromToken.symbol}
                <svg className="w-3 h-3 ml-1 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" /></svg>
              </button>
            </div>
          </div>
          <div className="flex w-full flex-row items-center justify-between flex-nowrap">
            <div className="relative group w-40 h-12 flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-4 shadow-sm hover:shadow-md transition-shadow">
              <input
                type="number"
                value={fromAmount}
                readOnly
                className="flex w-full bg-transparent border-0 outline-none font-semibold text-sm placeholder:text-gray-400 focus:ring-0"
                placeholder="Amount"
              />
            </div>
            <span className="text-sm text-right min-w-24 font-semibold text-gray-700 flex items-center gap-1">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 1v22M5 6h14M5 18h14" /></svg>
              {actualQuote && actualQuote.swapUsdValue ? `$${parseFloat(actualQuote.swapUsdValue).toFixed(2)} USD` : `$${(parseFloat(fromAmount) * 1).toFixed(2)} USD`}
            </span>
          </div>
        </div>
        {/* Arrow */}
        <div className="flex items-center justify-center cursor-pointer hover:opacity-80 rotate-90 transition-opacity">
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full p-2 shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
              <path d="m21 16-4 4-4-4"></path>
              <path d="M17 20V4"></path>
              <path d="m3 8 4-4 4 4"></path>
              <path d="M7 4v16"></path>
            </svg>
          </div>
        </div>
        {/* To Block */}
        <div className="flex flex-col w-full gap-3 p-4 bg-gradient-to-br from-gray-50 via-blue-50/30 to-cyan-50/30 rounded-xl mx-4 mb-2 shadow-sm border border-gray-100">
          <p className="text-sm text-left font-semibold text-gray-700">To</p>
          <div className="flex w-full justify-between relative mb-2">
            <div className="flex w-1/2 items-center gap-3 relative">
              <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                <img 
                  src={toLogoUrl} 
                  alt={toToken.symbol} 
                  className="w-6 h-6" 
                  onError={(e) => {
                    console.log('Failed to load to token logo:', toLogoUrl);
                    e.currentTarget.src = 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png';
                  }}
                />
              </div>
              <span className="font-bold text-sm text-gray-800">{toToken.symbol}</span>
            </div>
            <div className="flex flex-col items-end text-right">
              <span className="text-xs text-right font-normal text-gray-500">{toToken.chain}</span>
              <button className="flex font-semibold text-sm tracking-tight hover:text-blue-600 transition-colors items-center gap-1 cursor-pointer" onClick={() => { setModalType('to'); setModalOpen(true); }}>
                {toToken.symbol}
                <svg className="w-3 h-3 ml-1 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" /></svg>
              </button>
            </div>
          </div>
          <div className="flex w-full flex-row items-center justify-between flex-nowrap">
            <div className="relative group w-40 h-12 flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-4 shadow-sm hover:shadow-md transition-shadow">
              <span className="font-semibold text-sm w-full h-8 flex items-center">
                {toAmount}
              </span>
            </div>
            <span className="text-sm text-right min-w-24 font-semibold text-gray-700 flex items-center gap-1">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 1v22M5 6h14M5 18h14" /></svg>
              {actualQuote && actualQuote.swapUsdValue ? `$${parseFloat(actualQuote.swapUsdValue).toFixed(2)} USD` : `$${(parseFloat(fromAmount) * 1).toFixed(2)} USD`}
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
              <span className="text-xs text-gray-600 leading-6 ml-auto font-medium">{(slippage / 100).toFixed(2)} %</span>
            </div>
            {actualQuote && (
              <div className="flex flex-row items-center w-full">
                <label className="text-xs text-gray-500 min-w-[80px]">Price Impact:</label>
                <span className="text-xs text-gray-600 leading-6 ml-auto font-medium">
                  {actualQuote.priceImpactPct === "0" ? "< 0.01%" : `${parseFloat(actualQuote.priceImpactPct).toFixed(2)}%`}
                </span>
              </div>
            )}
            {actualQuote && (
              <div className="flex flex-row items-center w-full">
                <label className="text-xs text-gray-500 min-w-[80px]">Swap Value:</label>
                <span className="text-xs text-gray-600 leading-6 ml-auto font-medium">{actualQuote.swapUsdValue ? `$${parseFloat(actualQuote.swapUsdValue).toFixed(2)} USD` : `$${(parseFloat(fromAmount) * 1).toFixed(2)} USD`}</span>
              </div>
            )}
          </div>
        </div>
        {/* Action Button and Error */}
        <div className="items-center flex w-full p-4 pt-0 flex-col">
          <button
            className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold border-0 h-10 px-4 py-1.5 w-full shadow-md hover:shadow-lg transition-all duration-150 active:scale-95 ${
              isConfirming || !!error 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50' 
                : 'bg-gradient-to-r from-blue-500 to-cyan-400 text-white hover:from-blue-600 hover:to-cyan-500 cursor-pointer'
            }`}
            disabled={isConfirming || !!error}
            onClick={() => {
              console.log('🎯 Confirm button clicked!');
              console.log('Button state:', {
                disabled: isConfirming || !!error,
                fromTokenBalance: fromToken.balance,
                isConfirming,
                hasError: !!error,
                errorMessage: error,
                // 详细分析每个禁用条件
                noBalance: !fromToken.balance,
                isConfirmingState: isConfirming,
                hasErrorState: !!error
              });
              handleConfirm();
            }}
            style={{ cursor: isConfirming || !!error ? 'not-allowed' : 'pointer' }}
          >
            {isConfirming ? 'Confirming...' : error ? 'Cannot Confirm' : 'Confirm'}
          </button>
          {error && (
            <div className="flex items-center gap-2 text-red-500 text-xs mt-2 p-2 bg-red-50 rounded-lg border border-red-200">
              <span className="inline-block w-2 h-2 rounded-full bg-red-500"></span>
              <span className="flex-1">{error}</span>
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