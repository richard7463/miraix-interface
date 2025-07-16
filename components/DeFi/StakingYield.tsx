import React, { useState } from 'react';
import { FaChartLine } from 'react-icons/fa';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

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
    <div className={`w-full max-w-full overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <FaChartLine className="w-4 h-4 text-blue-600" />
        <h3 className="text-lg font-bold text-gray-900">Staking Agent</h3>
      </div>
      
      {/* Expandable Section */}
      <div className="mb-4">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
        >
          <span>Fetched Best Liquid Staking Yields</span>
          <ChevronDownIcon 
            className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
          />
        </button>
        
        {/* Protocols Grid */}
        <div className={`mt-3 transition-all duration-300 ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {sortedProtocols.map((protocol, index) => (
              <div
                key={`${protocol.symbol}-${index}`}
                className="bg-white border border-gray-200 rounded-lg p-3 hover:border-blue-500 hover:shadow-md transition-all duration-200 cursor-pointer"
                onClick={() => handleProtocolSelect(protocol)}
              >
                <div className="flex items-center gap-3">
                  <img 
                    src={protocol.logo} 
                    alt={protocol.name}
                    className="w-8 h-8 rounded-full"
                    onError={(e) => {
                      console.log('Failed to load protocol logo:', protocol.logo);
                      e.currentTarget.src = 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png';
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {protocol.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {protocol.symbol}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-600">
                      {protocol.apy.toFixed(2)}%
                    </p>
                    <p className="text-xs text-gray-500">APY</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Description */}
    </div>
  );
} 