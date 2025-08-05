'use client'

import React, { useState } from 'react'
import { useTheme } from '@/components/Themes'

interface MCPServer {
  id: string
  name: string
  description: string
  logo: string
  author?: string
  category: string
  status: 'active' | 'inactive'
  type: 'remote' | 'local'
}

const mockServers: MCPServer[] = [
  {
    id: '1',
    name: 'DefiLlama Stable Coin',
    description: 'Focused on stablecoin market data, this API provides real-time and historical mcap (market capitalization) summaries, chain-specific distributions, and price history. It supports listings of all tracked stablecoins with circulating supply metrics, chain-level mcap aggregation, and detailed historical breakdowns for individual stablecoins. Useful for stablecoin market analysis, liquidity monitoring across chains, and regulatory compliance studies, with charting capabilities for macro trends and asset-specific behavior.',
    logo: 'https://pro.llama.fi/pro.png',
    category: 'Blockchain',
    status: 'active',
    type: 'remote'
  },
  {
    id: '2',
    name: 'DefiLlama Coin',
    description: 'This API delivers blockchain asset pricing and foundational data, supporting real-time and historical price queries for tokens via contract addresses. It includes advanced pricing methodologies for exotic tokens, bridged assets, and LP tokens using valuation adapters. Features include batch historical pricing, time-series charts, percentage price changes, earliest price records, and blockchain block timestamp lookups. Ideal for cryptocurrency pricing infrastructure, cross-chain asset analysis, and liquidity assessment with confidence metrics for unverified prices.',
    logo: 'https://pro.llama.fi/pro.png',
    category: 'Blockchain',
    status: 'active',
    type: 'remote'
  },
  {
    id: '3',
    name: 'DefiLlama Field',
    description: 'This API specializes in DeFi yield data, offering APY (Annual Percentage Yield) metrics and liquidity insights for yield-generating pools. It includes real-time pool data with predictive analytics, historical APY/TVL trends for specific pools, and enriched metadata for yield strategies. Tailored for yield optimization, liquidity mining analysis, and investment decision-making, it provides actionable insights into DeFi returns and risk-adjusted performance metrics.',
    logo: 'https://pro.llama.fi/pro.png',
    category: 'Blockchain',
    status: 'active',
    type: 'remote'
  },
  {
    id: '4',
    name: 'DefiLlama Main',
    description: 'This API provides comprehensive DeFi protocol data, including TVL (Total Value Locked) metrics, decentralized exchange (DEX) volumes, options trading activity, and fee/revenue analytics. It enables retrieval of historical and real-time TVL for protocols and chains, breakdowns by token and chain, simplified TVL endpoints, volume summaries for DEXs and options platforms, and fee/revenue trends. Designed for DeFi analytics, protocol performance tracking, and market research, it supports granular filtering by chain, timeframes, and data types like daily fees or revenue.',
    logo: 'https://pro.llama.fi/pro.png',
    category: 'Blockchain',
    status: 'active',
    type: 'remote'
  },
  {
    id: '5',
    name: 'Fastest Article',
    description: 'Search for similar posts by content for a specified handle',
    logo: 'https://fastest.ai/favicon.ico',
    category: 'Marketing Social Media',
    status: 'active',
    type: 'remote'
  },
  {
    id: '6',
    name: 'bnbchain-mcp',
    description: 'BNBChain MCP provides an extensive API suite for interacting with blockchain networks, enabling seamless integration of blockchain functionalities into your applications. This suite includes tools for managing blockchain data, interacting with smart contracts, and handling various token standards.',
    logo: 'https://avatars.githubusercontent.com/u/45615063?s=48&v=4',
    author: '@OmniMCP-AI',
    category: 'Blockchain',
    status: 'active',
    type: 'remote'
  },
  {
    id: '7',
    name: 'Chainbase Token',
    description: 'Token API provides a set of endpoints to interact with token-related data on the blockchain. It allows users to retrieve token metadata, historical transfers, and other token-related information.',
    logo: 'https://avatars.githubusercontent.com/u/96564783?s=200&v=4',
    category: 'Blockchain',
    status: 'active',
    type: 'remote'
  },
  {
    id: '8',
    name: 'Chainbase NFT',
    description: 'NFT API provides a set of endpoints to interact with non-fungible tokens (NFTs) on various blockchain networks. It allows users to retrieve information about NFTs, including their metadata, ownership details, and transaction history. The API supports multiple chains, enabling developers to build applications that leverage NFT data across different platforms.',
    logo: 'https://avatars.githubusercontent.com/u/96564783?s=200&v=4',
    category: 'Blockchain',
    status: 'active',
    type: 'remote'
  },
  {
    id: '9',
    name: 'Chainbase Domain',
    description: 'Chainbase Domain API provides a set of endpoints to interact with the Chainbase platform. It allows users to access various features and functionalities related to blockchain data and services.',
    logo: 'https://avatars.githubusercontent.com/u/96564783?s=200&v=4',
    category: 'Blockchain',
    status: 'active',
    type: 'remote'
  },
  {
    id: '10',
    name: 'Chainbase Basic',
    description: 'Chainbase provides a set of APIs to help developers build Web3 applications. This document describes the basic API endpoints.',
    logo: 'https://avatars.githubusercontent.com/u/96564783?s=200&v=4',
    category: 'Blockchain',
    status: 'active',
    type: 'remote'
  },
  {
    id: '11',
    name: 'ChainBase Balance',
    description: 'Chainbase Balance API offers a versatile API suite designed to manage and monitor blockchain assets across various networks. This set of tools provides seamless access to account balances, NFTs, portfolios, and token holdings, ensuring comprehensive asset management for developers and users.',
    logo: 'https://avatars.githubusercontent.com/u/96564783?s=200&v=4',
    category: 'Blockchain',
    status: 'active',
    type: 'remote'
  },
  {
    id: '12',
    name: 'Fastest Agent',
    description: 'It includes endpoints for creating, listing, running, and updating agents, as well as executing specific actions like streaming and tool interactions. The API also supports team management functionalities, such as creating, updating, listing, and planning team activities. Additionally, it provides specialized tools for actions like liking tweets, enabling comprehensive control and coordination of agents and teams to achieve various operational goals efficiently.',
    logo: 'https://fastest.ai/favicon.ico',
    category: 'AI Machine Learning',
    status: 'active',
    type: 'remote'
  },
  {
    id: '13',
    name: 'Fastest Code',
    description: 'It includes endpoints for checking the length of various data inputs, validating URLs to ensure they meet specific criteria, and verifying the length of text inputs. These tools are essential for ensuring data integrity and compliance with predefined standards, making them valuable for applications that require robust data validation and processing capabilities.',
    logo: 'https://fastest.ai/favicon.ico',
    category: 'Developer Tools Dev Ops',
    status: 'active',
    type: 'remote'
  },
  {
    id: '14',
    name: 'Fastest Trends',
    description: 'Get trends and popular topics for each platform and country',
    logo: 'https://fastest.ai/favicon.ico',
    category: 'Marketing Social Media',
    status: 'active',
    type: 'remote'
  },
  {
    id: '15',
    name: 'Fastest Private Data',
    description: 'This new OpenAPI specification focuses on managing private knowledge databases associated with GPT models. It includes endpoints for retrieving all knowledge data linked to a specific GPT model, adding new knowledge entries by specifying a GPT model ID, resource URL, and type, and directly adding data as a knowledge database file. The API facilitates efficient management and indexing of knowledge resources, providing unique identifiers for each added entry to ensure seamless integration and retrieval.',
    logo: 'https://fastest.ai/favicon.ico',
    category: 'AI Machine Learning',
    status: 'active',
    type: 'remote'
  },
  {
    id: '16',
    name: 'Fastest Data Parser',
    description: 'This OpenAPI specification includes endpoints for extracting structured data, crawling URLs, and managing airdrop crawlers.',
    logo: 'https://fastest.ai/favicon.ico',
    category: 'Developer Tools Dev Ops',
    status: 'active',
    type: 'remote'
  },
  {
    id: '17',
    name: 'Fastest Twitter',
    description: 'This API provides endpoints for interacting with Twitter data, including user information, tweet details, and search capabilities.',
    logo: 'https://fastest.ai/favicon.ico',
    category: 'Marketing Social Media',
    status: 'active',
    type: 'remote'
  },
  {
    id: '18',
    name: 'KolsAI Whitelabel',
    description: 'KolsAI provides real-time Key Opinion Leader (KOL) tracking and analytics, allowing partners to integrate AI-powered insights into their own platforms.',
    logo: 'https://kolsai.io/favicon.ico',
    category: 'Marketing Social Media',
    status: 'active',
    type: 'remote'
  },
  {
    id: '19',
    name: 'Base Chain',
    description: 'The Base Chain MCP server provides AI systems with seamless access to a comprehensive suite of tools for managing and analyzing blockchain data, including native coin holders, transaction history, token balances, and NFT collections. It facilitates in-depth exploration of blockchain addresses and block details, enhancing data-driven decision-making and blockchain interactions.',
    logo: 'http://base.blockscout.com/assets/favicon/favicon-16x16.png',
    category: 'Blockchain',
    status: 'active',
    type: 'remote'
  },
  {
    id: '20',
    name: 'CoinGecko',
    description: 'This MCP server empowers AI systems to leverage CoinGecko\'s extensive crypto database, offering seamless access to current and historical market data, price feeds, and metadata for over 17,000 coins across 1,000+ exchanges. It enhances analysis capabilities by integrating on-chain DEX data from 200+ blockchain networks, facilitating informed decision-making for Web3 projects, institutions, and developers.',
    logo: 'https://coingecko.com/favicon.ico',
    category: 'Blockchain',
    status: 'active',
    type: 'remote'
  }
]

const categories = [
  'Popular',
  'Blockchain',
  'Sales Customer Support',
  'Productivity Project Management',
  'Document File Management',
  'Scheduling Booking',
  'CRM',
  'Developer Tools Dev Ops',
  'Marketing Social Media',
  'Entertainment Media',
  'Collaboration Communication',
  'Design Creative Tools',
  'Analytics Data',
  'Education LMS',
  'AI Machine Learning',
  'Other Miscellaneous',
  'Finance Accounting',
  'Advertising Marketing',
  'Security Compliance',
  'E Commerce',
  'All'
]

export default function MCPServerPage() {
  const { theme } = useTheme()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Popular')
  const [currentPage, setCurrentPage] = useState(1)
  const [hoveredServer, setHoveredServer] = useState<string | null>(null)
  const serversPerPage = 20

  // Filter servers based on search query and category
  const filteredServers = mockServers.filter(server => {
    const matchesSearch = server.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         server.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || selectedCategory === 'Popular' || server.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Pagination
  const totalPages = Math.ceil(filteredServers.length / serversPerPage)
  const startIndex = (currentPage - 1) * serversPerPage
  const endIndex = startIndex + serversPerPage
  const currentServers = filteredServers.slice(startIndex, endIndex)

  return (
    <main className="overflow-y-auto relative bg-zinc-800" style={{ height: 'calc(100vh - 46px)' }}>
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#4C94E5] rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#4C94E5] rounded-full opacity-10 blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 relative pt-6">
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#4C94E5] to-[#3d7bc4] bg-clip-text text-transparent">
              Model Context Protocol
            </h1>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Extend your agent's capabilities with our curated collection of MCP servers. Each server brings unique functionality to enhance your AI experience.
            </p>
          </div>
          
          {/* 搜索栏 - 玻璃态效果 */}
          <div className="relative w-full max-w-3xl mx-auto mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-[#4C94E5]/20 to-[#3d7bc4]/20 rounded-lg blur-xl"></div>
            <div className="relative">
              <input
                placeholder="Search MCP Server"
                className="w-full px-6 py-4 rounded-lg pl-12 bg-gray-800/80 backdrop-blur-md text-gray-100 border border-gray-700/50 focus:outline-none focus:ring-2 focus:ring-[#4C94E5] focus:border-transparent transition-all duration-300"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <svg
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
          </div>

          {/* 分类过滤器 - 创新滚动设计 */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-zinc-800 to-transparent z-10"></div>
            <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-zinc-800 to-transparent z-10"></div>
            <div className="flex gap-4 py-4 overflow-x-auto scrollbar-hide px-8">
              {categories.map((category) => (
                <div
                  key={category}
                  className={`inline-flex items-center rounded-full border text-sm font-medium transition-all duration-300 cursor-pointer px-6 py-2 whitespace-nowrap ${
                    selectedCategory === category
                      ? 'bg-gradient-to-r from-[#4C94E5] to-[#3d7bc4] text-white shadow-lg scale-105'
                      : 'bg-gray-800/80 backdrop-blur-md text-gray-300 hover:bg-gray-700 border-gray-700/50'
                  }`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </div>
              ))}
            </div>
          </div>

          {/* 服务器网格 - 创新卡片设计 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {currentServers.map((server) => (
              <div
                key={server.id}
                className={`group relative bg-gray-800/80 backdrop-blur-md rounded-xl p-6 transition-all duration-300 border border-gray-700/50 hover:shadow-2xl hover:scale-[1.02] cursor-pointer ${
                  hoveredServer === server.id ? 'ring-2 ring-[#4C94E5]' : ''
                }`}
                onMouseEnter={() => setHoveredServer(server.id)}
                onMouseLeave={() => setHoveredServer(null)}
              >
                {/* 卡片装饰 */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#4C94E5]/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <div className="relative space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-[#4C94E5] to-[#3d7bc4] rounded-full blur-md opacity-50"></div>
                      <span className="relative flex shrink-0 overflow-hidden rounded-full w-12 h-12 bg-gray-700 border border-gray-600/50">
                        <img
                          className="aspect-square h-full w-full object-cover"
                          alt={`${server.name} logo`}
                          src={server.logo}
                        />
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-semibold text-[#4C94E5] truncate">
                        {server.name}
                      </h3>
                      {server.author && (
                        <div className="text-sm text-gray-400 truncate">
                          {server.author}
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-gray-300 line-clamp-4 text-sm leading-relaxed">
                    {server.description}
                  </p>

                  <div className="flex items-center justify-between pt-4">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-gradient-to-r from-[#4C94E5] to-[#3d7bc4]"></span>
                      <span className="text-sm text-gray-400">{server.type}</span>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium transition-colors duration-300 ${
                      server.status === 'active'
                        ? 'bg-green-500/10 text-green-500 dark:text-green-400'
                        : 'bg-red-500/10 text-red-500 dark:text-red-400'
                    }`}>
                      {server.status === 'active' ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 分页 - 创新设计 */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <div className="inline-flex items-center gap-2 p-2 bg-gray-800/80 backdrop-blur-md rounded-full border border-gray-700/50">
                <button
                  className={`p-2 rounded-full transition-all duration-300 ${
                    currentPage === 1
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-gray-700'
                  }`}
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m15 18-6-6 6-6"></path>
                  </svg>
                </button>

                {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                  const pageNum = i + 1
                  return (
                    <button
                      key={pageNum}
                      className={`w-8 h-8 rounded-full transition-all duration-300 ${
                        currentPage === pageNum
                          ? 'bg-gradient-to-r from-[#4C94E5] to-[#3d7bc4] text-white'
                          : 'hover:bg-gray-700'
                      }`}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  )
                })}

                <button
                  className={`p-2 rounded-full transition-all duration-300 ${
                    currentPage === totalPages
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-gray-700'
                  }`}
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m9 18 6-6-6-6"></path>
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
} 