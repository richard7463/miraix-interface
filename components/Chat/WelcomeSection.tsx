// @ts-nocheck
import React from "react";
import { FaExchangeAlt } from 'react-icons/fa';
import { FaCoins } from 'react-icons/fa';
import { FiZap } from 'react-icons/fi';
import { GiBridge } from 'react-icons/gi';
import { PiBookOpenTextBold } from 'react-icons/pi';
import GradientHero from './GradientHero';
import IconWithLabel from './IconWithLabel';
import InfiniteScrollText from './InfiniteScrollText';
import { motion } from 'framer-motion';

interface WelcomeSectionProps {
  setMessage?: (message: string) => void;
}

export default function WelcomeSection({ setMessage }: WelcomeSectionProps) {
  const handleAskThis = (action: string) => {
    if (setMessage) {
      let message = '';
      switch (action) {
        case 'swap':
          message = 'swap 1sol to usdc';
          break;
        case 'bridge':
          message = 'bridge 1sol to usdc in ethereum';
          break;
        case 'stake':
          message = 'Find me the best staking yields';
          break;
        case 'createToken':
          message = 'Create a token named abcpump';
          break;
        case 'knowledge':
          message = 'show me the documentation for Jupiter protocol';
          break;
        default:
          message = '';
      }
      setMessage(message);
    }
  };

  return (
    <div className="flex flex-col items-center px-4 py-6 sm:py-8 pb-0 w-full bg-zinc-800">
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

        {/* Features Grid - Desktop Version (hidden on mobile) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="hidden lg:grid grid-cols-4 gap-4 w-full max-w-6xl"
        >
          {/* Swap Card */}
          <motion.div 
            whileHover={{ scale: 1.02, y: -2 }}
            onClick={() => handleAskThis('swap')}
            className="w-full px-3 py-3 bg-white/5 rounded-xl relative cursor-pointer transition-all duration-200 hover:bg-white/10"
          >
            <div className="p-1.5 bg-white/5 rounded-lg flex flex-col justify-center items-center overflow-hidden w-8 h-8 absolute top-3 left-3">
              <FaExchangeAlt className="w-5 h-5 text-blue-400" />
            </div>
            <div className="pt-12 pb-2">
              <div className="self-stretch justify-start">
                <span className="text-white/90 text-base font-normal font-['Anonymous_Pro']">Swap with the best route</span>
                <span className="text-white text-base font-normal font-['Anonymous_Pro']"> </span>
                <span className="text-white/30 text-base font-normal font-['Anonymous_Pro']">and get optimized pricing for your trades</span>
              </div>
              <div className="inline-flex justify-start items-center gap-1 mt-2">
                <div 
                  className="justify-start text-white/60 text-sm font-normal font-['Anonymous_Pro'] underline hover:text-white/80 transition-colors"
                >
                  Ask this
                </div>
                <div className="w-3.5 h-3.5 relative">
                  <FiZap className="w-3.5 h-3.5 text-white/60" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Bridge Card */}
          <motion.div 
            whileHover={{ scale: 1.02, y: -2 }}
            onClick={() => handleAskThis('bridge')}
            className="w-full px-3 py-3 bg-white/5 rounded-xl relative cursor-pointer transition-all duration-200 hover:bg-white/10"
          >
            <div className="p-1.5 bg-white/5 rounded-lg flex flex-col justify-center items-center overflow-hidden w-8 h-8 absolute top-3 left-3">
              <GiBridge className="w-5 h-5 text-purple-400" />
            </div>
            <div className="pt-12 pb-2">
              <div className="self-stretch justify-start">
                <span className="text-white/90 text-base font-normal font-['Anonymous_Pro']">Bridge assets across chains</span>
                <span className="text-white text-base font-normal font-['Anonymous_Pro']"> </span>
                <span className="text-white/30 text-base font-normal font-['Anonymous_Pro']">with ease and security</span>
              </div>
              <div className="inline-flex justify-start items-center gap-1 mt-2">
                <div 
                  className="justify-start text-white/60 text-sm font-normal font-['Anonymous_Pro'] underline hover:text-white/80 transition-colors"
                >
                  Ask this
                </div>
                <div className="w-3.5 h-3.5 relative">
                  <FiZap className="w-3.5 h-3.5 text-white/60" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Stake Card */}
          <motion.div 
            whileHover={{ scale: 1.02, y: -2 }}
            onClick={() => handleAskThis('stake')}
            className="w-full px-3 py-3 bg-white/5 rounded-xl relative cursor-pointer transition-all duration-200 hover:bg-white/10"
          >
            <div className="p-1.5 bg-white/5 rounded-lg flex flex-col justify-center items-center overflow-hidden w-8 h-8 absolute top-3 left-3">
              <FaCoins className="w-5 h-5 text-green-400" />
            </div>
            <div className="pt-12 pb-2">
              <div className="self-stretch justify-start">
                <span className="text-white/90 text-base font-normal font-['Anonymous_Pro']">Stake SOL for rewards</span>
                <span className="text-white text-base font-normal font-['Anonymous_Pro']"> </span>
                <span className="text-white/30 text-base font-normal font-['Anonymous_Pro']">and earn competitive APY rates</span>
              </div>
              <div className="inline-flex justify-start items-center gap-1 mt-2">
                <div 
                  className="justify-start text-white/60 text-sm font-normal font-['Anonymous_Pro'] underline hover:text-white/80 transition-colors"
                >
                  Ask this
                </div>
                <div className="w-3.5 h-3.5 relative">
                  <FiZap className="w-3.5 h-3.5 text-white/60" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Create Token Card */}
          <motion.div 
            whileHover={{ scale: 1.02, y: -2 }}
            onClick={() => handleAskThis('createToken')}
            className="w-full px-3 py-3 bg-white/5 rounded-xl relative cursor-pointer transition-all duration-200 hover:bg-white/10"
          >
            <div className="p-1.5 bg-white/5 rounded-lg flex flex-col justify-center items-center overflow-hidden w-8 h-8 absolute top-3 left-3">
              <FaCoins className="w-5 h-5 text-orange-400" />
            </div>
            <div className="pt-12 pb-2">
              <div className="self-stretch justify-start">
                <span className="text-white/90 text-base font-normal font-['Anonymous_Pro']">Create token on Solana</span>
                <span className="text-white text-base font-normal font-['Anonymous_Pro']"> </span>
                <span className="text-white/30 text-base font-normal font-['Anonymous_Pro']">in one click with on-chain creation</span>
              </div>
              <div className="inline-flex justify-start items-center gap-1 mt-2">
                <div 
                  className="justify-start text-white/60 text-sm font-normal font-['Anonymous_Pro'] underline hover:text-white/80 transition-colors"
                >
                  Ask this
                </div>
                <div className="w-3.5 h-3.5 relative">
                  <FiZap className="w-3.5 h-3.5 text-white/60" />
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Mobile Version - Compact Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="lg:hidden grid grid-cols-2 gap-3 w-full max-w-md"
        >
          {/* Swap Card - Mobile */}
          <motion.div 
            whileHover={{ scale: 1.02 }}
            onClick={() => handleAskThis('swap')}
            className="px-3 py-2 bg-white/5 rounded-lg relative cursor-pointer transition-all duration-200 hover:bg-white/10"
          >
            <div className="flex items-center gap-2">
              <FaExchangeAlt className="w-4 h-4 text-blue-400" />
              <span className="text-white/90 text-sm font-medium">Swap</span>
            </div>
          </motion.div>

          {/* Bridge Card - Mobile */}
          <motion.div 
            whileHover={{ scale: 1.02 }}
            onClick={() => handleAskThis('bridge')}
            className="px-3 py-2 bg-white/5 rounded-lg relative cursor-pointer transition-all duration-200 hover:bg-white/10"
          >
            <div className="flex items-center gap-2">
              <GiBridge className="w-4 h-4 text-purple-400" />
              <span className="text-white/90 text-sm font-medium">Bridge</span>
            </div>
          </motion.div>

          {/* Stake Card - Mobile */}
          <motion.div 
            whileHover={{ scale: 1.02 }}
            onClick={() => handleAskThis('stake')}
            className="px-3 py-2 bg-white/5 rounded-lg relative cursor-pointer transition-all duration-200 hover:bg-white/10"
          >
            <div className="flex items-center gap-2">
              <FaCoins className="w-4 h-4 text-green-400" />
              <span className="text-white/90 text-sm font-medium">Stake</span>
            </div>
          </motion.div>

          {/* Create Token Card - Mobile */}
          <motion.div 
            whileHover={{ scale: 1.02 }}
            onClick={() => handleAskThis('createToken')}
            className="px-3 py-2 bg-white/5 rounded-lg relative cursor-pointer transition-all duration-200 hover:bg-white/10"
          >
            <div className="flex items-center gap-2">
              <FaCoins className="w-4 h-4 text-orange-400" />
              <span className="text-white/90 text-sm font-medium">Create Token</span>
            </div>
          </motion.div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.6 }} className="w-full mt-4 sm:mt-6"><InfiniteScrollText setMessage={setMessage} /></motion.div>
      </div>
    </div>
  );
}
