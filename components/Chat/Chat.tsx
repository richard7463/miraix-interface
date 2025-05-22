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

  const {
    currentChat,
    chatList,
    setCurrentChat,
    updateChatStatus,
    setMessages,
    getMessages,
    setChatList
  } = useChatStore();

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
          const response = await fetch(API_ENDPOINTS.CREATE_CHAT, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'signature': '0x1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890',
            'message': `Create chat ${latestChat?.id}`,
              'address': '0x1234567890123456789012345678901234567890'
            },
            body: JSON.stringify({
            chatId: latestChat?.id,
            persona: latestChat?.persona,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              message: input,
              timestamp: new Date().toISOString()
            })
          });

          if (!response.ok) {
            throw new Error('Failed to create chat session');
          }

          // 更新聊天状态
        updateChatStatus(latestChat?.id!, true);
          
          // 添加用户消息到对话
        const messages = [{ content: input, role: 'user' }];
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
    [isLoading, message, setMessages, getMessages, router, updateChatStatus]
  );

  const handleKeypress = useCallback(
    (e: any) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  )

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
    <Flex direction="column" height="100vh" className="relative" gap="3" style={{ minHeight: '100vh', overflow: 'hidden' }}>
      <Flex
        justify="between"
        align="center"
        py="3"
        px="4"
      >
        {/* <Flex align="center" gap="3">
          <Heading size="4">{currentChatRef?.current?.persona?.name || 'None'}</Heading>
        </Flex> */}
        {/* <Flex gap="2">
          <IconButton
            size="2"
            variant="ghost"
            color="gray"
            onClick={onToggleSidebar}
          >
            <AiOutlineUnorderedList />
          </IconButton>
        </Flex> */}
      </Flex>
      <Flex className="flex-1 px-4" style={{}}>
        {/* 仅在没有消息时显示欢迎，否则渲染消息列表 */}
        <WelcomeSection />
        <div ref={bottomOfChatRef} />
      </Flex>
      <Flex className="chat-textarea w-full items-end gap-3 fixed bottom-0 inset-x-0 z-30" align="end" style={{
        borderRadius: '40px',
        display: 'flex',
        width: '70vw',
        padding: '12px 18px',
        justifyContent: 'space-between',
        alignItems: 'center',
        minHeight: '22px',
        height: 'auto',
        boxSizing: 'border-box',
        maxWidth: '100vw',
        margin: '0 auto',
        position: 'relative',
        flexDirection: 'column',
      }}>
        {/* 5 Action Buttons */}
        <div style={{ width: '100%' }}>
          <SwapBridgeStakeActionButtons setMessage={setMessage} />
        </div>
        <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center', height: '100%', width: '90%' }}>
          {(!message || message === '<br>') && (
            <span style={{
              position: 'absolute',
              left: 20,
              top: 0,
              height: '50px',
              display: 'flex',
              alignItems: 'center',
              color: '#fff',
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
            onChange={e => setMessage(e.target.value.replace(HTML_REGULAR, ''))}
            onKeyDown={handleKeypress}
            className="rt-TextAreaInput flex-1"
            style={{ paddingRight: '56px', paddingLeft: 20, minHeight: 22, height: 50, lineHeight: '50px', fontSize: 16, background: 'transparent', zIndex: 2 }}
          />
          <IconButton
            size="3"
            variant="solid"
            color="accent"
            disabled={isLoading}
            onClick={sendMessage}
            style={{
              position: 'absolute',
              right: '1%',
              top: '50%',
              transform: 'translateY(-50%) scale(0.7)',
              zIndex: 2,
              background: 'linear-gradient(100deg, #00C6FB 0%, #3F51B5 100%)',
              borderRadius: '50%',
              boxShadow: '0 0 16px 4px #00C6FB88, 0 2px 8px 0 rgba(0,0,0,0.12)',
              transition: 'box-shadow 0.25s, transform 0.18s',
              padding: '6px',
              border: 'none',
              cursor: 'pointer',
              outline: 'none',
              animation: 'glowPulse 2s infinite alternate',
            } as React.CSSProperties}
            onMouseOver={e => {
              e.currentTarget.style.boxShadow = '0 0 38px 10px #00C6FBcc, 0 2px 8px 0 rgba(0,0,0,0.14)';
              e.currentTarget.style.transform = 'translateY(-50%) scale(0.85)';
            }}
            onMouseOut={e => {
              e.currentTarget.style.boxShadow = '0 0 16px 4px #00C6FB88, 0 2px 8px 0 rgba(0,0,0,0.12)';
              e.currentTarget.style.transform = 'translateY(-50%) scale(0.7)';
            }}
          >
            {isLoading ? <AiOutlineLoading3Quarters className="animate-spin" /> : <FiSend />}
          </IconButton>
        </div>
      </Flex>
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
