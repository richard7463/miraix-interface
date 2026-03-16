"use client";

import React, { useState } from "react";
import { useTheme } from "@/components/Themes";
import { useRouter } from "next/navigation";

const categories = [
  "All",
  "DeFi",
  "Trading",
  "Security",
  "Yield",
  "Social",
  "Info",
  "Chat",
];

const mockAgents = [
  {
    id: "0",
    name: "100U FOMO Copilot",
    description:
      "Ask Miraix what to do with 100 USDC. Free preview first, then unlock the full OKX basket with fxUSD on Base.",
    tags: ["Trading", "Live", "Base"],
    status: "live",
    category: "Trading",
    href: "/fomo-copilot",
  },
  {
    id: "1",
    name: "Binance Agent Firewall",
    description:
      "Judge an AI trading prompt before it touches your Binance account. Live market data, permission fencing, and Pass / Warn / Block verdicts.",
    tags: ["Security", "Binance", "Live"],
    status: "live",
    category: "Security",
    href: "/binance-agent-firewall",
  },
  {
    id: "2",
    name: "ApexLiquid",
    description:
      "Trade perps on Hyperliquid. Track & analyze wallet performance. Copy top smart money trades.",
    tags: ["Trading", "Info"],
    status: "soon",
    category: "Trading",
    href: null,
  },
  {
    id: "3",
    name: "Intelligent DCA",
    description: "Recurrent intelligent buys.",
    tags: ["Trading"],
    status: "soon",
    category: "Trading",
    href: null,
  },
  {
    id: "4",
    name: "Levva",
    description: "Intelligent Portfolio Management — Smart Vaults.",
    tags: ["DeFi", "Yield"],
    status: "soon",
    category: "DeFi",
    href: null,
  },
  {
    id: "5",
    name: "Messari Deep Research",
    description:
      "Research any blockchain project with very detailed real-time insight.",
    tags: ["Info"],
    status: "soon",
    category: "Info",
    href: null,
  },
  {
    id: "6",
    name: "KaiBot",
    description: "Analyzes and improves your social performance.",
    tags: ["Social", "Info"],
    status: "soon",
    category: "Social",
    href: null,
  },
  {
    id: "7",
    name: "The Quantfather",
    description:
      "Ask about any token, crypto, get insights and technical analysis.",
    tags: ["Trading", "Info"],
    status: "soon",
    category: "Trading",
    href: null,
  },
  {
    id: "8",
    name: "Warden Bufett",
    description: "Wall Street meets crypto. Let Warden manage your portfolio.",
    tags: ["Trading"],
    status: "soon",
    category: "Trading",
    href: null,
  },
  {
    id: "9",
    name: "Venice",
    description: "Your favourite private and uncensored AI chatbot.",
    tags: ["Info", "Chat"],
    status: "soon",
    category: "Chat",
    href: null,
  },
];

export default function AgentHubPage() {
  const { theme } = useTheme();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [hoveredAgent, setHoveredAgent] = useState<string | null>(null);

  // Filter by category
  const filteredAgents = mockAgents.filter(
    (agent) =>
      selectedCategory === "All" || agent.category === selectedCategory,
  );

  // Helper: get logo url (use local svg by agent name)
  const getAgentLogo = (agent: any) => {
    const fileName = agent.name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    return `/agent-logos/${fileName}.svg`;
  };

  return (
    <main
      className="min-h-screen pt-24 pb-16 overflow-y-auto relative"
      style={{ backgroundColor: theme === "light" ? "#F8F9FB" : "#27272a" }}
    >
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#4C94E5] rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#4C94E5] rounded-full opacity-10 blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 relative space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#4C94E5] to-[#3d7bc4] bg-clip-text text-transparent">
            Agent Hub
          </h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Select an agent to manage, swap, earn and much more, using a simple
            chat.
          </p>
        </div>

        {/* Category tab - scrollable, gradient, highlight */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[#F8F9FB] dark:from-[#111217] to-transparent z-10"></div>
          <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#F8F9FB] dark:from-[#111217] to-transparent z-10"></div>
          <div className="flex gap-4 py-4 overflow-x-auto scrollbar-hide px-8">
            {categories.map((category) => (
              <div
                key={category}
                className={`inline-flex items-center rounded-full border text-sm font-medium transition-all duration-300 cursor-pointer px-6 py-2 whitespace-nowrap ${
                  selectedCategory === category
                    ? "bg-gradient-to-r from-[#4C94E5] to-[#3d7bc4] text-white shadow-lg scale-105"
                    : "bg-white/80 dark:bg-gray-800/80 backdrop-blur-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border-gray-200/50 dark:border-gray-700/50"
                }`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </div>
            ))}
          </div>
        </div>

        {/* Agent cards - mcp-server style */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAgents.map((agent) => (
            <div
              key={agent.id}
              className={`group relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-xl p-6 transition-all duration-300 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-2xl hover:scale-[1.02] cursor-pointer ${
                hoveredAgent === agent.id ? "ring-2 ring-[#4C94E5]" : ""
              }`}
              onMouseEnter={() => setHoveredAgent(agent.id)}
              onMouseLeave={() => setHoveredAgent(null)}
              onClick={() => agent.href && router.push(agent.href)}
            >
              {/* Card decoration */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#4C94E5]/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#4C94E5] to-[#3d7bc4] rounded-full blur-md opacity-50"></div>
                    <span className="relative flex shrink-0 overflow-hidden rounded-full w-12 h-12 bg-white border border-gray-200/50 dark:border-gray-700/50">
                      <img
                        className="aspect-square h-full w-full object-cover"
                        alt={agent.name + " logo"}
                        src={getAgentLogo(agent)}
                      />
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-semibold text-[#4C94E5] truncate">
                      {agent.name}
                    </h3>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-300 line-clamp-4 text-sm leading-relaxed">
                  {agent.description}
                </p>
                <div className="flex items-center justify-between pt-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    {agent.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-[#4C94E5]/10 to-[#3d7bc4]/10 text-[#4C94E5] mr-2 mb-1"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors duration-300 ${
                      agent.status === "live"
                        ? "bg-emerald-500/10 text-emerald-600"
                        : "bg-yellow-500/10 text-yellow-500"
                    }`}
                  >
                    {agent.status === "live" ? "Open now" : "Coming soon"}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Invite block (hidden) */}
        {false && (
          <div className="fixed md:absolute left-0 right-0 bottom-[104px] md:bottom-4 md:left-4 md:right-4 z-50 pointer-events-none backdrop-blur-sm">
            <div className="flex flex-row items-center justify-between bg-gradient-to-r from-[#2A8C7A] to-[#368B8B] rounded-[12px] py-3 px-4  m-2 md:m-0 shadow-lg pointer-events-auto">
              <div>
                <p className="text-white text-base font-light">
                  Invite friends
                </p>
                <div className="text-white/60 text-xs font-light">
                  Your invite code <span className="font-bold">TGYJ6</span>
                </div>
              </div>
              <button className="flex items-center justify-center px-4 py-1.5 bg-white text-black rounded-full shadow-md transition hover:bg-gray-100 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed font-inter text-[16px] font-semibold leading-6 capitalize">
                Invite
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
