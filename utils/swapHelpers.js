/**
 * NewSwap组件辅助工具
 * 用于处理token信息格式化和数量计算
 */

const { getTokenInfoByMint, formatTokenAmount, getTokenDecimals, getTokenPriceByMint, getTokenPriceBySymbol } = require('./tokenInfo.js');

/**
 * 根据quote数据创建fromToken对象
 * @param {Object} quote - Jupiter quote数据
 * @returns {Object} fromToken对象
 */
function createFromTokenFromQuote(quote) {
  if (!quote || !quote.inputMint) {
    console.warn('[createFromTokenFromQuote] 无效的quote数据');
    return null;
  }

  const tokenInfo = getTokenInfoByMint(quote.inputMint);
  if (!tokenInfo) {
    console.warn(`[createFromTokenFromQuote] 未找到token信息: ${quote.inputMint}`);
    return null;
  }

  // 计算实际数量
  const actualAmount = formatTokenAmount(quote.inAmount, tokenInfo.decimals);
  
  return {
    symbol: tokenInfo.symbol,
    name: tokenInfo.name,
    logo: tokenInfo.logoURI || `/tokens/${tokenInfo.symbol.toLowerCase()}.png`,
    chain: 'solana',
    chainLogo: '',
    address: quote.inputMint,
    balance: 0,
    price: 0,
    decimals: tokenInfo.decimals,
    amount: actualAmount,
    rawAmount: quote.inAmount
  };
}

/**
 * 根据quote数据创建toToken对象
 * @param {Object} quote - Jupiter quote数据
 * @returns {Object} toToken对象
 */
function createToTokenFromQuote(quote) {
  if (!quote || !quote.outputMint) {
    console.warn('[createToTokenFromQuote] 无效的quote数据');
    return null;
  }

  const tokenInfo = getTokenInfoByMint(quote.outputMint);
  if (!tokenInfo) {
    console.warn(`[createToTokenFromQuote] 未找到token信息: ${quote.outputMint}`);
    return null;
  }

  // 计算实际数量
  const actualAmount = formatTokenAmount(quote.outAmount, tokenInfo.decimals);
  
  return {
    symbol: tokenInfo.symbol,
    name: tokenInfo.name,
    logo: tokenInfo.logoURI || `/tokens/${tokenInfo.symbol.toLowerCase()}.png`,
    chain: 'solana',
    chainLogo: '',
    address: quote.outputMint,
    balance: 0,
    price: 0,
    decimals: tokenInfo.decimals,
    amount: actualAmount,
    rawAmount: quote.outAmount
  };
}

/**
 * 格式化quote数据用于NewSwap组件
 * @param {Object} quote - Jupiter quote数据
 * @returns {Object} 格式化后的数据
 */
function formatQuoteForNewSwap(quote) {
  if (!quote) {
    console.warn('[formatQuoteForNewSwap] 无效的quote数据');
    return null;
  }

  const fromToken = createFromTokenFromQuote(quote);
  const toToken = createToTokenFromQuote(quote);

  if (!fromToken || !toToken) {
    console.warn('[formatQuoteForNewSwap] 无法创建token对象');
    return null;
  }

  return {
    fromToken,
    toToken,
    fromAmount: fromToken.amount,
    toAmount: toToken.amount,
    fromAmountRaw: fromToken.rawAmount,
    toAmountRaw: toToken.rawAmount,
    priceImpact: quote.priceImpactPct || '0',
    swapUsdValue: quote.swapUsdValue || '0',
    slippageBps: quote.slippageBps || 50
  };
}

/**
 * 从swapEntities创建token对象
 * @param {Object} swapEntities - swap实体数据
 * @param {Object} quote - quote数据（可选）
 * @returns {Promise<Object>} 格式化后的数据
 */
async function createTokensFromSwapEntities(swapEntities, quote = null) {
  if (!swapEntities || !swapEntities.fromToken || !swapEntities.toToken) {
    console.warn('[createTokensFromSwapEntities] 无效的swapEntities数据');
    return null;
  }

  // 简化的token logo映射
  const getTokenLogo = (symbol) => {
    const symbolUpper = symbol.toUpperCase();
    switch (symbolUpper) {
      case 'BONK':
        return 'https://arweave.net/hQiPZOsRZXGXBJd_82PhVdlM_hACsT_q6wqwf5cSY7I';
      case 'SOL':
        return 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png';
      case 'USDC':
        return 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png';
      case 'USDT':
        return 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.svg';
      case 'JUP':
        return 'https://static.jup.ag/jup/icon.png';
      default:
        return `/tokens/${symbol.toLowerCase()}.png`;
    }
  };

  // 获取token信息
  const fromTokenInfo = getTokenInfoByMint(swapEntities.fromToken) || {
    symbol: swapEntities.fromToken,
    name: swapEntities.fromToken,
    decimals: getTokenDecimals(swapEntities.fromToken),
    logoURI: getTokenLogo(swapEntities.fromToken)
  };

  const toTokenInfo = getTokenInfoByMint(swapEntities.toToken) || {
    symbol: swapEntities.toToken,
    name: swapEntities.toToken,
    decimals: getTokenDecimals(swapEntities.toToken),
    logoURI: getTokenLogo(swapEntities.toToken)
  };

  // 获取实时价格
  let fromTokenPrice = 0;
  let toTokenPrice = 0;

  try {
    // 并行获取两个token的价格
    const [fromPrice, toPrice] = await Promise.all([
      getTokenPriceByMint(swapEntities.fromToken).catch(() => getTokenPriceBySymbol(fromTokenInfo.symbol).catch(() => 0)),
      getTokenPriceByMint(swapEntities.toToken).catch(() => getTokenPriceBySymbol(toTokenInfo.symbol).catch(() => 0))
    ]);

    fromTokenPrice = fromPrice;
    toTokenPrice = toPrice;

    console.log(`[createTokensFromSwapEntities] 获取到的价格:`, {
      fromToken: fromTokenInfo.symbol,
      fromPrice: fromTokenPrice,
      toToken: toTokenInfo.symbol,
      toPrice: toTokenPrice
    });
  } catch (error) {
    console.error('[createTokensFromSwapEntities] 获取价格失败:', error.message);
    // 价格获取失败时使用0，不影响其他功能
  }

  // 创建fromToken对象
  const fromToken = {
    symbol: fromTokenInfo.symbol,
    name: fromTokenInfo.name,
    logo: fromTokenInfo.logoURI || getTokenLogo(fromTokenInfo.symbol),
    chain: 'solana',
    chainLogo: '',
    address: swapEntities.fromToken,
    balance: 0,
    price: fromTokenPrice,
    decimals: fromTokenInfo.decimals
  };

  // 创建toToken对象
  const toToken = {
    symbol: toTokenInfo.symbol,
    name: toTokenInfo.name,
    logo: toTokenInfo.logoURI || getTokenLogo(toTokenInfo.symbol),
    chain: 'solana',
    chainLogo: '',
    address: swapEntities.toToken,
    balance: 0,
    price: toTokenPrice,
    decimals: toTokenInfo.decimals
  };

  // 如果有quote数据，使用quote中的数量
  let fromAmount = swapEntities.amount;
  let toAmount = '0';

  if (quote && !swapEntities.amount) {
    // 只有在swapEntities中没有amount时才使用quote中的数量
    fromAmount = formatTokenAmount(quote.inAmount, fromTokenInfo.decimals);
    toAmount = formatTokenAmount(quote.outAmount, toTokenInfo.decimals);
  } else if (quote) {
    // 如果有quote数据，只更新toAmount，保持fromAmount不变
    toAmount = formatTokenAmount(quote.outAmount, toTokenInfo.decimals);
  }

  return {
    fromToken,
    toToken,
    fromAmount: String(fromAmount),
    toAmount: String(toAmount),
    quote
  };
}

/**
 * 验证token地址是否有效
 * @param {string} mintAddress - Token的mint地址
 * @returns {boolean} 是否有效
 */
function isValidTokenAddress(mintAddress) {
  return mintAddress && 
         typeof mintAddress === 'string' && 
         mintAddress.length >= 32 && 
         mintAddress.length <= 44;
}

/**
 * 获取token的显示名称
 * @param {string} symbol - Token符号
 * @param {string} mintAddress - Token的mint地址
 * @returns {string} 显示名称
 */
function getTokenDisplayName(symbol, mintAddress) {
  if (symbol && symbol !== mintAddress) {
    return symbol;
  }
  
  const tokenInfo = getTokenInfoByMint(mintAddress);
  return tokenInfo ? tokenInfo.name : symbol || mintAddress;
}

module.exports = {
  createFromTokenFromQuote,
  createToTokenFromQuote,
  formatQuoteForNewSwap,
  createTokensFromSwapEntities,
  isValidTokenAddress,
  getTokenDisplayName
}; 