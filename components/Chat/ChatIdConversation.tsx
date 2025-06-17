'use client'
import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { ChatMessage, Persona, Chat, DefaultPersonas } from './interface'
import { API_ENDPOINTS } from '@/lib/config'
import { AI_CONFIG } from '@/lib/ai-config'
import { useChatStore } from '@/store/chatStore'
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
  const [streamingContent, setStreamingContent] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [thinkingDots, setThinkingDots] = useState<string>('');

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

      // 显示 loading 状态
      setIsLoading(true)

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
          setIsLoading(false)
        })
        .catch((error) => {
          console.error('[ChatIdConversation] Error getting AI response:', error)
          toast.error('Failed to get AI response')
          setIsLoading(false)
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
    try {
      console.log('[mockAIResponse] Sending request to API with message:', message);
      const response = await fetch('http://localhost:3009/api/chat-new', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[mockAIResponse] API request failed with status ${response.status}:`, errorText);
        throw new Error(`API request failed with status ${response.status}: ${errorText}`);
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
        swapEntities: responseData.data?.entities || null
      };
    } catch (error) {
      console.error('Error calling AI API:', error);
      // Return a fallback response in case of error
      return {
        role: 'assistant' as const,
        content: 'Sorry, I encountered an error processing your request.',
        timestamp: new Date().toISOString(),
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        thoughts: ['Error occurred while processing the request'],
        swapEntities: null
      };
    }
  };

  const getAIResponse = async (messages: ExtendedChatMessage[]): Promise<ExtendedChatMessage> => {
    try {
      // 使用与 mockAIResponse 相同的本地 API 端点
      const lastMessage = messages[messages.length - 1]?.content || '';
      console.log('[getAIResponse] Sending request to local API with message:', lastMessage);
      
      const response = await fetch('http://localhost:3009/api/chat-new', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: lastMessage
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[getAIResponse] API request failed with status ${response.status}:`, errorText);
        throw new Error(`API request failed with status ${response.status}: ${errorText}`);
      }

      const responseData = await response.json();
      console.log('[getAIResponse] Received response:', responseData);
      
      // 特别输出 quote 信息
      if (responseData.quote) {
        console.log('[getAIResponse] Quote information:', {
          quote: responseData.quote,
          inputMintLogo: responseData.quote.inputMintLogo,
          outputMintLogo: responseData.quote.outputMintLogo
        });
      }
      
      return {
        role: 'assistant' as const,
        content: responseData.message || 'No response from AI',
        timestamp: new Date().toISOString(),
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        thoughts: responseData.thoughts || [],
        quote: responseData.quote || null,
        swapEntities: responseData.data?.entities || null
      };
    } catch (error) {
      console.error('[ChatIdConversation] Error getting AI response:', error);
      setIsStreaming(false);
      // 出错时使用备用的模拟响应
      return mockAIResponse(messages[messages.length - 1].content);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    try {
      setIsLoading(true)
      setError(null) // 清除之前的错误
      
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
        try {
          console.log('[ChatIdConversation] Sending chat creation request to local API:', {
            chatId,
            persona: currentChat?.persona
          });
          
          const createResponse = await fetch('http://localhost:3009/api/chat-new', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              message: `Create new chat with ID: ${chatId}`,
              metadata: {
                chatId,
                persona: currentChat?.persona,
                createdAt: new Date().toISOString()
              }
            })
          });
          
          const responseData = await createResponse.json();
          console.log('[ChatIdConversation] Chat creation response:', responseData);

          if (!createResponse.ok) {
            console.warn('[ChatIdConversation] Failed to create chat session, but continuing...');
          }

          // 更新聊天状态
          console.log('[ChatIdConversation] Updating chat status:', {
            chatId,
            isNew: false
          })
          updateChatStatus(chatId, false)
        } catch (err) {
          console.error('[ChatIdConversation] Error creating chat session:', err);
          toast.error('Failed to create chat session, but will try to continue');
          // 继续处理消息，即使创建会话失败
        }
      }

      try {
        // 调用API获取回复
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
      } catch (err) {
        console.error('[ChatIdConversation] Error getting AI response:', err);
        toast.error('Failed to get response. Please try again.');
        setError('Failed to get response. Please try again.');
      }

    } catch (error) {
      console.error('[ChatIdConversation] Error sending message:', error)
      toast.error('Failed to send message')
      setError('Failed to send message. Please try again.');
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
            {messages.map((message, index) => {
              // Check if this is the special swap initiation reply
              const isSwapInitiation =
                message.role === 'assistant' &&
                /initiated the quoting process for swapping \d+(\.\d+)? \w+ to \w+ on \w+\./i.test(message.content);

              console.log('[ChatIdConversation] isSwapInitiation:', {
                isSwapInitiation,
                messageRole: message.role,
                hasQuote: !!message.quote,
                quoteInputLogo: message.quote?.inputMintLogo,
                quoteOutputLogo: message.quote?.outputMintLogo,
                content: message.content
              });

              return (
                <div key={index} className="flex flex-col">
                  {/* Render Thoughts and NewSwap if this is the swap initiation reply */}
                  {isSwapInitiation && (
                    <div className="swap-thoughts-wrapper ml-[76px]">
                      <Thoughts thoughts={message.thoughts || []} />
                      {message.swapEntities ? (
                        <NewSwap
                          fromToken={{
                            symbol: message.swapEntities.fromToken,
                            name: message.swapEntities.fromToken,
                            logo: message.quote?.inputMintLogo || '',
                            chain: message.swapEntities.network,
                            chainLogo: '',
                            address: '',
                            balance: 0,
                            price: 0
                          }}
                          toToken={{
                            symbol: message.swapEntities.toToken,
                            name: message.swapEntities.toToken,
                            logo: message.quote?.outputMintLogo || '',
                            chain: message.swapEntities.network,
                            chainLogo: '',
                            address: '',
                            balance: 0,
                            price: 0
                          }}
                          fromAmount={String(message.swapEntities.amount)}
                          quote={message.quote}
                        />
                      ) : (
                        <NewSwap />
                      )}
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
                            .replace(/'swap \[([^\]]+)\]\[([^\]]+)\] to \[([^\]]+)\]'/g, (_, amount, from, to) => 
                              `<code class="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono">swap ${amount}${from} to ${to}</code>`
                            )
                            // Then handle newlines
                            .replace(/\\n/g, '\n')
                            .split('\n')
                            .map((line, i, lines) => (
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
      <div className="flex flex-col gap-1 w-full p-2 mt-auto absolute bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 fixed" style={{ position: 'fixed' }}>
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
