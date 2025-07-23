import React from 'react';

interface CompareChartProps {
  data: {
    labels: string[];
    series: { name: string; data: number[] }[];
  };
}

const CompareChart: React.FC<CompareChartProps> = ({ data }) => {
  // Only static structure here, you can integrate chart library like ECharts/Chart.js
  return (
    <div className="bg-zinc-800 rounded-xl p-4 shadow-md w-full max-w-2xl mx-auto">
      <h2 className="text-lg font-bold text-white mb-2">Comparison Chart</h2>
      <div className="text-zinc-300 text-sm mb-2">(You can integrate ECharts/Chart.js here)</div>
      <pre className="bg-zinc-900 rounded p-2 text-xs text-zinc-400 overflow-x-auto">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
};

export default CompareChart; 