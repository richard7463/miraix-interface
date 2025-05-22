'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { ChatMessage, Persona, Chat, DefaultPersonas } from './interface'
import { API_ENDPOINTS } from '@/lib/config'
import { useChatStore } from '@/store/chatStore'
import Thoughts from './Thoughts'
import NewSwap from '@/components/DeFi/NewSwap'

interface ChatIdConversationProps {
  chatId: string;
  hideActions?: boolean;
}

interface ExtendedChatMessage extends ChatMessage {
  thoughts?: string[];
}

export default function ChatIdConversation({ chatId, hideActions = false }: ChatIdConversationProps) {
  const router = useRouter()
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
        const response = await fetch(API_ENDPOINTS.CHAT_MESSAGES(chatId), {
          headers: {
            'Content-Type': 'application/json',
            'signature': '0x1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890',
            'message': `Get messages for chat ${chatId}`,
            'address': '0x1234567890123456789012345678901234567890'
          }
        })
        
        if (!response.ok) {
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

      // 调用真实 API 获取回复
      getAIResponse([userMessage])
        .then((reply) => {
          console.log('[ChatIdConversation] Received API reply:', reply)
          
          // 更新消息列表
          setMessages(prev => {
            const newMessages = [...prev, reply]
            console.log('[ChatIdConversation] Updated messages:', newMessages)
            saveMessages(chatId, newMessages).catch((error: Error) => {
              console.error('[ChatIdConversation] Failed to save messages to server:', error)
              toast.error('Failed to save messages to server')
            })
            return newMessages
          })
          
          
          // 更新 store 中的消息
          storeSetMessages(chatId, [...messages, userMessage, reply])
          console.log('[ChatIdConversation] Updated store messages')
        })
        .catch((error) => {
          console.error('[ChatIdConversation] Error getting AI response:', error)
          toast.error('Failed to get AI response')
        })

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
    // 模拟 API 延迟
    await new Promise(resolve => setTimeout(resolve, 500));

    const mockData = {
      success: true,
      result: {
        _lock: "Confirmation",
        phase: "waitForConfirm",
        status: "pending",
        userInput: message,
        operationType: "swap",
        tokenIn: {
          value: "So11111111111111111111111111111111111111112"
        },
        tokenOut: {
          value: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
        },
        stop: {
          value: false
        },
        amount: 0.001,
        aiResponse: {
          value: "Great! I've found a good swap route for your 0.001 SOL. Would you like to proceed with the swap?"
        },
        executedSteps: {
          value: []
        },
        balance: {
          value: 0.0207276
        },
        quote: {
          value: {
            inputMint: "So11111111111111111111111111111111111111112",
            inAmount: "1000000",
            outputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
            outAmount: "171674",
            otherAmountThreshold: "170816",
            swapMode: "ExactIn",
            slippageBps: 50,
            platformFee: null,
            priceImpactPct: "0",
            routePlan: [
              {
                swapInfo: {
                  ammKey: "5guD4Uz462GT4Y4gEuqyGsHZ59JGxFN4a3rF6KWguMcJ",
                  label: "SolFi",
                  inputMint: "So11111111111111111111111111111111111111112",
                  outputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
                  inAmount: "1000000",
                  outAmount: "171674",
                  feeAmount: "0",
                  feeMint: "So11111111111111111111111111111111111111112"
                },
                percent: 100
              }
            ],
            contextSlot: 340793891,
            timeTaken: 0.00171872,
            swapUsdValue: "0.171519581678834008511590633",
            simplerRouteUsed: false
          }
        },
        transaction: {
          value: ""
        },
        logs: {
          value: [
            "[parseInput] Starting...",
            "[balanceCheck] Verifying user's balance...",
            "Current Balance: 0.0207276 SOL, Amount to swap: 0.001 SOL",
            "[getQuote] Starting...",
            "Fetching quote for 1000000 So11111111111111111111111111111111111111112 → EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
          ]
        },
        thoughts: {
          value: [
            "Information Gathering",
            "Analyzing user request",
            "Detecting operation type",
            "Balance Check",
            "Retrieving wallet balance",
            "Validating transaction amount",
            "Balance check passed",
            "Ready for quote",
            "Quote Generation",
            "Calculating best swap route",
            "Validating slippage",
            "Quote generated successfully",
            "Waiting for user confirmation"
          ]
        },
        walletAddress: {
          value: "78bzmytEFifLJJzS6sLS79pqvrw52NY8JTagqTm27gNR"
        },
        waitingFor: "confirmation"
      },
      threadId: "thread_1747555687227_phqtg13w2wp"
    };

    return {
      role: 'assistant' as const,
      content: mockData.result.aiResponse.value,
      timestamp: new Date().toISOString(),
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      thoughts: mockData.result.thoughts.value
    };
  };

  const getAIResponse = async (messages: ExtendedChatMessage[]): Promise<ExtendedChatMessage> => {
    try {
      // 使用模拟响应
      return await mockAIResponse(messages[messages.length - 1].content);

      // 注释掉真实 API 调用，等需要时再启用
      /*
      const response = await fetch('https://langgraph-defai.vercel.app/api/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          message: messages[messages.length - 1].content,
          timestamp: new Date().toISOString()
        }),
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      return {
        role: 'assistant' as const,
        content: data.response || data.message,
        timestamp: new Date().toISOString(),
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      };
      */
    } catch (error) {
      console.error('[ChatIdConversation] Error getting AI response:', error);
      throw error;
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    try {
      setIsLoading(true)
      const userMessage: ExtendedChatMessage = {
        role: 'user',
        content: input.trim(),
        timestamp: new Date().toISOString(),
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }

      console.log('[ChatIdConversation] handleSend - Starting:', {
        input: input.trim(),
        currentChat,
        chatId,
        isNew: currentChat?.isNew,
        chatListLength: chatList.length,
        existingMessages: getMessages(chatId)
      })

      if (!currentChat) {
        throw new Error('No current chat found')
      }

      // 添加用户消息到消息列表
      setMessages(prev => [...prev, userMessage])
      setInput('')

      // 如果是新建的聊天，先创建聊天会话
      if (currentChat.isNew) {
        console.log('[ChatIdConversation] Creating new chat session for first message:', {
          chatId,
          currentChat,
          isNew: currentChat.isNew
        })
        const createResponse = await fetch(API_ENDPOINTS.CREATE_CHAT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'signature': '0x1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890',
            'message': `Create chat ${chatId}`,
            'address': '0x1234567890123456789012345678901234567890'
          },
          body: JSON.stringify({
            chatId: chatId,
            persona: currentChat?.persona,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })
        })

        if (!createResponse.ok) {
          throw new Error('Failed to create chat session')
        }

        // 更新聊天状态
        console.log('[ChatIdConversation] Updating chat status:', {
          chatId,
          isNew: false
        })
        updateChatStatus(chatId, false)
      }

      // 调用真实 API 获取回复
      const replyMessage = await getAIResponse([...messages, userMessage])

      // 更新消息列表
      setMessages(prev => {
        const newMessages = [...prev, replyMessage]
        console.log('[ChatIdConversation] Saving new messages:', {
          messages: newMessages,
          currentChat,
          chatId
        })
        // Save to local store
        storeSetMessages(chatId, newMessages)
        // Save to server
        saveMessages(chatId, newMessages).catch((error: Error) => {
          console.error('[ChatIdConversation] Failed to save messages to server:', error)
          toast.error('Failed to save messages to server')
        })
        return newMessages
      })

    } catch (error) {
      console.error('[ChatIdConversation] Error sending message:', error)
      toast.error('Failed to send message')
    } finally {
      setIsLoading(false)
    }
  }

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
            {messages.map((message, index) => (
              <div key={index} className="flex flex-col">
                {message.role === 'assistant' && message.thoughts && (
                  <>
                    <Thoughts thoughts={message.thoughts} />
                    <NewSwap />
                  </>
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
                      <p className="text-sm md:text-base whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex flex-col">
                <Thoughts thoughts={[
                  "Analyzing your request...",
                  "Processing your swap request on Solana...",
                  "Validating input and output tokens..."
                ]} />
                <NewSwap />
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
                    <p className="text-sm font-semibold md:hidden text-gray-900">MiraiX</p>
                  </div>
                  <div className="pt-2 w-full max-w-full md:flex-1 md:w-0 overflow-hidden flex flex-col gap-2">
                    <div className="prose break-words prose-p:leading-relaxed prose-pre:p-0 flex flex-col gap-4">
                      <p className="text-sm md:text-base text-gray-500">MiraiX is thinking...</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <div className="flex flex-col gap-1 w-full p-2 mt-auto absolute bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
        <form className="w-full rounded-md flex flex-col overflow-hidden transition-colors duration-200 ease-in-out border border-transparent shadow-none bg-gray-100 dark:bg-gray-800 focus-within:border-blue-500">
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
            className="w-full max-h-60 resize-none bg-transparent px-3 py-2 text-sm placeholder:text-gray-600 dark:placeholder:text-gray-400 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none"
            style={{ height: '36px !important' }}
            disabled={isLoading}
          />
        </form>
      </div>
    </div>
  )
}
