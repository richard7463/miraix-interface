import React from 'react';

interface SentimentChartProps {
  data: {
    value: number;
    label?: string;
    history?: { date: string; value: number }[];
  };
}

const SentimentChart: React.FC<SentimentChartProps> = ({ data }) => {
  return (
    <div className="bg-zinc-800 rounded-xl p-4 shadow-md w-full max-w-md mx-auto flex flex-col items-center">
      <h2 className="text-lg font-bold text-white mb-2">Sentiment Index</h2>
      <div className="text-4xl font-extrabold text-yellow-400 mb-1">{data.value}</div>
      <div className="text-zinc-300 mb-2">{data.label || 'Current Sentiment'}</div>
      {/* You can extend with a historical line chart, etc. */}
      {data.history && (
        <pre className="bg-zinc-900 rounded p-2 text-xs text-zinc-400 overflow-x-auto w-full mt-2">
          {JSON.stringify(data.history, null, 2)}
        </pre>
      )}
    </div>
  );
};

export default SentimentChart; 