import React, { useState, useEffect, useMemo } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { useWallets, useFundWallet as useEvmFundWallet, usePrivy } from '@privy-io/react-auth';
import { useSolanaWallets, useFundWallet as useSolanaFundWallet } from '@privy-io/react-auth/solana';
import { createPortal } from 'react-dom';
import { useTheme } from '../Themes';
import { queryTokenListByAddress } from '../../src/utils/public';
import { Toast } from '../Toast';
import { Connection, PublicKey } from '@solana/web3.js';
import { FaArrowRight, FaRegCopy, FaExternalLinkAlt } from 'react-icons/fa';

interface WalletPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

interface Token {
    mint: string;
    balance: number;
    name: string;
    image: string;
    symbol: string;
    decimals: number;
}

// 获取 SOL 价格的函数
const getSolPrice = async (): Promise<number> => {
    try {
        // 添加超时控制
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒超时
        
        const response = await fetch('https://sol-wallet-theta.vercel.app/api/sol-price', {
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error('Failed to fetch SOL price');
        }
        const data = await response.json();
        return data.solPrice || 150.02; // 使用用户提供的价格作为fallback
    } catch (error) {
        console.error('Error fetching SOL price:', error);
        return 150.02; // 使用用户提供的价格作为fallback
    }
};

export const WalletPanel: React.FC<WalletPanelProps> = ({ isOpen, onClose }) => {
    const { theme } = useTheme();
    const [selectedWallet, setSelectedWallet] = useState<string>('all');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [activeTab, setActiveTab] = useState<'tokens' | 'transactions'>('tokens');
    const [evmTokens, setEvmTokens] = useState<Token[]>([]);
    const [solanaTokens, setSolanaTokens] = useState<Token[]>([]);
    const [totalBalance, setTotalBalance] = useState<number>(0);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');
    const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
    const [loadingTx, setLoadingTx] = useState(false);
    const [solPrice, setSolPrice] = useState<number>(0);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Get embedded wallets
    const { wallets: evmWallets } = useWallets();
    const { wallets: solanaWallets } = useSolanaWallets();
    const { exportWallet: exportEvmWallet, logout } = usePrivy();
    const { exportWallet: exportSolWallet } = useSolanaWallets();
    const { fundWallet: fundEvmWallet } = useEvmFundWallet();
    const { fundWallet: fundSolanaWallet } = useSolanaFundWallet();

    // Filter for embedded wallets only
    const embeddedEvmWallets = useMemo(() => evmWallets?.filter(wallet => wallet.walletClientType === 'privy') || [], [evmWallets]);
    const embeddedSolanaWallets = useMemo(() => solanaWallets?.filter(wallet => wallet.walletClientType === 'privy') || [], [solanaWallets]);

    console.log('[WalletPanel] Embedded EVM Wallets:', embeddedEvmWallets);
    console.log('[WalletPanel] Embedded Solana Wallets:', embeddedSolanaWallets);
    console.log('[WalletPanel] Total Embedded EVM Wallets:', embeddedEvmWallets.length);
    console.log('[WalletPanel] Total Embedded Solana Wallets:', embeddedSolanaWallets.length);

    // Wallet options with embedded wallets
    const walletOptions = [
        { id: 'all', name: 'All Wallets...' },
        ...(embeddedEvmWallets.map(wallet => ({
            id: `evm-${wallet.address}`,
            name: `EVM (${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)})`,
            type: 'evm',
            address: wallet.address
        }))),
        ...(embeddedSolanaWallets.map(wallet => ({
            id: `solana-${wallet.address}`,
            name: `SOL (${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)})`,
            type: 'solana',
            address: wallet.address
        })))
    ];

    console.log('[WalletPanel] Final Wallet Options:', walletOptions);

    // 获取 SOL 价格
    useEffect(() => {
        const fetchSolPrice = async () => {
            const price = await getSolPrice();
            setSolPrice(price);
        };
        fetchSolPrice();
    }, []);

    // 获取钱包余额
    useEffect(() => {
        const fetchBalances = async () => {
            // Clear tokens first when wallets are empty (logout case)
            if (embeddedEvmWallets.length === 0 && embeddedSolanaWallets.length === 0) {
                setEvmTokens([]);
                setSolanaTokens([]);
                return;
            }

            try {
                if (embeddedEvmWallets.length > 0 && embeddedEvmWallets[0]?.address) {
                    console.log('[WalletPanel] Fetching EVM tokens for address:', embeddedEvmWallets[0].address);
                    await queryTokenListByAddress(embeddedEvmWallets[0].address, (tokens) => {
                        console.log('[WalletPanel] Received EVM tokens:', tokens);
                        const tokensWithBalance = tokens.filter(token => token.balance > 0);
                        console.log('[WalletPanel] EVM tokens with balance:', tokensWithBalance);
                        setEvmTokens(tokens as Token[]);
                    });
                } else {
                    setEvmTokens([]);
                }
                
                if (embeddedSolanaWallets.length > 0 && embeddedSolanaWallets[0]?.address) {
                    console.log('[WalletPanel] Fetching Solana tokens for address:', embeddedSolanaWallets[0].address);
                    await queryTokenListByAddress(embeddedSolanaWallets[0].address, (tokens) => {
                        console.log('[WalletPanel] Received Solana tokens:', tokens);
                        const tokensWithBalance = tokens.filter(token => token.balance > 0);
                        console.log('[WalletPanel] Solana tokens with balance:', tokensWithBalance);
                        setSolanaTokens(tokens as Token[]);
                    });
                } else {
                    setSolanaTokens([]);
                }
            } catch (error) {
                console.error('Error fetching token balances:', error);
                setEvmTokens([]);
                setSolanaTokens([]);
            }
        };

        fetchBalances();
    }, [embeddedEvmWallets, embeddedSolanaWallets]);

    // 监听交易成功事件，自动刷新余额
    useEffect(() => {
        const handleTransactionSuccess = () => {
            console.log('[WalletPanel] Transaction success detected, refreshing balances...');
            // 延迟一点时间确保链上数据已更新
            setTimeout(() => {
                const fetchBalances = async () => {
                    try {
                        if (embeddedEvmWallets.length > 0 && embeddedEvmWallets[0]?.address) {
                            console.log('[WalletPanel] Refreshing EVM tokens for address:', embeddedEvmWallets[0].address);
                            await queryTokenListByAddress(embeddedEvmWallets[0].address, (tokens) => {
                                console.log('[WalletPanel] Refreshed EVM tokens:', tokens);
                                const tokensWithBalance = tokens.filter(token => token.balance > 0);
                                console.log('[WalletPanel] Refreshed EVM tokens with balance:', tokensWithBalance);
                                setEvmTokens(tokens as Token[]);
                            });
                        }
                        
                        if (embeddedSolanaWallets.length > 0 && embeddedSolanaWallets[0]?.address) {
                            console.log('[WalletPanel] Refreshing Solana tokens for address:', embeddedSolanaWallets[0].address);
                            await queryTokenListByAddress(embeddedSolanaWallets[0].address, (tokens) => {
                                console.log('[WalletPanel] Refreshed Solana tokens:', tokens);
                                const tokensWithBalance = tokens.filter(token => token.balance > 0);
                                console.log('[WalletPanel] Refreshed Solana tokens with balance:', tokensWithBalance);
                                setSolanaTokens(tokens as Token[]);
                            });
                        }
                    } catch (error) {
                        console.error('[WalletPanel] Error refreshing token balances:', error);
                    }
                };
                fetchBalances();
            }, 2000); // 延迟2秒确保链上数据已更新
        };

        // 监听自定义事件
        window.addEventListener('refreshBalance', handleTransactionSuccess);
        
        // 清理事件监听器
        return () => {
            window.removeEventListener('refreshBalance', handleTransactionSuccess);
        };
    }, [embeddedEvmWallets, embeddedSolanaWallets]);

    // 计算总余额
    useEffect(() => {
        const calculateTotal = () => {
        let total = 0;
            
            // 计算 EVM 钱包余额 - 只计算有余额的 token
            evmTokens
                .filter(token => token.balance > 0)
                .forEach(token => {
                if (token.symbol === 'ETH') {
                    // 这里需要添加 ETH 价格获取逻辑
                    total += token.balance * 2000; // 假设 ETH 价格为 2000 USD
                } else if (token.symbol === 'USDC' || token.symbol === 'USDT') {
                    total += token.balance;
                }
            });

            // 计算 Solana 钱包余额 - 只计算有余额的 token
            solanaTokens
                .filter(token => token.balance > 0)
                .forEach(token => {
                if (token.symbol === 'SOL') {
                    // 使用实时 SOL 价格
                    total += token.balance * solPrice;
                } else if (token.symbol === 'USDC' || token.symbol === 'USDT') {
                    total += token.balance;
                }
            });

            setTotalBalance(total);
        };

        calculateTotal();
    }, [evmTokens, solanaTokens, solPrice]);

    // 计算 token 价值的函数
    const calculateTokenValue = (token: Token): number => {
        if (token.symbol === 'SOL') {
            return token.balance * solPrice;
        } else if (token.symbol === 'USDC' || token.symbol === 'USDT') {
            return token.balance; // USDC/USDT 1:1 美元
        } else if (token.symbol === 'ETH') {
            return token.balance * 2000; // 假设 ETH 价格为 2000 USD
        }
        return 0; // 其他 token 暂时不计算价值
    };

    // 格式化价值的函数
    const formatValue = (value: number): string => {
        if (value === 0) return '$0.00';
        if (value < 0.01) return '<$0.01';
        return `$${value.toFixed(2)}`;
    };

    // Log state changes
    useEffect(() => {
        console.log('[WalletPanel] selectedWallet:', selectedWallet);
    }, [selectedWallet]);
    useEffect(() => {
        console.log('[WalletPanel] activeTab:', activeTab);
    }, [activeTab]);
    useEffect(() => {
        console.log('[WalletPanel] isSettingsOpen:', isSettingsOpen);
    }, [isSettingsOpen]);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    // Get wallet addresses from embedded wallets
    const evmWallet = embeddedEvmWallets[0];
    const solanaWallet = embeddedSolanaWallets[0];

    console.log('[WalletPanel] Selected EVM Wallet:', evmWallet);
    console.log('[WalletPanel] Selected Solana Wallet:', solanaWallet);

    const handleCopy = (address: string, type: 'EVM' | 'Solana') => {
        navigator.clipboard.writeText(address);
        setToastMessage(`${type} address copied to clipboard`);
        setToastType('success');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    const handleExportWallet = async (type: 'evm' | 'solana') => {
        try {
            if (type === 'evm' && evmWallet) {
                await exportEvmWallet({ address: evmWallet.address });
            } else if (type === 'solana' && solanaWallet) {
                await exportSolWallet({ address: solanaWallet.address });
            }
            setToastMessage('Wallet exported successfully');
            setToastType('success');
            setShowToast(true);
        } catch (error) {
            console.error('Error exporting wallet:', error);
            setToastMessage('Failed to export wallet');
            setToastType('error');
            setShowToast(true);
        }
    };

    const handleFundWallet = async (type: 'evm' | 'solana') => {
        try {
            if (type === 'evm' && evmWallet) {
                await fundEvmWallet(evmWallet.address);
                setToastMessage('Fund wallet opened successfully');
                setToastType('success');
            } else if (type === 'solana' && solanaWallet) {
                await fundSolanaWallet(solanaWallet.address, {
                    cluster: { name: 'mainnet-beta' },
                    amount: '0.1' // 默认充值 0.1 SOL
                });
                setToastMessage('Fund wallet opened successfully');
                setToastType('success');
            }
            setShowToast(true);
        } catch (error) {
            console.error('Error funding wallet:', error);
            setToastMessage('Failed to open fund wallet');
            setToastType('error');
            setShowToast(true);
        }
    };

    const handleEnableWallet = (type: 'evm' | 'solana') => {
        console.log('[WalletPanel] handleEnableWallet:', type);
        // Implementation for enabling wallet
    };

    const handleLogout = async () => {
        console.log('[WalletPanel] handleLogout called');
        try {
            console.log('[WalletPanel] Calling logout()...');
            await logout();
            console.log('[WalletPanel] logout() completed successfully');
            setToastMessage('Successfully logged out');
            setToastType('success');
            setShowToast(true);
            onClose(); // 关闭面板
        } catch (error) {
            console.error('[WalletPanel] Error logging out:', error);
            setToastMessage('Failed to log out');
            setToastType('error');
            setShowToast(true);
        }
    };

    // 手动刷新余额
    const handleRefreshBalances = async () => {
        setIsRefreshing(true);
        try {
            if (embeddedEvmWallets.length > 0 && embeddedEvmWallets[0]?.address) {
                console.log('[WalletPanel] Manual refresh EVM tokens for address:', embeddedEvmWallets[0].address);
                await queryTokenListByAddress(embeddedEvmWallets[0].address, (tokens) => {
                    console.log('[WalletPanel] Manual refreshed EVM tokens:', tokens);
                    const tokensWithBalance = tokens.filter(token => token.balance > 0);
                    console.log('[WalletPanel] Manual refreshed EVM tokens with balance:', tokensWithBalance);
                    setEvmTokens(tokens as Token[]);
                });
            }
            
            if (embeddedSolanaWallets.length > 0 && embeddedSolanaWallets[0]?.address) {
                console.log('[WalletPanel] Manual refresh Solana tokens for address:', embeddedSolanaWallets[0].address);
                await queryTokenListByAddress(embeddedSolanaWallets[0].address, (tokens) => {
                    console.log('[WalletPanel] Manual refreshed Solana tokens:', tokens);
                    const tokensWithBalance = tokens.filter(token => token.balance > 0);
                    console.log('[WalletPanel] Manual refreshed Solana tokens with balance:', tokensWithBalance);
                    setSolanaTokens(tokens as Token[]);
                });
            }
            
            setToastMessage('Balances refreshed successfully');
            setToastType('success');
            setShowToast(true);
        } catch (error) {
            console.error('[WalletPanel] Error manually refreshing token balances:', error);
            setToastMessage('Failed to refresh balances');
            setToastType('error');
            setShowToast(true);
        } finally {
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        const fetchRecentTransactions = async () => {
            if (activeTab === 'transactions' && selectedWallet.startsWith('solana-') && solanaWallet) {
                setLoadingTx(true);
                try {
                    const connection = new Connection('https://summer-wider-road.solana-mainnet.quiknode.pro/a2075ac578a82df2b00d14546fd7bb29c15d8ba3/');
                    const publicKey = new PublicKey(solanaWallet.address);
                    const signatures = await connection.getSignaturesForAddress(publicKey, { limit: 10 });
                    const txs = await Promise.all(
                        signatures.map(sigInfo => connection.getTransaction(sigInfo.signature, { maxSupportedTransactionVersion: 0 }))
                    );
                    setRecentTransactions(txs.filter(Boolean));
                } catch (e) {
                    console.error('[WalletPanel] Failed to fetch transactions:', e);
                    setRecentTransactions([]);
                }
                setLoadingTx(false);
            } else {
                setRecentTransactions([]);
            }
        };
        fetchRecentTransactions();
    }, [activeTab, selectedWallet, solanaWallet]);

    if (!isOpen || !mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-50">
            <div className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`} onClick={onClose} />
            <div className="absolute right-0 h-full">
                <div className="h-full flex flex-col items-start justify-start border-l">
                    <div className={`fixed right-0 top-0 h-full w-96 transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                        <div className="flex flex-col h-full">
                            <div className="border text-card-foreground shadow-sm h-screen border-l border-r-0 border-t-0 border-b-0 z-50 relative bg-white/95 rounded-none overflow-hidden w-96">
                                <div className="p-6 flex items-center gap-2 flex-row justify-between space-y-0 py-4 pb-4 border-b">
                                    <div className="flex items-center gap-2">
                                        <Listbox value={selectedWallet} onChange={(val) => { setSelectedWallet(val); console.log('[WalletPanel] Listbox onChange:', val); }}>
                                            <div className="relative">
                                                <Listbox.Button className="relative w-[200px] h-11 cursor-pointer rounded-md bg-white py-2.5 pl-3 pr-10 text-left shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-primary hover:bg-gray-50 transition-colors">
                                                    <span className="block truncate text-sm">
                                                        {walletOptions.find(option => option.id === selectedWallet)?.name}
                                                    </span>
                                                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                                        <ChevronUpDownIcon
                                                            className="h-5 w-5 text-gray-400"
                                                            aria-hidden="true"
                                                        />
                                                    </span>
                                                </Listbox.Button>
                                                <Transition
                                                    as={React.Fragment}
                                                    leave="transition ease-in duration-100"
                                                    leaveFrom="opacity-100"
                                                    leaveTo="opacity-0"
                                                >
                                                    <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                                        {walletOptions.map((option) => (
                                                            <Listbox.Option
                                                                key={option.id}
                                                                className={({ active }) =>
                                                                    `relative cursor-pointer select-none py-2 pl-3 pr-9 ${active ? 'bg-primary/10 text-primary' : 'text-gray-900'
                                                                    }`
                                                                }
                                                                value={option.id}
                                                            >
                                                                {({ selected }) => (
                                                                    <>
                                                                        <span
                                                                            className={`block truncate ${selected ? 'font-medium' : 'font-normal'
                                                                                }`}
                                                                        >
                                                                            {option.name}
                                                                        </span>
                                                                        {selected ? (
                                                                            <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-primary">
                                                                                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                                                    <path
                                                                                        fillRule="evenodd"
                                                                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                                                        clipRule="evenodd"
                                                                                    />
                                                                                </svg>
                                                                            </span>
                                                                        ) : null}
                                                                    </>
                                                                )}
                                                            </Listbox.Option>
                                                        ))}
                                                    </Listbox.Options>
                                                </Transition>
                                            </div>
                                        </Listbox>
                                        <button
                                            onClick={() => { setIsSettingsOpen(!isSettingsOpen); console.log('[WalletPanel] setIsSettingsOpen:', !isSettingsOpen); }}
                                            className={`inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-white hover:bg-gray-50 px-2 py-2 h-11 w-11 rounded-full transform ${isSettingsOpen ? 'scale-110' : 'scale-100'} cursor-pointer`}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-settings">
                                                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                                                <circle cx="12" cy="12" r="3" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                <div className="p-6 pt-0 space-y-4">
                                    <div className="mt-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex flex-col text-3xl font-bold">
                                                {formatValue(totalBalance)}
                                            </div>
                                            <button
                                                onClick={handleRefreshBalances}
                                                disabled={isRefreshing}
                                                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-white hover:bg-gray-50 h-10 px-3 py-2 shadow-sm hover:shadow-md cursor-pointer disabled:cursor-not-allowed"
                                                title="Refresh balances"
                                            >
                                                {isRefreshing ? (
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                                                ) : (
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-refresh-cw">
                                                        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                                                        <path d="M21 3v5h-5"/>
                                                        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                                                        <path d="M3 21v-5h5"/>
                                                    </svg>
                                                )}
                                                <span className="hidden sm:inline">Refresh</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex w-full">
                                        {/* <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 text-violet-50 h-10 px-4 py-2 bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-700 hover:to-violet-600 shadow-md hover:shadow-lg cursor-pointer">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-sparkles mr-2 h-4 w-4 text-violet-50">
                                                <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
                                                <path d="M20 3v4" />
                                                <path d="M22 5h-4" />
                                                <path d="M4 17v2" />
                                                <path d="M5 18H3" />
                                            </svg>
                                            Fund Wallet
                                        </button> */}
                                    </div>

                                    <div className="mt-4">
                                        <div className="w-full">
                                            <div className="flex items-center justify-center rounded-md bg-gray-100 p-1 text-muted-foreground w-full">
                                                <button
                                                    onClick={() => { setActiveTab('tokens'); console.log('[WalletPanel] setActiveTab: tokens'); }}
                                                    className={`flex-1 inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all duration-200 ${activeTab === 'tokens'
                                                        ? 'bg-white text-primary shadow-sm'
                                                        : 'text-gray-600 hover:text-gray-900'
                                                        } cursor-pointer`}
                                                >
                                                    Tokens
                                                </button>
                                                <button
                                                    onClick={() => { setActiveTab('transactions'); console.log('[WalletPanel] setActiveTab: transactions'); }}
                                                    className={`flex-1 inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all duration-200 ${activeTab === 'transactions'
                                                        ? 'bg-white text-primary shadow-sm'
                                                        : 'text-gray-600 hover:text-gray-900'
                                                        } cursor-pointer`}
                                                >
                                                    Transactions
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {activeTab === 'tokens' ? (
                                        <div className="space-y-3">
                                            {/* EVM Wallet */}
                                            {(selectedWallet === 'all' || selectedWallet.startsWith('evm-')) && 
                                                evmTokens
                                                    .filter(token => token.balance > 0) // 只显示有余额的 token
                                                    .sort((a, b) => b.balance - a.balance) // 按余额降序排列
                                                    .map((token, index) => (
                                                <div key={`evm-${index}`} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
                                                    <div className="flex items-center gap-3">
                                                        <img
                                                            src={token.image || '/favicon.png'}
                                                            alt={token.symbol}
                                                            className="w-8 h-8 rounded-full border border-gray-200 bg-white"
                                                            onError={(e) => {
                                                                e.currentTarget.src = '/favicon.png';
                                                            }}
                                                        />
                                                        <div>
                                                            <div className="font-medium">{token.balance.toFixed(6)}</div>
                                                            <div className="text-sm text-gray-500">{token.name}</div>
                                                        </div>
                                                    </div>
                                                    <div className="text-sm text-green-500 font-medium">
                                                        {formatValue(calculateTokenValue(token))}
                                                    </div>
                                                </div>
                                            ))}
                                            {/* Solana Wallet */}
                                            {(selectedWallet === 'all' || selectedWallet.startsWith('solana-')) && 
                                                solanaTokens
                                                    .filter(token => token.balance > 0) // 只显示有余额的 token
                                                    .sort((a, b) => b.balance - a.balance) // 按余额降序排列
                                                    .map((token, index) => (
                                                <div key={`sol-${index}`} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
                                                    <div className="flex items-center gap-3">
                                                        <img
                                                            src={token.image || '/favicon.png'}
                                                            alt={token.symbol}
                                                            className="w-8 h-8 rounded-full border border-gray-200 bg-white"
                                                            onError={(e) => {
                                                                e.currentTarget.src = '/favicon.png';
                                                            }}
                                                        />
                                                        <div>
                                                            <div className="font-medium">{token.balance.toFixed(6)}</div>
                                                            <div className="text-sm text-gray-500">{token.name}</div>
                                                        </div>
                                                    </div>
                                                    <div className="text-sm text-green-500 font-medium">
                                                        {formatValue(calculateTokenValue(token))}
                                                    </div>
                                                </div>
                                            ))}
                                            
                                            {/* 如果没有有余额的 token，显示提示信息 */}
                                            {((selectedWallet === 'all' || selectedWallet.startsWith('evm-')) && evmTokens.filter(token => token.balance > 0).length === 0) &&
                                             ((selectedWallet === 'all' || selectedWallet.startsWith('solana-')) && solanaTokens.filter(token => token.balance > 0).length === 0) && (
                                                <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                                                    <svg className="h-10 w-10 mb-2" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
                                                    </svg>
                                                    <p>No tokens with balance found</p>
                                                    <p className="text-xs mt-1">Try funding your wallet or check another wallet</p>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {/* Solana Wallet Recent Transactions */}
                                            {selectedWallet.startsWith('solana-') ? (
                                                loadingTx ? (
                                                    <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                                                        <svg className="animate-spin h-6 w-6 mb-2 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
                                                        Loading recent transactions...
                                                    </div>
                                                ) : recentTransactions.length === 0 ? (
                                                    <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                                                        <svg className="h-10 w-10 mb-2" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" /></svg>
                                                        No recent transactions
                                                    </div>
                                                ) : (
                                                    <div className="overflow-x-auto rounded-lg border border-gray-100 bg-white shadow-sm">
                                                        <table className="min-w-full text-xs text-left">
                                                            <thead className="bg-gray-50">
                                                                <tr>
                                                                    <th className="px-4 py-2 font-semibold text-gray-700">Txn Hash</th>
                                                                    <th className="px-4 py-2 font-semibold text-gray-700">Time</th>
                                                                    <th className="px-4 py-2 font-semibold text-gray-700">Amount (SOL)</th>
                                                                    <th className="px-4 py-2"></th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {recentTransactions.map((tx, idx) => {
                                                                    const hash = tx.transaction.signatures[0];
                                                                    const time = tx.blockTime ? new Date(tx.blockTime * 1000).toLocaleString() : '';
                                                                    const amount = tx.meta?.postBalances && tx.meta?.preBalances ? ((tx.meta.postBalances[0] - tx.meta.preBalances[0]) / 1e9) : null;
                                                                    return (
                                                                        <tr key={hash || idx} className="hover:bg-gray-50 transition-colors">
                                                                            <td className="px-4 py-2 max-w-[140px] truncate flex items-center gap-2 group">
                                                                                <span className="truncate">{hash.slice(0, 8)}...{hash.slice(-6)}</span>
                                                                                <button title="Copy" onClick={() => navigator.clipboard.writeText(hash)} className="opacity-60 group-hover:opacity-100 transition"><FaRegCopy size={14} /></button>
                                                                                <a href={`https://solscan.io/tx/${hash}`} target="_blank" rel="noopener noreferrer" title="View on Solscan" className="opacity-60 group-hover:opacity-100 transition"><FaExternalLinkAlt size={14} /></a>
                                                                            </td>
                                                                            <td className="px-4 py-2 whitespace-nowrap text-gray-500">{time}</td>
                                                                            <td className={`px-4 py-2 font-mono ${(amount ?? 0) > 0 ? 'text-green-600' : (amount ?? 0) < 0 ? 'text-red-500' : 'text-gray-500'}`}>{amount !== null && amount !== undefined ? amount.toFixed(6) : '-'}</td>
                                                                            <td className="px-4 py-2 text-gray-400"><FaArrowRight /></td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                )
                                            ) : (
                                                <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                                                    <svg className="h-10 w-10 mb-2" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" /></svg>
                                                    EVM transaction history is not supported yet
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {isSettingsOpen && (
                                    <div className="absolute top-20 right-4 z-50 rounded-md border bg-white p-4 text-popover-foreground shadow-md outline-none w-80 transform transition-all duration-300">
                                        <div className="space-y-4">
                                            <h4 className="font-medium text-sm">AI Wallet Settings</h4>

                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm">EVM Wallet</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {`${evmWallet.address.slice(0, 6)}...${evmWallet.address.slice(-4)}`}
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    <button 
                                                        onClick={() => handleCopy(evmWallet.address, 'EVM')} 
                                                        className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-gray-100 active:bg-gray-200 h-9 rounded-md px-3 transform hover:scale-105 active:scale-95"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-copy h-3 w-3 mr-1">
                                                            <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                                                            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                                                        </svg>
                                                        Copy
                                                    </button>
                                                    <button 
                                                        onClick={() => window.open(`https://etherscan.io/address/${evmWallet.address}`, '_blank')}
                                                        className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-gray-100 active:bg-gray-200 h-9 rounded-md px-3 transform hover:scale-105 active:scale-95"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-square-arrow-out-up-right h-3 w-3 mr-1">
                                                            <path d="M21 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6" />
                                                            <path d="m21 3-9 9" />
                                                            <path d="M15 3h6v6" />
                                                        </svg>
                                                        Explorer
                                                    </button>
                                                    <button 
                                                        onClick={() => handleExportWallet('evm')} 
                                                        className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-gray-100 active:bg-gray-200 h-9 rounded-md px-3 transform hover:scale-105 active:scale-95"
                                                    >
                                                        Export
                                                    </button>
                                                    <button 
                                                        onClick={() => handleFundWallet('evm')} 
                                                        className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-gray-100 active:bg-gray-200 h-9 rounded-md px-3 transform hover:scale-105 active:scale-95"
                                                    >
                                                        Fund
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="space-y-2 mt-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm">Solana Wallet</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {`${solanaWallet.address.slice(0, 6)}...${solanaWallet.address.slice(-6)}`}
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    <button 
                                                        onClick={() => handleCopy(solanaWallet.address, 'Solana')}
                                                        className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-gray-100 active:bg-gray-200 h-9 rounded-md px-3 transform hover:scale-105 active:scale-95"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-copy h-3 w-3 mr-1">
                                                            <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                                                            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                                                        </svg>
                                                        Copy
                                                    </button>
                                                    <button 
                                                        onClick={() => window.open(`https://solscan.io/account/${solanaWallet.address}`, '_blank')}
                                                        className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-gray-100 active:bg-gray-200 h-9 rounded-md px-3 transform hover:scale-105 active:scale-95"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-square-arrow-out-up-right h-3 w-3 mr-1">
                                                            <path d="M21 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6" />
                                                            <path d="m21 3-9 9" />
                                                            <path d="M15 3h6v6" />
                                                        </svg>
                                                        Explorer
                                                    </button>
                                                    <button 
                                                        onClick={() => handleExportWallet('solana')} 
                                                        className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-gray-100 active:bg-gray-200 h-9 rounded-md px-3 transform hover:scale-105 active:scale-95"
                                                    >
                                                        Export
                                                    </button>
                                                    <button 
                                                        onClick={() => handleFundWallet('solana')} 
                                                        className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-gray-100 active:bg-gray-200 h-9 rounded-md px-3 transform hover:scale-105 active:scale-95"
                                                    >
                                                        Fund
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="mt-4 border-t pt-4">
                                                <button 
                                                    onClick={handleLogout} 
                                                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/80 h-9 rounded-md px-3 w-full transform hover:scale-105 active:scale-95"
                                                >
                                                    Log Out
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Toast
                isVisible={showToast}
                message={toastMessage}
                type={toastType}
                onClose={() => setShowToast(false)}
            />
        </div>,
        document.body
    );
}; 