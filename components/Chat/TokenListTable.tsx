import React from 'react';

function formatNumber(num: number | null | undefined, digits = 2) {
  if (num == null) return '-';
  if (num >= 1e12) return (num / 1e12).toFixed(digits) + 'T';
  if (num >= 1e9) return (num / 1e9).toFixed(digits) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(digits) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(digits) + 'K';
  return num.toString();
}

function getAge(ath_date: string, atl_date: string) {
  // 取最早的日期
  const date = new Date(ath_date && atl_date ? (new Date(ath_date) < new Date(atl_date) ? ath_date : atl_date) : ath_date || atl_date);
  const now = new Date();
  let years = now.getFullYear() - date.getFullYear();
  let months = now.getMonth() - date.getMonth();
  if (months < 0) {
    years--;
    months += 12;
  }
  return `${years}y ${months}mon`;
}

export default function TokenListTable({ data }: { data: any[] }) {
  return (
    <div className="space-y-2">
      <div className="rounded-xl border text-card-foreground bg-background/50 backdrop-blur-xs shadow-none">
        <div className="flex flex-col space-y-1.5 p-6">
          <h3 className="font-semibold leading-none tracking-tight">Trending Tokens</h3>
        </div>
        <div className="overflow-x-auto overflow-y-auto scrollbar-none p-0">
          <table className="text-sm w-full border-collapse text-gray-900 dark:text-gray-100">
            <thead className="sticky top-0 bg-white dark:bg-gray-800 z-10">
              <tr className="text-gray-500 border-gray-300 border-b-1">
                <th className="py-2 text-start pl-2">Name</th>
                <th className="py-2 text-end">Age</th>
                <th className="py-2 text-end">MC</th>
                <th className="py-2 text-end">24h Vol</th>
                <th className="py-2 text-end">Total Supply</th>
                <th className="py-2 text-end px-2">Price</th>
              </tr>
            </thead>
            <tbody>
              {data.map((token, idx) => (
                <tr key={token.id || idx} className="border-gray-300 border-b-1 hover:bg-gray-100 dark:hover:bg-gray-900 last:border-b-0">
                  <td className="p-2 font-bold flex items-center gap-2">
                    <img src={token.image} alt={token.symbol} className="w-6 h-6 rounded-full" />
                    {token.name}
                  </td>
                  <td className="text-end py-2">{getAge(token.ath_date, token.atl_date)}</td>
                  <td className="text-end py-2 font-bold text-[#0AB380]">{formatNumber(token.market_cap)}</td>
                  <td className="text-end py-2 font-bold text-[#0AB380]">{formatNumber(token.total_volume)}</td>
                  <td className="text-end py-2">{formatNumber(token.total_supply)}</td>
                  <td className="text-end p-2">{token.current_price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 