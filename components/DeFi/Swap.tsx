import React, { useEffect, useRef } from 'react';

// 声明全局 Jupiter 类型
declare global {
  interface Window {
    Jupiter: {
      init: (config: {
        displayMode: 'modal' | 'integrated' | 'widget';
        endpoint: string;
        integratedTargetId?: string;  // 可选
        containerStyles?: string;
        theme?: {
          background: string;
          primary: string;
          secondary: string;
          accent: string;
          error: string;
          success: string;
          warning: string;
          text: {
            primary: string;
            secondary: string;
          };
        };
        widgetStyle?: {
          position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
          size?: 'default' | 'sm';
        };
      }) => void;
      open: () => void;  // 添加 open 方法
    };
  }
}

interface SwapProps {
  endpoint: string;
  className?: string;
}

export default function Swap({ endpoint, className = '' }: SwapProps) {
  const scriptLoaded = useRef(false);
  const targetId = 'jupiter-terminal-integrated';

  useEffect(() => {
    if (scriptLoaded.current) return;

    // 添加自定义样式
    const style = document.createElement('style');
    style.textContent = `
      #${targetId} {
        background: #27272a;
        border-radius: 1rem;
        padding: 0.75rem;
        margin: 0;
        width: 100%;
        max-width: 450px;
        box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
      }
      #${targetId} .jupiter-terminal {
        background: #27272a !important;
        border-radius: 1rem !important;
        padding: 0 !important;
        margin: 0 !important;
        width: 100% !important;
        max-width: 450px !important;
      }
      #${targetId} .jupiter-terminal-header {
        display: none !important;
      }
      #${targetId} .jupiter-terminal-container {
        background: #27272a !important;
        border-radius: 1rem !important;
      }
      #${targetId} .jupiter-terminal-token-selector {
        background: #3f3f46 !important;
        border: 1px solid #52525b !important;
        border-radius: 0.75rem !important;
      }
      #${targetId} .jupiter-terminal-token-selector:hover {
        background: #52525b !important;
      }
      #${targetId} .jupiter-terminal-input {
        background: #3f3f46 !important;
        border: 1px solid #52525b !important;
        border-radius: 0.75rem !important;
        color: #ffffff !important;
      }
      #${targetId} .jupiter-terminal-input:focus {
        border-color: #3B82F6 !important;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1) !important;
      }
      #${targetId} .jupiter-terminal-button {
        background: #3B82F6 !important;
        border-radius: 0.75rem !important;
        font-weight: 600 !important;
        transition: all 0.2s !important;
      }
      #${targetId} .jupiter-terminal-button:hover {
        background: #2563EB !important;
        transform: translateY(-1px) !important;
      }
      #${targetId} .jupiter-terminal-button:active {
        transform: translateY(0) !important;
      }
      #${targetId} .jupiter-terminal-swap-button {
        background: #3B82F6 !important;
        border-radius: 0.75rem !important;
        font-weight: 600 !important;
        transition: all 0.2s !important;
      }
      #${targetId} .jupiter-terminal-swap-button:hover {
        background: #2563EB !important;
        transform: translateY(-1px) !important;
      }
      #${targetId} .jupiter-terminal-swap-button:active {
        transform: translateY(0) !important;
      }
      #${targetId} .jupiter-terminal-token-list {
        background: #3f3f46 !important;
        border: 1px solid #52525b !important;
        border-radius: 1rem !important;
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1) !important;
      }
      #${targetId} .jupiter-terminal-token-list-item {
        border-bottom: 1px solid #52525b !important;
        padding: 0.75rem 1rem !important;
        color: #ffffff !important;
      }
      #${targetId} .jupiter-terminal-token-list-item:hover {
        background: #52525b !important;
      }
      #${targetId} .jupiter-terminal-token-list-item:last-child {
        border-bottom: none !important;
      }
    `;
    document.head.appendChild(style);

    // 加载 Jupiter Terminal 脚本
    const script = document.createElement('script');
    script.src = "https://terminal.jup.ag/main-v1.js";
    script.setAttribute('data-preload', '');
    
    script.onload = () => {
      scriptLoaded.current = true;
      // 脚本加载完成后初始化
      initializeJupiter();
    };

    document.head.appendChild(script);

    return () => {
      // 清理
      if (script.parentNode) {
        document.head.removeChild(script);
      }
      if (style.parentNode) {
        document.head.removeChild(style);
      }
    };
  }, []);

  const initializeJupiter = () => {
    // 确保目标元素存在
    let targetElement = document.getElementById(targetId);
    if (!targetElement) {
      targetElement = document.createElement('div');
      targetElement.id = targetId;
      document.body.appendChild(targetElement);
    }

    // 初始化 Jupiter Terminal
    window.Jupiter.init({
      displayMode: "integrated",
      integratedTargetId: targetId,
      endpoint: endpoint,
      theme: {
        background: '#27272a',
        primary: '#3B82F6',
        secondary: '#6B7280',
        accent: '#10B981',
        error: '#EF4444',
        success: '#10B981',
        warning: '#F59E0B',
        text: {
          primary: '#ffffff',
          secondary: '#9CA3AF',
        }
      }
    });
  };

  // 当 endpoint 改变时重新初始化
  useEffect(() => {
    if (scriptLoaded.current) {
      initializeJupiter();
    }
  }, [endpoint]);

  return (
    <div className={`rounded-xl text-card-foreground max-w-[450px] p-0 sm:p-2 my-2 ml-11 bg-zinc-800 border border-gray-600 shadow-sm hover:shadow-md transition-shadow duration-200 ${className}`}>
      <div id={targetId} className="w-full"></div>
    </div>
  );
} 