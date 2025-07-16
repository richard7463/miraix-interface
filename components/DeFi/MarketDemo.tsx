import React from 'react';
import Market from './Market';

export default function MarketDemo() {
  // 模拟API返回的数据结构
  const mockResponseData = {
    success: true,
    message: "Here is the current market trend data:",
    data: {
      success: true,
      message: "Here is the current market trend data:",
      data: {
        trendingTokens: [
          {
            rank: 1,
            name: "Defispot",
            symbol: "SPOT",
            price: "$0.000114",
            priceChange24h: "+935023692602.52%",
            platform: "Ethereum"
          },
          {
            rank: 2,
            name: "GAMA Coin",
            symbol: "GAMA",
            price: "$0.726",
            priceChange24h: "+7564660.70%",
            platform: "XDC Network"
          },
          {
            rank: 3,
            name: "Fuzion",
            symbol: "FUZN",
            price: "$23.19",
            priceChange24h: "+235076.52%",
            platform: "Kujira"
          },
          {
            rank: 4,
            name: "Black Phoenix",
            symbol: "BPX",
            price: "$2.62",
            priceChange24h: "+3072.07%",
            platform: "BNB Smart Chain"
          },
          {
            rank: 5,
            name: "BOME GROK",
            symbol: "GROK",
            price: "$0.000076",
            priceChange24h: "+2319.66%",
            platform: "BNB Smart Chain"
          }
        ],
        topProtocols: [
          {
            rank: 1,
            name: "Binance CEX",
            tvl: "$167.56B",
            category: "CEX",
            description: "Binance is a cryptocurrency exchange which is the largest exchange in the world in terms of daily trading volume of cryptocurrencies"
          },
          {
            rank: 2,
            name: "AAVE V3",
            tvl: "$28.50B",
            category: "Lending",
            description: "Earn interest, borrow assets, and build applications"
          },
          {
            rank: 3,
            name: "Lido",
            tvl: "$27.00B",
            category: "Liquid Staking",
            description: "Liquid staking for Ethereum and Polygon. Daily staking rewards, no lock ups."
          },
          {
            rank: 4,
            name: "OKX",
            tvl: "$26.93B",
            category: "CEX",
            description: "OKX, formerly known as OKEx, is a Seychelles-based cryptocurrency exchange and derivatives exchange"
          },
          {
            rank: 5,
            name: "Bitfinex",
            tvl: "$26.02B",
            category: "CEX",
            description: "Bitfinex facilitates a graphical trading experience with advanced charting functionality"
          }
        ],
        topDEXs: [
          {
            rank: 1,
            name: "PancakeSwap AMM",
            volume24h: "$2.48B",
            volume7d: "$27.98B",
            volume30d: "$92.62B"
          },
          {
            rank: 2,
            name: "PancakeSwap AMM V3",
            volume24h: "$2.04B",
            volume7d: "$13.42B",
            volume30d: "$73.65B"
          },
          {
            rank: 3,
            name: "Uniswap V3",
            volume24h: "$2.08B",
            volume7d: "$8.15B",
            volume30d: "$49.72B"
          },
          {
            rank: 4,
            name: "Uniswap V4",
            volume24h: "$1.16B",
            volume7d: "$4.03B",
            volume30d: "$16.08B"
          },
          {
            rank: 5,
            name: "Fluid DEX",
            volume24h: "$765.31M",
            volume7d: "$2.68B",
            volume30d: "$9.25B"
          }
        ],
        topPools: [
          {
            rank: 1,
            name: "BONK-WETH",
            protocol: "uniswap-v3",
            tvl: "$183.55K",
            apy1d: "+354.29%",
            apy7d: "+313.63%",
            apy30d: "+481.97%",
            riskLevel: "High"
          },
          {
            rank: 2,
            name: "SKL-WETH",
            protocol: "uniswap-v3",
            tvl: "$331.05K",
            apy1d: "+277.11%",
            apy7d: "+285.49%",
            apy30d: "+279.51%",
            riskLevel: "High"
          },
          {
            rank: 3,
            name: "UPYFI",
            protocol: "yearn-finance",
            tvl: "$235.70K",
            apy1d: "+210.14%",
            apy7d: "-51.75%",
            apy30d: "-32.18%",
            riskLevel: "Low"
          },
          {
            rank: 4,
            name: "SDYFI",
            protocol: "yearn-finance",
            tvl: "$539.38K",
            apy1d: "+141.38%",
            apy7d: "-17.24%",
            apy30d: "-145.47%",
            riskLevel: "Low"
          },
          {
            rank: 5,
            name: "DYFIETH-F",
            protocol: "yearn-finance",
            tvl: "$1.33M",
            apy1d: "+140.88%",
            apy7d: "-18.50%",
            apy30d: "-156.48%",
            riskLevel: "High"
          }
        ],
        topChains: [
          {
            rank: 1,
            name: "Ethereum",
            tvl: "$72,298,444,311.52"
          },
          {
            rank: 2,
            name: "Solana",
            tvl: "$9,276,759,562.11"
          },
          {
            rank: 3,
            name: "Bitcoin",
            tvl: "$6,876,296,651.75"
          },
          {
            rank: 4,
            name: "BSC (Binance Smart Chain)",
            tvl: "$6,306,226,909.61"
          },
          {
            rank: 5,
            name: "Tron",
            tvl: "$5,298,880,622.26"
          }
        ]
      },
      summary: "These data show the latest trends and hot projects in the cryptocurrency market. Please note that high yields often come with high risks, so please do thorough research before investing."
    },
    thoughts: [
      "Fetching market trend data...",
      "Analyzing popular tokens and protocols...",
      "Fetching DEX trading volume data...",
      "Calculating yields and risk indicators..."
    ],
    quote: {}
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          DeFi Market Dashboard
        </h1>
        <Market responseData={mockResponseData} />
      </div>
    </div>
  );
} 