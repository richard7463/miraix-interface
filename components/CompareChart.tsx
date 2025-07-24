import React from 'react';
import ReactECharts from 'echarts-for-react';

interface CompareChartProps {
  data: {
    labels: string[];
    series: { name: string; data: number[] }[];
  };
}

const CompareChart: React.FC<CompareChartProps> = ({ data }) => {
  const option = {
    title: {
      text: 'BTC vs ETH Volatility (7 Days)',
      left: 'center',
      textStyle: { color: '#fff', fontWeight: 'bold', fontSize: 18 }
    },
    tooltip: { trigger: 'axis' },
    legend: {
      data: data.series.map(s => s.name),
      top: 30,
      textStyle: { color: '#fff' }
    },
    grid: { left: 40, right: 20, bottom: 40, top: 70 },
    xAxis: {
      type: 'category',
      data: data.labels,
      axisLine: { lineStyle: { color: '#888' } },
      axisLabel: { color: '#ccc' }
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#888' } },
      axisLabel: { color: '#ccc' },
      splitLine: { lineStyle: { color: '#333' } }
    },
    series: data.series.map(s => ({
      name: s.name,
      type: 'line',
      data: s.data,
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      lineStyle: { width: 3 },
      emphasis: { focus: 'series' },
      itemStyle: { borderWidth: 2 }
    })),
    backgroundColor: 'transparent',
  };

  return (
    <div className="bg-zinc-800 rounded-xl p-4 shadow-md w-full max-w-2xl mx-auto">
      <ReactECharts option={option} style={{ height: 360, width: '100%' }} />
    </div>
  );
};

export default CompareChart; 