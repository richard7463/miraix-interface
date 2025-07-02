'use client'
import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { ChatMessage, Persona, Chat, DefaultPersonas } from './interface'
import { API_ENDPOINTS } from '@/lib/config'
import { AI_CONFIG } from '@/lib/ai-config'
import { useChatStore } from '@/store/chatStore'
import { useSolanaWallets } from '@privy-io/react-auth/solana'
import Thoughts from './Thoughts'
import NewSwap from '@/components/DeFi/NewSwap'

interface ChatIdConversationProps {
  chatId: string;
  hideActions?: boolean;
}

interface ExtendedChatMessage extends ChatMessage {
  thoughts?: string[];
  swapEntities?: any;
  quote?: any;
  responseData?: any;
  transactionStatus?: {
    txid: string;
    status: string;
    fromToken: any;
    toToken: any;
    fromAmount: string;
    toAmount: string;
  };
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
    saveMessages
  } = useChatStore()

  const [messages, setMessages] = useState<ExtendedChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [streamingContent, setStreamingContent] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [thinkingDots, setThinkingDots] = useState<string>('');

  // 获取 Solana 钱包地址
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
          throw new Error('无法连接到服务器，请检查服务器是否正在运行');
        }
        
        if (!response || !response.ok) {
          throw new Error('Failed to load messages')
        }
        
        const data = await response.json()
        console.log('[ChatIdConversation] Received messages:', {
          chatId,
          messages: data.messages
        })

        // 如果是新聊天，不要覆盖已有的消息
        if (!currentChat?.isNew) {
          setMessages(data.messages || [])
          storeSetMessages(chatId, data.messages || [])
        }
      } catch (error) {
        console.error('[ChatIdConversation] Error loading messages:', error)
        toast.error('Failed to load messages')
      } finally {
        setIsInitialLoading(false)
      }
    }

    if (currentChat?.isNew) {
      console.log('[ChatIdConversation] currentChat isNew:', {
        chatId,
        currentChat,
        isNew: currentChat?.isNew
      })

      // 创建用户消息
      const userMessage: ExtendedChatMessage = {
        role: 'user',
        content: getMessages(chatId)[0].content,
        timestamp: new Date().toISOString(),
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }

      console.log('[ChatIdConversation] Created user message:', userMessage)

      // 先添加用户消息
      setMessages(prev => [...prev, userMessage])

      // 显示 loading 状态
      setIsLoading(true)

      // 调用真实 API 获取回复
      const fetchReply = async () => {
        try {
          const reply = await getAIResponse([userMessage]);
          console.log('[ChatIdConversation] Received API reply:', reply)
          
          // 更新消息列表
          setMessages(prev => {
            const newMessages = [...prev, reply]
            console.log('[ChatIdConversation] Updated messages:', newMessages)
            
            // 获取钱包地址并转换为正确的格式
            const walletAddress = getWalletAddress()
            console.log('[ChatIdConversation] Using wallet address for saveMessages:', walletAddress)
            
            saveMessages(chatId, newMessages, walletAddress).catch((error: Error) => {
              console.error('[ChatIdConversation] Failed to save messages to server:', error)
              toast.error('Failed to save messages to server')
            })
            return newMessages
          })
          
          // 更新 store 中的消息
          storeSetMessages(chatId, [...messages, userMessage, reply])
          console.log('[ChatIdConversation] Updated store messages')
        } catch (error) {
          console.error('[ChatIdConversation] Error getting AI response:', error)
          toast.error('Failed to get AI response')
        } finally {
          setIsLoading(false)
        }
      };

      fetchReply();

      // 设置 isNew 为 false
      if (currentChat) {
        currentChat.isNew = false
      }
    } else {
      // 如果不是新聊天，加载消息
      loadMessages()
    }

    setIsInitialLoading(false)
  }, [currentChat, chatId, chatList, setCurrentChat, setChatList])

  // Scroll to bottom when messages change
  useEffect(() => {
    console.log('[ChatIdConversation] useEffect - messages change:', {
      messages
    })
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const mockAIResponse = async (message: string): Promise<ExtendedChatMessage> => {
    try {
      const walletAddress = getWalletAddress();
      console.log('[mockAIResponse] Sending request to API with message:', message);
      console.log('[mockAIResponse] Using wallet address:', walletAddress);
      
      let response;
      try {
        response = await fetch('http://localhost:3009/api/chat-new', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'signature': '0x1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890',
            'message': `Mock AI response for: ${message}`,
            'address': walletAddress
          },
          body: JSON.stringify({
            message: message,
            walletAddress: walletAddress
          })
        });
      } catch (fetchError) {
        console.error('[mockAIResponse] Fetch error:', fetchError);
        throw new Error('无法连接到服务器，请检查服务器是否正在运行');
      }

      if (!response || !response.ok) {
        const errorText = await response?.text() || 'Unknown error';
        console.error(`[mockAIResponse] API request failed with status ${response?.status}:`, errorText);
        throw new Error(`API request failed with status ${response?.status}: ${errorText}`);
      }

      const responseData = await response.json();
      console.log('[mockAIResponse] Received response:', responseData);
      
      // Return the response in the expected format
      return {
        role: 'assistant' as const,
        content: responseData.message || 'No response from AI',
        timestamp: new Date().toISOString(),
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        thoughts: responseData.thoughts || [],
        swapEntities: responseData.data?.entities || null,
        responseData: responseData
      };
    } catch (error) {
      console.error('Error calling AI API:', error);
      // Return a fallback response in case of error
      return {
        role: 'assistant' as const,
        content: '抱歉，我暂时无法连接到服务器。请检查服务器是否正在运行，或者稍后再试。',
        timestamp: new Date().toISOString(),
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        thoughts: ['服务器连接失败'],
        swapEntities: null,
        responseData: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  };

  const getAIResponse = async (messages: ExtendedChatMessage[]): Promise<ExtendedChatMessage> => {
    try {
      // 使用与 mockAIResponse 相同的本地 API 端点
      const lastMessage = messages[messages.length - 1]?.content || '';
      const walletAddress = getWalletAddress();
      console.log('[getAIResponse] Sending request to local API with message:', lastMessage);
      console.log('[getAIResponse] Using wallet address:', walletAddress);
      
      let response;
      try {
        response = await fetch('http://localhost:3009/api/chat-new', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'signature': '0x1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890',
            'message': `AI response for: ${lastMessage}`,
            'address': walletAddress
          },
          body: JSON.stringify({
            message: lastMessage,
            walletAddress: walletAddress
          })
        });
      } catch (fetchError) {
        console.error('[getAIResponse] Fetch error:', fetchError);
        throw new Error('无法连接到服务器，请检查服务器是否正在运行');
      }

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
        responseData: responseData
      };
    } catch (error) {
      console.error('[ChatIdConversation] Error getting AI response:', error);
      setIsStreaming(false);
      
      // 返回一个简单的错误响应，而不是调用可能失败的 mockAIResponse
      return {
        role: 'assistant' as const,
        content: '抱歉，我暂时无法连接到服务器。请检查服务器是否正在运行，或者稍后再试。',
        timestamp: new Date().toISOString(),
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        thoughts: ['服务器连接失败'],
        quote: null,
        swapEntities: null,
        responseData: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    try {
      setIsLoading(true);
      setError(null); // 清除之前的错误

      const userMessage: ExtendedChatMessage = {
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
      if (currentChat.isNew) {
        console.log('[ChatIdConversation] Creating new chat session for first message:', {
          chatId,
          currentChat,
          isNew: currentChat.isNew
        });
        try {
          console.log('[ChatIdConversation] Sending chat creation request to local API:', {
            chatId,
            persona: currentChat?.persona
          });
          
          let createResponse;
          try {
            createResponse = await fetch('http://localhost:3009/api/chat-new', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'signature': '0x1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890',
                'message': `Create new chat with ID: ${chatId}`,
                'address': getWalletAddress()
              },
              body: JSON.stringify({
                message: `Create new chat with ID: ${chatId}`,
                metadata: {
                  chatId,
                  persona: currentChat?.persona,
                  createdAt: new Date().toISOString()
                },
                walletAddress: getWalletAddress()
              })
            });
          } catch (fetchError) {
            console.error('[ChatIdConversation] Fetch error creating chat session:', fetchError);
            throw new Error('无法连接到服务器，请检查服务器是否正在运行');
          }
          
          if (createResponse && createResponse.ok) {
            const responseData = await createResponse.json();
            console.log('[ChatIdConversation] Chat creation response:', responseData);
          } else {
            console.warn('[ChatIdConversation] Failed to create chat session, but continuing...');
          }

          // 更新聊天状态
          console.log('[ChatIdConversation] Updating chat status:', {
            chatId,
            isNew: false
          });
          updateChatStatus(chatId, false);
        } catch (err) {
          console.error('[ChatIdConversation] Error creating chat session:', err);
          toast.error('Failed to create chat session, but will try to continue');
          // 继续处理消息，即使创建会话失败
        }
      }

      try {
        // 调用API获取回复
        const replyMessage = await getAIResponse([...messages, userMessage]);

        // 更新消息列表
        setMessages(prev => {
          const newMessages = [...prev, replyMessage];
          console.log('[ChatIdConversation] Saving new messages:', {
            messages: newMessages,
            currentChat,
            chatId
          });
          // Save to local store
          storeSetMessages(chatId, newMessages);
          // Save to server
          saveMessages(chatId, newMessages, getWalletAddress()).catch((error: Error) => {
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
    const transactionStatusMessage: ExtendedChatMessage = {
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

  if (isInitialLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            No messages yet. Start a conversation!
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              console.log(`[ChatIdConversation] Processing message ${index}:`, {
                role: message.role,
                content: message.content,
                hasQuote: !!message.quote,
                hasResponseData: !!message.responseData,
                responseDataSuccess: message.responseData?.success,
                responseDataError: message.responseData?.error
              });

              // Check if this is the special swap initiation reply
              const isSwapInitiation =
                message.role === 'assistant' &&
                (message.quote || 
                 message.responseData?.quote || 
                 message.responseData?.result?.quote?.value ||
                 message.swapEntities ||
                 message.responseData?.error);

              console.log('[ChatIdConversation] isSwapInitiation:', {
                isSwapInitiation,
                messageRole: message.role,
                hasQuote: !!message.quote,
                hasResponseDataQuote: !!message.responseData?.quote,
                hasResultQuote: !!message.responseData?.result?.quote?.value,
                hasSwapEntities: !!message.swapEntities,
                hasError: !!message.responseData?.error,
                quoteInputLogo: message.quote?.inputMintLogo,
                quoteOutputLogo: message.quote?.outputMintLogo,
                content: message.content,
                responseData: message.responseData
              });

              return (
                <div key={index} className="flex flex-col">
                  {/* Render Thoughts and NewSwap if this is the swap initiation reply */}
                  {isSwapInitiation && (
                    <div className="swap-thoughts-wrapper ml-[76px]">
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
                          
                          // 根据 token 类型设置正确的 decimals
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
                              case 'MNGO':
                                return 6;
                              case 'LIKE':
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
                              default:
                                return 9; // 默认值
                            }
                          };
                          
                          console.log('[ChatIdConversation] fromTokenAddress:', fromTokenAddress);
                          console.log('[ChatIdConversation] toTokenAddress:', toTokenAddress);
                          
                          return (
                        <NewSwap
                          fromToken={{
                            symbol: message.swapEntities.fromToken,
                            name: message.swapEntities.fromToken,
                            logo: message.quote?.inputMintLogo || '',
                            chain: message.swapEntities.network,
                            chainLogo: '',
                            address: fromTokenAddress,
                            balance: 0,
                            price: 0,
                            decimals: getTokenDecimals(message.swapEntities.fromToken)
                          }}
                          toToken={{
                            symbol: message.swapEntities.toToken,
                            name: message.swapEntities.toToken,
                            logo: message.quote?.outputMintLogo || '',
                            chain: message.swapEntities.network,
                            chainLogo: '',
                            address: toTokenAddress,
                            balance: 0,
                            price: 0,
                            decimals: getTokenDecimals(message.swapEntities.toToken)
                          }}
                          fromAmount={String(message.swapEntities.amount)}
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
                  )}
                  
                  {/* Render transaction status card if this is a transaction success message */}
                  {message.transactionStatus && (
                    <div className="ml-[76px] mb-4">
                      <div className="rounded-lg border bg-card text-card-foreground shadow-sm mt-4 max-w-[480px] mb-3 w-full">
                        <div className="flex flex-col space-y-1.5 p-6">
                          <h3 className="text-2xl font-semibold leading-none tracking-tight flex items-center gap-2">
                            Transaction Status 
                            <div className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground bg-green-500" style={{fontSize: '0.75em', padding: '0.25em 0.75em'}}>
                              <span className="hidden md:block">Confirmed!</span>
                              <span className="block md:hidden">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-check-big h-4 w-4">
                                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                  <path d="m9 11 3 3L22 4"></path>
                                </svg>
                              </span>
                            </div>
                          </h3>
                        </div>
                        <div className="p-6 pt-0 flex flex-col gap-4">
                          <a 
                            href={`https://solscan.io/tx/${message.transactionStatus.txid}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 flex items-center gap-2 cursor-pointer"
                          >
                            <span className="hidden md:block">Check Status on Solscan Explorer</span>
                            <span className="block md:hidden">Check Status</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-external-link h-4 w-4">
                              <path d="M15 3h6v6"></path>
                              <path d="M10 14 21 3"></path>
                              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                            </svg>
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div
                    className={`flex w-full px-2 py-3 sm:py-4 max-w-full last:border-b-0 h-fit flex-col gap-2 md:flex-row md:gap-4 md:px-4 border-b border-gray-200`}
                  >
                    <div className="flex items-center md:items-start gap-2 md:gap-4">
                      <div className="hidden md:flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full bg-gray-100 border border-gray-200">
                        {message.role === 'user' ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 md:w-6 md:h-6 text-gray-600">
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
                      <p className="text-sm font-semibold md:hidden text-gray-900">
                        {message.role === 'user' ? 'You' : 'MiraiX'}
                      </p>
                    </div>
                    <div className="pt-2 w-full max-w-full md:flex-1 md:w-0 overflow-hidden flex flex-col gap-2">
                      <div className="prose break-words prose-p:leading-relaxed prose-pre:p-0 flex flex-col gap-4">
                        <div className="text-sm md:text-base whitespace-pre-line">
                          {message.content
                            // First process the swap command format if it exists
                            .replace(/'swap \[([^\]]+)\]\[([^\]]+)\] to \[([^\]]+)\]'/g, (_: string, amount: string, fromToken: string, toToken: string) => 
                              `<code class="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono">swap ${amount}${fromToken} to ${toToken}</code>`
                            )
                            // Then handle newlines
                            .replace(/\\n/g, '\n')
                            .split('\n')
                            .map((line: string, i: number, lines: string[]) => (
                              <div 
                                key={i} 
                                className="whitespace-pre-wrap"
                                dangerouslySetInnerHTML={{ __html: line }}
                              />
                            ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {/* 显示流式响应 */}
            {isStreaming && (
              <div className="flex flex-col">
                <div className="flex w-full px-2 py-3 sm:py-4 max-w-full h-fit flex-col gap-2 md:flex-row md:gap-4 md:px-4 border-b border-gray-200">
                  <div className="flex items-center md:items-start gap-2 md:gap-4">
                    <div className="hidden md:flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full bg-gray-100 border border-gray-200">
                      <img 
                        src="/favicon.png" 
                        alt="MiraiX Logo" 
                        className="w-8 h-8 rounded-lg"
                        width={32}
                        height={32}
                      />
                    </div>
                    <p className="text-sm font-semibold md:hidden text-gray-900">
                      MiraiX
                    </p>
                  </div>
                  <div className="pt-2 w-full max-w-full md:flex-1 md:w-0 overflow-hidden flex flex-col gap-2">
                    <div className="prose break-words prose-p:leading-relaxed prose-pre:p-0 flex flex-col gap-4">
                      <p className="text-sm md:text-base whitespace-pre-wrap">{streamingContent || "..."}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {isLoading && !isStreaming && (
              <div className="flex flex-col">
                <div className="flex w-full px-2 py-3 sm:py-4 max-w-full h-fit flex-col gap-2 md:flex-row md:gap-4 md:px-4 border-b border-gray-200">
                  <div className="flex items-center md:items-start gap-2 md:gap-4">
                    <div className="hidden md:flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full bg-gray-100 border border-gray-200">
                      <img 
                        src="/favicon.png" 
                        alt="MiraiX Logo" 
                        className="w-8 h-8 rounded-lg"
                        width={32}
                        height={32}
                      />
                    </div>
                    <p className="text-sm font-semibold md:hidden text-gray-900">
                      MiraiX
                    </p>
                  </div>
                  <div className="pt-2 w-full max-w-full md:flex-1 md:w-0 overflow-hidden flex flex-col gap-2">
                    <div className="prose break-words prose-p:leading-relaxed prose-pre:p-0 flex flex-col gap-4">
                      <p className="text-sm md:text-base whitespace-pre-wrap">Miraix is thinking{thinkingDots}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="flex flex-col gap-1 p-4 mt-auto absolute bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 fixed w-[82%]" style={{ position: 'fixed' }}>
        <form className="w-full rounded-xl flex flex-col overflow-hidden transition-colors duration-200 ease-in-out border border-gray-200 dark:border-gray-700 shadow-sm bg-gray-50 dark:bg-gray-800 focus-within:border-blue-500 focus-within:shadow-md">
          <div className="flex items-end gap-3 p-3">
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
              className="flex-1 max-h-32 resize-none bg-transparent px-0 py-0 text-sm placeholder:text-gray-500 dark:placeholder:text-gray-400 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none border-none"
              style={{ 
                height: 'auto', 
                minHeight: '24px',
                lineHeight: '1.5',
                fontSize: '14px'
              }}
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold border-0 bg-gradient-to-r from-blue-500 to-cyan-400 text-white hover:from-blue-600 hover:to-cyan-500 h-8 px-3 py-1.5 shadow-sm hover:shadow-md transition-all duration-150 active:scale-95 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 disabled:transform-none"
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
        </form>
      </div>
    </div>
  )
}
