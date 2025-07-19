// @ts-nocheck
import React from 'react';
import { FaExchangeAlt } from 'react-icons/fa'; // Swap
import { GiStakesFence } from 'react-icons/gi'; // Stake
import { HiOutlineArrowUp } from 'react-icons/hi'; // Withdraw
import { MdTrendingUp } from 'react-icons/md'; // Trending
import { RiExchangeDollarLine } from 'react-icons/ri'; // Bridge

const actions = [
  {
    key: 'swap',
    label: 'Swap',
    icon: <FaExchangeAlt size={16} className="text-blue-500" />,
    bg: 'bg-blue-900/20',
    border: 'border-blue-600/30',
  },
  {
    key: 'bridge',
    label: 'Bridge',
    icon: <RiExchangeDollarLine size={16} className="text-purple-500" />,
    bg: 'bg-purple-900/20',
    border: 'border-purple-600/30',
  },
  {
    key: 'stake',
    label: 'Stake',
    icon: <GiStakesFence size={16} className="text-green-500" />,
    bg: 'bg-green-900/20',
    border: 'border-green-600/30',
  },
  {
    key: 'withdraw',
    label: 'Withdraw',
    icon: <HiOutlineArrowUp size={16} className="text-indigo-500" />,
    bg: 'bg-indigo-900/20',
    border: 'border-indigo-600/30',
  },
  {
    key: 'trending',
    label: 'Trending',
    icon: <MdTrendingUp size={16} className="text-pink-500" />,
    bg: 'bg-pink-900/20',
    border: 'border-pink-600/30',
  },
];

interface SwapBridgeStakeActionButtonsProps {
  setMessage: (message: string) => void;
  customActions?: Array<{
    key: string;
    label: string;
    icon: React.ReactNode;
    message?: string;
    bg?: string;
    border?: string;
  }>;
}

export default function SwapBridgeStakeActionButtons({
  setMessage,
  customActions,
}: SwapBridgeStakeActionButtonsProps) {
  const defaultActions = [
    {
      key: 'swap',
      label: 'Swap',
      icon: <FaExchangeAlt size={16} className="text-blue-500" />,
      message: 'swap 1sol to usdc',
      bg: 'bg-blue-900/20',
      border: 'border-blue-600/30',
    },
    {
      key: 'bridge',
      label: 'Bridge',
      icon: <RiExchangeDollarLine size={16} className="text-purple-500" />,
      message: 'bridge 1sol to usdc in ethereum',
      bg: 'bg-purple-900/20',
      border: 'border-purple-600/30',
    },
    {
      key: 'stake',
      label: 'Stake',
      icon: <GiStakesFence size={16} className="text-green-500" />,
      message: 'stake 1sol in Jupiter',
      bg: 'bg-green-900/20',
      border: 'border-green-600/30',
    },
    {
      key: 'withdraw',
      label: 'Withdraw',
      icon: <HiOutlineArrowUp size={16} className="text-indigo-500" />,
      message: 'withdraw 1jupsol in jupiter',
      bg: 'bg-indigo-900/20',
      border: 'border-indigo-600/30',
    },
  ];

  const actions = customActions || defaultActions;

  const handleAction = (action: { key: string; message?: string }) => {
    if (action.message) {
      setMessage(action.message);
    }
  };

  return (
    <div className="flex flex-row justify-center gap-4 mb-2 mt-1">
      {actions.map((action) => (
        <button
          key={action.key}
          type="button"
          onClick={() => handleAction(action)}
          className={`flex items-center gap-2 px-3 py-1 rounded-full border ${action.bg} ${action.border} shadow-sm hover:shadow-md hover:scale-105 transition-all duration-150 font-semibold text-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${action.key === 'swap' ? 'blue' : action.key === 'bridge' ? 'purple' : action.key === 'stake' ? 'green' : action.key === 'withdraw' ? 'indigo' : 'pink'}-400`}
          style={{ fontSize: 17, letterSpacing: 0.2 }}
        >
          {action.icon}
          {action.label}
        </button>
      ))}
    </div>
  );
}
