import React from 'react';

export default function GradientHero() {
  return (
    <div className="flex flex-col items-center justify-center py-2">
      <h1 className="text-3xl font-extrabold text-center leading-tight">
        <span className="bg-gradient-to-r from-[#FF7C4D] to-[#C471F5] text-transparent bg-clip-text">MiraiX,</span>
        <span className="inline-block mx-2 align-middle bg-gradient-to-r from-[#C471F5] to-[#3F51B5] text-transparent bg-clip-text">
          Your AI-Powered DeFi Partner
        </span>
      </h1>
    </div>
  );
}
