import React from 'react';
import ReactECharts from 'echarts-for-react';

interface MarketTrendCardProps {
  data: {
    totalMarketCap?: number;
    btcDominance?: number;
    volume24h?: number;
    [key: string]: any;
  };
}

const MarketTrendCard: React.FC<MarketTrendCardProps> = ({ data }) => {
  const btc = data.btcDominance || 0;
  const others = 100 - btc;
  const option = {
    title: {
      text: 'BTC Dominance',
      left: 'center',
      top: '45%',
      textStyle: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
    },
    tooltip: { trigger: 'item', formatter: '{b}: {d}%' },
    legend: { show: false },
    series: [
      {
        name: 'BTC Dominance',
        type: 'pie',
        radius: ['60%', '80%'],
        avoidLabelOverlap: false,
        label: { show: false },
        emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold' } },
        data: [
          { value: btc, name: 'BTC', itemStyle: { color: '#f7931a' } },
          { value: others, name: 'Others', itemStyle: { color: '#3b82f6' } }
        ]
      }
    ],
    backgroundColor: 'transparent',
  };

  return (
    <div className="bg-gradient-to-br from-zinc-800 via-zinc-900 to-zinc-800 rounded-2xl p-6 shadow-lg flex flex-col gap-4 w-full max-w-md mx-auto border border-zinc-700">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white mb-2">Market Overview</h2>
          <div className="flex flex-col gap-1 text-zinc-200 text-base">
            <div>Total Market Cap: <span className="font-semibold">{data.totalMarketCap ? `$${data.totalMarketCap.toLocaleString()}` : '--'}</span></div>
            <div>24h Volume: <span className="font-semibold">{data.volume24h ? `$${data.volume24h.toLocaleString()}` : '--'}</span></div>
          </div>
        </div>
        <div className="w-40 h-40 mx-auto md:mx-0">
          <ReactECharts option={option} style={{ height: 160, width: 160 }} />
        </div>
      </div>
    </div>
  );
};

export default MarketTrendCard; 