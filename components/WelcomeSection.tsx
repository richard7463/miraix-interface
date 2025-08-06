import React from 'react';
import { useRouter } from 'next/navigation';
import useChatHook from './Chat/useChatHook';
import { DefaultPersonas } from './Chat/useChatHook';

// 新增：支持setMessage作为props
interface WelcomeSectionProps {
  setMessage?: (msg: string) => void;
}

export default function WelcomeSection({ setMessage }: WelcomeSectionProps) {
  const router = useRouter();
  const chatHook = useChatHook();

  const handleStartChat = async () => {
    const chat = await chatHook.onCreateChat(DefaultPersonas[0]);
    router.push(`/chat/${chat.id}`);
  };

  // 新增：快捷填充按钮
  const handleCreateTokenExample = () => {
    if (setMessage) {
      setMessage('Create a token named abcpump ...');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-3 sm:p-6 md:p-8 lg:p-12">
      {/* Hero Section */}
      <div className="max-w-4xl mx-auto text-center space-y-4 sm:space-y-8 md:space-y-10">
        <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white">
          Welcome to <span className="text-blue-600 dark:text-blue-400">MiraiX</span>
        </h1>
        
        <p className="text-sm sm:text-lg md:text-xl lg:text-2xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Your AI-powered assistant for all your crypto needs. Get instant answers, market insights, and trading guidance.
        </p>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 md:gap-8 mt-6 sm:mt-12 md:mt-16">
          {/* Feature 1 */}
          <div className="bg-white dark:bg-gray-800 p-3 sm:p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-3 sm:mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-7 sm:w-7 md:h-8 md:w-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-base sm:text-xl md:text-2xl font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">Instant Answers</h3>
            <p className="text-xs sm:text-base text-gray-600 dark:text-gray-300">Get quick and accurate responses to your crypto questions</p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white dark:bg-gray-800 p-3 sm:p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-3 sm:mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-7 sm:w-7 md:h-8 md:w-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-base sm:text-xl md:text-2xl font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">Market Insights</h3>
            <p className="text-xs sm:text-base text-gray-600 dark:text-gray-300">Stay updated with real-time market analysis and trends</p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white dark:bg-gray-800 p-3 sm:p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mb-3 sm:mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-7 sm:w-7 md:h-8 md:w-8 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-base sm:text-xl md:text-2xl font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">Trading Guidance</h3>
            <p className="text-xs sm:text-base text-gray-600 dark:text-gray-300">Get expert advice on trading strategies and risk management</p>
          </div>
        </div>

        {/* CTA Button */}
        <div className="mt-6 sm:mt-12 md:mt-16 flex flex-col items-center gap-4">
          <button
            onClick={handleStartChat}
            className="px-4 sm:px-8 md:px-10 py-2 sm:py-4 text-sm sm:text-lg md:text-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors duration-200"
          >
            Start Chatting Now
          </button>
          {/* 新增：一键填充创建Token意图 */}
          <button
            onClick={handleCreateTokenExample}
            className="px-4 sm:px-8 md:px-10 py-2 sm:py-4 text-sm sm:text-lg md:text-xl font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-sm transition-colors duration-200"
          >
            Create a token named abcpump
          </button>
        </div>
      </div>
    </div>
  );
} 