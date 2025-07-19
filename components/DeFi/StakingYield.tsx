import React, { useState } from 'react';
import { FaChartLine } from 'react-icons/fa';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

interface StakingProtocol {
  name: string;
  symbol: string;
  apy: number;
  logo: string;
}

interface StakingQuote {
  protocols: StakingProtocol[];
  amount: number;
}

interface StakingYieldProps {
  quote?: StakingQuote;
  responseData?: {
    success: boolean;
    message: string;
    data?: {
      intent: string;
      entities: any;
      missingInfo: any;
      response: string;
    };
    thoughts?: string[];
    quote?: StakingQuote;
  };
  onProtocolSelect?: (protocol: StakingProtocol) => void;
  className?: string;
  onSendMessage?: (message: string) => void; // 新增：发送消息的回调
}

export default function StakingYield({
  quote,
  responseData,
  onProtocolSelect,
  className = '',
  onSendMessage
}: StakingYieldProps) {
  console.log("🌾 StakingYield component rendered!");
  console.log("StakingYield props:", { quote, responseData, onSendMessage });
  
  // Extract quote from responseData if available
  const actualQuote = quote || (responseData?.quote);
  const [isExpanded, setIsExpanded] = useState(true);

  if (!actualQuote || !actualQuote.protocols) {
    console.log("🌾 No quote or protocols found, returning null");
    return null;
  }

  // Sort protocols by APY (highest first)
  const sortedProtocols = [...actualQuote.protocols].sort((a, b) => b.apy - a.apy);

  console.log("🌾 Rendering StakingYield with protocols:", sortedProtocols);

  // 处理协议选择
  const handleProtocolSelect = (protocol: StakingProtocol) => {
    console.log('🌾 Protocol selected:', protocol);
    
    // 调用原有的回调
    onProtocolSelect?.(protocol);
    
    // 自动发送消息
    if (onSendMessage) {
      const message = `I want to stake 1 SOL using ${protocol.symbol} protocol`;
      console.log('🌾 Sending message:', message);
      onSendMessage(message);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={`overflow-hidden shadow-xl rounded-2xl mt-2 flex flex-col max-w-[480px] mb-3 w-full text-[#e0e0e6] bg-[#3f3f46] border border-[#52525b] hover:shadow-2xl transition-all duration-300 ${className}`}
      style={{ minWidth: 0 }}
    >
      {/* Header with Icon */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#27272a] border-b border-[#52525b]">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500/20">
            <FaChartLine className="w-3.5 h-3.5 text-green-400" />
          </div>
          <h3 className="text-sm font-medium text-[#e0e0e6]">Staking Agent</h3>
        </div>
      </div>
      
      <div className="p-4">
        {/* Expandable Section */}
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-sm font-medium text-[#a1a1aa] hover:text-[#e0e0e6] transition-colors"
          >
            <span>Fetched Best Liquid Staking Yields</span>
            <ChevronDownIcon 
              className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
            />
          </button>
          
          {/* Protocols Grid */}
          <div className={`mt-3 transition-all duration-300 ${isExpanded ? 'max-h-[500px] opacity-100 overflow-y-auto' : 'max-h-0 opacity-0 overflow-hidden'}`}>
            <div className="grid grid-cols-1 gap-3 pb-2">
              {sortedProtocols.map((protocol, index) => (
                <motion.div
                  key={`${protocol.symbol}-${index}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="bg-[#27272a] border border-[#52525b] rounded-lg p-3 hover:border-green-500/50 hover:bg-[#3f3f46] transition-all duration-200 cursor-pointer group"
                  onClick={() => handleProtocolSelect(protocol)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-[#3f3f46] flex items-center justify-center border border-[#52525b]">
                      <img 
                        src={protocol.logo} 
                        alt={protocol.name}
                        className="w-6 h-6 object-contain"
                        onError={(e) => {
                          console.log('Failed to load protocol logo:', protocol.logo);
                          e.currentTarget.src = 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png';
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#e0e0e6] truncate group-hover:text-green-400 transition-colors">
                        {protocol.name}
                      </p>
                      <p className="text-xs text-[#a1a1aa] truncate">
                        {protocol.symbol}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-400">
                        {protocol.apy.toFixed(2)}%
                      </p>
                      <p className="text-xs text-[#a1a1aa]">APY</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Description - moved to bottom with proper spacing */}
      <div className="px-4 pb-4 pt-2 border-t border-[#52525b] bg-[#27272a]">
        <div className="text-xs text-[#a1a1aa] text-center">
          Select a protocol above to start staking your SOL
        </div>
      </div>
    </motion.div>
  );
} 