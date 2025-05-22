// @ts-nocheck
import React from "react";
import { FaExchangeAlt } from 'react-icons/fa';
import { FaCoins } from 'react-icons/fa';
import { FiZap } from 'react-icons/fi';
import { GiBridge } from 'react-icons/gi';
import { PiBookOpenTextBold } from 'react-icons/pi';
import GradientHero from './GradientHero';
import IconWithLabel from './IconWithLabel';
import SwapBridgeStakeKnowledgeIcons from './SwapBridgeStakeKnowledgeIcons';

export default function WelcomeSection() {
  return (
    <div className="flex flex-col items-center px-4 py-6 sm:py-10 pb-0 w-full">
      <div className="flex flex-col items-center w-full max-w-4xl">
        {/* Top: Emoji + Title */}
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <img
            alt="👋"
            loading="lazy"
            width={32}
            height={32}
            className="w-8 h-8 sm:w-10 sm:h-10 shrink-0"
            src="https://registry.npmmirror.com/@lobehub/fluent-emoji-anim-1/latest/files/assets/1f44b.webp"
          />
          <GradientHero />
        </div>
        {/* Description */}
        <div className="text-center mb-6 sm:mb-8" style={{ color: 'var(--text-color-light)' }}>
          <p className="text-lg sm:text-xl font-light tracking-wide leading-relaxed px-2 sm:px-0" style={{
            color: 'inherit',
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
            lineHeight: '1.6'
          }}>
            I am your AI-powered DeFi assistant, ready to help you navigate the future of autonomous finance.
          </p>
          <p className="mt-3 sm:mt-4 text-sm sm:text-base font-normal flex items-center justify-center gap-2" style={{
            color: 'inherit',
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
            letterSpacing: '0.01em',
          }}>
            For specialized DeFi and AI agent operations, click
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            to create a new chat.
          </p>
        </div>
      </div>
      {/* Features Grid */}
      <div className="hidden sm:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 w-full max-w-6xl">
        <div className="welcome-card p-2 sm:p-3 rounded-xl flex flex-col justify-between items-stretch gap-1 sm:gap-2">
          <div className="p-1 rounded-lg flex flex-col justify-center items-center overflow-hidden">
            <IconWithLabel icon={<FaExchangeAlt />} label="Swap" color="#3B82F6" />
          </div>
          <div className="text-sm welcome-card-title">Swap With the Best route</div>
          <div className="text-xs text-neutral-400">Get the best price for your swap.</div>
          <div className="inline-flex justify-start items-center gap-1 mt-1 group-hover:text-primary transition-colors duration-200">
            <div className="welcome-card-action underline">Ask this</div>
            <FiZap className="text-gray-400 group-hover:text-primary transition-colors duration-200" style={{ fontSize: '1.2em', strokeWidth: 2, verticalAlign: 'middle' }} />
          </div>
        </div>
        <div className="welcome-card p-2 sm:p-3 rounded-xl flex flex-col justify-between items-stretch gap-1 sm:gap-2">
          <div className="p-1 rounded-lg flex flex-col justify-center items-center overflow-hidden">
            <IconWithLabel icon={<GiBridge />} label="Bridge" color="#8B5CF6" />
          </div>
          <div className="self-stretch justify-start">
            <span className="text-sm welcome-card-title">Bridge assets to another chain</span>
            <div className="text-xs text-neutral-400">Move tokens across blockchains easily.</div>
          </div>
          <div className="inline-flex justify-start items-center gap-1 mt-1 group-hover:text-primary transition-colors duration-200">
            <div className="welcome-card-action underline">Ask this</div>
            <FiZap className="text-gray-400 group-hover:text-primary transition-colors duration-200" style={{ fontSize: '1.2em', strokeWidth: 2, verticalAlign: 'middle' }} />
          </div>
        </div>
        <div className="welcome-card p-2 sm:p-3 rounded-xl flex flex-col justify-between items-stretch gap-1 sm:gap-2">
          <div className="p-1 rounded-lg flex flex-col justify-center items-center overflow-hidden">
            <IconWithLabel icon={<FaCoins />} label="Stake" color="#22C55E" />
          </div>
          <div className="self-stretch justify-start">
            <span className="text-sm welcome-card-title">Stake SOL for 9.11% APY rewards</span>
            <div className="text-xs text-neutral-400">Earn passive income by staking SOL.</div>
          </div>
          <div className="inline-flex justify-start items-center gap-1 mt-1 group-hover:text-primary transition-colors duration-200">
            <div className="welcome-card-action underline">Ask this</div>
            <FiZap className="text-gray-400 group-hover:text-primary transition-colors duration-200" style={{ fontSize: '1.2em', strokeWidth: 2, verticalAlign: 'middle' }} />
          </div>
        </div>
        <div className="welcome-card p-2 sm:p-3 rounded-xl flex flex-col justify-between items-stretch gap-1 sm:gap-2">
          <div className="p-1 rounded-lg flex flex-col justify-center items-center overflow-hidden">
            <IconWithLabel icon={<PiBookOpenTextBold />} label="KnowLedge" color="#F59E42" />
          </div>
          <div className="self-stretch justify-start">
            <span className="text-sm welcome-card-title">Get developer docs for protocols</span>
            <div className="text-xs text-neutral-400">Find docs for top DeFi projects.</div>
          </div>
          <div className="inline-flex justify-start items-center gap-1 mt-1 group-hover:text-primary transition-colors duration-200">
            <div className="welcome-card-action underline">Ask this</div>
            <FiZap className="text-gray-400 group-hover:text-primary transition-colors duration-200" style={{ fontSize: '1.2em', strokeWidth: 2, verticalAlign: 'middle' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
