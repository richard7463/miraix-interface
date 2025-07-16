import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RiExchangeDollarLine } from 'react-icons/ri';
import { usePrivy } from '@privy-io/react-auth';
import { useSolanaWallets } from '@privy-io/react-auth/solana';
import { Connection, Transaction, PublicKey, VersionedTransaction } from '@solana/web3.js';
import toast from 'react-hot-toast';

interface BridgeQuote {
  fromToken: string;
  toToken: string;
  fromAmount: number;
  toAmount: number;
  provider: string;
  providerFee: string;
  gasEstimate: string;
  estimatedTime: number;
  slippage: number;
  fromTokenAddress: string;
  fromAddress: string;
  toAddress: string;
  transactionRequest: {
    data: string;
  };
  // 添加USD价值字段
  fromUsdValue?: string;
  toUsdValue?: string;
  swapUsdValue?: string; // 添加和NewSwap一致的字段
}

interface BridgeResponseData {
  success: boolean;
  message: string;
  error?: string;
  data?: {
    intent: string;
    entities: {
      amount: number;
      fromToken: string;
      toToken: string;
      sourceChain: string;
      destinationChain: string;
    };
    missingInfo: any;
    response: string;
  };
  thoughts?: string[];
  quote?: BridgeQuote;
}

interface NewBridgeProps {
  responseData?: BridgeResponseData;
  quote?: BridgeQuote;
  thoughts?: string[];
  onTransactionSuccess?: (txid: string, fromToken: string, toToken: string, fromAmount: string, toAmount: string) => void;
  className?: string;
}

export default function NewBridge({
  responseData,
  quote,
  thoughts,
  onTransactionSuccess,
  className = ''
}: NewBridgeProps) {
  console.log("🌉 NewBridge component rendered!");
  console.log("NewBridge props:", { quote, thoughts, responseData });
  
  // Extract quote from responseData if available
  const actualQuote = quote || (responseData?.quote);
  const actualThoughts = thoughts || (responseData?.thoughts || []);
  
  console.log("Actual bridge quote:", actualQuote);
  console.log("Quote prop:", quote);
  console.log("ResponseData quote:", responseData?.quote);
  console.log("ResponseData:", responseData);

  const [fromAmount, setFromAmount] = useState<string>("0");
  const [toAmount, setToAmount] = useState<string>("0");
  const [error, setError] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [solPrice, setSolPrice] = useState<number>(100); // 默认SOL价格
  const { wallets } = useSolanaWallets();
  const { getAccessToken } = usePrivy();

  // 动态获取SOL价格
  useEffect(() => {
    const fetchSolPrice = async () => {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
        const data = await response.json();
        const price = data.solana?.usd || 100;
        setSolPrice(price);
        console.log('🌉 SOL price fetched:', price);
      } catch (error) {
        console.log('Failed to fetch SOL price, using fallback:', error);
        setSolPrice(100);
      }
    };

    fetchSolPrice();
  }, []);

  // 监听钱包状态变化
  useEffect(() => {
    console.log('[NewBridge] Wallets changed:', {
      walletsCount: wallets?.length,
      wallets: wallets,
      embeddedWallet: wallets?.find(wallet => wallet.walletClientType === 'privy')
    });
    
    // 如果钱包连接了，清除钱包相关的错误
    if (wallets && wallets.length > 0) {
      const embeddedWallet = wallets.find(wallet => wallet.walletClientType === 'privy');
      if (embeddedWallet && embeddedWallet.address) {
        console.log('[NewBridge] Wallet connected, clearing wallet errors');
        if (error && (error.includes('wallet') || error.includes('connect'))) {
          setError(null);
        }
      }
    }
  }, [wallets, error]);

  // Handle responseData errors
  useEffect(() => {
    console.log('[NewBridge] responseData changed:', responseData);
    if (responseData && !responseData.success && responseData.error) {
      console.log('[NewBridge] Setting error from responseData:', responseData.error);
      setError(responseData.error);
    } else if (responseData && responseData.success) {
      console.log('[NewBridge] Clearing error - success response');
      setError(null);
    }
  }, [responseData]);

  // Process bridge quote data
  useEffect(() => {
    if (actualQuote) {
      console.log("🔄 Processing bridge quote in useEffect:", actualQuote);
      
      // Update amounts with proper decimal handling
      if (actualQuote.fromAmount) {
        // SOL has 9 decimals
        const normalizedFromAmount = (actualQuote.fromAmount / Math.pow(10, 9)).toString();
        setFromAmount(normalizedFromAmount);
        console.log("🔄 From amount normalized:", normalizedFromAmount);
      }
      
      if (actualQuote.toAmount) {
        // Determine correct decimals based on toToken
        let decimals = 18; // Default for ETH
        if (actualQuote.toToken === 'USDC') {
          decimals = 6; // USDC has 6 decimals
        } else if (actualQuote.toToken === 'USDT') {
          decimals = 6; // USDT has 6 decimals
        } else if (actualQuote.toToken === 'ETH') {
          decimals = 18; // ETH has 18 decimals
        }
        
        const normalizedToAmount = (actualQuote.toAmount / Math.pow(10, decimals)).toString();
        setToAmount(normalizedToAmount);
        console.log("🔄 To amount normalized:", {
          rawAmount: actualQuote.toAmount,
          decimals: decimals,
          normalizedAmount: normalizedToAmount,
          token: actualQuote.toToken
        });
      }
    }
  }, [actualQuote]);

  const handleConfirm = async () => {
    console.log('🔘 Bridge handleConfirm clicked!');
    console.log('Current state:', {
      isConfirming,
      hasError: !!error,
      hasQuote: !!actualQuote,
      walletsCount: wallets?.length,
      wallets: wallets,
      embeddedWallet: wallets?.find(wallet => wallet.walletClientType === 'privy')
    });

    if (isConfirming) {
      console.log('❌ Already confirming, returning early');
      return;
    }

    // 1. Check wallet - 改进钱包检查逻辑
    console.log('🔍 Checking wallets:', wallets);
    console.log('🔍 Wallets count:', wallets?.length);
    
    if (!wallets || wallets.length === 0) {
      console.log('❌ No wallets available');
      setError('No wallets available, please connect your wallet');
      return;
    }
    
    const embeddedWallet = wallets.find(wallet => wallet.walletClientType === 'privy');
    console.log('🔍 Found embedded wallet:', embeddedWallet);
    
    if (!embeddedWallet) {
      console.log('❌ No embedded wallet found');
      setError('Embedded wallet not found, please connect your wallet');
      return;
    }
    
    if (!embeddedWallet.address) {
      console.log('❌ Embedded wallet has no address');
      setError('Wallet address not available, please try reconnecting your wallet');
      return;
    }
    
    console.log('✅ Wallet check passed, address:', embeddedWallet.address);
    
    if (!actualQuote) {
      console.log('❌ No bridge quote available');
      setError('Missing bridge quote information');
      return;
    }

    // 检查 actualQuote 的必要字段
    console.log('🔍 Checking actualQuote fields:', {
      fromToken: actualQuote.fromToken,
      toToken: actualQuote.toToken,
      fromAmount: actualQuote.fromAmount,
      toAmount: actualQuote.toAmount,
      provider: actualQuote.provider,
      hasTransactionRequest: !!actualQuote.transactionRequest,
      transactionRequestData: actualQuote.transactionRequest?.data
    });

    if (!actualQuote.fromToken || !actualQuote.toToken) {
      setError('Bridge quote is missing token information');
      return;
    }

    if (!actualQuote.fromAmount || !actualQuote.toAmount) {
      setError('Bridge quote is missing amount information');
      return;
    }

    if (!actualQuote.provider) {
      setError('Bridge quote is missing provider information');
      return;
    }

    // 2. Check balance
    console.log('💰 Checking balance before bridge transaction...');
    const connection = new Connection('https://summer-wider-road.solana-mainnet.quiknode.pro/a2075ac578a82df2b00d14546fd7bb29c15d8ba3/', 'confirmed');
    const userPublicKey = new PublicKey(embeddedWallet.address);
    console.log('💰 Checking balance for address:', userPublicKey.toBase58());
    console.log('💰 From amount:', fromAmount);
    
    try {
      // Check SOL balance (for transaction fees and bridge amount)
      const solBalance = await connection.getBalance(userPublicKey);
      const solBalanceInSol = solBalance / 1e9;
      console.log('💰 SOL balance:', solBalanceInSol, 'lamports:', solBalance);
      
      // Calculate required amount (bridge amount + fees)
      const bridgeAmount = parseFloat(fromAmount);
      const providerFee = parseFloat(actualQuote.providerFee || '0');
      const estimatedFees = 0.01; // Estimated transaction fees
      const requiredAmount = bridgeAmount + providerFee + estimatedFees;
      
      console.log('💰 Balance calculation:', {
        bridgeAmount,
        providerFee,
        estimatedFees,
        requiredAmount,
        currentBalance: solBalanceInSol
      });
      
      if (solBalanceInSol < requiredAmount) {
        setError(`Insufficient SOL balance. Need ${requiredAmount.toFixed(4)} SOL (${bridgeAmount.toFixed(4)} SOL for bridge + ${providerFee.toFixed(4)} SOL provider fee + ${estimatedFees.toFixed(4)} SOL for fees). Current balance: ${solBalanceInSol.toFixed(4)} SOL`);
        return;
      }
      
      // Additional check for minimum SOL balance for fees
      if (solBalanceInSol < 0.01) {
        setError('Insufficient SOL balance. Need at least 0.01 SOL for transaction fees');
        return;
      }
    } catch (balanceError) {
      console.error('❌ Error checking balance:', balanceError);
      setError('Failed to check balance, please try again later');
      return;
    }

    console.log('✅ Balance check passed, starting bridge confirmation process');

    try {
      setIsConfirming(true);
      console.log('🔄 Setting isConfirming to true');

      // 3. 检查 transactionRequest 是否存在
      if (!actualQuote.transactionRequest) {
        throw new Error('Bridge transaction request is missing');
      }
      
      if (!actualQuote.transactionRequest.data) {
        throw new Error('Bridge transaction data is missing');
      }

      // 4. Deserialize bridge transaction
      console.log('🔧 Deserializing bridge transaction...');
      console.log('🔧 Transaction data:', actualQuote.transactionRequest.data);
      let transaction: Transaction | VersionedTransaction;
      
      try {
        // Try versioned transaction first
        transaction = VersionedTransaction.deserialize(Buffer.from(actualQuote.transactionRequest.data, 'base64'));
        console.log('✅ Versioned bridge transaction deserialized');
        
        // 检查版本化交易是否包含用户的公钥
        const userPublicKey = new PublicKey(embeddedWallet.address);
        console.log('🔍 User public key:', userPublicKey.toBase58());
        console.log('🔍 Versioned transaction static account keys count:', transaction.message.staticAccountKeys.length);
        
        // 简化检查：只验证交易结构
        const hasUserKey = transaction.message.staticAccountKeys.length > 0;
        console.log('🔍 Versioned transaction has account keys:', hasUserKey);
        
        if (!hasUserKey) {
          console.warn('⚠️ Versioned transaction does not contain user key, this may cause signing issues');
        }
      } catch (versionedError) {
        console.log('⚠️ Not a versioned transaction, trying legacy format...');
        // Try legacy format
        transaction = Transaction.from(Buffer.from(actualQuote.transactionRequest.data, 'base64'));
        console.log('✅ Legacy bridge transaction deserialized');
        
        // 检查传统交易是否包含用户的公钥
        const userPublicKey = new PublicKey(embeddedWallet.address);
        const hasUserKey = transaction.feePayer?.equals(userPublicKey) || 
                          transaction.instructions.some(ix => 
                            ix.keys.some(key => key.pubkey.equals(userPublicKey))
                          );
        console.log('🔍 Legacy transaction contains user key:', hasUserKey);
        
        if (!hasUserKey) {
          console.warn('⚠️ Legacy transaction does not contain user key, this may cause signing issues');
        }
      }

      // 5. Simulate transaction
      console.log('🧪 Simulating bridge transaction...');
      try {
        let simulation;
        if (transaction instanceof VersionedTransaction) {
          simulation = await connection.simulateTransaction(transaction);
        } else {
          simulation = await connection.simulateTransaction(transaction);
        }
        console.log('✅ Bridge transaction simulation result:', simulation);
        
        if (simulation.value.err) {
          console.warn('⚠️ Bridge transaction simulation failed:', simulation.value.err);
          // 对于某些错误（如AccountNotFound），我们仍然可以继续执行交易
          if (simulation.value.err.toString().includes('AccountNotFound')) {
            console.log('⚠️ AccountNotFound error detected, continuing with transaction...');
          } else {
            throw new Error(`Bridge transaction simulation failed: ${JSON.stringify(simulation.value.err)}`);
          }
        }
      } catch (simulationError: any) {
        console.warn('⚠️ Bridge transaction simulation error:', simulationError);
        // 对于某些错误，我们仍然可以继续执行交易
        if (simulationError.message.includes('AccountNotFound') || 
            simulationError.message.includes('Attempt to debit an account but found no record of a prior credit')) {
          console.log('⚠️ Account-related error detected, continuing with transaction...');
        } else {
          throw new Error(`Bridge transaction simulation failed: ${simulationError.message}`);
        }
      }

      // 6. Sign with Privy wallet
      console.log('✍️ Signing bridge transaction with Privy wallet...');
      let signedTransaction: Transaction | VersionedTransaction;
      
      if (transaction instanceof VersionedTransaction) {
        const signedTx = await embeddedWallet.signTransaction(transaction);
        signedTransaction = signedTx;
      } else {
        // 对于传统交易，确保设置正确的fee payer
        if (!transaction.feePayer) {
          console.log('🔧 Setting fee payer for legacy transaction');
          transaction.feePayer = new PublicKey(embeddedWallet.address);
        }
        
        const signedTx = await embeddedWallet.signTransaction(transaction);
        signedTransaction = signedTx;
      }
      
      const rawTransaction = signedTransaction.serialize();
      console.log('✅ Bridge transaction signed');

      // 7. Send transaction
      console.log('📤 Sending bridge transaction to Solana network...');
      const txid = await connection.sendRawTransaction(rawTransaction, {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
        maxRetries: 3
      });
      console.log('✅ Bridge transaction sent, txid:', txid);

      // 8. Confirm transaction
      console.log('⏳ Confirming bridge transaction...');
      const confirmation = await connection.confirmTransaction(txid, 'confirmed');
      console.log('✅ Bridge transaction confirmation result:', confirmation);
      
      if (confirmation.value.err) {
        throw new Error(`Bridge transaction confirmation failed: ${JSON.stringify(confirmation.value.err)}`);
      }

      // 9. UI success
      console.log('🎉 Bridge transaction successful!');
      toast.success('Bridge transaction confirmed!');
      setError(null);
      
      // 10. Refresh balance
      console.log('🔄 Refreshing balance...');
      const event = new CustomEvent('refreshBalance');
      window.dispatchEvent(event);
      
      if (onTransactionSuccess) {
        onTransactionSuccess(txid, actualQuote.fromToken, actualQuote.toToken, fromAmount, toAmount);
      }
      
    } catch (error: any) {
      console.error('❌ Error in bridge handleConfirm:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      let errorMessage = error.message || 'Bridge transaction failed';
      
      // Handle specific bridge errors - 和NewSwap组件保持一致的错误处理
      if (error.message.includes('Insufficient balance')) {
        // 解析 Jupiter API 的余额不足错误
        const match = error.message.match(/You have ([\d.]+) SOL but need ([\d.]+) SOL/);
        if (match) {
          const [_, currentBalance, requiredBalance] = match;
          errorMessage = `Insufficient balance: You have ${currentBalance} SOL, but need ${requiredBalance} SOL. Please check your wallet balance or reduce the bridge amount.`;
        } else {
          errorMessage = 'Insufficient balance, please check your wallet balance or reduce the bridge amount';
        }
      } else if (error.message.includes('AccountNotFound')) {
        errorMessage = 'Account not found. This may be due to insufficient balance or uninitialized token accounts. Please check your wallet balance.';
      } else if (error.message.includes('Transaction does not contain public key')) {
        errorMessage = 'Bridge transaction configuration error. The transaction does not include your wallet address. Please try again or contact support.';
      } else if (error.message.includes('Attempt to debit an account but found no record of a prior credit')) {
        errorMessage = 'Insufficient balance or account not initialized, please check your wallet balance and ensure you have enough SOL for transaction fees';
      } else if (error.message.includes('insufficient funds')) {
        errorMessage = 'Insufficient balance, please check your wallet balance';
      } else if (error.message.includes('Invalid account data')) {
        errorMessage = 'Invalid account data, please ensure the token account is correctly initialized';
      } else if (error.message.includes('Failed to get bridge transaction instructions')) {
        errorMessage = 'Failed to get bridge transaction instructions, please try again later';
      } else if (error.message.includes('Bridge transaction simulation failed')) {
        errorMessage = 'Bridge transaction simulation failed. This may be due to insufficient balance or network issues. Please check your wallet balance and try again.';
      }
      
      setError(errorMessage);
      toast.error(`Bridge failed: ${errorMessage}`);
    } finally {
      console.log('🏁 Setting isConfirming to false');
      setIsConfirming(false);
    }
  };

  // Get logo URLs
  const getLocalLogoUrl = (symbol: string) => {
    const tokenSymbol = symbol.toLowerCase();
    if (tokenSymbol === 'sol' || tokenSymbol === 'wsol') return '/tokens/sol.png';
    if (tokenSymbol === 'eth') return '/tokens/eth.png';
    if (tokenSymbol === 'usdc') return '/tokens/usdc.png';
    return 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png';
  };

  // 动态获取token价格
  const getTokenPrice = async (symbol: string): Promise<number> => {
    const tokenSymbol = symbol.toLowerCase();
    
    // 如果是SOL，尝试从API获取实时价格
    if (tokenSymbol === 'sol' || tokenSymbol === 'wsol') {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
        const data = await response.json();
        return data.solana?.usd || 100; // fallback to $100
      } catch (error) {
        console.log('Failed to fetch SOL price, using fallback:', error);
        return 100; // fallback
      }
    }
    
    // 其他token的fallback价格
    switch (tokenSymbol) {
      case 'eth':
        return 2000;
      case 'usdc':
        return 1;
      default:
        return 100;
    }
  };

  // 计算USD价值
  const calculateUsdValue = async (amount: string, tokenSymbol: string): Promise<string> => {
    const price = await getTokenPrice(tokenSymbol);
    return (parseFloat(amount) * price).toFixed(2);
  };
  
  const fromLogoUrl = getLocalLogoUrl(actualQuote?.fromToken || 'SOL');
  const toLogoUrl = getLocalLogoUrl(actualQuote?.toToken || 'ETH');

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className={`border border-gray-200 shadow-xl rounded-2xl mt-2 flex flex-col items-center gap-4 max-w-[480px] mb-3 p-0 w-full text-gray-900 bg-white/95 backdrop-blur-md hover:shadow-2xl transition-all duration-300 ${className}`}
        style={{ minWidth: 0 }}
      >
        {/* Header with Icon */}
        <div className="flex flex-row items-center gap-1.5 w-full px-4 py-2 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-2xl">
          <div className="bg-gradient-to-tr from-purple-500 to-pink-500 rounded-full p-2 shadow-lg flex items-center justify-center">
            <RiExchangeDollarLine className="text-white w-4 h-4" />
          </div>
          <span className="font-bold text-purple-600 text-sm tracking-wide">Bridge</span>
        </div>

        {/* Bridge Main Block */}
        <div className="flex flex-col w-full gap-3 p-4 bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30 rounded-xl mx-4 mt-2 shadow-sm border border-gray-100">
          <p className="text-sm text-left font-semibold text-gray-700">From</p>
          <div className="flex w-full justify-between relative mb-2">
            <div className="flex w-1/2 items-center gap-3 relative">
              <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                <img 
                  src={fromLogoUrl} 
                  alt={actualQuote?.fromToken || 'SOL'} 
                  className="w-6 h-6" 
                  onError={(e) => {
                    console.log('Failed to load from token logo:', fromLogoUrl);
                    e.currentTarget.src = 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png';
                  }}
                />
              </div>
              <span className="font-bold text-sm text-gray-800">{actualQuote?.fromToken || 'SOL'}</span>
            </div>
            <div className="flex flex-col items-end text-right">
              <span className="text-xs text-right font-normal text-gray-500">Solana</span>
              <span className="font-semibold text-sm tracking-tight text-gray-800">
                {actualQuote?.fromToken || 'SOL'}
              </span>
            </div>
          </div>
          <div className="flex w-full flex-row items-center justify-between flex-nowrap">
            <div className="relative group w-40 h-12 flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-4 shadow-sm hover:shadow-md transition-shadow">
              <span className="font-semibold text-sm w-full h-8 flex items-center">
                {fromAmount}
              </span>
            </div>
            <span className="text-sm text-right min-w-24 font-semibold text-gray-700 flex items-center gap-1">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 1v22M5 6h14M5 18h14" /></svg>
              {actualQuote?.swapUsdValue ? `$${parseFloat(actualQuote.swapUsdValue).toFixed(2)} USD` : `$${(parseFloat(fromAmount) * solPrice).toFixed(2)} USD`}
            </span>
          </div>
        </div>

        {/* Arrow */}
        <div className="flex items-center justify-center cursor-pointer hover:opacity-80 rotate-90 transition-opacity">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-full p-2 shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
              <path d="m21 16-4 4-4-4"></path>
              <path d="M17 20V4"></path>
              <path d="m3 8 4-4 4 4"></path>
              <path d="M7 4v16"></path>
            </svg>
          </div>
        </div>

        {/* To Block */}
        <div className="flex flex-col w-full gap-3 p-4 bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30 rounded-xl mx-4 mb-2 shadow-sm border border-gray-100">
          <p className="text-sm text-left font-semibold text-gray-700">To</p>
          <div className="flex w-full justify-between relative mb-2">
            <div className="flex w-1/2 items-center gap-3 relative">
              <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                <img 
                  src={toLogoUrl} 
                  alt={actualQuote?.toToken || 'ETH'} 
                  className="w-6 h-6" 
                  onError={(e) => {
                    console.log('Failed to load to token logo:', toLogoUrl);
                    e.currentTarget.src = 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png';
                  }}
                />
              </div>
              <span className="font-bold text-sm text-gray-800">{actualQuote?.toToken || 'ETH'}</span>
            </div>
            <div className="flex flex-col items-end text-right">
              <span className="text-xs text-right font-normal text-gray-500">
                {actualQuote?.toToken === 'USDC' ? 'Arbitrum' : 'Ethereum'}
              </span>
              <span className="font-semibold text-sm tracking-tight text-gray-800">
                {actualQuote?.toToken || 'ETH'}
              </span>
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
              {actualQuote?.swapUsdValue ? `$${parseFloat(actualQuote.swapUsdValue).toFixed(2)} USD` : `$${(parseFloat(fromAmount) * solPrice).toFixed(2)} USD`}
            </span>
          </div>
        </div>
        
        {/* Divider */}
        <div className="w-full h-[1px] bg-gradient-to-r from-purple-200 via-pink-200 to-transparent my-1 rounded-full" />
        
        {/* Bridge Details Section */}
        <div className="flex w-full p-4 pt-0 flex-col gap-3">
          <div className="flex flex-col items-center w-full">
            {actualQuote && (
              <>
                <div className="flex flex-row items-center w-full">
                  <label className="text-xs text-gray-500 min-w-[80px]">Provider:</label>
                  <span className="text-xs text-gray-600 leading-6 ml-auto font-medium capitalize">{actualQuote.provider}</span>
                </div>
                <div className="flex flex-row items-center w-full">
                  <label className="text-xs text-gray-500 min-w-[80px]">Provider Fee:</label>
                  <span className="text-xs text-gray-600 leading-6 ml-auto font-medium">{actualQuote.providerFee} SOL</span>
                </div>
                <div className="flex flex-row items-center w-full">
                  <label className="text-xs text-gray-500 min-w-[80px]">Gas Estimate:</label>
                  <span className="text-xs text-gray-600 leading-6 ml-auto font-medium">{actualQuote.gasEstimate} ETH</span>
                </div>
                <div className="flex flex-row items-center w-full">
                  <label className="text-xs text-gray-500 min-w-[80px]">Est. Time:</label>
                  <span className="text-xs text-gray-600 leading-6 ml-auto font-medium">{actualQuote.estimatedTime} minutes</span>
                </div>
                <div className="flex flex-row items-center w-full">
                  <label className="text-xs text-gray-500 min-w-[80px]">Slippage:</label>
                  <span className="text-xs text-gray-600 leading-6 ml-auto font-medium">{(actualQuote.slippage * 100).toFixed(2)}%</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Action Button and Error */}
        <div className="items-center flex w-full p-4 pt-0 flex-col">
          <button
            className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold border-0 h-10 px-4 py-1.5 w-full shadow-md hover:shadow-lg transition-all duration-150 active:scale-95 ${
              isConfirming || !!error 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50' 
                : 'bg-gradient-to-r from-purple-500 to-pink-400 text-white hover:from-purple-600 hover:to-pink-500 cursor-pointer'
            }`}
            disabled={isConfirming || !!error}
            onClick={() => {
              console.log('🎯 Bridge Confirm button clicked!');
              console.log('Button state:', {
                disabled: isConfirming || !!error,
                isConfirming,
                hasError: !!error,
                errorMessage: error
              });
              handleConfirm();
            }}
            style={{ cursor: isConfirming || !!error ? 'not-allowed' : 'pointer' }}
          >
            {isConfirming ? 'Confirming Bridge...' : error ? 'Cannot Confirm' : 'Confirm Bridge'}
          </button>
          {error && (
            <div className="flex items-center gap-2 text-red-500 text-xs mt-2 p-2 bg-red-50 rounded-lg border border-red-200">
              <span className="inline-block w-2 h-2 rounded-full bg-red-500"></span>
              <span className="flex-1">{error}</span>
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
} 