'use client'

import { useEffect } from 'react'
import { useChatStore } from '@/store/chatStore'

export default function ChatTest() {
  const {
    currentChat,
    chatList,
    setCurrentChat,
    setChatList,
    updateChatStatus,
    setMessages,
    getMessages
  } = useChatStore()

  // 测试创建新聊天
  useEffect(() => {
    const testChat = {
      id: 'test-chat-1',
      isNew: true,
      persona: 'test-persona',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    console.log('=== 测试创建新聊天 ===')
    console.log('Before:', { currentChat, chatList })
    
    setCurrentChat(testChat)
    setChatList([testChat])
    
    console.log('After:', { currentChat, chatList })
  }, [])

  // 测试更新聊天状态
  useEffect(() => {
    if (currentChat) {
      console.log('=== 测试更新聊天状态 ===')
      console.log('Before:', { currentChat, chatList })
      
      updateChatStatus(currentChat.id, false)
      
      console.log('After:', { currentChat, chatList })
    }
  }, [currentChat])

  // 测试消息操作
  useEffect(() => {
    if (currentChat) {
      console.log('=== 测试消息操作 ===')
      const testMessages = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' }
      ]
      
      console.log('Before messages:', getMessages(currentChat.id))
      
      setMessages(currentChat.id, testMessages)
      
      console.log('After messages:', getMessages(currentChat.id))
    }
  }, [currentChat])

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Chat Store Test</h1>
      
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">Current Chat:</h2>
        <pre className="bg-gray-100 p-2 rounded">
          {JSON.stringify(currentChat, null, 2)}
        </pre>
      </div>
      
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">Chat List:</h2>
        <pre className="bg-gray-100 p-2 rounded">
          {JSON.stringify(chatList, null, 2)}
        </pre>
      </div>
      
      <div>
        <h2 className="text-lg font-semibold mb-2">Messages:</h2>
        <pre className="bg-gray-100 p-2 rounded">
          {JSON.stringify(currentChat ? getMessages(currentChat.id) : [], null, 2)}
        </pre>
      </div>
    </div>
  )
} 