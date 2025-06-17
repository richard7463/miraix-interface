// @ts-nocheck
import React from "react";
import { FaExchangeAlt } from 'react-icons/fa';
import { FaCoins } from 'react-icons/fa';
import { FiZap } from 'react-icons/fi';
import { GiBridge } from 'react-icons/gi';
import { PiBookOpenTextBold } from 'react-icons/pi';
import GradientHero from './GradientHero';
import IconWithLabel from './IconWithLabel';
import { motion } from 'framer-motion';

export default function WelcomeSection() {
  return (
    <div className="flex flex-col items-center px-4 py-6 sm:py-8 pb-0 w-full">
      <div className="flex flex-col items-center w-full max-w-4xl">
        {/* Top: Emoji + Title */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6"
        >
          <img
            alt="👋"
            loading="lazy"
            width={40}
            height={40}
            className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-full shadow-lg"
            src="https://registry.npmmirror.com/@lobehub/fluent-emoji-anim-1/latest/files/assets/1f44b.webp"
          />
          <GradientHero />
        </motion.div>

        {/* Description */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center mb-4 sm:mb-5 max-w-2xl mx-auto"
        >
          <p className="text-base sm:text-md font-normal tracking-wide leading-normal text-muted-foreground">
            I am your AI-powered DeFi assistant, ready to help you navigate the future of autonomous finance.
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="hidden sm:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full max-w-6xl"
        >
          {/* Swap Card */}
          <motion.div 
            whileHover={{ scale: 1.02, y: -2 }}
            className="welcome-card p-3 sm:p-4 rounded-xl flex flex-col justify-between items-stretch gap-2"
          >
            <div className="p-1.5 rounded-lg bg-primary/5 flex flex-col justify-center items-center">
              <IconWithLabel icon={<FaExchangeAlt />} label="Swap" color="#3B82F6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm sm:text-base font-semibold text-foreground">Swap With the Best Route</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">Get the best price for your swap with optimized routing.</p>
            </div>
            <button className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-primary hover:text-primary/80 transition-colors">
              <span>Ask this</span>
              <FiZap className="w-3.5 h-3.5" />
            </button>
          </motion.div>

          {/* Bridge Card */}
          <motion.div 
            whileHover={{ scale: 1.02, y: -2 }}
            className="welcome-card p-3 sm:p-4 rounded-xl flex flex-col justify-between items-stretch gap-2"
          >
            <div className="p-1.5 rounded-lg bg-primary/5 flex flex-col justify-center items-center">
              <IconWithLabel icon={<GiBridge />} label="Bridge" color="#8B5CF6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm sm:text-base font-semibold text-foreground">Bridge Assets Across Chains</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">Move tokens across blockchains with ease and security.</p>
            </div>
            <button className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-primary hover:text-primary/80 transition-colors">
              <span>Ask this</span>
              <FiZap className="w-3.5 h-3.5" />
            </button>
          </motion.div>

          {/* Stake Card */}
          <motion.div 
            whileHover={{ scale: 1.02, y: -2 }}
            className="welcome-card p-3 sm:p-4 rounded-xl flex flex-col justify-between items-stretch gap-2"
          >
            <div className="p-1.5 rounded-lg bg-primary/5 flex flex-col justify-center items-center">
              <IconWithLabel icon={<FaCoins />} label="Stake" color="#22C55E" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm sm:text-base font-semibold text-foreground">Stake SOL for Rewards</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">Earn passive income with competitive APY rates.</p>
            </div>
            <button className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-primary hover:text-primary/80 transition-colors">
              <span>Ask this</span>
              <FiZap className="w-3.5 h-3.5" />
            </button>
          </motion.div>

          {/* Knowledge Card */}
          <motion.div 
            whileHover={{ scale: 1.02, y: -2 }}
            className="welcome-card p-3 sm:p-4 rounded-xl flex flex-col justify-between items-stretch gap-2"
          >
            <div className="p-1.5 rounded-lg bg-primary/5 flex flex-col justify-center items-center">
              <IconWithLabel icon={<PiBookOpenTextBold />} label="Knowledge" color="#F59E42" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm sm:text-base font-semibold text-foreground">Developer Documentation</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">Access comprehensive docs for top DeFi protocols.</p>
            </div>
            <button className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-primary hover:text-primary/80 transition-colors">
              <span>Ask this</span>
              <FiZap className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
