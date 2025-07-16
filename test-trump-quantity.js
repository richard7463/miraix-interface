#!/usr/bin/env node

/**
 * TRUMP Token 数量计算测试脚本
 * 分析为什么TRUMP数量显示为0
 */

// TRUMP token信息
const TRUMP_TOKEN = {
  symbol: 'TRUMP',
  name: 'TRUMP',
  address: 'TRUMPkKpCb9agJ9TwcqBvKjq5w4BLHUjK5zyJvBcJqX',
  decimals: 6
};

// 模拟quote数据
const mockQuote = {
  inputMint: 'So11111111111111111111111111111111111111112', // SOL
  inAmount: '5000000000', // 5 SOL (9 decimals)
  outputMint: 'TRUMPkKpCb9agJ9TwcqBvKjq5w4BLHUjK5zyJvBcJqX', // TRUMP
  outAmount: '1000000', // 1 TRUMP (6 decimals)
  priceImpactPct: '0.5',
  swapUsdValue: '760.00'
};

console.log('🔍 TRUMP Token 数量计算分析');
console.log('=====================================');

console.log('\n📋 Token信息:');
console.log('TRUMP Symbol:', TRUMP_TOKEN.symbol);
console.log('TRUMP Address:', TRUMP_TOKEN.address);
console.log('TRUMP Decimals:', TRUMP_TOKEN.decimals);

console.log('\n📊 Quote数据:');
console.log('Input Mint (SOL):', mockQuote.inputMint);
console.log('Input Amount (raw):', mockQuote.inAmount);
console.log('Output Mint (TRUMP):', mockQuote.outputMint);
console.log('Output Amount (raw):', mockQuote.outAmount);
console.log('Price Impact:', mockQuote.priceImpactPct + '%');
console.log('Swap USD Value:', '$' + mockQuote.swapUsdValue);

// 计算SOL数量
const solDecimals = 9;
const solAmount = parseInt(mockQuote.inAmount) / Math.pow(10, solDecimals);
console.log('\n💰 SOL数量计算:');
console.log('Raw amount:', mockQuote.inAmount);
console.log('SOL decimals:', solDecimals);
console.log('Calculated SOL:', solAmount);

// 计算TRUMP数量
const trumpDecimals = 6;
const trumpAmount = parseInt(mockQuote.outAmount) / Math.pow(10, trumpDecimals);
console.log('\n🎯 TRUMP数量计算:');
console.log('Raw amount:', mockQuote.outAmount);
console.log('TRUMP decimals:', trumpDecimals);
console.log('Calculated TRUMP:', trumpAmount);

// 检查NewSwap组件中的计算逻辑
console.log('\n🔧 NewSwap组件计算逻辑分析:');

// 模拟fromToken
const fromToken = {
  symbol: 'SOL',
  decimals: 9,
  price: 152.37
};

// 模拟toToken
const toToken = {
  symbol: 'TRUMP',
  decimals: 6,
  price: 0
};

console.log('From Token (SOL):', {
  symbol: fromToken.symbol,
  decimals: fromToken.decimals,
  price: fromToken.price
});

console.log('To Token (TRUMP):', {
  symbol: toToken.symbol,
  decimals: toToken.decimals,
  price: toToken.price
});

// 模拟NewSwap中的数量计算
const fromAmount = '5'; // 用户输入的5 SOL
const toAmount = (parseInt(mockQuote.outAmount) / Math.pow(10, toToken.decimals)).toString();

console.log('\n📈 最终显示数量:');
console.log('From Amount (用户输入):', fromAmount);
console.log('To Amount (计算得出):', toAmount);
console.log('To Amount (数值):', parseFloat(toAmount));

// 检查是否显示为0的原因
console.log('\n❓ 问题分析:');
console.log('1. TRUMP decimals是否正确:', trumpDecimals === 6 ? '✅ 正确' : '❌ 错误');
console.log('2. Quote outAmount是否存在:', mockQuote.outAmount ? '✅ 存在' : '❌ 不存在');
console.log('3. outAmount是否为0:', mockQuote.outAmount === '0' ? '❌ 为0' : '✅ 不为0');
console.log('4. 计算结果是否为0:', parseFloat(toAmount) === 0 ? '❌ 为0' : '✅ 不为0');

// 测试不同的outAmount值
console.log('\n🧪 测试不同outAmount值:');
const testAmounts = ['0', '1000000', '100000', '10000', '1000', '100', '10', '1'];
testAmounts.forEach(rawAmount => {
  const calculated = parseInt(rawAmount) / Math.pow(10, trumpDecimals);
  console.log(`Raw: ${rawAmount} -> Calculated: ${calculated}`);
});

// 检查Jupiter API返回的实际数据
console.log('\n🌐 Jupiter API数据检查:');
console.log('如果TRUMP数量显示为0，可能的原因:');
console.log('1. Jupiter API返回的outAmount为0或null');
console.log('2. TRUMP token的decimals配置错误');
console.log('3. Quote数据中的outputMint地址不匹配');
console.log('4. 网络请求失败或超时');

console.log('\n💡 建议解决方案:');
console.log('1. 检查Jupiter API返回的完整quote数据');
console.log('2. 确认TRUMP token的decimals为6');
console.log('3. 验证outputMint地址是否正确');
console.log('4. 添加调试日志输出raw outAmount值');
console.log('5. 检查是否有错误处理导致数量被重置为0'); 