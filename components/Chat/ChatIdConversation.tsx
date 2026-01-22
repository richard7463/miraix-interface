'use client'
import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { ChatMessage, Persona, Chat, DefaultPersonas } from './interface'
import { API_ENDPOINTS, SOLANA_RPC_URL } from '@/lib/config'
import { AI_CONFIG } from '@/lib/ai-config'
import { useChatStore } from '@/store/chatStore'
import { useSolanaWallets } from '@privy-io/react-auth/solana'
import Thoughts from './Thoughts'
import NewSwap from '@/components/DeFi/NewSwap'
import NewBridge from '@/components/DeFi/NewBridge'
import StakingYield from '@/components/DeFi/StakingYield'
import Market from '@/components/DeFi/Market'
import TokenCreation from '@/components/DeFi/TokenCreation'
import TokenListTable from './TokenListTable';
import { createTokensFromSwapEntities } from '@/utils/swapHelpers'
import MarketTrendCard from '@/components/MarketTrendCard';
import CompareChart from '@/components/CompareChart';
import SentimentChart from '@/components/SentimentChart';
import ErrorBanner from '@/components/ErrorBanner';
import {
  Connection,
  VersionedTransaction,
  Transaction,
  PublicKey,
  ComputeBudgetProgram,
  SystemProgram
} from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createTransferCheckedInstruction,
  TOKEN_PROGRAM_ID
} from '@solana/spl-token';

interface ChatIdConversationProps {
  chatId: string;
  hideActions?: boolean;
}

export default function ChatIdConversation({ chatId, hideActions = false }: ChatIdConversationProps) {
  const router = useRouter()
  const { wallets: solanaWallets } = useSolanaWallets()
  const {
    currentChat,
    chatList,
    setCurrentChat,
    updateChatStatus,
    setMessages: storeSetMessages,
    getMessages,
    setChatList,
    messagesMap,
    saveMessages,
    enableX402Payment,
    setEnableX402Payment
  } = useChatStore()

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [streamingContent, setStreamingContent] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [thinkingDots, setThinkingDots] = useState<string>('');
  const [chatCreated, setChatCreated] = useState(false);
  const [tokenDataMap, setTokenDataMap] = useState<{[key: string]: any}>({});
  const processedX402TransactionsRef = useRef<Set<string>>(new Set());

  // Get Solana wallet address
  const getWalletAddress = () => {
    const embeddedWallet = solanaWallets?.find(wallet => wallet.walletClientType === 'privy');
    return embeddedWallet?.address || '0x1234567890123456789012345678901234567890';
  };

  // Animate the dots for 'Miraix is thinking...'
  useEffect(() => {
    if (isLoading && !isStreaming) {
      let step = 0;
      const interval = setInterval(() => {
        step = (step + 1) % 3;
        setThinkingDots('.'.repeat(step + 1));
      }, 500);
      return () => clearInterval(interval);
    } else {
      setThinkingDots('');
    }
  }, [isLoading, isStreaming]);

  // X402 auto-sign and broadcast transaction
  useEffect(() => {
    const handleX402AutoSign = async () => {
      // Find messages that need X402 auto-signing
      const x402Message = messages.find(msg =>
        msg.responseData?.enableX402Payment === true &&
        msg.responseData?.phase === 'waitingForX402Signature' &&
        msg.responseData?.transaction &&
        msg.id &&
        !processedX402TransactionsRef.current.has(msg.id)
      );

      if (!x402Message || !x402Message.id) {
        return;
      }

      console.log('[X402] Detected X402 auto-sign request:', x402Message.id);

      // Mark as processed (prevent duplicate processing)
      processedX402TransactionsRef.current.add(x402Message.id!);

      try {
        // Get wallet
        const embeddedWallet = solanaWallets?.find(wallet => wallet.walletClientType === 'privy');
        if (!embeddedWallet) {
          toast.error('Wallet not found. Please connect your wallet.');
          return;
        }

        console.log('[X402] Using wallet address:', embeddedWallet.address);

        // Check wallet balance before proceeding
        console.log('[X402] Checking wallet balance...');
        const connection = new Connection(
          'https://special-yolo-tent.solana-mainnet.quiknode.pro/f6e8a1ac41cfcd90c3837b93f190923fd8b89d8f/',
          'confirmed'
        );
        const balance = await connection.getBalance(new PublicKey(embeddedWallet.address));
        const balanceInSol = balance / 1_000_000_000;
        console.log('[X402] Wallet balance:', balanceInSol.toFixed(6), 'SOL');

        // Get swap amount from quote
        const swapAmount = x402Message.responseData?.quote?.inAmount || '0';
        const swapAmountInSol = Number(swapAmount) / 1_000_000_000;
        console.log('[X402] Swap amount:', swapAmountInSol.toFixed(6), 'SOL');

        // Estimate gas fee (0.0002 SOL)
        const estimatedGasFee = 0.0002;
        const totalRequired = swapAmountInSol + estimatedGasFee;

        console.log('[X402] Balance check:', {
          balance: balanceInSol.toFixed(6),
          swapAmount: swapAmountInSol.toFixed(6),
          estimatedGasFee: estimatedGasFee,
          totalRequired: totalRequired.toFixed(6)
        });

        if (balanceInSol < totalRequired) {
          toast.error(`Insufficient SOL balance. Required: ${totalRequired.toFixed(4)} SOL, Available: ${balanceInSol.toFixed(4)} SOL. Please add more SOL to your wallet.`);
          console.error('[X402] Insufficient balance, aborting transaction');
          return;
        }

        // Get unsigned transaction data
        const swapTransactionBase64 = x402Message.responseData!.transaction;
        console.log('[X402] Transaction data length:', swapTransactionBase64.length);

        // Deserialize transaction
        const transactionBuffer = Buffer.from(swapTransactionBase64, 'base64');
        let transaction: VersionedTransaction;

        try {
          transaction = VersionedTransaction.deserialize(transactionBuffer);
          console.log('[X402] Deserialized as VersionedTransaction');
        } catch (versionedError) {
          console.error('[X402] VersionedTransaction deserialization failed:', versionedError);
          throw new Error('Failed to deserialize transaction');
        }

        // Validate required signers before signing
        // In Solana v0 messages, the first `numRequiredSignatures` accounts are required signers.
        const requiredSigners = transaction.message.staticAccountKeys
          .slice(0, transaction.message.header.numRequiredSignatures)
          .map(k => k.toBase58());
        console.log('[X402] Required signers:', requiredSigners);

        if (!requiredSigners.includes(embeddedWallet.address)) {
          throw new Error(
            `Swap transaction requires signer(s) that do not match the connected wallet. Connected: ${embeddedWallet.address}. Required: ${requiredSigners.join(', ')}`
          );
        }

        // Step 1: Sign with user wallet
        console.log('[X402] Step 1/3: Signing with user wallet...');
        const signedTransaction = await embeddedWallet.signTransaction(transaction);
        console.log('[X402] User wallet signature successful');

        // Step 2: Broadcast the signed transaction to Solana network
        // Note: X402 in this context means "auto-sign with user wallet and execute"
        // The user pays gas fees, but the transaction is signed automatically
        console.log('[X402] Step 2/3: Broadcasting signed transaction to Solana...');

        try {
          const signature = await connection.sendRawTransaction(
            signedTransaction.serialize(),
            { skipPreflight: false }
          );
          console.log('[X402] Transaction broadcasted:', signature);
          toast.success(`Transaction broadcasted successfully! Signature: ${signature.substring(0, 8)}...`);

          // Verify transaction confirmation
          console.log('[X402] Step 3/3: Waiting for transaction confirmation...');
          const confirmation = await connection.confirmTransaction(signature, 'confirmed');

          if (confirmation.value.err) {
            throw new Error(`Transaction confirmation failed: ${JSON.stringify(confirmation.value.err)}`);
          }

          console.log('[X402] Transaction confirmed');
          toast.success('Transaction confirmed!');

          // Try to get token info and display transaction success card
          console.log('[X402] x402Message.responseData?.quote:', x402Message.responseData?.quote);

          const getSimpleTokenInfo = async (mintAddress: string, defaultSymbol: string = 'Unknown') => {
            try {
              const response = await fetch(`https://api.jup.ag/tokens/v2/search?query=${mintAddress}`, {
                headers: {
                  'x-api-key': '9dfe02ba-941a-4c4a-952b-d0cccf5c21e7'
                }
              });

              if (!response.ok) {
                console.warn('[X402] Failed to get token info, using default values');
                return { symbol: defaultSymbol, name: defaultSymbol, decimals: 9 };
              }

              const tokenDataArray = await response.json();
              const tokenData = Array.isArray(tokenDataArray) && tokenDataArray.length > 0 ? tokenDataArray[0] : null;

              return tokenData ? {
                symbol: tokenData.symbol,
                name: tokenData.name,
                decimals: tokenData.decimals
              } : { symbol: defaultSymbol, name: defaultSymbol, decimals: 9 };
            } catch (error) {
              console.warn('[X402] Error getting token info:', error);
              return { symbol: defaultSymbol, name: defaultSymbol, decimals: 9 };
            }
          };

          try {
            const quote = x402Message.responseData?.quote;
            console.log('[X402] Quote check:', {
              quote: !!quote,
              inputMint: quote?.inputMint,
              outputMint: quote?.outputMint,
              inAmount: quote?.inAmount,
              outAmount: quote?.outAmount
            });

            if (quote?.inputMint && quote?.outputMint) {
              const fromToken = await getSimpleTokenInfo(quote.inputMint, 'SOL');
              const toToken = await getSimpleTokenInfo(quote.outputMint, 'USDC');
              console.log('[X402] Token info:', { fromToken, toToken });

              // Convert amounts
              const fromDecimals = fromToken.decimals || 9;
              const toDecimals = toToken.decimals || 6;
              const fromAmount = quote.inAmount ?
                (Number(quote.inAmount) / Math.pow(10, fromDecimals)).toFixed(6) : '0';
              const toAmount = quote.outAmount ?
                (Number(quote.outAmount) / Math.pow(10, toDecimals)).toFixed(6) : '0';

              console.log('[X402] Calling handleTransactionSuccess to show transaction success card');
              await handleTransactionSuccess(signature, fromToken, toToken, fromAmount, toAmount);
              console.log('[X402] handleTransactionSuccess completed');
            } else {
              console.warn('[X402] Quote data incomplete, using fallback');
              throw new Error('Quote data not available');
            }
          } catch (error) {
            console.error('[X402] Unable to get detailed token info, showing basic success message:', error);
            // If unable to get token info, still show basic success message
            const successMessage: ChatMessage = {
              id: Date.now().toString(),
              role: 'assistant',
              content: `Great! Your transaction has been completed successfully. Transaction signature: ${signature}`,
              timestamp: new Date().toISOString(),
              transactionStatus: {
                txid: signature,
                status: 'confirmed',
                fromToken: { symbol: 'Unknown', name: 'Unknown' },
                toToken: { symbol: 'Unknown', name: 'Unknown' },
                fromAmount: '0',
                toAmount: '0'
              }
            };
            console.log('[X402] Fallback message added to message list');
            setMessages(prev => [...prev, successMessage]);
          }

        } catch (x402Error: any) {
          console.error('[X402] X402 facilitator error:', x402Error);
          toast.error(`X402 facilitator error: ${x402Error.message || 'Unknown error'}`);

          // Keep message in processed set to prevent infinite retry
          // The user can manually retry by sending a new message
        }

      } catch (error: any) {
        console.error('[X402] Auto-sign failed:', error);
        toast.error(`X402 auto-sign failed: ${error.message || 'Unknown error'}`);

        // Keep message in processed set to prevent infinite retry
        // The user can manually retry by sending a new message
      }
    };

    handleX402AutoSign();
  }, [messages, solanaWallets]);

  // X402 Merchant Payment Flow - NEW
  useEffect(() => {
    const handleMerchantPayment = async () => {
      console.log('[X402 Merchant] Checking for merchant payment messages...', messages.length);

      // Debug: Log all messages with their status
      messages.forEach(msg => {
        if (msg.responseData) {
          console.log('[X402 Merchant] Message debug:', {
            id: msg.id,
            role: msg.role,
            enableX402Payment: msg.responseData.enableX402Payment,
            phase: msg.responseData.phase,
            hasPaymentRequest: !!msg.responseData.paymentRequest,
            paymentRequest: msg.responseData.paymentRequest,
            fullResponseDataKeys: Object.keys(msg.responseData),
            responseDataData: msg.responseData.data
          });
        }
      });

      // Find messages that need merchant payment
      const merchantPaymentMessage = messages.find(msg =>
        msg.responseData?.enableX402Payment === true &&
        msg.responseData?.phase === 'waitingForMerchantPayment' &&
        msg.responseData?.paymentRequest &&
        msg.id &&
        !processedX402TransactionsRef.current.has(msg.id)
      );

      console.log('[X402 Merchant] Found merchant payment message:', !!merchantPaymentMessage);

      if (!merchantPaymentMessage || !merchantPaymentMessage.id) {
        return;
      }

      console.log('[X402 Merchant] Detected merchant payment request:', merchantPaymentMessage.id);

      // Mark as processed (prevent duplicate processing)
      processedX402TransactionsRef.current.add(merchantPaymentMessage.id!);

      try {
        // Get wallet
        const embeddedWallet = solanaWallets?.find(wallet => wallet.walletClientType === 'privy');
        if (!embeddedWallet) {
          toast.error('Wallet not found. Please connect your wallet.');
          return;
        }

        const paymentRequest = merchantPaymentMessage.responseData?.paymentRequest;
        const paymentRequirements = paymentRequest?.paymentRequirements;

        console.log('[X402 Merchant] Payment request:', paymentRequest);
        console.log('[X402 Merchant] Payment requirements:', paymentRequirements);

        if (!paymentRequirements) {
          throw new Error('Payment requirements not found. Please try again.');
        }

        // Step 1: Build Solana transaction with 3 required instructions (x402 spec)
        toast.loading('Building transaction...');
        console.log('[X402 Merchant] Step 1/3: Building transaction with 3 instructions...');

        const connection = new Connection(SOLANA_RPC_URL);
        const userWalletPubkey = new PublicKey(embeddedWallet.address);
        const merchantPubkey = new PublicKey(paymentRequirements.payTo);
        const tokenMintPubkey = new PublicKey(paymentRequirements.asset);

        // Get user's token account
        const userTokenAccount = await getAssociatedTokenAddress(
          userWalletPubkey,
          tokenMintPubkey
        );

        // Get merchant's token account (derive it, don't query chain)
        const merchantTokenAccount = await getAssociatedTokenAddress(
          merchantPubkey,
          tokenMintPubkey
        );

        // Parse amount and determine decimals (USDC = 6, SOL = 9)
        const amount = BigInt(paymentRequirements.maxAmountRequired);
        const isUSDC = paymentRequirements.asset === 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
        const decimals = isUSDC ? 6 : 9;

        console.log('[X402 Merchant] Transaction params:', {
          userTokenAccount: userTokenAccount.toBase58(),
          merchantTokenAccount: merchantTokenAccount.toBase58(),
          amount: amount.toString(),
          decimals
        });

        // Create transaction with EXACTLY 3 instructions (x402 spec requirement)
        const transaction = new Transaction();
        transaction.add(
          ComputeBudgetProgram.setComputeUnitLimit({ units: 200_000 }),
          ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1 }),
          createTransferCheckedInstruction(
            userTokenAccount,
            tokenMintPubkey,
            merchantTokenAccount,
            userWalletPubkey,
            amount,
            decimals
          )
        );

        console.log('[X402 Merchant] Transaction built with 3 instructions');

        // Step 2: Sign transaction with user wallet
        toast.loading('Please sign transaction...');
        console.log('[X402 Merchant] Step 2/3: Signing transaction with user wallet...');

        const signedTransaction = await embeddedWallet.signTransaction(transaction);
        console.log('[X402 Merchant] Transaction signed by user');

        // Step 3: Serialize to base64
        const base64Transaction = Buffer.from(signedTransaction.serialize()).toString('base64');
        console.log('[X402 Merchant] Transaction serialized to base64, length:', base64Transaction.length);

        // Step 4: Send to PayAI Facilitator via backend proxy (x402 spec format)
        toast.loading('Processing payment via PayAI Facilitator...');
        console.log('[X402 Merchant] Step 3/3: Sending to PayAI Facilitator...');

        const requestBody = {
          paymentPayload: {
            x402Version: 1,
            scheme: 'exact',
            network: 'solana',
            payload: {
              transaction: base64Transaction
            }
          },
          paymentRequirements
        };

        console.log('[X402 Merchant] Request body:', JSON.stringify(requestBody, null, 2));
        console.log('[X402 Merchant] Sending to:', API_ENDPOINTS.PAYAI_SETTLE);

        const facilitatorResponse = await fetch(API_ENDPOINTS.PAYAI_SETTLE, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });

        const facilitatorResult = await facilitatorResponse.json();
        console.log('[X402 Merchant] Facilitator response:', facilitatorResult);

        if (!facilitatorResponse.ok) {
          throw new Error(`PayAI Facilitator error: ${facilitatorResult.error || facilitatorResult.message || facilitatorResult.errorReason || 'Unknown error'}`);
        }

        if (!facilitatorResult.success) {
          throw new Error(`Payment failed: ${facilitatorResult.errorReason || facilitatorResult.error || 'Unknown error'}`);
        }

        console.log('[X402 Merchant] Payment successful:', facilitatorResult);
        toast.success('Payment completed! Verifying...');

        // Step 2: Wait for payment confirmation
        const txSignature = facilitatorResult.transaction || facilitatorResult.txSignature;
        console.log('[X402 Merchant] Transaction signature:', txSignature);

        // Step 2: Wait for payment confirmation on-chain
        console.log('[X402 Merchant] Step 2/3: Waiting for payment confirmation on-chain...');

        // Wait for transaction confirmation (reuse existing connection)
        let confirmed = false;
        let attempts = 0;
        const maxAttempts = 30; // 1 minute max

        while (!confirmed && attempts < maxAttempts) {
          try {
            const txStatus = await connection.getSignatureStatus(txSignature);
            if (txStatus.value?.confirmationStatus === 'confirmed' || txStatus.value?.confirmationStatus === 'finalized') {
              confirmed = true;
              console.log('[X402 Merchant] Transaction confirmed!');
            } else {
              attempts++;
              if (attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
              }
            }
          } catch (error) {
            console.error('[X402 Merchant] Error checking tx status:', error);
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }

        if (!confirmed) {
          throw new Error('Payment confirmation timeout');
        }

        // Step 3: Execute swap after payment
        console.log('[X402 Merchant] Step 3/3: Executing swap...');
        toast.success('Payment confirmed! Executing swap...');

        // Call backend to execute the swap (use correct port 3009)
        const executeResponse = await fetch('http://localhost:3009/api/x402/execute-after-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentId: txSignature, // Use transaction signature as payment ID
            threadId: chatId,
            message: merchantPaymentMessage.content,
            walletAddress: embeddedWallet.address,
            mintPubkey: paymentRequest.tokenMint
          })
        });

        const executeData = await executeResponse.json();

        if (!executeResponse.ok) {
          throw new Error(`Execute failed: ${executeData.error || 'Unknown error'}`);
        }

        console.log('[X402 Merchant] Swap completed:', executeData);
        toast.success('Swap completed successfully!');

        // Add success message to chat
        const successMessage: ChatMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `Great! Your swap has been completed successfully via X402 merchant payment. Transaction signature: ${executeData.result?.transaction?.value || 'N/A'}`,
          timestamp: new Date().toISOString(),
          responseData: {
            ...executeData.result
          }
        };

        setMessages(prev => [...prev, successMessage]);
        saveMessages(chatId, [...messages, successMessage]);

      } catch (error: any) {
        console.error('[X402 Merchant] Error:', error);
        toast.error(`X402 merchant payment failed: ${error.message || 'Unknown error'}`);

        // Remove from processed set to allow retry
        processedX402TransactionsRef.current.delete(merchantPaymentMessage.id!);
      }
    };

    handleMerchantPayment();
  }, [messages, solanaWallets, chatId]);

  // 监听 currentChat 的变化，打印 isNew 状态
  useEffect(() => {
    console.log('[ChatIdConversation] currentChat status:', {
      chatId,
      currentChat,
      isNew: currentChat?.isNew,
      chatListLength: chatList.length
    })

    console.log('[ChatIdConversation] get messages:', getMessages(chatId))

    const loadMessages = async () => {
      if (!chatId) return

      try {
        console.log('[ChatIdConversation] Loading messages for chat:', chatId)
        
        // 恢复消息加载API调用
        let response;
        try {
          response = await fetch(API_ENDPOINTS.CHAT_MESSAGES(chatId), {
            headers: {
              'Content-Type': 'application/json',
              'signature': '0x1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890',
              'message': `Get messages for chat ${chatId}`,
              'address': getWalletAddress()
            }
          });
        } catch (fetchError) {
          console.error('[ChatIdConversation] Fetch error loading messages:', fetchError);
          // 不要抛出错误，静默处理
          console.log('[ChatIdConversation] Failed to load messages, but continuing...');
          return;
        }
        
        if (!response || !response.ok) {
          console.warn('[ChatIdConversation] Failed to load messages, status:', response?.status);
          // 不要抛出错误，静默处理
          return;
        }
        
        const data = await response.json()
        console.log('[ChatIdConversation] Raw API response:', {
          chatId,
          fullResponse: data,
          messages: data.messages,
          messageCount: data.messages?.length || 0,
          responseKeys: Object.keys(data)
        })

        // 如果是历史会话，加载消息并按时间戳排序
        if (!currentChat?.isNew) {
          // 先检查消息的时间戳格式
          if (data.messages && data.messages.length > 0) {
            console.log('[ChatIdConversation] Message timestamp analysis:', {
              firstMessage: {
                timestamp: data.messages[0].timestamp,
                createdAt: data.messages[0].createdAt,
                id: data.messages[0].id,
                role: data.messages[0].role,
                content: data.messages[0].content?.substring(0, 50) + '...'
              },
              lastMessage: {
                timestamp: data.messages[data.messages.length - 1].timestamp,
                createdAt: data.messages[data.messages.length - 1].createdAt,
                id: data.messages[data.messages.length - 1].id,
                role: data.messages[data.messages.length - 1].role,
                content: data.messages[data.messages.length - 1].content?.substring(0, 50) + '...'
              },
              allMessages: data.messages.map((msg: any, index: number) => ({
                index,
                id: msg.id,
                role: msg.role,
                timestamp: msg.timestamp,
                createdAt: msg.createdAt,
                content: msg.content?.substring(0, 30) + '...'
              }))
            });
          }
          
          // 检查时间戳字段
          console.log('[ChatIdConversation] Timestamp field analysis:', {
            messages: data.messages?.map((msg: any) => ({
              id: msg.id,
              role: msg.role,
              timestamp: msg.timestamp,
              createdAt: msg.createdAt,
              hasTimestamp: !!msg.timestamp,
              hasCreatedAt: !!msg.createdAt,
              timestampType: typeof msg.timestamp,
              createdAtType: typeof msg.createdAt
            }))
          });
          
          // 从消息ID中提取时间戳的函数
          const extractTimestampFromId = (id: string): number => {
            // 处理格式: 'msg-1751625661227-al66jq4oe' 或 '1751625649553'
            const match = id.match(/(?:msg-)?(\d+)/);
            return match ? parseInt(match[1]) : 0;
          };
          
          const sortedMessages = (data.messages || []).sort((a: any, b: any) => {
            // 首先尝试使用timestamp字段
            const timeA = new Date(a.timestamp || a.createdAt || 0).getTime();
            const timeB = new Date(b.timestamp || b.createdAt || 0).getTime();
            
            // 如果timestamp相同，使用ID中的时间戳
            if (timeA === timeB && timeA !== 0) {
              const idTimeA = extractTimestampFromId(a.id || '');
              const idTimeB = extractTimestampFromId(b.id || '');
              console.log('[ChatIdConversation] Using ID timestamp for sorting:', {
                messageA: { 
                  id: a.id, 
                  role: a.role, 
                  idTimeA,
                  content: a.content?.substring(0, 30) + '...'
                },
                messageB: { 
                  id: b.id, 
                  role: b.role, 
                  idTimeB,
                  content: b.content?.substring(0, 30) + '...'
                },
                result: idTimeA - idTimeB
              });
              return idTimeA - idTimeB;
            }
            
            console.log('[ChatIdConversation] Using timestamp field for sorting:', {
              messageA: { 
                id: a.id, 
                role: a.role, 
                timeA, 
                timestamp: a.timestamp, 
                createdAt: a.createdAt,
                content: a.content?.substring(0, 30) + '...'
              },
              messageB: { 
                id: b.id, 
                role: b.role, 
                timeB, 
                timestamp: b.timestamp, 
                createdAt: b.createdAt,
                content: b.content?.substring(0, 30) + '...'
              },
              result: timeA - timeB
            });
            return timeA - timeB; // 按时间升序排列（最早的在前）
          });
          
          console.log('[ChatIdConversation] Sorted messages:', {
            originalCount: data.messages?.length || 0,
            sortedCount: sortedMessages.length,
            firstMessage: sortedMessages[0],
            lastMessage: sortedMessages[sortedMessages.length - 1],
            sortedOrder: sortedMessages.map((msg: any, index: number) => ({
              index,
              id: msg.id,
              role: msg.role,
              timestamp: msg.timestamp,
              content: msg.content?.substring(0, 30) + '...'
            }))
          });
          
          setMessages(sortedMessages);
          storeSetMessages(chatId, sortedMessages);
        }
        
        console.log('[ChatIdConversation] Message loading completed');
      } catch (error) {
        console.error('[ChatIdConversation] Error loading messages:', error)
        // 不要显示 toast 错误，静默处理
        console.log('[ChatIdConversation] Failed to load messages, but continuing...');
      } finally {
        setIsInitialLoading(false)
      }
    }

    // 新建会话的处理逻辑
    if (currentChat?.isNew && !chatCreated) {
      console.log('[ChatIdConversation] Processing new chat:', chatId);
      const existingMessages = getMessages(chatId);
      console.log('[ChatIdConversation] New chat with existing messages:', existingMessages);
      
      // 使用本地消息，避免重复调用API
      setMessages(existingMessages);
      setIsInitialLoading(false);
      
      // 如果有用户消息但没有AI回复，自动调用AI回复
      if (existingMessages.length > 0) {
        const hasAIReply = existingMessages.some(msg => msg.role === 'assistant');
        
        if (!hasAIReply) {
          console.log('[ChatIdConversation] Found user message without AI reply, triggering auto reply');
          // 延迟一点时间确保组件完全加载
          setTimeout(() => {
            handleAutoReply(existingMessages);
          }, 100);
        }
      }
      
      // 标记聊天已创建
      setChatCreated(true);
      console.log('[ChatIdConversation] New chat ready for user input');
    } 
    // 非新建会话的处理逻辑
    else if (!currentChat?.isNew) {
      // 只在非新建会话时尝试加载消息
      console.log('[ChatIdConversation] Loading messages for existing chat:', chatId);
      // 恢复消息加载调用
      loadMessages();
      console.log('[ChatIdConversation] Message loading enabled for existing chat');
    } 
    // 其他情况（新建会话但已创建）
    else {
      // 新建会话，不需要加载消息
      console.log('[ChatIdConversation] New chat (already created), skipping message load');
      setIsInitialLoading(false);
    }
    
    return;
  }, [currentChat, chatId, chatList, setCurrentChat, setChatList, chatCreated]);

  // 处理异步token数据创建
  useEffect(() => {
    const createTokenDataForMessages = async () => {
      const newTokenDataMap = { ...tokenDataMap };
      let hasChanges = false;

      for (const message of messages) {
        // 只对swap操作创建token数据，跳过其他操作
        if (message.swapEntities && message.id && !tokenDataMap[message.id] && 
            message.responseData?.data?.intent !== 'createToken') {
          try {
            console.log('[ChatIdConversation] 为消息创建token数据:', message.id);
            const { createTokensFromSwapEntities } = await import('@/utils/swapHelpers');
            const tokenData = await createTokensFromSwapEntities(message.swapEntities, message.quote);
            
            if (tokenData) {
              newTokenDataMap[message.id] = tokenData;
              hasChanges = true;
              console.log('[ChatIdConversation] Token数据创建成功:', message.id, tokenData);
            }
          } catch (error) {
            console.error('[ChatIdConversation] 创建token数据失败:', message.id, error);
          }
        }
      }

      if (hasChanges) {
        setTokenDataMap(newTokenDataMap);
      }
    };

    createTokenDataForMessages();
  }, [messages, tokenDataMap]);

  // Scroll to bottom when messages change
  useEffect(() => {
    console.log('[ChatIdConversation] useEffect - messages change:', {
      messages
    })
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 添加isLoading状态变化的调试日志
  useEffect(() => {
    console.log('[ChatIdConversation] isLoading state changed:', {
      isLoading,
      isStreaming,
      messagesLength: messages.length
    });
  }, [isLoading, isStreaming, messages.length]);

  const mockAIResponse = async (message: string): Promise<ChatMessage> => {
    return {
      role: 'assistant',
      content: 'This is a mock AI reply.',
      timestamp: new Date().toISOString(),
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
  };

  const getAIResponse = async (messages: ChatMessage[]): Promise<ChatMessage> => {
    try {
      const lastMessage = messages[messages.length - 1]?.content || '';
      const walletAddress = getWalletAddress();
      console.log('[getAIResponse] Sending request to AI API with message:', lastMessage);
      console.log('[getAIResponse] Using wallet address:', walletAddress);
      console.log('[getAIResponse] ChatId:', chatId);
      
      // Debug: Check message content
      console.log('[getAIResponse] Message debug:', {
        original: lastMessage,
        trimmed: lastMessage.toLowerCase().trim(),
        target: 'find me the best staking yields',
        matches: lastMessage.toLowerCase().trim() === 'find me the best staking yields'
      });
      
      // 检查是否是staking yields请求
      const isStakingYieldsRequest = lastMessage.toLowerCase().includes('staking yields') || lastMessage.toLowerCase().trim() === 'find me the best staking yields';
      
      // 检查是否是Token创建请求
      const isTokenCreationRequest = lastMessage.toLowerCase().includes('create token') || 
                                   lastMessage.toLowerCase().includes('create a token') ||
                                   lastMessage.toLowerCase().includes('new token');
      
      console.log('[getAIResponse] Token creation request check:', {
        lastMessage,
        isTokenCreationRequest,
        lowerCase: lastMessage.toLowerCase()
      });
      
      // 如果是Token创建请求，生成mintKeypair并传递mintPubkey
      let mintPubkey = null;
      let mintKeypair: any = null;
      if (isTokenCreationRequest) {
        const { Keypair } = await import('@solana/web3.js');
        mintKeypair = Keypair.generate();
        mintPubkey = mintKeypair.publicKey.toBase58();
        console.log('[getAIResponse] Generated mintPubkey for token creation:', mintPubkey);
      }
      
      const API_BASE_URL = process.env.NODE_ENV === 'production'
        ? 'https://langgraph-defai.vercel.app'
        : 'http://localhost:3009';
      // 调用 /api/chat-new 获取 AI 回复
      const response = await fetch(`${API_BASE_URL}/api/chat-new`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'signature': '0x1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890',
          'message': `AI response for: ${lastMessage}`,
          'address': walletAddress
        },
        body: JSON.stringify({
          message: lastMessage,
          walletAddress: walletAddress,
          mintPubkey: mintPubkey, // 传递mintPubkey给后端
          enableX402Payment: enableX402Payment // 传递x402自动支付设置给后端
        })
      });

      console.log('[getAIResponse] Request body:', {
        message: lastMessage,
        walletAddress,
        mintPubkey,
        enableX402Payment
      });
      
      console.log('[getAIResponse] /api/chat-new response status:', response?.status);
      
      if (!response || !response.ok) {
        const errorText = await response?.text() || 'Unknown error';
        console.error(`[getAIResponse] API request failed with status ${response?.status}:`, errorText);
        throw new Error(`API request failed with status ${response?.status}: ${errorText}`);
      }

      const responseData = await response.json();
      console.log('[getAIResponse] Received response:', responseData);
      console.log('[getAIResponse] Response details:', {
        success: responseData.success,
        error: responseData.error,
        hasQuote: !!responseData.quote,
        hasResultQuote: !!responseData.result?.quote?.value,
        hasError: !!responseData.error,
        message: responseData.message
      });
      
      // 如果是staking yields请求，使用hardcode的AI回复消息
      if (isStakingYieldsRequest) {
        console.log('[getAIResponse] Using hardcoded message for staking yields request');
        responseData.message = "I've found the best liquid staking yields for you. Please choose one of the options above to stake your SOL.";
        if (responseData.data) {
          responseData.data.response = "I've found the best liquid staking yields for you. Please choose one of the options above to stake your SOL.";
        }
      }
      
      // 正确提取 quote 数据 - 它可能在 result.quote.value 中
      const quote = responseData.quote || responseData.result?.quote?.value;
      
      // 特别输出 quote 信息
      if (quote) {
        console.log('[getAIResponse] Quote information:', {
          quote: quote,
          inputMintLogo: quote.inputMintLogo,
          outputMintLogo: quote.outputMintLogo
        });
      }
      
      return {
        role: 'assistant' as const,
        content: responseData.message || 'No response from AI',
        timestamp: new Date().toISOString(),
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        thoughts: responseData.thoughts || [],
        quote: quote || null,
        swapEntities: responseData.data?.entities || null,
        responseData: responseData,
        mintKeypair: mintKeypair // 保存mintKeypair到消息中
      };
    } catch (error) {
      console.error('[ChatIdConversation] Error getting AI response:', error);
      setIsStreaming(false);
      
      // 返回一个简单的错误响应
      return {
        role: 'assistant' as const,
        content: 'Sorry, I am unable to connect to the server at the moment. Please check if the server is running or try again later.',
        timestamp: new Date().toISOString(),
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        thoughts: ['Server connection failed'],
        quote: null,
        swapEntities: null,
        responseData: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    } finally {
      console.log('[getAIResponse] Function completed, ensuring loading state is properly managed');
    }
  };

  // 处理自动AI回复
  const handleAutoReply = async (existingMessages: ChatMessage[]) => {
    console.log('[ChatIdConversation] handleAutoReply called with messages:', existingMessages);
    
    try {
      setIsLoading(true);
      
      // 1. 先调用创建新会话 API
      const createChatResponse = await fetch('https://new-miraix-api.vercel.app/api/create-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'signature': '0x1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890',
          'message': 'test-message-for-signature',
          'address': getWalletAddress()
        },
        body: JSON.stringify({
          chatId: chatId,
          persona: currentChat?.persona || { name: 'default', description: 'default' },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          message: existingMessages[0]?.content || ''
        })
      });
      
      if (!createChatResponse.ok) {
        throw new Error(`Failed to create chat: ${createChatResponse.status}`);
      }
      
      console.log('[ChatIdConversation] Chat created successfully in handleAutoReply');
      
      // 2. 获取 AI 回复
      const aiReply = await getAIResponse(existingMessages);
      const newMessages = [...existingMessages, aiReply];
      setMessages(newMessages);
      storeSetMessages(chatId, newMessages);
      
      // 3. 保存消息到服务器
      const messagesToSave = newMessages.map(msg => ({
        content: msg.content,
        role: msg.role,
        timestamp: msg.timestamp,
        id: msg.id,
        thoughts: msg.thoughts,
        swapEntities: msg.swapEntities,
        quote: msg.quote,
        responseData: msg.responseData,
        transactionStatus: msg.transactionStatus
      }));
      
      await saveMessages(chatId, messagesToSave, getWalletAddress());
      console.log('[ChatIdConversation] Auto AI reply and save done');
      
      // 4. 延迟更新聊天状态，标记为非新建，避免触发消息加载
      console.log('[ChatIdConversation] Delaying isNew status update to avoid triggering message load');
      setTimeout(() => {
        updateChatStatus(chatId, false);
        console.log('[ChatIdConversation] isNew status updated to false after delay');
      }, 2000); // 延迟2秒更新状态
      
    } catch (err) {
      console.error('[ChatIdConversation] Auto AI reply error:', err);
      toast.error('Failed to auto reply for new chat');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReply = async () => {
    try {
      // 获取最后一条用户消息
      const lastUserMessage = messages.find(msg => msg.role === 'user');
      if (!lastUserMessage) {
        console.error('[fetchReply] No user message found');
        return;
      }

      // 调用 AI 回复接口
      const reply = await getAIResponse([lastUserMessage]);
      console.log('[fetchReply] Received AI reply:', reply);
      
      // 更新消息列表
      setMessages(prev => {
        const newMessages = [...prev, reply];
        console.log('[fetchReply] Updated messages:', newMessages);
        
        // 保存消息到服务器 - 使用正确的格式
        const messagesToSave = newMessages.map(msg => ({
          content: msg.content,
          role: msg.role,
          timestamp: msg.timestamp,
          id: msg.id,
          thoughts: msg.thoughts,
          swapEntities: msg.swapEntities,
          quote: msg.quote,
          responseData: msg.responseData,
          transactionStatus: msg.transactionStatus
        }));
        
        saveMessages(chatId, messagesToSave, getWalletAddress()).catch((error: Error) => {
          console.error('[fetchReply] Failed to save messages to server:', error);
          toast.error('Failed to save messages to server');
        });
        return newMessages;
      });
      
      // 更新 store 中的消息
      storeSetMessages(chatId, [...messages, reply]);
      console.log('[fetchReply] Updated store messages');
    } catch (error) {
      console.error('[fetchReply] Error getting AI response:', error);
      toast.error('Failed to get AI response');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    try {
      setIsLoading(true);
      setError(null); // 清除之前的错误

      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: input.trim(),
        timestamp: new Date().toISOString(),
      };

      console.log('[ChatIdConversation] handleSend - Starting:', {
        input: input.trim(),
        currentChat,
        chatId,
        isNew: currentChat?.isNew,
        chatListLength: chatList.length,
        existingMessages: getMessages(chatId)
      });

      if (!currentChat) {
        throw new Error('No current chat found');
      }

      // 添加用户消息到消息列表
      setMessages(prev => [...prev, userMessage]);
      setInput('');

      // 如果是新建的聊天，先创建聊天会话
      if (currentChat.isNew && !chatCreated) {
        console.log('[ChatIdConversation] Creating new chat session for first message:', {
          chatId,
          currentChat,
          isNew: currentChat.isNew
        });
        
        try {
          // 1. 调用创建新会话 API
          const createChatResponse = await fetch('https://new-miraix-api.vercel.app/api/create-chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'signature': '0x1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890',
              'message': 'test-message-for-signature',
              'address': getWalletAddress()
            },
            body: JSON.stringify({
              chatId: chatId,
              persona: currentChat?.persona || { name: 'default', description: 'default' },
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              message: input.trim()
            })
          });
          
          if (!createChatResponse.ok) {
            throw new Error(`Failed to create chat: ${createChatResponse.status}`);
          }
          
          console.log('[ChatIdConversation] Chat created successfully in handleSend');
          setChatCreated(true);
          
          // 2. 延迟更新聊天状态，标记为非新建，避免触发消息加载
          console.log('[ChatIdConversation] Delaying chat status update to avoid triggering message load');
          setTimeout(() => {
            console.log('[ChatIdConversation] Updating chat status:', {
              chatId,
              isNew: false
            });
            updateChatStatus(chatId, false);
          }, 2000); // 延迟2秒更新状态
        } catch (err) {
          console.error('[ChatIdConversation] Error creating chat session:', err);
          toast.error('Failed to create chat session, but will try to continue');
        }
      }

      // 每次用户输入都必须调用AI回复 - 使用包含新用户消息的数组
      const messagesWithUserMessage = [...messages, userMessage];
      console.log('[ChatIdConversation] Calling getAIResponse with messages:', messagesWithUserMessage);
      
      try {
        const replyMessage = await getAIResponse(messagesWithUserMessage);
        console.log('[ChatIdConversation] Received AI reply:', replyMessage);

        // 更新消息列表
        setMessages(prev => {
          const newMessages = [...prev, replyMessage];
          console.log('[ChatIdConversation] Updated messages list:', {
            previousLength: prev.length,
            newLength: newMessages.length,
            messages: newMessages
          });
          
          // 保存消息到服务器 - 使用正确的格式
          const messagesToSave = newMessages.map(msg => ({
            content: msg.content,
            role: msg.role,
            timestamp: msg.timestamp,
            id: msg.id,
            thoughts: msg.thoughts,
            swapEntities: msg.swapEntities,
            quote: msg.quote,
            responseData: msg.responseData,
            transactionStatus: msg.transactionStatus
          }));
          
          console.log('[ChatIdConversation] Saving messages to store and server:', {
            chatId,
            messagesToSave,
            walletAddress: getWalletAddress()
          });
          
          // Save to local store
          storeSetMessages(chatId, newMessages);
          console.log('[ChatIdConversation] Messages saved to local store');
          
          // Save to server
          saveMessages(chatId, messagesToSave, getWalletAddress()).then(() => {
            console.log('[ChatIdConversation] Messages saved to server successfully');
          }).catch((error: Error) => {
            console.error('[ChatIdConversation] Failed to save messages to server:', error);
            toast.error('Failed to save messages to server');
          });
          
          return newMessages;
        });
      } catch (err) {
        console.error('[ChatIdConversation] Error getting AI response:', err);
        toast.error('Failed to get response. Please try again.');
        setError('Failed to get response. Please try again.');
      }

    } catch (error) {
      console.error('[ChatIdConversation] Error sending message:', error);
      toast.error('Failed to send message');
      setError('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // 处理交易成功消息
  const handleTransactionSuccess = async (txid: string, fromToken: any, toToken: any, fromAmount: string, toAmount: string) => {
    console.log('🎉 Transaction success callback triggered:', { txid, fromToken, toToken, fromAmount, toAmount });
    
    // 触发余额刷新事件
    console.log('🔄 Triggering balance refresh from ChatIdConversation...');
    const event = new CustomEvent('refreshBalance');
    window.dispatchEvent(event);
    
    // 构建交易成功消息
    const successMessage = `Great! I've successfully completed your swap transaction. You swapped ${fromAmount} ${fromToken.symbol} to ${toAmount} ${toToken.symbol}. You can check the transaction status on Solscan using the link below.`;
    
    // 创建交易状态卡片消息
    const transactionStatusMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      content: successMessage,
      timestamp: new Date().toISOString(),
      transactionStatus: {
        txid,
        status: 'confirmed',
        fromToken,
        toToken,
        fromAmount,
        toAmount
      }
    };

    // 添加消息到聊天
    setMessages(prev => [...prev, transactionStatusMessage]);
  };

  // 处理token creation成功消息
  const handleTokenCreationSuccess = async (txid: string, tokenInfo: any) => {
    console.log('🎉 Token creation success callback triggered:', { txid, tokenInfo });
    
    // 构建token创建成功消息
    const successMessage = `Great! I've successfully created your token "${tokenInfo.name}" (${tokenInfo.symbol}). The token has been deployed to Solana Devnet. You can check the transaction status on Solscan using the link below.`;
    
    // 创建交易状态卡片消息
    const transactionStatusMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      content: successMessage,
      timestamp: new Date().toISOString(),
      transactionStatus: {
        txid,
        status: 'confirmed',
        fromToken: tokenInfo,
        toToken: tokenInfo,
        fromAmount: '1',
        toAmount: '1'
      }
    };

    // 添加消息到聊天
    setMessages(prev => [...prev, transactionStatusMessage]);
  };

  // 处理协议选择并发送消息
  const handleProtocolSelect = async (protocol: any) => {
    console.log('🌾 Protocol selected in ChatIdConversation:', protocol);
    const message = `I want to stake 1 SOL using ${protocol.symbol}`;
    console.log('🌾 Sending protocol selection message:', message);
    
    // 创建用户消息
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };

    // 添加用户消息到消息列表
    setMessages(prev => [...prev, userMessage]);

    try {
      setIsLoading(true);
      
      // 调用AI回复
      const replyMessage = await getAIResponse([...messages, userMessage]);
      console.log('[ChatIdConversation] Received AI reply for protocol selection:', replyMessage);

      // 更新消息列表
      setMessages(prev => {
        const newMessages = [...prev, replyMessage];
        
        // 保存消息到服务器
        const messagesToSave = newMessages.map(msg => ({
          content: msg.content,
          role: msg.role,
          timestamp: msg.timestamp,
          id: msg.id,
          thoughts: msg.thoughts,
          swapEntities: msg.swapEntities,
          quote: msg.quote,
          responseData: msg.responseData,
          transactionStatus: msg.transactionStatus
        }));
        
        // Save to local store
        storeSetMessages(chatId, newMessages);
        
        // Save to server
        saveMessages(chatId, messagesToSave, getWalletAddress()).catch((error: Error) => {
          console.error('[ChatIdConversation] Failed to save messages to server:', error);
        });
        
        return newMessages;
      });
    } catch (err) {
      console.error('[ChatIdConversation] Error getting AI response for protocol selection:', err);
      toast.error('Failed to get response for protocol selection');
    } finally {
      setIsLoading(false);
    }
  };

  if (isInitialLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="flex flex-col relative" style={{ height: '100%' }}>
      <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-4" style={{ height: 'calc(100% - 100px)' }}>
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            No messages yet. Start a conversation!
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              // tokenList/defiPools
              if ((message.responseData?.dataType === 'tokenList' || message.responseData?.dataType === 'defiPools') && Array.isArray(message.responseData?.data)) {
                return (
                  <div key={index} className="flex flex-col">
                    <div className="md:ml-[76px] flex justify-center md:justify-start">
                      <div className="w-full max-w-[680px]">
                        <TokenListTable data={message.responseData.data} />
                      </div>
                    </div>
                  </div>
                );
              }
              // marketTrend
              if (message.responseData?.dataType === 'marketTrend' && message.responseData?.data) {
                return (
                  <div key={index} className="flex flex-col">
                    <div className="md:ml-[76px] flex justify-center md:justify-start">
                      <div className="w-full max-w-[480px]">
                        <MarketTrendCard data={message.responseData.data} />
                      </div>
                    </div>
                  </div>
                );
              }
              // volatilityCompare
              if (message.responseData?.dataType === 'volatilityCompare' && message.responseData?.data) {
                return (
                  <div key={index} className="flex flex-col">
                    <div className="md:ml-[76px] flex justify-center md:justify-start">
                      <div className="w-full max-w-[680px]">
                        <CompareChart data={message.responseData.data} />
                      </div>
                    </div>
                  </div>
                );
              }
              // sentiment
              if (message.responseData?.dataType === 'sentiment' && message.responseData?.data) {
                return (
                  <div key={index} className="flex flex-col">
                    <div className="md:ml-[76px] flex justify-center md:justify-start">
                      <div className="w-full max-w-[480px]">
                        <SentimentChart data={message.responseData.data} />
                      </div>
                    </div>
                  </div>
                );
              }
              // error
              if (message.responseData?.dataType === 'error' && message.responseData?.error) {
                return (
                  <div key={index} className="flex flex-col">
                    <div className="md:ml-[76px] flex justify-center md:justify-start">
                      <div className="w-full max-w-[480px]">
                        <ErrorBanner message={message.responseData.error} />
                      </div>
                    </div>
                  </div>
                );
              }
              console.log(`[ChatIdConversation] Processing message ${index}:`, {
                role: message.role,
                content: message.content,
                hasQuote: !!message.quote,
                hasResponseData: !!message.responseData,
                responseDataSuccess: message.responseData?.success,
                responseDataError: message.responseData?.error,
                responseDataKeys: message.responseData ? Object.keys(message.responseData) : [],
                fullResponseData: message.responseData
              });

              // 检查是否是 bridge 操作
              const isBridgeOperation = message.role === 'assistant' && 
                (message.responseData?.data?.intent === 'bridge' || 
                 message.content.toLowerCase().includes('bridge') ||
                 message.responseData?.quote?.provider);

              // 检查是否是 staking 操作 (协议选择)
              const isStakingOperation = message.role === 'assistant' && 
                (message.responseData?.data?.intent === 'stakingAgent' || 
                 message.responseData?.data?.intent === 'staking' ||
                 message.responseData?.quote?.protocols ||
                 (message.responseData?.success === true && message.responseData?.data?.quote?.protocols));

              // 检查是否是 market 操作
              const isMarketOperation = message.role === 'assistant' && 
                (message.responseData?.data?.intent === 'marketData' || 
                 message.responseData?.data?.intent === 'trending' ||
                 message.content.toLowerCase().includes('market') ||
                 message.content.toLowerCase().includes('trending') ||
                 message.responseData?.data?.data?.trendingTokens ||
                 (message.responseData?.success === true && message.responseData?.data?.data?.trendingTokens));

              // 检查是否是 token creation 操作
              const isTokenCreationOperation = message.role === 'assistant' && 
                (message.responseData?.data?.intent === 'createToken' || 
                 message.content.toLowerCase().includes('create token') ||
                 message.content.toLowerCase().includes('token creation') ||
                 message.responseData?.quote?.unsignedTx);

              console.log('[ChatIdConversation] Staking operation check:', {
                messageRole: message.role,
                isAssistant: message.role === 'assistant',
                intent: message.responseData?.data?.intent,
                contentIncludesStaking: message.content.toLowerCase().includes('staking'),
                hasQuoteProtocols: !!message.responseData?.quote?.protocols,
                hasDataQuoteProtocols: !!(message.responseData?.success === true && message.responseData?.data?.quote?.protocols),
                isStakingOperation,
                isMarketOperation,
                responseDataKeys: message.responseData ? Object.keys(message.responseData) : [],
                dataKeys: message.responseData?.data ? Object.keys(message.responseData.data) : []
              });

              // 检查是否是 swap 操作 (包括 stake intent，因为它使用swap机制)
              const hasSwapData = !!(message.quote || 
                                   message.swapEntities ||
                                   (message.responseData?.success === true && message.responseData?.data?.quote) ||
                                   (message.responseData?.success === true && message.responseData?.data?.swapEntities));
              
              const hasSwapError = !!(message.responseData?.error && 
                                   message.responseData?.error.includes('quote'));
              
              // 更严格的检查：只有当有真正的swap数据时才显示组件
              // 检查是否包含真正的swap相关信息，而不是仅仅因为responseData存在
              const hasValidSwapEntities = message.swapEntities && 
                                         message.swapEntities.fromToken && 
                                         message.swapEntities.toToken && 
                                         message.swapEntities.amount;
              
              const hasRealSwapData = !!(message.quote || 
                                       hasValidSwapEntities ||
                                       message.responseData?.data?.quote ||
                                       message.responseData?.data?.swapEntities);
              
              // 对于stake intent，如果有quote数据，应该显示NewSwap组件
              const isStakeIntent = message.responseData?.data?.intent === 'stake';
              
              const isSwapInitiation = message.role === 'assistant' && (hasRealSwapData || (isStakeIntent && message.quote)) && !isBridgeOperation && !isStakingOperation && !isMarketOperation && !isTokenCreationOperation;
              
              // 恢复swap组件显示，但使用更严格的判断
              const shouldShowSwapComponent = true;
              const shouldShowBridgeComponent = true;
              const shouldShowStakingComponent = true;
              const shouldShowMarketComponent = true;

              console.log('[ChatIdConversation] Operation analysis:', {
                isBridgeOperation,
                isStakingOperation,
                isMarketOperation,
                isSwapInitiation,
                messageRole: message.role,
                hasSwapData,
                hasRealSwapData,
                hasValidSwapEntities,
                hasSwapError,
                hasQuote: !!message.quote,
                hasResponseDataQuote: !!message.responseData?.quote,
                hasResultQuote: !!message.responseData?.result?.quote?.value,
                hasSwapEntities: !!message.swapEntities,
                swapEntitiesDetails: message.swapEntities,
                hasError: !!message.responseData?.error,
                responseDataSuccess: message.responseData?.success,
                responseDataError: message.responseData?.error,
                responseDataKeys: message.responseData ? Object.keys(message.responseData) : [],
                responseDataData: message.responseData?.data,
                quoteInputLogo: message.quote?.inputMintLogo,
                quoteOutputLogo: message.quote?.outputMintLogo,
                content: message.content,
                fullResponseData: message.responseData
              });

              return (
                <div key={index} className="flex flex-col">
                  {/* Render Thoughts and NewBridge if this is the bridge initiation reply */}
                  {isBridgeOperation && shouldShowBridgeComponent && (
                    <div className="bridge-thoughts-wrapper md:ml-[76px] flex justify-center md:justify-start">
                      <div className="w-full max-w-[480px]">
                        <Thoughts thoughts={message.thoughts || []} />
                        <NewBridge 
                          responseData={message.responseData}
                          quote={message.responseData?.quote}
                          thoughts={message.thoughts}
                          onTransactionSuccess={handleTransactionSuccess}
                        />
                      </div>
                    </div>
                  )}

                  {/* Render StakingYield if this is the staking initiation reply */}
                  {isStakingOperation && shouldShowStakingComponent && (() => {
                    console.log('🌾 Rendering StakingYield component with:', {
                      responseData: message.responseData,
                      quote: message.responseData?.quote,
                      hasProtocols: !!message.responseData?.quote?.protocols
                    });
                    return (
                      <div className="staking-thoughts-wrapper md:ml-[76px] flex justify-center md:justify-start">
                        <div className="w-full max-w-[480px]">
                          <StakingYield 
                            responseData={message.responseData}
                            quote={message.responseData?.quote}
                            onProtocolSelect={handleProtocolSelect}
                          />
                        </div>
                      </div>
                    );
                  })()}

                  {/* Render Market if this is the market data reply */}
                  {isMarketOperation && shouldShowMarketComponent && (() => {
                    console.log('📊 Rendering Market component with:', {
                      responseData: message.responseData,
                      intent: message.responseData?.data?.intent
                    });
                    return (
                      <div className="market-thoughts-wrapper md:ml-[76px] flex justify-center md:justify-start">
                        <div className="w-full max-w-[480px]">
                          <Market 
                            responseData={message.responseData}
                          />
                        </div>
                      </div>
                    );
                  })()}

                  {/* Render TokenCreation if this is the token creation reply */}
                  {isTokenCreationOperation && (() => {
                    console.log('🪙 Rendering TokenCreation component with:', {
                      responseData: message.responseData,
                      intent: message.responseData?.data?.intent,
                      mintKeypair: message.mintKeypair
                    });
                    return (
                      <div className="token-creation-thoughts-wrapper md:ml-[76px] flex justify-center md:justify-start">
                        <div className="w-full max-w-[480px]">
                          <TokenCreation 
                            responseData={{
                              ...message.responseData,
                              mintKeypair: message.mintKeypair // 传递mintKeypair
                            }}
                            onTransactionSuccess={handleTokenCreationSuccess}
                          />
                        </div>
                      </div>
                    );
                  })()}

                  {/* Render Thoughts and NewSwap if this is the swap initiation reply */}
                  {isSwapInitiation && shouldShowSwapComponent && (() => {
                    // 检查是否 X402 已执行（通过 thoughts 中是否有 swap 执行步骤）
                    const thoughts = message.thoughts || [];
                    const hasSwapExecution = thoughts.some(t =>
                      t.toLowerCase().includes('swap execution') ||
                      t.toLowerCase().includes('execution failed') ||
                      t.toLowerCase().includes('confirming swap')
                    );

                    console.log('[ChatIdConversation] X402 check:', {
                      hasSwapExecution,
                      thoughts: thoughts.join(', ')
                    });

                    // 如果 X402 已执行（后端已经尝试完成交易），不显示 NewSwap 组件
                    if (hasSwapExecution) {
                      return (
                        <div className="swap-thoughts-wrapper md:ml-[76px] flex justify-center md:justify-start">
                          <div className="w-full max-w-[480px]">
                            <Thoughts thoughts={message.thoughts || []} />
                            <div className="bg-gray-800 rounded-lg p-4 mt-2">
                              <p className="text-sm text-gray-300">
                                X402 Auto-payment: {message.responseData?.success === false ? 'Transaction failed' : 'Transaction was processed automatically'}
                              </p>
                              {message.responseData?.error && (
                                <p className="text-sm text-red-400 mt-2">
                                  Error: {message.responseData.error}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // 否则显示 NewSwap 组件供用户确认
                    return (
                    <div className="swap-thoughts-wrapper md:ml-[76px] flex justify-center md:justify-start">
                      <div className="w-full max-w-[480px]">
                        <Thoughts thoughts={message.thoughts || []} />
                        {message.swapEntities ? (
                          (() => {
                            console.log('[ChatIdConversation] swapEntities:', message.swapEntities);
                            console.log('[ChatIdConversation] quote:', message.quote);
                            console.log('[ChatIdConversation] fromToken:', message.swapEntities.fromToken);
                            console.log('[ChatIdConversation] toToken:', message.swapEntities.toToken);
                            console.log('[ChatIdConversation] amount:', message.swapEntities.amount);
                            console.log('[ChatIdConversation] amount type:', typeof message.swapEntities.amount);
                            console.log('[ChatIdConversation] amount stringified:', String(message.swapEntities.amount));
                            
                            // 从 quote 中获取正确的 token 地址
                            const fromTokenAddress = message.quote?.inputMint || '';
                            const toTokenAddress = message.quote?.outputMint || '';
                            
                            console.log('[ChatIdConversation] fromTokenAddress:', fromTokenAddress);
                            console.log('[ChatIdConversation] toTokenAddress:', toTokenAddress);
                            console.log('[ChatIdConversation] quote.inputMint:', message.quote?.inputMint);
                            console.log('[ChatIdConversation] quote.outputMint:', message.quote?.outputMint);
                            console.log('[ChatIdConversation] quote structure:', {
                              hasQuote: !!message.quote,
                              inputMint: message.quote?.inputMint,
                              outputMint: message.quote?.outputMint,
                              inputMintLogo: message.quote?.inputMintLogo,
                              outputMintLogo: message.quote?.outputMintLogo
                            });
                            
                            // 使用消息ID作为key来存储token数据
                            const messageKey = message.id;
                            const tokenData = messageKey ? tokenDataMap[messageKey] : undefined;
                            
                            if (!tokenData) {
                              console.warn('[ChatIdConversation] 无法创建token数据，使用基本NewSwap');
                              return (
                                <NewSwap 
                                  responseData={message.responseData}
                                  quote={message.quote}
                                  onTransactionSuccess={handleTransactionSuccess}
                                />
                              );
                            }
                            
                            return (
                              <NewSwap
                                fromToken={tokenData.fromToken}
                                toToken={tokenData.toToken}
                                fromAmount={tokenData.fromAmount}
                                quote={message.quote}
                                responseData={message.responseData}
                                onTransactionSuccess={handleTransactionSuccess}
                              />
                            );
                          })()
                        ) : (
                          <NewSwap
                            responseData={message.responseData}
                            quote={message.quote}
                            onTransactionSuccess={handleTransactionSuccess}
                          />
                        )}
                        </div>
                      </div>
                    );
                  })()}
                  
                  {/* Render transaction status card if this is a transaction success message */}
                  {message.transactionStatus && (
                    <div className="md:ml-[76px] mb-4 flex justify-center md:justify-start">
                      <div className="rounded-xl border border-[#52525b] bg-[#27272a] shadow-lg mt-4 max-w-[480px] mb-3 w-full overflow-hidden">
                        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-b border-[#52525b]">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-400">
                                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                  <path d="m9 11 3 3L22 4"></path>
                                </svg>
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-[#e0e0e6]">Transaction Confirmed</h3>
                              <p className="text-sm text-[#a1a1aa]">Your swap was successful</p>
                        </div>
                        </div>
                          <div className="inline-flex items-center rounded-full bg-green-500/20 px-3 py-1 text-xs font-medium text-green-400 border border-green-500/30">
                            <span className="hidden md:block">Success</span>
                            <span className="block md:hidden">✓</span>
                      </div>
                    </div>
                        <div className="p-4">
                          <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-[#a1a1aa]">Transaction ID:</span>
                              <span className="text-[#e0e0e6] font-mono text-xs">
                                {message.transactionStatus.txid.slice(0, 8)}...{message.transactionStatus.txid.slice(-8)}
                              </span>
                            </div>
                          <a 
                            href={`https://solscan.io/tx/${message.transactionStatus.txid}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                              className="inline-flex items-center justify-center gap-2 w-full rounded-lg bg-[#3f3f46] hover:bg-[#52525b] transition-colors duration-200 text-sm font-medium text-[#e0e0e6] h-10 px-4 py-2 border border-[#52525b] hover:border-[#71717a]"
                          >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M15 3h6v6"></path>
                              <path d="M10 14 21 3"></path>
                              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                            </svg>
                              <span>View on Solscan</span>
                          </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div
                    className={`flex w-full px-2 py-3 sm:py-4 max-w-full last:border-b-0 h-fit flex-col gap-2 md:flex-row md:gap-4 md:px-4 border-b border-[#3f3f46]`}
                  >
                    <div className="flex items-center md:items-start gap-2 md:gap-4">
                      <div className="hidden md:flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#3f3f46] border border-[#52525b]">
                        {message.role === 'user' ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 md:w-6 md:h-6 text-[#a1a1aa]">
                            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                          </svg>
                        ) : (
                          <img 
                            src="/favicon.png" 
                            alt="MiraiX Logo" 
                            className="w-8 h-8 rounded-lg"
                            width={32}
                            height={32}
                          />
                        )}
                      </div>
                      <p className="text-sm font-semibold md:hidden text-[#e0e0e6]">
                        {message.role === 'user' ? 'You' : 'MiraiX'}
                      </p>
                    </div>
                    <div className="pt-2 w-full max-w-full md:flex-1 md:w-0 overflow-hidden flex flex-col gap-2">
                      <div className="prose break-words prose-p:leading-relaxed prose-pre:p-0 flex flex-col gap-4">
                        <p className="text-sm md:text-base whitespace-pre-wrap text-[#e0e0e6]">{message.content}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {/* 显示流式响应 */}
            {isStreaming && (
              <div className="flex flex-col">
                <div className="flex w-full px-2 py-3 sm:py-4 max-w-full h-fit flex-col gap-2 md:flex-row md:gap-4 md:px-4 border-b border-[#3f3f46]">
                  <div className="flex items-center md:items-start gap-2 md:gap-4">
                    <div className="hidden md:flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#3f3f46] border border-[#52525b]">
                      <img 
                        src="/favicon.png" 
                        alt="MiraiX Logo" 
                        className="w-8 h-8 rounded-lg"
                        width={32}
                        height={32}
                      />
                    </div>
                    <p className="text-sm font-semibold md:hidden text-[#e0e0e6]">
                      MiraiX
                    </p>
                  </div>
                  <div className="pt-2 w-full max-w-full md:flex-1 md:w-0 overflow-hidden flex flex-col gap-2">
                    <div className="prose break-words prose-p:leading-relaxed prose-pre:p-0 flex flex-col gap-4">
                      <p className="text-sm md:text-base whitespace-pre-wrap text-[#e0e0e6]">{streamingContent || "..."}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {isLoading && !isStreaming && (
              <div className="flex flex-col">
                <div className="flex w-full px-2 py-3 sm:py-4 max-w-full h-fit flex-col gap-2 md:flex-row md:gap-4 md:px-4 border-b border-[#3f3f46]">
                  <div className="flex items-center md:items-start gap-2 md:gap-4">
                    <div className="hidden md:flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#3f3f46] border border-[#52525b]">
                      <img 
                        src="/favicon.png" 
                        alt="MiraiX Logo" 
                        className="w-8 h-8 rounded-lg"
                        width={32}
                        height={32}
                      />
                    </div>
                    <p className="text-sm font-semibold md:hidden text-[#e0e0e6]">
                      MiraiX
                    </p>
                  </div>
                  <div className="pt-2 w-full max-w-full md:flex-1 md:w-0 overflow-hidden flex flex-col gap-2">
                    <div className="prose break-words prose-p:leading-relaxed prose-pre:p-0 flex flex-col gap-4">
                      <p className="text-sm md:text-base whitespace-pre-wrap text-[#e0e0e6]">Miraix is thinking{thinkingDots}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="bottom-0 inset-x-0 z-30 bg-zinc-800 border-t border-gray-600 p-4" style={{ height: '130px' }}>
        <div className="flex items-center justify-between mb-2 w-full lg:w-[100%] mx-auto">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <div className="relative">
              <input
                type="checkbox"
                checked={enableX402Payment}
                onChange={(e) => setEnableX402Payment(e.target.checked)}
                className="sr-only"
              />
              <div className={`w-11 h-6 rounded-full transition-colors duration-200 ${enableX402Payment ? 'bg-blue-500' : 'bg-gray-600'}`}>
                <div className={`absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full transition-transform duration-200 ${enableX402Payment ? 'translate-x-5' : ''}`}></div>
              </div>
            </div>
            <span className="text-sm text-gray-300">Auto-Confirm</span>
            <span className="text-xs text-gray-500 ml-2">
              {enableX402Payment ? '(Auto sign & broadcast)' : '(Manual confirm)'}
            </span>
          </label>
        </div>
        <div className="relative flex items-center w-full lg:w-[100%] mx-auto">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder="Ask MiraiX anything..."
            className="flex-1 resize-none bg-transparent px-4 py-3 text-sm placeholder:text-gray-400 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none border border-gray-600 rounded-xl"
            style={{ 
              minHeight: '50px',
              lineHeight: '1.5',
              fontSize: '16px',
              color: '#e0e0e6'
            }}
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="ml-3 inline-flex items-center justify-center rounded-lg text-sm font-semibold border-0 bg-gradient-to-r from-blue-500 to-cyan-400 text-white hover:from-blue-600 hover:to-cyan-500 h-10 w-10 shadow-sm hover:shadow-md transition-all duration-150 active:scale-95 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 disabled:transform-none"
            title={`isLoading: ${isLoading}, input: "${input}", input.trim(): "${input.trim()}"`}
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m22 2-7 20-4-9-9-4 20-7z"/>
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
