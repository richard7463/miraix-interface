/**
 * Token信息获取工具
 * 基于Jupiter API获取token的元信息、价格等数据
 */

// 检查是否在Node.js环境中
const isNode = typeof window === 'undefined';

// 在Node.js环境中使用HTTP代理，在客户端环境中直接使用fetch
let fetchFunction;
if (isNode) {
  // 在Node.js环境中，使用HTTP代理访问Jupiter API
  const http = require('http');
  const https = require('https');
  
  fetchFunction = (url, options = {}) => {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      
      // 使用本地HTTP代理（7890端口）
      const proxyOptions = {
        hostname: '127.0.0.1',
        port: 7890,
        path: url,
        method: options.method || 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Host': urlObj.hostname,
          ...options.headers
        },
        timeout: 10000
      };

      const req = http.request(proxyOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            json: () => Promise.resolve(JSON.parse(data))
          });
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (options.body) {
        req.write(options.body);
      }
      req.end();
    });
  };
} else {
  fetchFunction = fetch;
}

// 常用token的mint地址映射
const TOKEN_MINTS = {
  'SOL': 'So11111111111111111111111111111111111111112',
  'USDC': 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  'USDT': 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  'BONK': 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  'JUP': 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
  'TRUMP': '6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN',
  'RAY': '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
  'SRM': 'SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt',
  'MNGO': 'MangoCzJ36AjZyKwVj3VnYU4GTonjfVEnJmvvWaxLac',
  'ORCA': 'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE',
  'SAMO': '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
  'COPE': '8HGyAAB1yoM1ttS7pXjHMa3dukTFGQggnFFH3hJZgzQh',
  'ALEPH': 'CsZ5LZkDS7h9TDKjrbL7VAwQZ9nsRu8vAo2eJYVWX64m',
  'MEDIA': 'ETAtLmCmsoiEEKfNrHKJ2kYy3MoABhU6NQvpSfij5tDs',
  'ROPE': '8PMHT4swUMtBzgHnh5U564N5sjPSiUz2cjEQzF6PzDoM',
  'STEP': 'StepAscQoEioFxxWGnh2sLBDFp9d8rvKz2Yp39iDpyT',
  'SLND': 'SLNDpmoWTVADgEdzwyvWwpqW6EiEPLWN6zqb4D9Gqaw',
  'SNY': '4dmKkXNHJmXs1Td9SgR9qFw5GkCeKb3J9dGzVv6LqH5p',
  'MER': 'MERt85fc5boKw3BW1eYdxonEuJNvXbiMbs6hvheau5K',
  'TULIP': 'TuLipcqtGVXP9XR62wM8WWCm6a9vhLs7TQo1FLtqPcW',
  'LIKE': '3bRTivrVsitbmCTGtqwp7hxXPsybkjn4XLNtPsHqa3zR'
};

// 硬编码的token元数据作为fallback
const HARDCODED_TOKEN_DATA = {
  'So11111111111111111111111111111111111111112': {
    address: 'So11111111111111111111111111111111111111112',
    name: 'Wrapped SOL',
    symbol: 'SOL',
    decimals: 9,
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
    tags: ['verified', 'community', 'strict'],
    daily_volume: 586934249.7881349
  },
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': {
    address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    name: 'Bonk',
    symbol: 'Bonk',
    decimals: 5,
    logoURI: 'https://arweave.net/hQiPZOsRZXGXBJd_82PhVdlM_hACsT_q6wqwf5cSY7I',
    tags: ['verified', 'strict', 'birdeye-trending', 'community'],
    daily_volume: 9075169.44042829
  },
  'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN': {
    address: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
    name: 'Jupiter',
    symbol: 'JUP',
    decimals: 6,
    logoURI: 'https://static.jup.ag/jup/icon.png',
    tags: ['verified', 'birdeye-trending', 'strict', 'community'],
    daily_volume: 2702545.0244062124
  },
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': {
    address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    name: 'USD Coin',
    symbol: 'USDC',
    decimals: 6,
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
    tags: ['verified', 'strict', 'community'],
    daily_volume: 527863372.3808767
  },
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': {
    address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    name: 'USDT',
    symbol: 'USDT',
    decimals: 6,
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.svg',
    tags: ['verified', 'community', 'strict'],
    daily_volume: 73489245.7034785
  },
  '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R': {
    address: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
    name: 'Raydium',
    symbol: 'RAY',
    decimals: 6,
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R/logo.png',
    tags: ['verified', 'strict', 'birdeye-trending', 'community'],
    daily_volume: 1045278.1563600472
  }
};

// Jupiter API端点
const JUPITER_API_BASE = 'https://api.jup.ag/tokens/v1';
const JUPITER_QUOTE_API = 'https://quote-api.jup.ag/v6';
const JUPITER_API_KEY = '9dfe02ba-941a-4c4a-952b-d0cccf5c21e7';

/**
 * 获取token的元信息
 * @param {string} mintAddress - Token的mint地址
 * @returns {Promise<Object|null>} Token元信息
 */
async function getTokenMetadata(mintAddress) {
  try {
    console.log(`[getTokenMetadata] 获取token元信息: ${mintAddress}`);
    
    // 首先尝试从API获取
    const response = await fetchFunction(`${JUPITER_API_BASE}/token/${mintAddress}`, {
      headers: {
        'x-api-key': JUPITER_API_KEY
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`[getTokenMetadata] API成功获取token元信息:`, {
      name: data.name,
      symbol: data.symbol,
      decimals: data.decimals,
      logoURI: data.logoURI
    });
    
    return data;
  } catch (error) {
    console.error(`[getTokenMetadata] API获取失败，使用硬编码数据: ${mintAddress}`, error.message);
    
    // 如果API失败，使用硬编码数据
    const hardcodedData = HARDCODED_TOKEN_DATA[mintAddress];
    if (hardcodedData) {
      console.log(`[getTokenMetadata] 使用硬编码数据:`, {
        name: hardcodedData.name,
        symbol: hardcodedData.symbol,
        decimals: hardcodedData.decimals,
        logoURI: hardcodedData.logoURI
      });
      return hardcodedData;
    }
    
    console.error(`[getTokenMetadata] 未找到硬编码数据: ${mintAddress}`);
    return null;
  }
}

/**
 * 获取token价格（相对于USDC）
 * @param {string} mintAddress - Token的mint地址
 * @param {number} amount - 查询数量（默认1个token）
 * @returns {Promise<number|null>} Token价格
 */
async function getTokenPrice(mintAddress, amount = 1000000) {
  try {
    console.log(`[getTokenPrice] 获取token价格: ${mintAddress}`);
    
    const params = new URLSearchParams({
      inputMint: mintAddress,
      outputMint: TOKEN_MINTS.USDC,
      amount: amount.toString(),
      slippageBps: '50'
    });
    
    const response = await fetchFunction(`${JUPITER_QUOTE_API}/quote?${params}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.data) {
      // 计算价格：输出USDC数量 / 输入token数量
      const price = parseFloat(data.data.outAmount) / parseFloat(data.data.inAmount);
      console.log(`[getTokenPrice] Token价格: $${price.toFixed(6)}`);
      return price;
    }
    
    console.log(`[getTokenPrice] 无法获取价格信息`);
    return null;
  } catch (error) {
    console.error(`[getTokenPrice] 获取token价格失败: ${mintAddress}`, error.message);
    return null;
  }
}

/**
 * 通过symbol获取完整的token信息
 * @param {string} symbol - Token符号
 * @returns {Promise<Object|null>} 完整的token信息
 */
async function getTokenInfoBySymbol(symbol) {
  const mintAddress = TOKEN_MINTS[symbol.toUpperCase()];
  
  if (!mintAddress) {
    console.error(`[getTokenInfoBySymbol] 未找到token: ${symbol}`);
    return null;
  }
  
  console.log(`[getTokenInfoBySymbol] 开始获取 ${symbol} 的token信息...`);
  console.log(`[getTokenInfoBySymbol] Mint地址: ${mintAddress}`);
  
  // 并行获取元信息和价格
  const [metadata, price] = await Promise.all([
    getTokenMetadata(mintAddress),
    getTokenPrice(mintAddress)
  ]);
  
  if (!metadata) {
    console.error(`[getTokenInfoBySymbol] 无法获取 ${symbol} 的元信息`);
    return null;
  }
  
  const tokenInfo = {
    symbol: symbol.toUpperCase(),
    mintAddress,
    name: metadata.name,
    decimals: metadata.decimals,
    logoURI: metadata.logoURI,
    tags: metadata.tags,
    daily_volume: metadata.daily_volume,
    price: price,
    created_at: metadata.created_at,
    extensions: metadata.extensions
  };
  
  console.log(`[getTokenInfoBySymbol] ${symbol} 完整信息:`, tokenInfo);
  
  return tokenInfo;
}

/**
 * 批量获取多个token的信息
 * @param {string[]} symbols - Token符号数组
 * @returns {Promise<Object[]>} Token信息数组
 */
async function getMultipleTokenInfo(symbols) {
  console.log(`[getMultipleTokenInfo] 批量获取token信息: ${symbols.join(', ')}`);
  
  const results = [];
  
  for (const symbol of symbols) {
    try {
      const tokenInfo = await getTokenInfoBySymbol(symbol);
      if (tokenInfo) {
        results.push(tokenInfo);
      }
      
      // 添加延迟避免API限制
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`[getMultipleTokenInfo] 获取 ${symbol} 信息失败:`, error.message);
    }
  }
  
  console.log(`[getMultipleTokenInfo] 批量获取完成，成功获取 ${results.length}/${symbols.length} 个token`);
  
  return results;
}

/**
 * 获取token的decimals
 * @param {string} symbol - Token符号
 * @returns {number} Token的decimals
 */
function getTokenDecimals(symbol) {
  // 常用token的decimals映射
  const decimalsMap = {
    'USDC': 6,
    'USDT': 6,
    'SOL': 9,
    'BONK': 5,
    'JUP': 6,
    'RAY': 6,
    'SRM': 6,
    'MNGO': 6,
    'ORCA': 6,
    'SAMO': 9,
    'COPE': 6,
    'ALEPH': 6,
    'MEDIA': 6,
    'ROPE': 9,
    'STEP': 9,
    'SLND': 6,
    'SNY': 6,
    'MER': 6,
    'TULIP': 6,
    'LIKE': 9,
    'TRUMP': 6
  };
  
  return decimalsMap[symbol.toUpperCase()] || 9; // 默认9位小数
}

/**
 * 格式化token数量
 * @param {string|number} amount - 原始数量
 * @param {number} decimals - Token的decimals
 * @returns {string} 格式化后的数量
 */
function formatTokenAmount(amount, decimals) {
  const numAmount = parseFloat(amount);
  const divisor = Math.pow(10, decimals);
  return (numAmount / divisor).toFixed(decimals);
}

/**
 * 获取本地logo URL
 * @param {string} symbol - Token符号
 * @returns {string} Logo URL
 */
function getLocalLogoUrl(symbol) {
  const tokenSymbol = symbol.toLowerCase();
  const logoMap = {
    'bonk': '/tokens/bonk.png',
    'jup': '/tokens/jup.png',
    'usdt': '/tokens/usdt.png',
    'usdc': '/tokens/usdc.png',
    'sol': '/tokens/sol.png',
    'trump': '/tokens/trump.png',
    'ray': '/tokens/ray.png'
  };
  
  return logoMap[tokenSymbol] || null;
}

/**
 * 创建token对象（用于NewSwap组件）
 * @param {string} symbol - Token符号
 * @param {Object} metadata - Token元信息
 * @param {number} price - Token价格
 * @returns {Object} Token对象
 */
function createTokenObject(symbol, metadata, price = 0) {
  return {
    symbol: symbol.toUpperCase(),
    name: metadata?.name || symbol,
    logo: getLocalLogoUrl(symbol) || metadata?.logoURI || '/favicon.png',
    chain: 'solana',
    chainLogo: '',
    address: metadata?.address || TOKEN_MINTS[symbol.toUpperCase()] || '',
    balance: 0,
    price: price,
    decimals: metadata?.decimals || getTokenDecimals(symbol)
  };
}

/**
 * 根据mint地址获取token信息
 * @param {string} mintAddress - Token的mint地址
 * @returns {Object|null} Token信息
 */
function getTokenInfoByMint(mintAddress) {
  // 先尝试从硬编码数据获取
  const hardcodedData = HARDCODED_TOKEN_DATA[mintAddress];
  if (hardcodedData) {
    return hardcodedData;
  }
  
  // 如果硬编码数据中没有，尝试从TOKEN_MINTS反向查找
  for (const [symbol, mint] of Object.entries(TOKEN_MINTS)) {
    if (mint === mintAddress) {
      return {
        symbol: symbol,
        name: symbol,
        decimals: getTokenDecimals(symbol),
        logoURI: getLocalLogoUrl(symbol),
        address: mintAddress
      };
    }
  }
  
  return null;
}

/**
 * 通过Jupiter API获取token价格
 * @param {string} mintAddress - Token的mint地址
 * @returns {Promise<number>} token价格（USD）
 */
async function getTokenPriceByMint(mintAddress) {
  try {
    console.log(`[getTokenPriceByMint] 获取token价格: ${mintAddress}`);
    
    // 使用Jupiter的lite价格API
    const response = await fetchFunction(`https://lite-api.jup.ag/price/v3?ids=${mintAddress}`);
    
    if (!response.ok) {
      console.warn(`[getTokenPriceByMint] 价格API请求失败: ${response.status}`);
      return 0;
    }
    
    const data = await response.json();
    console.log(`[getTokenPriceByMint] 价格API响应:`, data);
    
    if (data && data[mintAddress] && data[mintAddress].usdPrice) {
      const price = data[mintAddress].usdPrice;
      console.log(`[getTokenPriceByMint] Token价格: $${price}`);
      return price;
    }
    
    console.warn(`[getTokenPriceByMint] 未找到价格数据: ${mintAddress}`);
    return 0;
  } catch (error) {
    console.error(`[getTokenPriceByMint] 获取价格失败: ${mintAddress}`, error.message);
    return 0;
  }
}

/**
 * 通过symbol获取token价格
 * @param {string} symbol - Token符号
 * @returns {Promise<number>} token价格（USD）
 */
async function getTokenPriceBySymbol(symbol) {
  try {
    console.log(`[getTokenPriceBySymbol] 获取token价格: ${symbol}`);
    
    // 先通过symbol获取mint地址
    const tokenInfo = getTokenInfoBySymbol(symbol);
    if (!tokenInfo || !tokenInfo.mintAddress) {
      console.warn(`[getTokenPriceBySymbol] 未找到token信息: ${symbol}`);
      return 0;
    }
    
    // 通过mint地址获取价格
    return await getTokenPriceByMint(tokenInfo.mintAddress);
  } catch (error) {
    console.error(`[getTokenPriceBySymbol] 获取价格失败: ${symbol}`, error.message);
    return 0;
  }
}

/**
 * 批量获取多个token的价格
 * @param {string[]} mintAddresses - Token的mint地址数组
 * @returns {Promise<Object>} 价格映射 {mintAddress: price}
 */
async function getMultipleTokenPrices(mintAddresses) {
  try {
    if (!mintAddresses || mintAddresses.length === 0) {
      return {};
    }
    
    console.log(`[getMultipleTokenPrices] 批量获取价格:`, mintAddresses);
    
    // 使用Jupiter的lite价格API批量获取
    const ids = mintAddresses.join(',');
    const response = await fetchFunction(`https://lite-api.jup.ag/price/v3?ids=${ids}`);
    
    if (!response.ok) {
      console.warn(`[getMultipleTokenPrices] 价格API请求失败: ${response.status}`);
      return {};
    }
    
    const data = await response.json();
    console.log(`[getMultipleTokenPrices] 价格API响应:`, data);
    
    const prices = {};
    if (data) {
      mintAddresses.forEach(mintAddress => {
        if (data[mintAddress] && data[mintAddress].usdPrice) {
          prices[mintAddress] = data[mintAddress].usdPrice;
        } else {
          prices[mintAddress] = 0;
        }
      });
    }
    
    console.log(`[getMultipleTokenPrices] 获取到的价格:`, prices);
    return prices;
  } catch (error) {
    console.error(`[getMultipleTokenPrices] 批量获取价格失败:`, error.message);
    return {};
  }
}

module.exports = {
  TOKEN_MINTS,
  HARDCODED_TOKEN_DATA,
  getTokenMetadata,
  getTokenPrice,
  getTokenInfoBySymbol,
  getTokenInfoByMint,
  getMultipleTokenInfo,
  getTokenDecimals,
  formatTokenAmount,
  getLocalLogoUrl,
  createTokenObject,
  getTokenPriceByMint,
  getTokenPriceBySymbol,
  getMultipleTokenPrices
}; 