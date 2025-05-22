// @ts-nocheck

'use client'
import { Suspense } from 'react'
import { Flex } from '@radix-ui/themes'
import { Chat, ChatSideBar } from '@/components'
import { ChatContext } from '@/components/Chat/useChatHook'
import useChatHook from '@/components/Chat/useChatHook'

const ChatProvider = () => {
  const provider = useChatHook()
  return (
    <ChatContext.Provider value={provider}>
      <Flex>
        <ChatSideBar />
        <Chat />
      </Flex>
    </ChatContext.Provider>
  )
}

export default function ChatPage() {
  return (
    <Suspense>
      <ChatProvider />
    </Suspense>
  )
}
