// @ts-nocheck
import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface ThoughtsProps {
  thoughts: string[];
  status?: string;
}

export default function Thoughts({ thoughts, status = 'Processing your request' }: ThoughtsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="rounded-lg text-card-foreground max-w-[480px] w-full my-3 bg-[#3f3f46] border border-[#52525b] shadow-lg cursor-default select-none transform transition-all duration-300 ease-in-out"
      style={{ minWidth: 0 }}
    >
      <div className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-start space-x-2">
            <div className="min-w-2 min-h-2 bg-primary rounded-full self-start mt-1"></div>
            <span 
              className="text-sm font-medium cursor-pointer hover:text-primary transition-colors text-[#e0e0e6]" 
              onClick={() => setIsExpanded((v) => !v)}
              style={{ cursor: 'pointer' }}
            >
              {status}
            </span>
          </div>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className={`lucide lucide-chevron-${isExpanded ? 'up' : 'down'} cursor-pointer w-4 h-4 text-primary transition-transform duration-300 hover:scale-110`}
            onClick={() => setIsExpanded((v) => !v)}
            style={{ cursor: 'pointer' }}
          >
            <path d={isExpanded ? "m18 15-6-6-6 6" : "m6 9 6 6 6-6"}></path>
          </svg>
        </div>
        
        {isExpanded && thoughts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="mt-3 pt-3 border-t border-[#52525b]"
          >
            <div className="space-y-2">
            {thoughts.map((thought, index) => (
                <div key={index} className="text-sm text-[#a1a1aa] leading-relaxed">
                  {thought}
              </div>
            ))}
          </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
} 