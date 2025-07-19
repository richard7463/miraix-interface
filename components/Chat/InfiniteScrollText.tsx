import React, { useState, useEffect } from 'react';

interface InfiniteScrollTextProps {
  setMessage?: (message: string) => void;
}

const InfiniteScrollText: React.FC<InfiniteScrollTextProps> = ({ setMessage }) => {
  const [isHovered, setIsHovered] = useState(false);

  // 三行不同的文字内容
  const textRows = [
    [
      { text: "List the top 10 tokens by 24h volume.", icon: "https://pub-19fe115140224519b796b1bbd6bccda7.r2.dev/Token%20Analytics%20Agent.jpg" },
      { text: "Which crypto currently show the strongest investment potential?", icon: "https://pub-19fe115140224519b796b1bbd6bccda7.r2.dev/Crypto%20Opportunity%20Scout.jpg" },
      { text: "What are the top trending DeFi pools tokens?", icon: "https://pub-19fe115140224519b796b1bbd6bccda7.r2.dev/Meme%20Coin%20Radar.jpg" },
      { text: "Identify today's most trending cryptocurrency tokens", icon: "https://pub-19fe115140224519b796b1bbd6bccda7.r2.dev/Crypto%20Opportunity%20Scout.jpg" },
    ],
    [
      { text: "Show meme coins with recent large purchases.", icon: "https://pub-19fe115140224519b796b1bbd6bccda7.r2.dev/Meme%20Coin%20Radar.jpg" },
      { text: "Identify crypto investment sentiment shifts.", icon: "https://pub-19fe115140224519b796b1bbd6bccda7.r2.dev/Market%20Sentiment%20Radar.jpg" },
      { text: "Current cryptocurrency market trends", icon: "https://pub-19fe115140224519b796b1bbd6bccda7.r2.dev/Crypto%20Opportunity%20Scout.jpg" },
      { text: "Identify extreme fear moments in crypto market for the last 7 days.", icon: "https://pub-19fe115140224519b796b1bbd6bccda7.r2.dev/Market%20Sentiment%20Radar.jpg" },
    ],
    [
      { text: "Compare BTC and ETH price volatility over the past 7 days.", icon: "https://pub-19fe115140224519b796b1bbd6bccda7.r2.dev/Token%20Analytics%20Agent.jpg" },
      { text: "Filter tokens with 100M–1B market cap and >10% 24h gain. (X not stable)", icon: "https://pub-19fe115140224519b796b1bbd6bccda7.r2.dev/Token%20Analytics%20Agent.jpg" },
      { text: "Recommend 10 meme coins.", icon: "https://pub-19fe115140224519b796b1bbd6bccda7.r2.dev/Meme%20Coin%20Radar.jpg" },
      { text: "Give me the top 10 market cap cryptos.", icon: "https://pub-19fe115140224519b796b1bbd6bccda7.r2.dev/Token%20Analytics%20Agent.jpg" },
    ]
  ];

  // 处理文字点击
  const handleTextClick = (text: string) => {
    if (setMessage) {
      setMessage(text);
    }
  };

  // 渲染单行文字
  const renderTextRow = (rowIndex: number) => {
    const texts = textRows[rowIndex];
    const duplicatedTexts = [...texts, ...texts, ...texts, ...texts];

    return (
      <div 
        key={rowIndex}
        className="relative overflow-hidden whitespace-nowrap"
        style={{ 
          scrollbarWidth: 'none',
          transform: 'translate3d(0px, 0px, 0px)',
          backfaceVisibility: 'hidden',
          perspective: '1000px'
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="absolute right-0 top-0 w-16 md:w-32 h-full bg-gradient-to-r from-transparent via-zinc-800/80 to-zinc-800 z-10 pointer-events-none"></div>
        
        <div 
          className={`flex space-x-2 md:space-x-4 ${isHovered ? 'scroll-pause' : 'scroll-resume'}`}
          style={{
            display: 'inline-flex',
            whiteSpace: 'nowrap',
            pointerEvents: 'auto',
            minWidth: '400%',
            animation: `scrollLeft${rowIndex} 30s linear infinite`
          }}
        >
          {duplicatedTexts.map((item, index) => (
            <div
              key={`${rowIndex}-${index}`}
              className="shrink-0 flex items-center rounded-lg px-2 py-1 md:px-3 md:py-2 text-xs md:text-sm bg-white/5 border border-zinc-600/30 shadow-[0_-2px_4px_rgba(0,0,0,0.05)] hover:cursor-pointer hover:bg-white/15 hover:border-zinc-500/50 hover:shadow-[0_-4px_8px_rgba(0,0,0,0.1)] hover:scale-105 transition-all duration-200 ease-in-out group"
              style={{ minWidth: 'max-content' }}
              onClick={() => handleTextClick(item.text)}
            >
              <img 
                alt="icon" 
                className="w-3 h-3 md:w-4 md:h-4 rounded-full object-cover transition-transform duration-200 group-hover:scale-110" 
                src={item.icon}
              />
              <span className="ml-1 md:ml-2 text-zinc-300 hover:text-white transition-all duration-200 ease-in-out text-xs md:text-sm font-medium">
                {item.text}
              </span>
            </div>
          ))}
        </div>
        
        <div className="absolute -left-1 top-0 w-16 md:w-32 h-full bg-gradient-to-l from-transparent via-zinc-800/80 to-zinc-800 z-10 pointer-events-none"></div>
      </div>
    );
  };

  // 注入CSS动画
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const style = document.createElement('style');
      style.textContent = `
        @keyframes scrollLeft0 {
          0% { transform: translateX(0); }
          100% { transform: translateX(-25%); }
        }
        @keyframes scrollLeft1 {
          0% { transform: translateX(-8.33%); }
          100% { transform: translateX(-33.33%); }
        }
        @keyframes scrollLeft2 {
          0% { transform: translateX(-16.66%); }
          100% { transform: translateX(-41.66%); }
        }
        
        /* 添加暂停动画的过渡效果 */
        .scroll-pause {
          animation-play-state: paused !important;
          transition: all 0.3s ease-in-out;
        }
        
        .scroll-resume {
          animation-play-state: running !important;
          transition: all 0.3s ease-in-out;
        }
      `;
      document.head.appendChild(style);
      
      return () => {
        document.head.removeChild(style);
      };
    }
  }, []);

  return (
    <div className="w-full">
      <div className="space-y-1 md:space-y-2">
        {textRows.map((_, index) => renderTextRow(index))}
      </div>
    </div>
  );
};

export default InfiniteScrollText;
