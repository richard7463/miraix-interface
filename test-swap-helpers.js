#!/usr/bin/env node

/**
 * 测试swap辅助工具
 */

const { formatQuoteForNewSwap, createTokensFromSwapEntities } = require('./utils/swapHelpers.js');

// 测试用的quote数据
const testQuote = {
  "inputMint": "So11111111111111111111111111111111111111112",
  "inAmount": "1000000000",
  "outputMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "outAmount": "146945900",
  "otherAmountThreshold": "146211171",
  "swapMode": "ExactIn",
  "slippageBps": 50,
  "platformFee": null,
  "priceImpactPct": "0",
  "swapUsdValue": "146.88552453143958331044367243"
};

// 测试用的swapEntities数据
const testSwapEntities = {
  fromToken: "So11111111111111111111111111111111111111112",
  toToken: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
  amount: "10",
  network: "solana"
};

// 测试BONK的quote数据
const testBonkQuote = {
  "inputMint": "So11111111111111111111111111111111111111112",
  "inAmount": "1000000000",
  "outputMint": "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
  "outAmount": "953402751265",
  "otherAmountThreshold": "948635737509",
  "swapMode": "ExactIn",
  "slippageBps": 50,
  "platformFee": null,
  "priceImpactPct": "0",
  "swapUsdValue": "153.910599766058966567585692"
};

/**
 * 测试formatQuoteForNewSwap函数
 */
function testFormatQuoteForNewSwap() {
  console.log('\n🧪 测试 formatQuoteForNewSwap 函数...');
  
  // 测试SOL到USDC
  console.log('\n1. 测试 SOL → USDC:');
  const solUsdcResult = formatQuoteForNewSwap(testQuote);
  if (solUsdcResult) {
    console.log('✅ SOL → USDC 格式化成功:');
    console.log(`   From: ${solUsdcResult.fromToken.symbol} (${solUsdcResult.fromAmount})`);
    console.log(`   To: ${solUsdcResult.toToken.symbol} (${solUsdcResult.toAmount})`);
    console.log(`   From Logo: ${solUsdcResult.fromToken.logo}`);
    console.log(`   To Logo: ${solUsdcResult.toToken.logo}`);
    console.log(`   From Decimals: ${solUsdcResult.fromToken.decimals}`);
    console.log(`   To Decimals: ${solUsdcResult.toToken.decimals}`);
  } else {
    console.log('❌ SOL → USDC 格式化失败');
  }
  
  // 测试SOL到BONK
  console.log('\n2. 测试 SOL → BONK:');
  const solBonkResult = formatQuoteForNewSwap(testBonkQuote);
  if (solBonkResult) {
    console.log('✅ SOL → BONK 格式化成功:');
    console.log(`   From: ${solBonkResult.fromToken.symbol} (${solBonkResult.fromAmount})`);
    console.log(`   To: ${solBonkResult.toToken.symbol} (${solBonkResult.toAmount})`);
    console.log(`   From Logo: ${solBonkResult.fromToken.logo}`);
    console.log(`   To Logo: ${solBonkResult.toToken.logo}`);
    console.log(`   From Decimals: ${solBonkResult.fromToken.decimals}`);
    console.log(`   To Decimals: ${solBonkResult.toToken.decimals}`);
  } else {
    console.log('❌ SOL → BONK 格式化失败');
  }
}

/**
 * 测试createTokensFromSwapEntities函数
 */
function testCreateTokensFromSwapEntities() {
  console.log('\n🧪 测试 createTokensFromSwapEntities 函数...');
  
  // 测试不带quote
  console.log('\n1. 测试不带quote数据:');
  const result1 = createTokensFromSwapEntities(testSwapEntities);
  if (result1) {
    console.log('✅ 不带quote数据创建成功:');
    console.log(`   From: ${result1.fromToken.symbol} (${result1.fromAmount})`);
    console.log(`   To: ${result1.toToken.symbol} (${result1.toAmount})`);
    console.log(`   From Logo: ${result1.fromToken.logo}`);
    console.log(`   To Logo: ${result1.toToken.logo}`);
  } else {
    console.log('❌ 不带quote数据创建失败');
  }
  
  // 测试带quote
  console.log('\n2. 测试带quote数据:');
  const result2 = createTokensFromSwapEntities(testSwapEntities, testBonkQuote);
  if (result2) {
    console.log('✅ 带quote数据创建成功:');
    console.log(`   From: ${result2.fromToken.symbol} (${result2.fromAmount})`);
    console.log(`   To: ${result2.toToken.symbol} (${result2.toAmount})`);
    console.log(`   From Logo: ${result2.fromToken.logo}`);
    console.log(`   To Logo: ${result2.toToken.logo}`);
  } else {
    console.log('❌ 带quote数据创建失败');
  }
}

/**
 * 测试token信息获取
 */
function testTokenInfo() {
  console.log('\n🧪 测试token信息获取...');
  
  const { getTokenInfoByMint } = require('./utils/tokenInfo.js');
  
  const testMints = [
    'So11111111111111111111111111111111111111112', // SOL
    'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', // BONK
    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
    'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN'  // JUP
  ];
  
  testMints.forEach(mint => {
    const tokenInfo = getTokenInfoByMint(mint);
    if (tokenInfo) {
      console.log(`✅ ${tokenInfo.symbol}: ${tokenInfo.name} (${tokenInfo.decimals} decimals)`);
      console.log(`   Logo: ${tokenInfo.logoURI}`);
    } else {
      console.log(`❌ 未找到token信息: ${mint}`);
    }
  });
}

/**
 * 主测试函数
 */
async function runTests() {
  console.log('🚀 开始测试swap辅助工具...\n');
  
  testTokenInfo();
  testFormatQuoteForNewSwap();
  testCreateTokensFromSwapEntities();
  
  console.log('\n✅ 所有测试完成!');
}

// 运行测试
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests }; 