// @ts-nocheck
'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Text } from '@radix-ui/themes'
import { BiMessageDetail } from 'react-icons/bi'
import { FiPlus } from 'react-icons/fi'
import { useRouter } from 'next/navigation'
import { RiRobot2Line } from 'react-icons/ri'
import { ImSpinner8 } from 'react-icons/im'

interface ChatSelectorProps {
  chatList: any[]
  currentChatId?: string
  onChangeChat: (chat: any) => void
  onCreateChat: () => void
  onOpenChange?: (isOpen: boolean) => void
  isLoading?: boolean
}

export const ChatSelector: React.FC<ChatSelectorProps> = ({
  chatList,
  currentChatId,
  onChangeChat,
  onCreateChat,
  onOpenChange,
  isLoading = false
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // 移除点击外部关闭的逻辑
  // useEffect(() => {
  //   const handleClickOutside = (event: MouseEvent) => {
  //     if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
  //       setIsOpen(false)
  //       onOpenChange?.(false)
  //     }
  //   }

  //   document.addEventListener('mousedown', handleClickOutside)
  //   return () => document.removeEventListener('mousedown', handleClickOutside)
  // }, [onOpenChange])

  const handleToggle = () => {
    const newIsOpen = !isOpen
    setIsOpen(newIsOpen)
    onOpenChange?.(newIsOpen)
  }

  // 处理聊天选择
  const handleChatSelect = (chat: any) => {
    // onChangeChat(chat);
    // 跳转到对应的聊天页面
    router.push(`/chat/${chat.id}`);
    // 保持列表展开状态
  }

  return (
    <div className="w-full border border-gray-600 rounded-md">
      <button
        onClick={handleToggle}
        className="peer/menu-button gap-2 overflow-hidden rounded-md p-2 text-left outline-none duration-300 ease-in-out focus-visible:ring-2 active:text-sidebar-foreground-accent disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 data-[active=true]:font-medium data-[active=true]:text-sidebar-active data-[state=open]:hover:bg-gray-700 data-[state=open]:hover:text-sidebar-active group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 hover:bg-gray-700 hover:text-sidebar-active h-8 text-sm flex items-center font-medium transition-all group justify-between w-full"
        type="button"
        aria-controls="chat-list"
        aria-expanded={isOpen}
        data-state={isOpen ? 'open' : 'closed'}
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <BiMessageDetail className="h-4 w-4" />
            <h1 className="text-sm font-semibold">Chats</h1>
          </div>
          <div className="flex items-center gap-2">
            <div 
              className="h-fit w-fit p-1 hover:bg-gray-700 rounded-md transition-colors duration-200"
              onClick={(e) => {
                e.stopPropagation();
                onCreateChat();
              }}
            >
              <FiPlus className="w-4 h-4" />
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`h-[14px] w-[14px] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} text-gray-500`}
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>
        </div>
      </button>

      <div
        id="chat-list"
        className={`data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden transition-all duration-200 ease-in-out ${
          isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        }`}
        data-state={isOpen ? 'open' : 'closed'}
      >
        <div className="mt-2 space-y-1 p-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-2">
              <ImSpinner8 className="w-4 h-4 animate-spin text-gray-500" />
            </div>
          ) : (
            chatList.map((chat) => (
              <button
                key={chat.id}
                onClick={() => handleChatSelect(chat)}
                className={`w-full text-left px-2 py-1.5 text-sm rounded-md transition-colors duration-200 ${
                  chat.id === currentChatId
                    ? 'bg-gray-700 text-gray-100'
                    : 'hover:bg-gray-700 text-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <RiRobot2Line className="h-4 w-4" />
                  <span className="truncate">{chat.name || 'New Chat'}</span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default ChatSelector
