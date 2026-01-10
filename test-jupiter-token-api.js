#!/usr/bin/env node

/**
 * Jupiter Token API 测试脚本
 * 测试通过token symbol获取token的元信息（logo、decimals、价格等）
 */

// 常用token的mint地址映射
const TOKEN_MINTS = {
  'SOL': 'So11111111111111111111111111111111111111112',
  'USDC': 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  'USDT': 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  'BONK': 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  'JUP': 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
  'TRUMP': 'TRUMPkKpCb9agJ9TwcqBvKjq5w4BLHUjK5zyJvBcJqX', // Trump token
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

// Jupiter API 端点
const JUPITER_API_BASE = 'https://api.jup.ag/tokens/v1';
const JUPITER_QUOTE_API = 'https://quote-api.jup.ag/v6';
const JUPITER_API_KEY = '9dfe02ba-941a-4c4a-952b-d0cccf5c21e7';

/**
 * 获取token的元信息
 * @param {string} mintAddress - Token的mint地址
 * @returns {Promise<Object>} Token元信息
 */
async function getTokenMetadata(mintAddress) {
  try {
    console.log(`🔍 获取token元信息: ${mintAddress}`);
    
    const response = await fetch(`${JUPITER_API_BASE}/token/${mintAddress}`, {
      headers: {
        'x-api-key': JUPITER_API_KEY
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const tokenData = await response.json();
    
    console.log(`✅ 成功获取token元信息:`, {
      name: tokenData.name,
      symbol: tokenData.symbol,
      decimals: tokenData.decimals,
      logoURI: tokenData.logoURI,
      tags: tokenData.tags,
      daily_volume: tokenData.daily_volume
    });
    
    return tokenData;
  } catch (error) {
    console.error(`❌ 获取token元信息失败: ${mintAddress}`, error.message);
    return null;
  }
}

/**
 * 获取token价格
 * @param {string} mintAddress - Token的mint地址
 * @returns {Promise<Object>} 价格信息
 */
async function getTokenPrice(mintAddress) {
  try {
    console.log(`💰 获取token价格: ${mintAddress}`);
    
    // 使用Jupiter的quote API获取价格
    const response = await fetch(`${JUPITER_QUOTE_API}/quote`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // 查询参数：用1个token换USDC来获取价格
      // 这里使用USDC作为基准货币
      // 注意：URL需要正确编码
    });
    
    // 构建查询URL
    const params = new URLSearchParams({
      inputMint: mintAddress,
      outputMint: TOKEN_MINTS.USDC,
      amount: '1000000', // 1 token (假设6位小数)
      slippageBps: '50'
    });
    
    const quoteResponse = await fetch(`${JUPITER_QUOTE_API}/quote?${params}`);
    
    if (!quoteResponse.ok) {
      throw new Error(`Quote API error! status: ${quoteResponse.status}`);
    }
    
    const quoteData = await quoteResponse.json();
    
    if (quoteData.data) {
      const price = parseFloat(quoteData.data.outAmount) / parseFloat(quoteData.data.inAmount);
      console.log(`✅ Token价格 (相对于USDC): ${price}`);
      return { price, quoteData: quoteData.data };
    } else {
      console.log(`⚠️ 无法获取价格信息`);
      return { price: null, quoteData: null };
    }
  } catch (error) {
    console.error(`❌ 获取token价格失败: ${mintAddress}`, error.message);
    return { price: null, quoteData: null };
  }
}

/**
 * 通过symbol获取token信息
 * @param {string} symbol - Token符号
 * @returns {Promise<Object>} 完整的token信息
 */
async function getTokenInfoBySymbol(symbol) {
  const mintAddress = TOKEN_MINTS[symbol.toUpperCase()];
  
  if (!mintAddress) {
    console.error(`❌ 未找到token: ${symbol}`);
    return null;
  }
  
  console.log(`\n🚀 开始获取 ${symbol} 的token信息...`);
  console.log(`📍 Mint地址: ${mintAddress}`);
  
  // 并行获取元信息和价格
  const [metadata, priceInfo] = await Promise.all([
    getTokenMetadata(mintAddress),
    getTokenPrice(mintAddress)
  ]);
  
  if (!metadata) {
    console.error(`❌ 无法获取 ${symbol} 的元信息`);
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
    price: priceInfo.price,
    quoteData: priceInfo.quoteData,
    created_at: metadata.created_at,
    extensions: metadata.extensions
  };
  
  console.log(`\n📊 ${symbol} 完整信息:`);
  console.log(JSON.stringify(tokenInfo, null, 2));
  
  return tokenInfo;
}

/**
 * 测试所有指定的token
 */
async function testAllTokens() {
  const tokensToTest = ['BONK', 'TRUMP', 'USDC', 'SOL', 'JUP', 'RAY'];
  
  console.log('🧪 开始测试Jupiter Token API...\n');
  
  const results = [];
  
  for (const token of tokensToTest) {
    try {
      const tokenInfo = await getTokenInfoBySymbol(token);
      if (tokenInfo) {
        results.push(tokenInfo);
      }
      
      // 添加延迟避免API限制
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`❌ 测试 ${token} 时出错:`, error.message);
    }
  }
  
  console.log('\n📋 测试结果汇总:');
  console.log('='.repeat(80));
  
  results.forEach((token, index) => {
    console.log(`${index + 1}. ${token.symbol}`);
    console.log(`   名称: ${token.name}`);
    console.log(`   地址: ${token.mintAddress}`);
    console.log(`   精度: ${token.decimals}`);
    console.log(`   价格: ${token.price ? `$${token.price.toFixed(6)}` : 'N/A'}`);
    console.log(`   Logo: ${token.logoURI}`);
    console.log(`   标签: ${token.tags?.join(', ') || 'N/A'}`);
    console.log(`   日交易量: ${token.daily_volume || 'N/A'}`);
    console.log('');
  });
  
  console.log(`✅ 测试完成! 成功获取 ${results.length}/${tokensToTest.length} 个token的信息`);
  
  return results;
}

/**
 * 测试单个token
 */
async function testSingleToken(symbol) {
  console.log(`🧪 测试单个token: ${symbol}\n`);
  
  const tokenInfo = await getTokenInfoBySymbol(symbol);
  
  if (tokenInfo) {
    console.log(`\n✅ ${symbol} 测试成功!`);
  } else {
    console.log(`\n❌ ${symbol} 测试失败!`);
  }
  
  return tokenInfo;
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    // 没有参数，测试所有token
    await testAllTokens();
  } else if (args.length === 1) {
    // 一个参数，测试指定token
    await testSingleToken(args[0]);
  } else {
    console.log('用法:');
    console.log('  node test-jupiter-token-api.js                    # 测试所有token');
    console.log('  node test-jupiter-token-api.js BONK              # 测试指定token');
    console.log('  node test-jupiter-token-api.js TRUMP USDC SOL    # 测试多个token');
  }
}

// 错误处理
process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
  process.exit(1);
});

// 运行主函数
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  getTokenMetadata,
  getTokenPrice,
  getTokenInfoBySymbol,
  testAllTokens,
  testSingleToken,
  TOKEN_MINTS
}; 