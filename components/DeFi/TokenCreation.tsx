import React, { useState } from 'react';
import { FaCoins, FaCheckCircle, FaExternalLinkAlt, FaSpinner } from 'react-icons/fa';
import { useSolanaWallets } from '@privy-io/react-auth/solana';
import { Transaction, Connection, PublicKey, Keypair } from '@solana/web3.js';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

interface TokenCreationProps {
  responseData?: {
    success: boolean;
    message: string;
    data?: {
      intent: string;
      entities?: any;
      missingInfo?: string[];
      response?: string;
    };
    thoughts?: string[];
    quote?: {
      unsignedTx: string;
      mintAddress: string;
      tokenAccountAddress: string;
      name: string;
      symbol: string;
      decimals: number;
      totalSupply: number;
      payer: string;
      network: string;
    };
    mintKeypair?: Keypair; // 新增：从AI响应中获取的mintKeypair
  };
  onTransactionSuccess?: (txid: string, tokenInfo: any) => void;
  className?: string;
}

export default function TokenCreation({
  responseData,
  onTransactionSuccess,
  className = ''
}: TokenCreationProps) {
  const { wallets: solanaWallets } = useSolanaWallets();
  const [isSigning, setIsSigning] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  // 新增：mintKeypair状态，确保每次Token创建都生成新的Keypair
  const [mintKeypair, setMintKeypair] = useState<Keypair | null>(null);

  const isTokenCreationData = responseData?.data?.intent === 'createToken' && 
                             responseData?.quote?.unsignedTx;

  // 仅在Token创建意图时设置mintKeypair
  React.useEffect(() => {
    if (isTokenCreationData) {
      // 从responseData中获取mintKeypair（如果存在的话）
      if (responseData?.mintKeypair) {
        setMintKeypair(responseData.mintKeypair);
        console.log('🔍 Using mintKeypair from responseData:', responseData.mintKeypair.publicKey.toBase58());
      } else {
        console.error('❌ No mintKeypair found in responseData!');
        console.error('❌ This should not happen - mintKeypair should be passed from ChatIdConversation');
        console.error('❌ responseData:', responseData);
        setMintKeypair(null);
      }
    }
  }, [isTokenCreationData, responseData?.mintKeypair]);

  if (!isTokenCreationData) {
    return null;
  }

  const tokenInfo = responseData.quote;
  const embeddedWallet = solanaWallets?.find(wallet => wallet.walletClientType === 'privy');

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const handleConfirm = async () => {
    if (!embeddedWallet || !tokenInfo) {
      toast.error('Wallet not connected or token info missing');
      return;
    }
    if (!mintKeypair) {
      toast.error('Mint Keypair missing - this is a development error. Please check console logs.');
      console.error('❌ mintKeypair is null when trying to sign transaction');
      console.error('❌ This means the mintKeypair was not properly passed from ChatIdConversation');
      return;
    }

    try {
      setIsSigning(true);
      toast.loading('Signing transaction...');

      console.log('🔍 Token creation data:', {
        unsignedTx: tokenInfo.unsignedTx?.substring(0, 50) + '...',
        mintAddress: tokenInfo.mintAddress,
        tokenAccountAddress: tokenInfo.tokenAccountAddress,
        payer: tokenInfo.payer,
        network: tokenInfo.network
      });

      // 1. 组装请求体，带上mintPubkey
      // 这里假设后端已按新协议实现，实际请求代码应在父组件或API调用处实现
      const unsignedTxBuffer = Buffer.from(tokenInfo.unsignedTx, 'base64');
      const transaction = Transaction.from(unsignedTxBuffer);
      
      console.log('🔍 Transaction details:', {
        feePayer: transaction.feePayer?.toBase58(),
        recentBlockhash: transaction.recentBlockhash,
        instructions: transaction.instructions.length,
        signers: transaction.signatures.length
      });
      
      // 创建连接 - 默认使用devnet进行测试
      const rpcEndpoint = tokenInfo.network === 'mainnet' 
        ? 'https://summer-wider-road.solana-mainnet.quiknode.pro/a2075ac578a82df2b00d14546fd7bb29c15d8ba3/'
        : 'https://api.devnet.solana.com';
      
      console.log('🔗 Using RPC endpoint:', rpcEndpoint, 'for network:', tokenInfo.network || 'devnet');
      const connection = new Connection(rpcEndpoint, 'confirmed');
      
      // 详细分析交易指令和账户
      console.log('🔍 Analyzing transaction instructions...');
      transaction.instructions.forEach((instruction, index) => {
        console.log(`🔍 Instruction ${index}:`, {
          programId: instruction.programId.toBase58(),
          keys: instruction.keys.map(key => ({
            pubkey: key.pubkey.toBase58(),
            isSigner: key.isSigner,
            isWritable: key.isWritable
          })),
          data: instruction.data.length
        });
      });
      
      // 检查关键账户是否存在
      console.log('🔍 Checking key accounts...');
      const keyAccounts = [
        { name: 'Fee Payer', address: transaction.feePayer?.toBase58() },
        { name: 'Mint Address', address: tokenInfo.mintAddress },
        { name: 'Token Account', address: tokenInfo.tokenAccountAddress },
        { name: 'Payer', address: tokenInfo.payer }
      ];
      
      for (const account of keyAccounts) {
        if (account.address) {
          try {
            const accountInfo = await connection.getAccountInfo(new PublicKey(account.address));
            console.log(`🔍 ${account.name} (${account.address}):`, accountInfo ? 'EXISTS' : 'NOT FOUND');
          } catch (error: any) {
            console.log(`🔍 ${account.name} (${account.address}): ERROR - ${error.message}`);
          }
        }
      }
      
      // 检查钱包余额
      console.log('💰 Checking wallet balance...');
      try {
        const userPublicKey = new PublicKey(embeddedWallet.address);
        const balance = await connection.getBalance(userPublicKey);
        const balanceInSol = balance / 1e9;
        console.log('💰 Wallet balance:', balanceInSol, 'SOL');
        
        if (balanceInSol < 0.01) {
          toast.error('Insufficient SOL balance. Please get some devnet SOL from the faucet.');
          return;
        }
      } catch (balanceError: any) {
        console.warn('⚠️ Failed to check balance:', balanceError.message);
        toast.error('Failed to check wallet balance. Please ensure your wallet is connected to devnet.');
        return;
      }
      
      // 检查blockhash是否过期，如果过期则更新
      console.log('🔍 Checking blockhash validity...');
      try {
        const { blockhash: currentBlockhash } = await connection.getLatestBlockhash();
        console.log('🔍 Current blockhash:', currentBlockhash);
        console.log('🔍 Transaction blockhash:', transaction.recentBlockhash);
        
        if (transaction.recentBlockhash !== currentBlockhash) {
          console.log('⚠️ Blockhash expired, updating transaction...');
          transaction.recentBlockhash = currentBlockhash;
        }
      } catch (blockhashError) {
        console.warn('⚠️ Failed to check blockhash validity:', blockhashError);
      }
      
      // 检查交易是否包含用户的公钥
      const userPublicKey = new PublicKey(embeddedWallet.address);
      const hasUserKey = transaction.feePayer?.equals(userPublicKey) || 
                        transaction.instructions.some(ix => 
                          ix.keys.some(key => key.pubkey.equals(userPublicKey))
                        );
      console.log('🔍 Transaction contains user key:', hasUserKey);
      console.log('🔍 User public key:', userPublicKey.toBase58());
      console.log('🔍 Transaction fee payer:', transaction.feePayer?.toBase58());
      
      if (!hasUserKey) {
        console.warn('⚠️ Transaction does not contain user key, this may cause signing issues');
      }
      
      // 尝试模拟交易，但如果失败则跳过
      console.log('🧪 Simulating transaction...');
      let simulationPassed = false;
      try {
        const simulation = await connection.simulateTransaction(transaction);
        console.log('✅ Transaction simulation result:', simulation);
        
        if (simulation.value.err) {
          console.error('❌ Transaction simulation failed:', simulation.value.err);
          console.log('⚠️ Proceeding without simulation...');
        } else {
          simulationPassed = true;
        }
      } catch (simulationError: any) {
        console.error('❌ Transaction simulation error:', simulationError);
        console.log('⚠️ Proceeding without simulation...');
      }
      
      // 3. 钱包签名
      console.log('✍️ Signing transaction...');
      console.log('🔍 MintKeypair public key:', mintKeypair.publicKey.toBase58());
      console.log('🔍 Expected mint address:', tokenInfo.mintAddress);
      
      // 验证mintKeypair是否匹配预期的mint地址
      if (mintKeypair.publicKey.toBase58() !== tokenInfo.mintAddress) {
        console.error('❌ MintKeypair mismatch!');
        console.error('Expected:', tokenInfo.mintAddress);
        console.error('Got:', mintKeypair.publicKey.toBase58());
        throw new Error('Mint keypair does not match the expected mint address');
      }
      
      const signedTx = await embeddedWallet.signTransaction(transaction);
      // 4. mintKeypair签名
      signedTx.partialSign(mintKeypair);
      console.log('✅ Transaction signed successfully');
      
      // 5. 广播
      const rawTransaction = signedTx.serialize();
      console.log('📤 Sending transaction to network...');
      
      const txHash = await connection.sendRawTransaction(rawTransaction, {
        skipPreflight: !simulationPassed, // 如果模拟失败，跳过预检
        preflightCommitment: 'confirmed',
        maxRetries: 3
      });
      
      console.log('✅ Transaction sent, hash:', txHash);
      
      // 交易发送成功，显示发送状态
      setTxHash(txHash);
      toast.success('Token creation transaction sent! Confirming...');
      
      // 异步等待确认
      console.log('⏳ Confirming transaction asynchronously...');
      connection.confirmTransaction({
        signature: txHash,
        blockhash: transaction.recentBlockhash!,
        lastValidBlockHeight: (await connection.getLatestBlockhash()).lastValidBlockHeight
      }, 'confirmed').then(confirmation => {
        console.log('✅ Transaction confirmation result:', confirmation);
        if (confirmation.value.err) {
          console.warn('⚠️ Transaction confirmation failed:', confirmation.value.err);
          toast.error('Transaction failed. Please check the transaction status.');
        } else {
          console.log('🎉 Transaction confirmed successfully!');
          setIsSuccess(true);
          toast.success('Token created successfully!');
          
          if (onTransactionSuccess) {
            onTransactionSuccess(txHash, {
              name: tokenInfo.name,
              symbol: tokenInfo.symbol,
              mintAddress: tokenInfo.mintAddress,
              totalSupply: tokenInfo.totalSupply
            });
          }
        }
      }).catch(confirmError => {
        console.warn('⚠️ Transaction confirmation error:', confirmError);
        toast.error('Failed to confirm transaction. Please check the transaction status.');
      });

    } catch (error: any) {
      console.error('Token creation error:', error);
      
      // 更详细的错误处理
      let errorMessage = error.message || 'Failed to create token';
      
      if (error.message.includes('Transaction was not confirmed in')) {
        // 交易发送成功但确认超时，显示交易哈希
        const txHashMatch = error.message.match(/signature ([A-Za-z0-9]+)/);
        if (txHashMatch) {
          const txHash = txHashMatch[1];
          setTxHash(txHash);
          setIsSuccess(true);
          toast.success('Token creation transaction sent! Please check the transaction status.');
          
          if (onTransactionSuccess) {
            onTransactionSuccess(txHash, {
              name: tokenInfo.name,
              symbol: tokenInfo.symbol,
              mintAddress: tokenInfo.mintAddress,
              totalSupply: tokenInfo.totalSupply
            });
          }
          return; // 不显示错误，直接返回成功状态
        }
      } else if (error.message.includes('block height exceeded')) {
        // 交易过期，显示交易哈希但提示用户检查状态
        const txHashMatch = error.message.match(/Signature ([A-Za-z0-9]+) has expired/);
        if (txHashMatch) {
          const txHash = txHashMatch[1];
          setTxHash(txHash);
          setIsSuccess(true);
          toast.success('Token creation transaction sent! Transaction may have expired, please check the status.');
          
          if (onTransactionSuccess) {
            onTransactionSuccess(txHash, {
              name: tokenInfo.name,
              symbol: tokenInfo.symbol,
              mintAddress: tokenInfo.mintAddress,
              totalSupply: tokenInfo.totalSupply
            });
          }
          return; // 不显示错误，直接返回成功状态
        }
      } else if (error.message.includes('Invalid account data')) {
        errorMessage = 'Invalid account data. The token creation transaction may be malformed. Please try again or contact support.';
      } else if (error.message.includes('Insufficient balance')) {
        errorMessage = 'Insufficient balance. Please ensure you have enough SOL for transaction fees.';
      } else if (error.message.includes('Blockhash not found')) {
        errorMessage = 'Transaction expired. Please try again.';
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSigning(false);
      toast.dismiss();
    }
  };

  const handleViewOnSolscan = () => {
    if (txHash) {
      const cluster = tokenInfo?.network === 'mainnet' ? 'mainnet' : 'devnet';
      const url = `https://solscan.io/tx/${txHash}?cluster=${cluster}`;
      window.open(url, '_blank');
    }
  };

  if (isSuccess && txHash) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className={`overflow-hidden shadow-xl rounded-2xl mt-2 flex flex-col max-w-[480px] mb-3 w-full text-[#e0e0e6] bg-[#3f3f46] border border-[#52525b] hover:shadow-2xl transition-all duration-300 ${className}`}
        style={{ minWidth: 0 }}
      >
        {/* Header with Icon */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#27272a] border-b border-[#52525b]">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500/20">
              <FaCheckCircle className="w-3.5 h-3.5 text-green-400" />
            </div>
            <h3 className="text-sm font-medium text-[#e0e0e6]">Token Created Successfully</h3>
          </div>
              </div>
        
        <div className="p-4">
          <div className="text-center mb-4">
            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <FaCheckCircle className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-[#e0e0e6] mb-2">
                Token creation transaction ready!
              </h3>
            <div className="text-[#a1a1aa] text-sm text-left bg-[#27272a] rounded-lg p-3 border border-[#52525b]">
              <div className="font-medium text-[#e0e0e6] mb-2">Token Details:</div>
              <div className="space-y-1 text-xs">
                <div>Name: <span className="text-[#e0e0e6]">{tokenInfo?.name}</span></div>
                <div>Symbol: <span className="text-[#e0e0e6]">{tokenInfo?.symbol}</span></div>
                <div>Decimals: <span className="text-[#e0e0e6]">{tokenInfo?.decimals}</span></div>
                <div>Total Supply: <span className="text-[#e0e0e6]">{formatNumber(tokenInfo?.totalSupply || 0)}</span></div>
                <div>Mint Address: <span className="text-[#e0e0e6] font-mono">{tokenInfo?.mintAddress}</span></div>
                <div>Token Account: <span className="text-[#e0e0e6] font-mono">{tokenInfo?.tokenAccountAddress}</span></div>
              </div>
            </div>
          </div>
              <button
                onClick={handleViewOnSolscan}
            className="w-full bg-[#3f3f46] hover:bg-[#52525b] transition-colors duration-200 text-sm font-medium text-[#e0e0e6] h-10 px-4 py-2 border border-[#52525b] hover:border-[#71717a] rounded-lg flex items-center justify-center gap-2"
              >
                <FaExternalLinkAlt className="w-4 h-4" />
                View on Solscan
              </button>
            </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={`overflow-hidden shadow-xl rounded-2xl mt-2 flex flex-col max-w-[480px] mb-3 w-full text-[#e0e0e6] bg-[#3f3f46] border border-[#52525b] hover:shadow-2xl transition-all duration-300 ${className}`}
      style={{ minWidth: 0 }}
    >
      {/* Header with Icon */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#27272a] border-b border-[#52525b]">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-500/20">
            <FaCoins className="w-3.5 h-3.5 text-purple-400" />
            </div>
          <h3 className="text-sm font-medium text-[#e0e0e6]">Create New Token</h3>
            </div>
          </div>

      <div className="p-4">
        <p className="text-xs text-[#a1a1aa] mb-4">Review token details before creation</p>

        <div className="space-y-4">
          {/* Token Details */}
          <div className="bg-[#27272a] border border-[#52525b] rounded-lg p-3">
            <h4 className="font-semibold text-[#e0e0e6] mb-3 text-sm">Token Details</h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                <span className="text-[#a1a1aa]">Name:</span>
                <p className="font-semibold text-[#e0e0e6]">{tokenInfo?.name}</p>
                </div>
                <div>
                <span className="text-[#a1a1aa]">Symbol:</span>
                <p className="font-semibold text-[#e0e0e6]">{tokenInfo?.symbol}</p>
                </div>
                <div>
                <span className="text-[#a1a1aa]">Decimals:</span>
                <p className="font-semibold text-[#e0e0e6]">{tokenInfo?.decimals}</p>
                </div>
                <div>
                <span className="text-[#a1a1aa]">Total Supply:</span>
                <p className="font-semibold text-[#e0e0e6]">
                    {formatNumber(tokenInfo?.totalSupply || 0)}
                  </p>
                </div>
              </div>
            </div>

          {/* Network Information */}
          <div className="bg-[#27272a] border border-[#52525b] rounded-lg p-3">
            <h4 className="font-semibold text-[#e0e0e6] mb-3 text-sm">Network Information</h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                <span className="text-[#a1a1aa]">Network:</span>
                <p className="font-semibold text-[#e0e0e6] capitalize">{tokenInfo?.network}</p>
                </div>
                <div>
                <span className="text-[#a1a1aa]">Payer:</span>
                <p className="font-mono text-xs text-[#e0e0e6] break-all">
                    {tokenInfo?.payer}
                  </p>
                </div>
              </div>
            </div>

          {/* Generated Addresses */}
          <div className="bg-[#27272a] border border-[#52525b] rounded-lg p-3">
            <h4 className="font-semibold text-[#e0e0e6] mb-3 text-sm">Generated Addresses</h4>
            <div className="space-y-2 text-xs">
                <div>
                <span className="text-[#a1a1aa]">Mint Address:</span>
                <p className="font-mono text-xs text-[#e0e0e6] break-all">
                    {tokenInfo?.mintAddress}
                  </p>
                </div>
                <div>
                <span className="text-[#a1a1aa]">Token Account:</span>
                <p className="font-mono text-xs text-[#e0e0e6] break-all">
                    {tokenInfo?.tokenAccountAddress}
                  </p>
                </div>
              </div>
            </div>

          {/* Create Button */}
              <button
                onClick={handleConfirm}
                disabled={isSigning || !embeddedWallet}
            className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 h-12"
              >
                {isSigning ? (
                  <>
                    <FaSpinner className="w-4 h-4 animate-spin" />
                    Creating Token...
                  </>
                ) : (
                  'Create Token'
                )}
              </button>

            {!embeddedWallet && (
            <div className="text-center text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-2">
                Please connect your wallet to create tokens
              </div>
            )}
          </div>
        </div>
    </motion.div>
  );
} 