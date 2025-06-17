import React, { useState, useEffect } from 'react';
import { queryTokenData } from '../../src/utils/public';

const DEFAULT_TOKENS = [
  {
    mint: 'So11111111111111111111111111111111111111112',
    name: 'Solana',
    symbol: 'SOL',
    decimals: 9,
    image: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
    balance: 0
  },
  {
    mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    name: 'USDT',
    symbol: 'USDT',
    decimals: 6,
    image: '/img/swap/USDT.svg',
    balance: 0
  },
  {
    mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    name: 'USD Coin',
    symbol: 'USDC',
    decimals: 6,
    image: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
    balance: 0
  }
];

export interface TokenInfo {
  mint: string;
  name: string;
  symbol: string;
  decimals: number;
  image: string;
  balance: number;
}

interface SelectTokenModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (token: TokenInfo) => void;
  selectedToken?: TokenInfo;
  accountAddress?: string;
}

function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export const SelectTokenModal: React.FC<SelectTokenModalProps> = ({
  open,
  onClose,
  onSelect,
  selectedToken,
  accountAddress
}) => {
  const [searchText, setSearchText] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<TokenInfo | null>(null);
  const [tokenList, setTokenList] = useState(DEFAULT_TOKENS);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      console.log('SelectTokenModal rendered');
      setSearchText('');
      setSearchResult(null);
      setIsSearching(false);
      setError('');
      setTokenList(DEFAULT_TOKENS);
    }
  }, [open]);

  // 输入即搜索
  const debouncedSearchText = useDebounce(searchText, 400);
  useEffect(() => {
    if (!open) return;
    if (!debouncedSearchText) {
      setSearchResult(null);
      setIsSearching(false);
      setError('');
      return;
    }
    handleSearch(debouncedSearchText);
    // eslint-disable-next-line
  }, [debouncedSearchText, open]);

  const handleSearch = async (input?: string) => {
    const value = typeof input === 'string' ? input : searchText;
    if (!value) {
      setSearchResult(null);
      setIsSearching(false);
      setError('');
      return;
    }
    setIsSearching(true);
    setError('');
    try {
      const tokenData = await queryTokenData(value.trim());
      console.log('[SelectTokenModal] queryTokenData result:', tokenData);
      if (tokenData) {
        setSearchResult({
          mint: tokenData.address,
          name: tokenData.name,
          symbol: tokenData.symbol,
          decimals: tokenData.decimals,
          image: tokenData.logoURI,
          balance: 0
        });
      } else {
        setSearchResult(null);
        setError('Token not found');
        console.log('[SelectTokenModal] Token not found for address:', value);
      }
    } catch (e) {
      setError('Failed to fetch token info');
      setSearchResult(null);
      console.log('[SelectTokenModal] Error fetching token info:', e);
    }
    setIsSearching(false);
  };

  const formatAddress = (address: string) => address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';
  const formatBalance = (balance: number) => balance ? Number(balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 }) : '0';

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {}
  };

  return open ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl p-0 w-full max-w-md relative select-token-modal border border-gray-200">
        <button className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-2xl" onClick={onClose}>×</button>
        <div className="px-6 pt-6 pb-2">
          <h2 className="text-xl font-bold mb-4 text-gray-900">Select Token</h2>
          <div className="mb-4">
            <input
              className="w-full border border-gray-200 rounded-xl px-4 py-3 mb-0 text-base focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all bg-gray-50"
              placeholder="Enter token address to search"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              autoFocus
            />
          </div>
        </div>
        {/* Search result */}
        <div className="px-2 pb-4">
          {isSearching && <div className="search-result py-6 text-center text-gray-400">Searching token info...</div>}
          {!isSearching && searchText && searchResult === null && <div className="search-result py-6 text-center text-gray-400">{error || 'Token not found'}</div>}
          {!isSearching && searchResult && (
            <div className="search-result">
              <div className="option-item flex items-center justify-between p-3 rounded-xl cursor-pointer bg-white border border-blue-100 shadow hover:shadow-md hover:bg-blue-50 transition-all mb-2" onClick={() => { onSelect(searchResult); onClose(); }}>
                <div className="group flex items-center gap-3">
                  <img src={searchResult.image} alt={searchResult.name} className="w-10 h-10 rounded-full border border-gray-200 bg-white" />
                  <div className="info">
                    <div>
                      <span className="text font-bold text-base text-gray-900">{searchResult.name}</span>
                      <span className="address ml-2 text-xs text-gray-500 inline-flex items-center gap-1">
                        {formatAddress(searchResult.mint)}
                        <img src="/img/swap/copy.svg" alt="copy" className="w-3 h-3 cursor-pointer" onClick={e => { e.stopPropagation(); copyToClipboard(searchResult.mint); }} />
                      </span>
                    </div>
                    <div className="sub-text text-xs text-gray-400">{searchResult.symbol}</div>
                  </div>
                </div>
                <div className="balance text-base font-semibold text-gray-900">{formatBalance(searchResult.balance)}</div>
              </div>
            </div>
          )}
          {/* Default token list */}
          {!isSearching && !searchText && (
            <div className="token-list max-h-80 overflow-y-auto space-y-2 px-2 pb-2">
              {tokenList.map(token => (
                <div
                  key={token.mint}
                  className={`option-item flex items-center justify-between p-3 rounded-xl cursor-pointer bg-white border border-gray-100 shadow hover:shadow-md hover:bg-blue-50 transition-all ${token.mint === selectedToken?.mint ? 'active bg-blue-50 border-blue-300' : ''}`}
                  onClick={() => { onSelect(token); onClose(); }}
                >
                  <div className="group flex items-center gap-3">
                    <img src={token.image} alt={token.name} className="w-10 h-10 rounded-full border border-gray-200 bg-white" />
                    <div className="info">
                      <div>
                        <span className="text font-bold text-base text-gray-900">{token.name}</span>
                        <span className="address ml-2 text-xs text-gray-500 inline-flex items-center gap-1">
                          {formatAddress(token.mint)}
                          <img src="/img/swap/copy.svg" alt="copy" className="w-3 h-3 cursor-pointer" onClick={e => { e.stopPropagation(); copyToClipboard(token.mint); }} />
                        </span>
                      </div>
                      <div className="sub-text text-xs text-gray-400">{token.symbol}</div>
                    </div>
                  </div>
                  <div className="balance text-base font-semibold text-gray-900">{formatBalance(token.balance)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  ) : null;
}; 