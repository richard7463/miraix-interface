#!/usr/bin/env node

/**
 * 测试Jupiter API获取TRUMP token的实际quote数据
 */

const fetch = require('node-fetch');

// Jupiter Quote API
const JUPITER_QUOTE_API = 'https://quote-api.jup.ag/v6';

// Token地址
const TOKENS = {
  SOL: 'So11111111111111111111111111111111111111112',
  TRUMP: 'TRUMPkKpCb9agJ9TwcqBvKjq5w4BLHUjK5zyJvBcJqX',
  BONK: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263'
};

async function getJupiterQuote(inputMint, outputMint, amount, slippageBps = 50) {
  try {
    const params = new URLSearchParams({
      inputMint: inputMint,
      outputMint: outputMint,
      amount: amount.toString(),
      slippageBps: slippageBps.toString()
    });
    
    console.log(`🔍 请求Jupiter Quote API:`);
    console.log(`URL: ${JUPITER_QUOTE_API}/quote?${params}`);
    
    const response = await fetch(`${JUPITER_QUOTE_API}/quote?${params}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ 获取quote失败:', error.message);
    return null;
  }
}

function formatTokenAmount(amount, decimals) {
  return (parseInt(amount) / Math.pow(10, decimals)).toString();
}

async function testTrumpQuote() {
  console.log('🚀 测试TRUMP Token Quote数据');
  console.log('=====================================');
  
  // 测试SOL -> TRUMP
  console.log('\n📊 测试 SOL -> TRUMP:');
  const solAmount = 5 * Math.pow(10, 9); // 5 SOL (9 decimals)
  
  const quoteData = await getJupiterQuote(
    TOKENS.SOL,
    TOKENS.TRUMP,
    solAmount,
    50
  );
  
  if (quoteData && quoteData.data) {
    const quote = quoteData.data;
    
    console.log('\n✅ Quote数据获取成功:');
    console.log('Input Mint:', quote.inputMint);
    console.log('Output Mint:', quote.outputMint);
    console.log('In Amount (raw):', quote.inAmount);
    console.log('Out Amount (raw):', quote.outAmount);
    console.log('Price Impact:', quote.priceImpactPct + '%');
    console.log('Swap USD Value:', quote.swapUsdValue);
    
    // 计算实际数量
    const solDecimals = 9;
    const trumpDecimals = 6;
    
    const solAmountFormatted = formatTokenAmount(quote.inAmount, solDecimals);
    const trumpAmountFormatted = formatTokenAmount(quote.outAmount, trumpDecimals);
    
    console.log('\n💰 格式化后的数量:');
    console.log('SOL Amount:', solAmountFormatted);
    console.log('TRUMP Amount:', trumpAmountFormatted);
    
    // 检查是否为0
    console.log('\n❓ 数量检查:');
    console.log('TRUMP raw amount是否为0:', quote.outAmount === '0');
    console.log('TRUMP formatted amount是否为0:', parseFloat(trumpAmountFormatted) === 0);
    console.log('TRUMP amount数值:', parseFloat(trumpAmountFormatted));
    
    // 检查decimals
    console.log('\n🔧 Decimals检查:');
    console.log('使用的SOL decimals:', solDecimals);
    console.log('使用的TRUMP decimals:', trumpDecimals);
    
    // 测试不同的decimals
    console.log('\n🧪 测试不同decimals:');
    const testDecimals = [4, 5, 6, 7, 8, 9];
    testDecimals.forEach(decimals => {
      const amount = formatTokenAmount(quote.outAmount, decimals);
      console.log(`TRUMP decimals ${decimals}: ${amount}`);
    });
    
  } else {
    console.log('❌ 无法获取quote数据');
    console.log('Response:', quoteData);
  }
  
  // 测试BONK -> TRUMP作为对比
  console.log('\n📊 测试 BONK -> TRUMP (对比):');
  const bonkAmount = 1000000 * Math.pow(10, 5); // 1M BONK (5 decimals)
  
  const bonkQuoteData = await getJupiterQuote(
    TOKENS.BONK,
    TOKENS.TRUMP,
    bonkAmount,
    50
  );
  
  if (bonkQuoteData && bonkQuoteData.data) {
    const bonkQuote = bonkQuoteData.data;
    
    console.log('\n✅ BONK Quote数据:');
    console.log('In Amount (raw):', bonkQuote.inAmount);
    console.log('Out Amount (raw):', bonkQuote.outAmount);
    
    const bonkDecimals = 5;
    const bonkAmountFormatted = formatTokenAmount(bonkQuote.inAmount, bonkDecimals);
    const trumpAmountFormatted2 = formatTokenAmount(bonkQuote.outAmount, trumpDecimals);
    
    console.log('BONK Amount:', bonkAmountFormatted);
    console.log('TRUMP Amount:', trumpAmountFormatted2);
  }
}

// 运行测试
testTrumpQuote().catch(console.error); 