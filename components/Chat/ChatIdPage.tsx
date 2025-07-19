'use client'
import { Flex } from '@radix-ui/themes'
import ChatIdConversation from './ChatIdConversation'
import { ChatSideBar } from './ChatSideBar'
import { useState } from 'react'
import { IconButton } from '@radix-ui/themes'
import { AiOutlineMenu } from 'react-icons/ai'

export default function ChatIdPage({ chatId }: { chatId: string }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="h-[calc(100vh-46px)] flex relative bg-zinc-800">
      {/* Mobile menu button */}
      <div className="lg:hidden absolute top-4 left-4 z-20">
        <IconButton onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          <AiOutlineMenu />
        </IconButton>
      </div>

      {/* Sidebar - hidden on mobile by default, shown when isSidebarOpen is true */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-10
        transform transition-transform duration-200 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        w-64 lg:w-64
      `}>
      <ChatSideBar />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col h-full w-full lg:w-auto" style={{ overflow: 'auto' }}>
        <div className="absolute top-4 right-4">
          <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
            Beta
          </span>
        </div>
        <div className="flex-1 overflow-hidden">
          <ChatIdConversation chatId={chatId} hideActions={true} />
        </div>
      </div>

      {/* Overlay for mobile when sidebar is open */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-0 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  )
}
