// @ts-nocheck
'use client'

import {
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from 'react'
import { Flex, Heading, IconButton, ScrollArea, Tooltip } from '@radix-ui/themes'
import axios from 'axios';
import { useRouter } from 'next/navigation';
import ContentEditable from 'react-contenteditable'
import toast from 'react-hot-toast'
import { AiOutlineClear, AiOutlineLoading3Quarters, AiOutlineUnorderedList } from 'react-icons/ai'
import { FiSend } from 'react-icons/fi'
import type { Chat, ChatMessage } from './interface'
import Message from './Message'
import SwapBridgeStakeActionButtons from './SwapBridgeStakeActionButtons';
import WelcomeSection from './WelcomeSection';
import { API_ENDPOINTS } from '@/lib/config'
import { useChatStore } from '@/store/chatStore'
import { DefaultPersonas } from './interface'
import { usePrivy } from '@privy-io/react-auth'
import { useSolanaWallets } from '@privy-io/react-auth/solana'
import { Toast } from '../Toast'
// const { user, ready, authenticated } = usePrivy();

import './index.scss'

// 动画 keyframes 注入（仅一次）
if (typeof window !== 'undefined' && !document.getElementById('glowPulseKeyframes')) {
  const style = document.createElement('style');
  style.id = 'glowPulseKeyframes';
  style.innerHTML = `@keyframes glowPulse {
    0% { box-shadow: 0 0 16px 4px #00C6FB88, 0 2px 8px 0 rgba(0,0,0,0.12); }
    100% { box-shadow: 0 0 26px 8px #00C6FBcc, 0 2px 8px 0 rgba(0,0,0,0.14); }
  }`;
  document.head.appendChild(style);
}


const HTML_REGULAR =
  /<(?!img|table|\/table|thead|\/thead|tbody|\/tbody|tr|\/tr|td|\/td|th|\/th|br|\/br).*?>/gi

export interface ChatProps {
  chatId?: string;
}

export interface ChatGPInstance {
  setConversation: (messages: ChatMessage[]) => void
  getConversation: () => ChatMessage[]
  focus: () => void
}

const postChatOrQuestion = async (chat: Chat, messages: any[], input: string) => {
  const url = '/api/chat'

  const data = {
    prompt: chat?.persona?.prompt,
    messages: [...messages!],
    input
  }

  return await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
}


const Chat = (props: ChatProps, ref: any) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [currentMessage, setCurrentMessage] = useState<string>('');
  const textAreaRef = useRef<HTMLElement>(null);
  const bottomOfChatRef = useRef<HTMLDivElement>(null);
  const { ready, authenticated } = usePrivy();
  const { wallets: solanaWallets } = useSolanaWallets();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'info' | 'success' | 'warning' | 'error'>('info');

  const {
    currentChat,
    chatList,
    setCurrentChat,
    updateChatStatus,
    setMessages,
    getMessages,
    setChatList
  } = useChatStore();

  // 监控钱包状态变化
  useEffect(() => {
    console.log('[Chat] Wallet status changed:', {
      ready,
      authenticated,
      solanaWalletsCount: solanaWallets?.length,
      solanaWallets: solanaWallets?.map(w => ({ 
        type: w.walletClientType, 
        address: w.address,
        connected: w.connected
      }))
    });
  }, [ready, authenticated, solanaWallets]);

  // 初始化聊天
  useEffect(() => {
    const initializeChat = async () => {
      if (!currentChat) {
        console.log('[Chat] Initializing new chat');
        // 创建新的聊天
        const newChat = {
          id: crypto.randomUUID(),
          isNew: false,
          persona: DefaultPersonas[0],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        // 更新状态
        setCurrentChat(newChat);
        setChatList([...chatList, newChat]);
        console.log('[Chat] Created new chat:', newChat);
      }
    };

    // initializeChat();
  }, [currentChat, chatList, setCurrentChat, setChatList]);


  // Test proxy by requesting baidu.com and qq.com

  const checkWalletConnection = useCallback(() => {
    console.log('[checkWalletConnection] Checking wallet status:', { 
      ready, 
      authenticated, 
      solanaWalletsCount: solanaWallets?.length,
      solanaWallets: solanaWallets?.map(w => ({ type: w.walletClientType, address: w.address }))
    });

    if (!ready) {
      console.log('[checkWalletConnection] Privy not ready');
      setToastMessage('Please wait for wallet to be ready');
      setToastType('warning');
      setShowToast(true);
      return false;
    }

    if (!authenticated) {
      console.log('[checkWalletConnection] User not authenticated');
      setToastMessage('Please login to your wallet first');
      setToastType('warning');
      setShowToast(true);
      return false;
    }

    const hasSolanaWallet = solanaWallets && solanaWallets.length > 0;
    if (!hasSolanaWallet) {
      console.log('[checkWalletConnection] No Solana wallet found');
      setToastMessage('Please connect your Solana wallet first');
      setToastType('warning');
      setShowToast(true);
      return false;
    }

    const embeddedWallet = solanaWallets.find(wallet => wallet.walletClientType === 'privy');
    if (!embeddedWallet) {
      console.log('[checkWalletConnection] No embedded Solana wallet found');
      setToastMessage('Please connect your embedded Solana wallet first');
      setToastType('warning');
      setShowToast(true);
      return false;
    }

    console.log('[checkWalletConnection] Wallet check passed, embedded wallet found:', embeddedWallet.address);
    return true;
  }, [ready, authenticated, solanaWallets, setToastMessage, setToastType, setShowToast]);

  const sendMessage = useCallback(
    async () => {
      console.log('[sendMessage] called', { isLoading, message, currentChatId: currentChat?.id });
      if (isLoading || !message.trim()) return;

      try {
        setIsLoading(true);
        const input = message.trim();
        setMessage('');

        // 使用当前聊天，而不是创建新的
        const newChat = {
          id: crypto.randomUUID(),
          isNew: true,
          persona: DefaultPersonas[0],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        // 设置新的聊天
        setCurrentChat(newChat);
        
        // 使用 getState() 获取最新状态
        const currentState = useChatStore.getState();
        const latestChat = currentState.currentChat;
        
        // 如果是新聊天，先创建聊天会话
        console.log('[sendMessage] Using current chat:', {
          chatId: latestChat?.id,
          isNew: latestChat?.isNew
        });

        console.log('[sendMessage] Creating new chat session for first message', latestChat, input);
        
        // 获取真实的 Solana 钱包地址
        const embeddedWallet = solanaWallets?.find(wallet => wallet.walletClientType === 'privy');
        const walletAddress = embeddedWallet?.address || '0x1234567890123456789012345678901234567890';
        
        console.log('[sendMessage] Using wallet address:', walletAddress);
        
        // 添加用户消息到对话
        const messages = [{ 
          content: input, 
          role: 'user',
          timestamp: new Date().toISOString(),
          id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        }];
        setMessages(latestChat?.id!, messages);
        
        // 跳转到对应的聊天页面
        router.push(`/chat/${latestChat?.id}`);
      } catch (error) {
        console.error('Error sending message:', error);
        toast.error('Failed to send message');
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, message, setMessages, getMessages, router, updateChatStatus, solanaWallets, setCurrentChat, setChatList]
  );

  // 统一的发送处理函数
  const handleSend = useCallback(() => {
    console.log('[handleSend] called with message:', message);
    console.log('[handleSend] message.trim():', message.trim());
    console.log('[handleSend] isLoading:', isLoading);
    
    if (isLoading || !message.trim()) {
      console.log('[handleSend] Early return - isLoading:', isLoading, 'message empty:', !message.trim());
      return;
    }
    
    console.log('[handleSend] Calling sendMessage');
    sendMessage();
  }, [message, isLoading, sendMessage]);

  const handleKeypress = useCallback(
    (e: any) => {
      console.log('[handleKeypress] Key pressed:', e.key, 'Shift:', e.shiftKey);
      
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        
        const input = message.trim();
        if (input && !isLoading) {
          console.log('[handleKeypress] Sending message:', input);
          setIsLoading(true);
          setMessage('');
          
          // 创建新的聊天
          const newChat = {
            id: crypto.randomUUID(),
            isNew: true,
            persona: DefaultPersonas[0],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          // 设置新的聊天
          setCurrentChat(newChat);
          
          // 使用 getState() 获取最新状态
          const currentState = useChatStore.getState();
          const latestChat = currentState.currentChat;
          
          console.log('[handleKeypress] Created new chat:', {
            chatId: latestChat?.id,
            isNew: latestChat?.isNew
          });
          
          // 获取真实的 Solana 钱包地址
          const embeddedWallet = solanaWallets?.find(wallet => wallet.walletClientType === 'privy');
          const walletAddress = embeddedWallet?.address || '0x1234567890123456789012345678901234567890';
          
          // 添加用户消息到对话
          const messages = [{ 
            content: input, 
            role: 'user',
            timestamp: new Date().toISOString(),
            id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          }];
          setMessages(latestChat?.id!, messages);
          router.push(`/chat/${latestChat?.id}`);
          setIsLoading(false);
        } else {
          console.log('[handleKeypress] Empty message or already loading, not sending');
        }
      }
    },
    [setCurrentChat, setMessages, updateChatStatus, router, solanaWallets, isLoading, message]
  );

  const clearMessages = () => {
    // conversation.current = []
    // forceUpdate?.()
  }

  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = '50px'
      textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight + 2}px`
    }
  }, [message, textAreaRef])

  useEffect(() => {
    if (bottomOfChatRef.current) {
      bottomOfChatRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [currentMessage])

  useEffect(() => {
    if (!isLoading) {
      textAreaRef.current?.focus()
    }
  }, [isLoading])

  useImperativeHandle(ref, () => {
    return {
      setConversation(messages: ChatMessage[]) {
        // conversation.current = messages
        // forceUpdate?.()
      },
      getConversation() {
        return getMessages(currentChat?.id) // 修正：已无 conversationRef
      },
      focus: () => {
        textAreaRef.current?.focus()
      }
    }
  })

  // 移除自动发送事件监听
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handler = (e: any) => {
        if (typeof e.detail === 'string') {
          setMessage(e.detail);
        }
      };
      window.addEventListener('autoSendInput', handler);
      return () => window.removeEventListener('autoSendInput', handler);
    }
  }, []);

  // 移除自动发送逻辑
  useEffect(() => {
    if (message && typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      const inputParam = url.searchParams.get('input');
      if (inputParam && inputParam === message) {
        // 只清除参数，不自动发送
        url.searchParams.delete('input');
        window.history.replaceState({}, '', url.pathname + url.search);
      }
    }
  }, [message]);

  return (
    <Flex direction="column" className="relative" style={{ height: 'calc(100vh - 46px)', overflow: 'hidden', flex: 1 }}>
      <Flex className="flex-1 px-4 pb-20" style={{ overflow: 'auto' }}>
        {/* 仅在没有消息时显示欢迎，否则渲染消息列表 */}
        <WelcomeSection setMessage={setMessage} />
        <div ref={bottomOfChatRef} />
      </Flex>
      <Flex className="chat-textarea w-full items-end gap-3 absolute bottom-0 inset-x-0 z-30 bg-zinc-800 border-t border-gray-600" align="end" style={{
        borderRadius: '0',
        display: 'flex',
        width: '100%',
        padding: '12px 16px',
        justifyContent: 'space-between',
        alignItems: 'center',
        minHeight: '22px',
        height: 'auto',
        boxSizing: 'border-box',
        maxWidth: '100%',
        margin: '0',
        position: 'absolute',
        flexDirection: 'column',
      }}>
        {/* 5 Action Buttons */}
        {/* <div style={{ width: '100%' }}>
          <SwapBridgeStakeActionButtons setMessage={setMessage} />
        </div> */}
        <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center', height: '100%', width: '100%', maxWidth: '660px', margin: '0 auto' }}>
          {(!message || message === '<br>') && (
            <span style={{
              position: 'absolute',
              left: 20,
              top: 0,
              height: '50px',
              display: 'flex',
              alignItems: 'center',
              color: '#a0a0a6',
              pointerEvents: 'none',
              fontSize: 16,
              userSelect: 'none',
              zIndex: 1,
              fontWeight: 400,
              lineHeight: '50px',
              width: 'calc(100% - 56px)',
            }}>
              ask Miraix anything...
            </span>
          )}
          <ContentEditable
            innerRef={textAreaRef}
            html={message}
            disabled={isLoading}
            onChange={e => {
              console.log('[ContentEditable] onChange triggered');
              console.log('[ContentEditable] e.target.value:', e.target.value);
              console.log('[ContentEditable] e.target.innerHTML:', e.target.innerHTML);
              console.log('[ContentEditable] e.target.textContent:', e.target.textContent);
              const cleanedValue = e.target.value.replace(HTML_REGULAR, '');
              console.log('[ContentEditable] cleanedValue:', cleanedValue);
              setMessage(cleanedValue);
              console.log('[ContentEditable] setMessage called with:', cleanedValue);
            }}
            onKeyDown={(e) => {
              console.log('[ContentEditable] onKeyDown event:', e.key, e.shiftKey);
              handleKeypress(e);
            }}
            className="rt-TextAreaInput flex-1"
            style={{ 
              paddingRight: '56px', 
              paddingLeft: 20, 
              minHeight: 22, 
              height: 50, 
              lineHeight: '50px', 
              fontSize: 16, 
              background: 'transparent', 
              zIndex: 2,
              borderRadius: '25px',
              border: '1px solid #52525b',
              color: '#e0e0e6',
              transition: 'all 0.2s ease-in-out'
            }}
          />
          <IconButton
            size="3"
            variant="solid"
            color="accent"
            disabled={isLoading}
            onClick={() => {
              console.log('[SendButton] Clicked');
              
              const input = message.trim();
              if (input && !isLoading) {
                console.log('[SendButton] Sending message:', input);
                setIsLoading(true);
                setMessage('');
                
                // 创建新的聊天
                const newChat = {
                  id: crypto.randomUUID(),
                  isNew: true,
                  persona: DefaultPersonas[0],
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                };
                
                // 设置新的聊天
                setCurrentChat(newChat);
                
                // 使用 getState() 获取最新状态
                const currentState = useChatStore.getState();
                const latestChat = currentState.currentChat;
                
                console.log('[SendButton] Created new chat:', {
                  chatId: latestChat?.id,
                  isNew: latestChat?.isNew
                });
                
                // 获取真实的 Solana 钱包地址
                const embeddedWallet = solanaWallets?.find(wallet => wallet.walletClientType === 'privy');
                const walletAddress = embeddedWallet?.address || '0x1234567890123456789012345678901234567890';
                
                // 添加用户消息到对话
                const messages = [{ 
                  content: input, 
                  role: 'user',
                  timestamp: new Date().toISOString(),
                  id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
                }];
                setMessages(latestChat?.id!, messages);
                router.push(`/chat/${latestChat?.id}`);
                setIsLoading(false);
              } else {
                console.log('[SendButton] Empty message or already loading, not sending');
              }
            }}
            style={{
              position: 'absolute',
              right: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 2,
              background: 'linear-gradient(100deg, #00C6FB 0%, #3F51B5 100%)',
              borderRadius: '50%',
              boxShadow: '0 4px 12px rgba(0, 198, 251, 0.3), 0 2px 4px rgba(0,0,0,0.1)',
              transition: 'all 0.2s ease-in-out',
              padding: '8px',
              border: 'none',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              outline: 'none',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            } as React.CSSProperties}
            onMouseOver={e => {
              if (!isLoading) {
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 198, 251, 0.4), 0 4px 8px rgba(0,0,0,0.15)';
                e.currentTarget.style.transform = 'translateY(-50%) scale(1.05)';
              }
            }}
            onMouseOut={e => {
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 198, 251, 0.3), 0 2px 4px rgba(0,0,0,0.1)';
              e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
            }}
          >
            {isLoading ? <AiOutlineLoading3Quarters className="animate-spin" /> : <FiSend />}
          </IconButton>
        </div>
      </Flex>
      <Toast
        message={toastMessage}
        type={toastType}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
        duration={3000}
      />
    </Flex>
  );
}

interface ChatContextType {
  debug?: boolean;
  personaPanelType: string;
  DefaultPersonas: Persona[];
  currentChatRef?: MutableRefObject<Chat | undefined>;
  chatList: Chat[];
  personas: Persona[];
  isOpenPersonaModal?: boolean;
  editPersona?: Persona;
  personaModalLoading?: boolean;
  openPersonaPanel?: boolean;
  toggleSidebar?: boolean;
  onOpenPersonaModal?: () => void;
  onClosePersonaModal?: () => void;
  setCurrentChat?: (chat: Chat) => void;
  onCreatePersona?: (persona: Persona) => void;
  onDeleteChat?: (chat: Chat) => void;
  onDeletePersona?: (persona: Persona) => void;
  onEditPersona?: (persona: Persona) => void;
  onCreateChat?: (persona: Persona) => void;
  onChangeChat?: (chat: Chat) => void;
  saveMessages?: (messages: ChatMessage[]) => void;
  onOpenPersonaPanel?: (type?: string) => void;
  onClosePersonaPanel?: () => void;
  onToggleSidebar?: () => void;
  forceUpdate?: () => void;
  messagesMap?: MutableRefObject<Map<string, ChatMessage[]>>;
  updateChatStatus?: (chatId: string, isNew: boolean) => void;
}

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export default Chat;
