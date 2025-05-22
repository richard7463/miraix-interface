import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Chat as ChatInterface, Persona } from '@/components/Chat/interface'
import { API_ENDPOINTS } from '@/lib/config'

export type Chat = ChatInterface

interface ChatStore {
  currentChat: Chat | null
  chatList: Chat[]
  messagesMap: Map<string, any[]>
  setCurrentChat: (chat: Chat | null) => void
  setChatList: (chats: Chat[]) => void
  updateChatStatus: (chatId: string, isNew: boolean) => void
  addMessage: (chatId: string, message: any) => void
  setMessages: (chatId: string, messages: any[]) => void
  getMessages: (chatId: string) => any[]
  saveMessages: (chatId: string, messages: any[]) => Promise<void>
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      currentChat: null,
      chatList: [],
      messagesMap: new Map<string, any[]>(),
      
      setCurrentChat: (chat) => set({ currentChat: chat }),
      
      setChatList: (chats) => set({ chatList: chats }),
      
      updateChatStatus: (chatId, isNew) => 
        set((state) => ({
          chatList: state.chatList.map(chat => 
            chat.id === chatId ? { ...chat, isNew } : chat
          ),
          currentChat: state.currentChat?.id === chatId 
            ? { ...state.currentChat, isNew } 
            : state.currentChat
        })),
      
      addMessage: (chatId, message) => 
        set((state) => {
          let map = state.messagesMap instanceof Map
            ? state.messagesMap
            : new Map<string, any[]>(Array.isArray(state.messagesMap) ? state.messagesMap : [])
          const messages = map.get(chatId) || []
          const newMessages = [...messages, message]
          map.set(chatId, newMessages)
          return { messagesMap: map }
        }),
      
      setMessages: (chatId, messages) =>
        set((state) => {
          let map = state.messagesMap instanceof Map
            ? state.messagesMap
            : new Map<string, any[]>(Array.isArray(state.messagesMap) ? state.messagesMap : [])
          map.set(chatId, messages)
          return { messagesMap: map }
        }),
      
      getMessages: (chatId) => {
        const state = get()
        let map = state.messagesMap instanceof Map
          ? state.messagesMap
          : new Map<string, any[]>(Array.isArray(state.messagesMap) ? state.messagesMap : [])
        return map.get(chatId) || []
      },
      
      saveMessages: async (chatId, messages) => {
        const state = get()
        const currentChat = state.chatList.find(chat => chat.id === chatId)

        console.log('[chatStore] Saving messages:', {
          chatId,
          messages,
          currentChat
        })

        if (messages.length > 0 && chatId) {
          try {
            // 确保消息包含所有必要的字段
            const formattedMessages = messages.map(msg => ({
              ...msg,
              timestamp: msg.timestamp || new Date().toISOString(),
              id: msg.id || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            }))

            const response = await fetch(API_ENDPOINTS.SAVE_MESSAGES(chatId), {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'signature': '0x1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890',
                'message': `Save messages for chat ${chatId}`,
                'address': '0x1234567890123456789012345678901234567890'
              },
              body: JSON.stringify({
                messages: formattedMessages,
                chatId: chatId,
                persona: currentChat?.persona,
                createdAt: currentChat?.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString()
              })
            })

            if (!response.ok) {
              throw new Error('Failed to save messages')
            }

            // 更新本地消息映射
            set((state) => {
              let map = state.messagesMap instanceof Map
                ? state.messagesMap
                : new Map<string, any[]>(Array.isArray(state.messagesMap) ? state.messagesMap : [])
              map.set(chatId, formattedMessages)
              return { messagesMap: map }
            })

            console.log('[chatStore] Messages saved successfully:', formattedMessages)
          } catch (error) {
            console.error('Error in saveMessages:', error)
            throw error
          }
        }
      }
    }),
    {
      name: 'chat-storage',
      partialize: (state) => ({
        chatList: state.chatList,
        messagesMap: Array.from(state.messagesMap.entries())
      })
    }
  )
) 