// @ts-nocheck
"use client";

import React, { useContext, useState, useEffect } from "react";
import { Box, Flex, IconButton, ScrollArea, Text } from "@radix-ui/themes";
import cs from "classnames";
import { AiOutlineCloseCircle } from "react-icons/ai";
import { BiMessageDetail } from "react-icons/bi";
import {
  FiPlus,
  FiCheckSquare,
  FiServer,
  FiClock,
  FiActivity,
  FiZap,
  FiShield,
  FiAward,
  FiTrendingUp,
} from "react-icons/fi";
import { RiRobot2Line } from "react-icons/ri";
import { useTheme } from "../Themes";
import { ChatContext } from "./useChatHook";
import "./index.scss";
import { ChatSelector } from "./ChatSelector";
import SidePanel from "./SidePanel";
import { useRouter } from "next/navigation";
// import { StrategiesSelector } from './StrategiesSelector'
// import { TasksSelector } from './TasksSelector'
import { usePrivyAuth } from "./usePrivyAuth";

export const ChatSideBar = () => {
  const {
    currentChatRef,
    chatList,
    DefaultPersonas,
    toggleSidebar,
    onDeleteChat,
    onChangeChat,
    onCreateChat,
    onOpenPersonaPanel,
  } = useContext(ChatContext);

  const { theme } = useTheme();
  const router = useRouter();
  console.log("theme in chatsidebar", theme);
  // Log the value of chatList
  console.log("chatList in ChatSideBar:", chatList);

  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Add login state
  const [localChatList, setLocalChatList] = useState([]);
  const [isChatSelectorOpen, setIsChatSelectorOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { getUserChats } = usePrivyAuth();

  // 获取聊天列表的函数
  const displayChatList = async () => {
    console.log(
      "displayChatList called, isChatSelectorOpen:",
      isChatSelectorOpen,
    );
    try {
      setIsLoading(true);
      console.log("Fetching chats from API...");
      const { chats: userChats } = await getUserChats();
      console.log("Fetched chats:", userChats);
      setLocalChatList(userChats || []);
      return userChats || [];
    } catch (error) {
      console.error("Error fetching chats:", error);
      setLocalChatList([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // 当 ChatSelector 打开时获取聊天列表
  useEffect(() => {
    console.log("useEffect triggered, isChatSelectorOpen:", isChatSelectorOpen);
    if (isChatSelectorOpen) {
      console.log("ChatSelector is open, fetching chats...");
      displayChatList();
    }
  }, [isChatSelectorOpen]);

  // 处理 ChatSelector 打开状态变化
  const handleChatSelectorOpenChange = (isOpen: boolean) => {
    console.log("ChatSelector open state changed:", isOpen);
    // 只在打开时设置状态，关闭时不处理
    if (isOpen) {
      setIsChatSelectorOpen(true);
      displayChatList();
    }
  };

  // 处理聊天选择
  const handleChatChange = (chat: any) => {
    onChangeChat(chat);
    // 保持列表展开状态
    setIsChatSelectorOpen(true);
  };

  // 处理MCP Server导航
  const handleMCPServerClick = () => {
    router.push("/mcp-server");
  };

  // Mock data for tasks and strategies
  const mockTasks = [
    { id: "task-1", title: "Task 1" },
    { id: "task-2", title: "Task 2" },
  ];

  const mockStrategies = [
    { id: "strategy-1", title: "Strategy 1" },
    { id: "strategy-2", title: "Strategy 2" },
  ];

  // Create handlers
  const handleCreateChat = () => {
    if (onCreateChat) {
      onCreateChat();
    }
  };

  const handleCreateTask = () => {
    // TODO: Implement task creation logic
    console.log("Creating new task");
  };

  const handleCreateStrategy = () => {
    // TODO: Implement strategy creation logic
    console.log("Creating new strategy");
  };

  const handleLogin = () => {
    // Mock login function
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    // Mock logout function
    setIsLoggedIn(false);
  };

  return (
    <Flex
      direction="column"
      className={
        cs("chat-side-bar", { show: toggleSidebar }) +
        " shadow-lg border-r border-gray-700 z-50 bg-zinc-800"
      }
      style={{ position: "relative", height: "calc(100vh - 46px)" }}
    >
      <Flex
        className="p-3 h-full overflow-hidden w-full"
        direction="column"
        gap="4"
        style={{ flex: 1, minHeight: 0 }}
      >
        <ScrollArea className="flex-1" style={{ width: "100%" }} type="auto">
          <Flex direction="column" gap="3" className="px-3">
            <ChatSelector
              chatList={localChatList}
              currentChatId={currentChatRef?.current?.id}
              onChangeChat={handleChatChange}
              onCreateChat={handleCreateChat}
              onOpenChange={handleChatSelectorOpenChange}
              isLoading={isLoading}
            />

            {/* MCP Server Tab */}
            <div className="w-full border border-gray-600 rounded-lg">
              <button
                onClick={handleMCPServerClick}
                className="peer/menu-button gap-2 overflow-hidden rounded-lg p-2 text-left outline-none duration-300 ease-in-out focus-visible:ring-2 focus-visible:ring-blue-500/50 active:text-sidebar-foreground-accent disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 data-[active=true]:font-medium data-[active=true]:text-sidebar-active data-[state=open]:hover:bg-gray-700/50 data-[state=open]:hover:text-sidebar-active group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 hover:bg-gray-700/50 hover:text-sidebar-active h-8 text-sm flex items-center font-medium transition-all group justify-between w-full text-gray-300 hover:text-gray-100"
                type="button"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <FiServer className="h-4 w-4 text-blue-400" />
                    <h1 className="text-sm font-semibold">MCP Server</h1>
                  </div>
                </div>
              </button>
            </div>
            {/* Agent Hub Tab */}
            <div className="w-full border border-gray-600 rounded-lg">
              <button
                onClick={() => router.push("/agent-hub")}
                className="peer/menu-button gap-2 overflow-hidden rounded-lg p-2 text-left outline-none duration-300 ease-in-out focus-visible:ring-2 focus-visible:ring-blue-500/50 active:text-sidebar-foreground-accent disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 data-[active=true]:font-medium data-[active=true]:text-sidebar-active data-[state=open]:hover:bg-gray-700/50 data-[state=open]:hover:text-sidebar-active group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 hover:bg-gray-700/50 hover:text-sidebar-active h-8 text-sm flex items-center font-medium transition-all group justify-between w-full text-gray-300 hover:text-gray-100"
                type="button"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <RiRobot2Line className="h-4 w-4 text-purple-400" />
                    <h1 className="text-sm font-semibold">Agent Hub</h1>
                  </div>
                </div>
              </button>
            </div>

            {/* Auto Tasks Tab */}
            <div className="w-full border border-gray-600 rounded-lg">
              <button
                onClick={() => router.push("/auto-tasks")}
                className="peer/menu-button gap-2 overflow-hidden rounded-lg p-2 text-left outline-none duration-300 ease-in-out focus-visible:ring-2 focus-visible:ring-blue-500/50 active:text-sidebar-foreground-accent disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 data-[active=true]:font-medium data-[active=true]:text-sidebar-active data-[state=open]:hover:bg-gray-700/50 data-[state=open]:hover:text-sidebar-active group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 hover:bg-gray-700/50 hover:text-sidebar-active h-8 text-sm flex items-center font-medium transition-all group justify-between w-full text-gray-300 hover:text-gray-100"
                type="button"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <FiClock className="h-4 w-4 text-green-400" />
                    <h1 className="text-sm font-semibold">Auto Tasks</h1>
                  </div>
                </div>
              </button>
            </div>

            <div className="w-full border border-gray-600 rounded-lg">
              <button
                onClick={() => router.push("/meme-rotation-desk")}
                className="peer/menu-button gap-2 overflow-hidden rounded-lg p-2 text-left outline-none duration-300 ease-in-out focus-visible:ring-2 focus-visible:ring-blue-500/50 active:text-sidebar-foreground-accent disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 data-[active=true]:font-medium data-[active=true]:text-sidebar-active data-[state=open]:hover:bg-gray-700/50 data-[state=open]:hover:text-sidebar-active group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 hover:bg-gray-700/50 hover:text-sidebar-active h-8 text-sm flex items-center font-medium transition-all group justify-between w-full text-gray-300 hover:text-gray-100"
                type="button"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <FiTrendingUp className="h-4 w-4 text-emerald-400" />
                    <h1 className="text-sm font-semibold">
                      Meme Rotation Desk
                    </h1>
                  </div>
                </div>
              </button>
            </div>

            <div className="w-full border border-gray-600 rounded-lg">
              <button
                onClick={() => router.push("/fomo-copilot")}
                className="peer/menu-button gap-2 overflow-hidden rounded-lg p-2 text-left outline-none duration-300 ease-in-out focus-visible:ring-2 focus-visible:ring-blue-500/50 active:text-sidebar-foreground-accent disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 data-[active=true]:font-medium data-[active=true]:text-sidebar-active data-[state=open]:hover:bg-gray-700/50 data-[state=open]:hover:text-sidebar-active group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 hover:bg-gray-700/50 hover:text-sidebar-active h-8 text-sm flex items-center font-medium transition-all group justify-between w-full text-gray-300 hover:text-gray-100"
                type="button"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <FiZap className="h-4 w-4 text-sky-400" />
                    <h1 className="text-sm font-semibold">100U FOMO Copilot</h1>
                  </div>
                </div>
              </button>
            </div>

            <div className="w-full border border-gray-600 rounded-lg">
              <button
                onClick={() => router.push("/wallet-roast")}
                className="peer/menu-button gap-2 overflow-hidden rounded-lg p-2 text-left outline-none duration-300 ease-in-out focus-visible:ring-2 focus-visible:ring-blue-500/50 active:text-sidebar-foreground-accent disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 data-[active=true]:font-medium data-[active=true]:text-sidebar-active data-[state=open]:hover:bg-gray-700/50 data-[state=open]:hover:text-sidebar-active group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 hover:bg-gray-700/50 hover:text-sidebar-active h-8 text-sm flex items-center font-medium transition-all group justify-between w-full text-gray-300 hover:text-gray-100"
                type="button"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <FiActivity className="h-4 w-4 text-orange-400" />
                    <h1 className="text-sm font-semibold">Wallet Roast</h1>
                  </div>
                </div>
              </button>
            </div>

            <div className="w-full border border-gray-600 rounded-lg">
              <button
                onClick={() => router.push("/agent-arena")}
                className="peer/menu-button gap-2 overflow-hidden rounded-lg p-2 text-left outline-none duration-300 ease-in-out focus-visible:ring-2 focus-visible:ring-blue-500/50 active:text-sidebar-foreground-accent disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 data-[active=true]:font-medium data-[active=true]:text-sidebar-active data-[state=open]:hover:bg-gray-700/50 data-[state=open]:hover:text-sidebar-active group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 hover:bg-gray-700/50 hover:text-sidebar-active h-8 text-sm flex items-center font-medium transition-all group justify-between w-full text-gray-300 hover:text-gray-100"
                type="button"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <FiAward className="h-4 w-4 text-lime-400" />
                    <h1 className="text-sm font-semibold">Agent Arena</h1>
                  </div>
                </div>
              </button>
            </div>

            <div className="w-full border border-gray-600 rounded-lg">
              <button
                onClick={() => router.push("/binance-agent-firewall")}
                className="peer/menu-button gap-2 overflow-hidden rounded-lg p-2 text-left outline-none duration-300 ease-in-out focus-visible:ring-2 focus-visible:ring-blue-500/50 active:text-sidebar-foreground-accent disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 data-[active=true]:font-medium data-[active=true]:text-sidebar-active data-[state=open]:hover:bg-gray-700/50 data-[state=open]:hover:text-sidebar-active group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 hover:bg-gray-700/50 hover:text-sidebar-active h-8 text-sm flex items-center font-medium transition-all group justify-between w-full text-gray-300 hover:text-gray-100"
                type="button"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <FiShield className="h-4 w-4 text-yellow-400" />
                    <h1 className="text-sm font-semibold">
                      Binance Agent Firewall
                    </h1>
                  </div>
                </div>
              </button>
            </div>

            {/* <TasksSelector
              taskList={mockTasks}
              currentTaskId={mockTasks[0].id}
              onChangeTask={(task) => console.log('Task selected:', task)}
              onCreateTask={handleCreateTask}
            /> */}
            {/* <StrategiesSelector
              strategyList={mockStrategies}
              currentStrategyId={mockStrategies[0].id}
              onChangeStrategy={(strategy) => console.log('Strategy selected:', strategy)}
              onCreateStrategy={handleCreateStrategy}
            /> */}
          </Flex>
        </ScrollArea>

        {/* Social Links */}
        <div className="mt-auto pt-4 border-t border-gray-600">
          <div className="flex flex-col gap-3 px-3">
            <Text size="1" className="text-gray-400 text-center font-medium">
              Connect with us
            </Text>
            <div className="flex justify-center gap-4">
              <a
                href="https://x.com/Miraix_Ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-blue-400 transition-colors duration-200"
              >
                <span className="sr-only">Twitter</span>
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a
                href="https://github.com/miraixai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gray-200 transition-colors duration-200"
              >
                <span className="sr-only">GitHub</span>
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </Flex>

      <SidePanel isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)}>
        <div className="space-y-4">
          <div className="rounded-lg border border-gray-600 p-4 bg-gray-800/50 backdrop-blur-sm">
            <h3 className="mb-2 text-lg font-medium text-gray-200">
              Chat Settings
            </h3>
            <p className="text-gray-400">
              Configure your chat preferences here.
            </p>
          </div>

          <div className="rounded-lg border border-gray-600 p-4 bg-gray-800/50 backdrop-blur-sm">
            <h3 className="mb-2 text-lg font-medium text-gray-200">
              Task Management
            </h3>
            <p className="text-gray-400">View and manage your tasks.</p>
          </div>

          <div className="rounded-lg border border-gray-600 p-4 bg-gray-800/50 backdrop-blur-sm">
            <h3 className="mb-2 text-lg font-medium text-gray-200">
              Strategy Settings
            </h3>
            <p className="text-gray-400">Configure your AI strategies.</p>
          </div>
        </div>
      </SidePanel>
    </Flex>
  );
};

export default ChatSideBar;
