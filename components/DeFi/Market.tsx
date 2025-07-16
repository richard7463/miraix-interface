import React, { useState } from 'react';
import { FaChartLine, FaCoins, FaExchangeAlt, FaLayerGroup, FaNetworkWired } from 'react-icons/fa';
import { ChevronDownIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';

interface TrendingToken {
  rank: number;
  name: string;
  symbol: string;
  price: string;
  priceChange24h: string;
  platform: string;
}

interface TopProtocol {
  rank: number;
  name: string;
  tvl: string;
  category: string;
  description: string;
}

interface TopDEX {
  rank: number;
  name: string;
  volume24h: string;
  volume7d: string;
  volume30d: string;
}

interface TopPool {
  rank: number;
  name: string;
  protocol: string;
  tvl: string;
  apy1d: string;
  apy7d: string;
  apy30d: string;
  riskLevel: string;
}

interface TopChain {
  rank: number;
  name: string;
  tvl: string;
}

interface MarketData {
  trendingTokens: TrendingToken[];
  topProtocols: TopProtocol[];
  topDEXs: TopDEX[];
  topPools: TopPool[];
  topChains: TopChain[];
}

interface MarketProps {
  responseData?: {
    success: boolean;
    message: string;
    data?: {
      success: boolean;
      message: string;
      data?: MarketData;
      summary?: string;
    };
    thoughts?: string[];
    quote?: any;
  };
  className?: string;
}

export default function Market({
  responseData,
  className = ''
}: MarketProps) {
  console.log("📊 Market component rendered!");
  console.log("Market props:", { responseData });
  
  const [expandedSections, setExpandedSections] = useState({
    trending: true,
    protocols: false,
    dex: false,
    pools: false,
    chains: false
  });

  // 检查是否是trending相关的数据
  const isTrendingData = responseData?.message?.includes('趋势') || 
                        responseData?.data?.message?.includes('趋势') ||
                        responseData?.message?.includes('trend') ||
                        responseData?.data?.message?.includes('trend') ||
                        responseData?.data?.data?.trendingTokens ||
                        (responseData?.success === true && responseData?.data?.data?.trendingTokens);

  if (!isTrendingData) {
    console.log("📊 No trending data found, returning null");
    return null;
  }

  // 获取市场数据
  const marketData = responseData?.data?.data || {} as MarketData;
  const summary = responseData?.data?.summary;

  console.log("📊 Market data loaded:", marketData);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel.toLowerCase()) {
      case 'high': return 'text-red-500 bg-red-50';
      case 'medium': return 'text-yellow-500 bg-yellow-50';
      case 'low': return 'text-green-500 bg-green-50';
      default: return 'text-gray-500 bg-gray-50';
    }
  };

  const formatNumber = (value: string) => {
    const num = parseFloat(value.replace(/[$,]/g, ''));
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return value;
  };

  return (
    <div className={`w-full max-w-full space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
          <FaChartLine className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Market Overview</h3>
          <p className="text-sm text-gray-600">Real-time market data and trend analysis</p>
        </div>
      </div>
      
      {/* Trending Tokens */}
      {marketData.trendingTokens && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <button
            onClick={() => toggleSection('trending')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <FaCoins className="w-5 h-5 text-yellow-500" />
              <span className="font-semibold text-gray-900">Trending Tokens</span>
              <span className="text-sm text-gray-500">({marketData.trendingTokens.length})</span>
            </div>
          <ChevronDownIcon 
              className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${expandedSections.trending ? 'rotate-180' : ''}`}
          />
        </button>
        
          {expandedSections.trending && (
            <div className="px-6 pb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {marketData.trendingTokens.map((token: any) => {
                  const isPositive = token.priceChange24h?.includes('+');
                  const changeColor = isPositive ? 'text-green-600' : 'text-red-600';
                  const bgColor = isPositive ? 'bg-green-50' : 'bg-red-50';
              
              return (
                    <div key={token.rank} className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {token.rank}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{token.name}</h4>
                            <p className="text-sm text-gray-500">{token.symbol}</p>
                          </div>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${bgColor} ${changeColor}`}>
                          {isPositive ? <ArrowTrendingUpIcon className="w-3 h-3 inline mr-1" /> : <ArrowTrendingDownIcon className="w-3 h-3 inline mr-1" />}
                          {token.priceChange24h}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Price:</span>
                          <span className="font-semibold text-gray-900">{token.price}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Platform:</span>
                          <span className="text-sm text-gray-700">{token.platform}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Top Protocols */}
      {marketData.topProtocols && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <button
            onClick={() => toggleSection('protocols')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <FaLayerGroup className="w-5 h-5 text-blue-500" />
              <span className="font-semibold text-gray-900">Top Protocols</span>
              <span className="text-sm text-gray-500">({marketData.topProtocols.length})</span>
            </div>
            <ChevronDownIcon 
              className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${expandedSections.protocols ? 'rotate-180' : ''}`}
            />
          </button>
          
          {expandedSections.protocols && (
            <div className="px-6 pb-6">
              <div className="space-y-4">
                {marketData.topProtocols.map((protocol: any) => (
                  <div key={protocol.rank} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:shadow-md transition-shadow">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                      {protocol.rank}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900">{protocol.name}</h4>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">{protocol.category}</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{protocol.description}</p>
                      <div className="text-lg font-bold text-gray-900">{protocol.tvl}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Top DEXs */}
      {marketData.topDEXs && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <button
            onClick={() => toggleSection('dex')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <FaExchangeAlt className="w-5 h-5 text-green-500" />
              <span className="font-semibold text-gray-900">Top DEXs</span>
              <span className="text-sm text-gray-500">({marketData.topDEXs.length})</span>
            </div>
            <ChevronDownIcon 
              className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${expandedSections.dex ? 'rotate-180' : ''}`}
            />
          </button>
          
          {expandedSections.dex && (
            <div className="px-6 pb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {marketData.topDEXs.map((dex: any) => (
                  <div key={dex.rank} className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {dex.rank}
                      </div>
                      <h4 className="font-semibold text-gray-900">{dex.name}</h4>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">24h Volume:</span>
                        <span className="font-semibold text-gray-900">{dex.volume24h}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">7d Volume:</span>
                        <span className="text-sm text-gray-700">{dex.volume7d}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">30d Volume:</span>
                        <span className="text-sm text-gray-700">{dex.volume30d}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Top Pools */}
      {marketData.topPools && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <button
            onClick={() => toggleSection('pools')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <FaChartLine className="w-5 h-5 text-purple-500" />
              <span className="font-semibold text-gray-900">High Yield Pools</span>
              <span className="text-sm text-gray-500">({marketData.topPools.length})</span>
            </div>
            <ChevronDownIcon 
              className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${expandedSections.pools ? 'rotate-180' : ''}`}
            />
          </button>
          
          {expandedSections.pools && (
            <div className="px-6 pb-6">
              <div className="space-y-4">
                {marketData.topPools.map((pool: any) => (
                  <div key={pool.rank} className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {pool.rank}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{pool.name}</h4>
                          <p className="text-sm text-gray-500">{pool.protocol}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRiskColor(pool.riskLevel)}`}>
                        {pool.riskLevel} Risk
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">TVL</p>
                        <p className="font-semibold text-gray-900">{pool.tvl}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">1d APY</p>
                        <p className={`font-semibold ${pool.apy1d?.includes('+') ? 'text-green-600' : 'text-red-600'}`}>
                          {pool.apy1d}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">7d APY</p>
                        <p className={`font-semibold ${pool.apy7d?.includes('+') ? 'text-green-600' : 'text-red-600'}`}>
                          {pool.apy7d}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">30d APY</p>
                        <p className={`font-semibold ${pool.apy30d?.includes('+') ? 'text-green-600' : 'text-red-600'}`}>
                          {pool.apy30d}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Top Chains */}
      {marketData.topChains && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <button
            onClick={() => toggleSection('chains')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <FaNetworkWired className="w-5 h-5 text-indigo-500" />
              <span className="font-semibold text-gray-900">Top Chains</span>
              <span className="text-sm text-gray-500">({marketData.topChains.length})</span>
            </div>
            <ChevronDownIcon 
              className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${expandedSections.chains ? 'rotate-180' : ''}`}
            />
          </button>
          
          {expandedSections.chains && (
            <div className="px-6 pb-6">
              <div className="space-y-4">
                {marketData.topChains.map((chain: any) => (
                  <div key={chain.rank} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                        {chain.rank}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{chain.name}</h4>
                        <p className="text-2xl font-bold text-gray-900">{formatNumber(chain.tvl)}</p>
                      </div>
                    </div>
                    <div className="w-16 h-16 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
                      <FaNetworkWired className="w-6 h-6 text-indigo-600" />
                    </div>
                  </div>
                ))}
                  </div>
          </div>
          )}
        </div>
      )}
      
      {/* Summary */}
      {summary && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
          <h4 className="font-semibold text-gray-900 mb-2">Market Summary</h4>
          <p className="text-gray-700 leading-relaxed">{summary}</p>
      </div>
      )}
    </div>
  );
} 