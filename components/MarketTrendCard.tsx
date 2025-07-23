import React from 'react';

interface MarketTrendCardProps {
  data: {
    totalMarketCap?: number;
    btcDominance?: number;
    volume24h?: number;
    [key: string]: any;
  };
}

const MarketTrendCard: React.FC<MarketTrendCardProps> = ({ data }) => {
  return (
    <div className="bg-zinc-800 rounded-xl p-4 shadow-md flex flex-col gap-2 w-full max-w-md mx-auto">
      <h2 className="text-lg font-bold text-white mb-2">Market Overview</h2>
      <div className="flex flex-col gap-1 text-zinc-200 text-sm">
        <div>Total Market Cap: <span className="font-semibold">{data.totalMarketCap ? `$${data.totalMarketCap.toLocaleString()}` : '--'}</span></div>
        <div>BTC Dominance: <span className="font-semibold">{data.btcDominance ? `${data.btcDominance}%` : '--'}</span></div>
        <div>24h Volume: <span className="font-semibold">{data.volume24h ? `$${data.volume24h.toLocaleString()}` : '--'}</span></div>
      </div>
    </div>
  );
};

export default MarketTrendCard; 