import React, { useState } from 'react';

interface ThoughtsProps {
  thoughts: string[];
}

export default function Thoughts({ thoughts }: ThoughtsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="rounded-lg text-card-foreground max-w-[550px] p-0 sm:p-2 my-4 ml-11 bg-background border shadow-lg cursor-default select-none transform transition-all duration-300 ease-in-out">
      <div className="p-4 pb-2">
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-start space-x-2">
            <div className="min-w-2 min-h-2 bg-primary rounded-full self-start mt-1"></div>
            <span className="text-sm font-medium">Processing your request</span>
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
            className={`lucide lucide-chevron-${isExpanded ? 'up' : 'down'} w-4 h-4 text-primary transition-transform duration-300`}
          >
            <path d={isExpanded ? "m18 15-6-6-6 6" : "m6 9 6 6 6-6"}></path>
          </svg>
        </div>
        <div 
          className={`transition-all duration-300 ease-in-out overflow-hidden ${
            isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="mt-4 p-0 sm:p-2 space-y-2 border-t border-primary select-none">
            {thoughts.map((thought, index) => (
              <div key={index} className="flex items-start space-x-2 mt-2">
                <div className="min-w-2 min-h-2 bg-primary/50 rounded-full self-start mt-1"></div>
                <span className="text-sm text-gray-400">{thought}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 