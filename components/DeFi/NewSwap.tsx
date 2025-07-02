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
  responseData,
  onTransactionSuccess
}: NewSwapProps) {
  console.log("🚀 NewSwap component rendered!");
  console.log("NewSwap props:", { quote, thoughts, responseData });
  console.log("NewSwap fromAmountProp:", fromAmountProp);
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

  const [fromAmount, setFromAmount] = useState<string>(fromAmountProp || "0");
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
    if (fromTokenProp) setFromToken(fromTokenProp);
  }, [fromTokenProp]);
  useEffect(() => {
    if (toTokenProp) setToToken(toTokenProp);
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
      if (actualQuote.inAmount && !fromAmountProp) {
        // 只有在没有 fromAmountProp 时才使用 quote 中的金额
        console.log('[NewSwap] Using quote inAmount because fromAmountProp is not provided');
        console.log('[NewSwap] Quote inAmount:', actualQuote.inAmount);
        // 根据 token symbol 确定正确的 decimals
        const getTokenDecimals = (tokenSymbol: string) => {
          switch (tokenSymbol.toUpperCase()) {
            case 'USDC':
            case 'USDT':
              return 6;
            case 'SOL':
              return 9;
            case 'BONK':
              return 5; // BONK 使用 5 decimals
            case 'JUP':
              return 6;
            case 'RAY':
              return 6;
            case 'SRM':
              return 6;
            case 'MNGO':
              return 6;
            case 'ORCA':
              return 6;
            case 'SAMO':
              return 9;
            case 'COPE':
              return 6;
            case 'ALEPH':
              return 6;
            case 'MEDIA':
              return 6;
            case 'ROPE':
              return 9;
            case 'STEP':
              return 9;
            case 'SLND':
              return 6;
            case 'SNY':
              return 6;
            case 'MER':
              return 6;
            case 'TULIP':
              return 6;
            case 'LIKE':
              return 9;
            default:
              return 9; // 默认值
          }
        };
        
        const inputDecimals = getTokenDecimals(fromToken.symbol);
        const normalizedAmount = (parseInt(actualQuote.inAmount) / Math.pow(10, inputDecimals)).toString();
        setFromAmount(normalizedAmount);
        
        // 同时更新 fromToken 的 decimals
        setFromToken(prev => ({
          ...prev,
          decimals: inputDecimals
        }));
      }
      
      if (actualQuote.outAmount) {
        // 根据 token symbol 确定正确的 decimals
        const getTokenDecimals = (tokenSymbol: string) => {
          switch (tokenSymbol.toUpperCase()) {
            case 'USDC':
            case 'USDT':
              return 6;
            case 'SOL':
              return 9;
            case 'BONK':
              return 5; // BONK 使用 5 decimals
            case 'JUP':
              return 6;
            case 'RAY':
              return 6;
            case 'SRM':
              return 6;
            case 'MNGO':
              return 6;
            case 'ORCA':
              return 6;
            case 'SAMO':
              return 9;
            case 'COPE':
              return 6;
            case 'ALEPH':
              return 6;
            case 'MEDIA':
              return 6;
            case 'ROPE':
              return 9;
            case 'STEP':
              return 9;
            case 'SLND':
              return 6;
            case 'SNY':
              return 6;
            case 'MER':
              return 6;
            case 'TULIP':
              return 6;
            case 'LIKE':
              return 9;
            default:
              return 9; // 默认值
          }
        };
        
        const outputDecimals = getTokenDecimals(toToken.symbol);
        const normalizedAmount = (parseInt(actualQuote.outAmount) / Math.pow(10, outputDecimals)).toString();
        setToAmount(normalizedAmount);
        
        // 同时更新 toToken 的 decimals
        setToToken(prev => ({
          ...prev,
          decimals: outputDecimals
        }));
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
        if (!fromToken.address || fromToken.address.toLowerCase() === SOL_TOKEN.address.toLowerCase()) {
          // 查询 SOL 余额
          const lamports = await connection.getBalance(userPublicKey);
          balance = lamports / 1e9;
          console.log('[NewSwap] lamports:', lamports, 'SOL:', balance);
        } else {
          // 查询 SPL Token 余额
          const tokenMintAddress = new PublicKey(fromToken.address);
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
  const getLocalLogoUrl = (symbol: string) => {
    const tokenSymbol = symbol.toLowerCase();
    if (tokenSymbol === 'bonk') return '/tokens/bonk.png';
    if (tokenSymbol === 'jup') return '/tokens/jup.png';
    if (tokenSymbol === 'usdt') return '/tokens/usdt.png';
    if (tokenSymbol === 'usdc') return '/tokens/usdc.png';
    if (tokenSymbol === 'sol') return '/tokens/sol.png';
    return null;
  };
  
  const fromLogoUrl = getLocalLogoUrl(fromToken.symbol) || 
                     (actualQuote && actualQuote.inputMintLogo) || 
                     fromToken.logo || 
                     '/favicon.png';
  const toLogoUrl = getLocalLogoUrl(toToken.symbol) || 
                   (actualQuote && actualQuote.outputMintLogo) || 
                   toToken.logo || 
                   '/favicon.png';
  
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
      setError('未找到嵌入式钱包，请先连接钱包');
      return;
    }
    
    if (!actualQuote) {
      console.log('❌ No quote available');
      setError('缺少报价信息');
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
        setError('SOL 余额不足，需要至少 0.01 SOL 支付交易费用');
        return;
      }

      // 检查是否有包装的 SOL 账户
      if (fromToken.address.toLowerCase() === SOL_TOKEN.address.toLowerCase()) {
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
      if ((fromToken.address && fromToken.address.toLowerCase() === SOL_TOKEN.address.toLowerCase()) || !fromToken.address) {
        // 如果是 SOL 或地址为空，检查是否有足够的 SOL 进行交易
        const requiredAmount = parseFloat(fromAmount) + 0.01; // 交易金额 + 费用
        console.log('💰 Required SOL amount:', requiredAmount, 'Available:', solBalanceInSol);
        console.log('💰 Transaction amount:', parseFloat(fromAmount), 'Fee estimate: 0.01');
        if (solBalanceInSol < requiredAmount) {
          setError(`SOL 余额不足，需要 ${requiredAmount.toFixed(4)} SOL，当前余额 ${solBalanceInSol.toFixed(4)} SOL`);
          return;
        }
      } else {
        // 如果是 SPL Token，检查 Token 余额
        if (!fromToken.address) {
          setError(`代币地址无效: ${fromToken.symbol}`);
          return;
        }
        
        try {
          const tokenMintAddress = new PublicKey(fromToken.address);
          const tokenAccounts = await connection.getParsedTokenAccountsByOwner(userPublicKey, {
            mint: tokenMintAddress,
          });
          
          if (tokenAccounts.value.length === 0) {
            setError(`未找到 ${fromToken.symbol} 代币账户，请确保您持有该代币`);
            return;
          }
          
          const tokenBalance = tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount || 0;
          console.log(`💰 ${fromToken.symbol} balance:`, tokenBalance);
          
          if (tokenBalance < parseFloat(fromAmount)) {
            setError(`${fromToken.symbol} 余额不足，需要 ${fromAmount}，当前余额 ${tokenBalance}`);
            return;
          }
        } catch (tokenError: any) {
          console.error('❌ Error checking token balance:', tokenError);
          setError(`检查 ${fromToken.symbol} 余额失败: ${tokenError.message}`);
          return;
        }
      }
    } catch (balanceError) {
      console.error('❌ Error checking balance:', balanceError);
      setError('检查余额失败，请稍后重试');
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
        let errorMessage = '获取交易指令失败';
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
            errorMessage = `余额不足: ${errorText}`;
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
          throw new Error(`交易模拟失败: ${JSON.stringify(simulation.value.err)}`);
        }
      } catch (simulationError: any) {
        console.error('❌ Transaction simulation error:', simulationError);
        if (simulationError.message.includes('Attempt to debit an account but found no record of a prior credit')) {
          throw new Error('账户余额不足或账户未初始化，请检查您的钱包余额');
        }
        throw new Error(`交易模拟失败: ${simulationError.message}`);
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
        throw new Error(`交易确认失败: ${JSON.stringify(confirmation.value.err)}`);
      }

      // 9. UI 提示
      console.log('🎉 Transaction successful!');
      toast.success('交易确认成功！');
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
      let errorMessage = error.message || '交易失败';
      
      // 处理 Jupiter API 特定的错误信息
      if (error.message.includes('Insufficient balance')) {
        // 解析 Jupiter API 的余额不足错误
        const match = error.message.match(/You have ([\d.]+) SOL but need ([\d.]+) SOL/);
        if (match) {
          const [_, currentBalance, requiredBalance] = match;
          errorMessage = `余额不足：您有 ${currentBalance} SOL，但需要 ${requiredBalance} SOL。请检查您的钱包余额或减少交易金额。`;
        } else {
          errorMessage = '余额不足，请检查您的钱包余额或减少交易金额';
        }
      } else if (error.message.includes('Attempt to debit an account but found no record of a prior credit')) {
        errorMessage = '账户余额不足或账户未初始化，请检查您的钱包余额并确保有足够的 SOL 支付交易费用';
      } else if (error.message.includes('insufficient funds')) {
        errorMessage = '余额不足，请检查您的钱包余额';
      } else if (error.message.includes('Invalid account data')) {
        errorMessage = '账户数据无效，请确保代币账户已正确初始化';
      } else if (error.message.includes('获取交易指令失败')) {
        errorMessage = '获取交易指令失败，请稍后重试';
      }
      
      setError(errorMessage);
      toast.error(`交易失败: ${errorMessage}`);
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
                    e.currentTarget.src = '/favicon.png';
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
              ${(parseFloat(fromAmount) * (fromToken.price || 1)).toFixed(2)}
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
                    e.currentTarget.src = '/favicon.png';
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
                {toAmount && !isNaN(parseFloat(toAmount)) ? Number(toAmount).toFixed(toToken.decimals) : "0"}
              </span>
            </div>
            <span className="text-sm text-right min-w-24 font-semibold text-gray-700 flex items-center gap-1">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 1v22M5 6h14M5 18h14" /></svg>
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
            {actualQuote && actualQuote.swapUsdValue && (
              <div className="flex flex-row items-center w-full">
                <label className="text-xs text-gray-500 min-w-[80px]">Swap Value:</label>
                <span className="text-xs text-gray-600 leading-6 ml-auto font-medium">${parseFloat(actualQuote.swapUsdValue).toFixed(2)} USD</span>
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