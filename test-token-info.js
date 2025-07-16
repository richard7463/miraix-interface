#!/usr/bin/env node

/**
 * 测试Jupiter API获取token信息
 */

const { getTokenInfoBySymbol, getMultipleTokenInfo } = require('./utils/tokenInfo.js');

// 测试单个token
async function testSingleToken() {
  console.log('🧪 测试单个token信息获取...\n');
  
  const testSymbols = ['SOL', 'BONK', 'USDC', 'JUP', 'TRUMP'];
  
  for (const symbol of testSymbols) {
    try {
      console.log(`\n📊 获取 ${symbol} 信息:`);
      const tokenInfo = await getTokenInfoBySymbol(symbol);
      
      if (tokenInfo) {
        console.log(`✅ ${symbol} 信息获取成功:`);
        console.log(`   Symbol: ${tokenInfo.symbol}`);
        console.log(`   Name: ${tokenInfo.name}`);
        console.log(`   Mint Address: ${tokenInfo.mintAddress}`);
        console.log(`   Decimals: ${tokenInfo.decimals}`);
        console.log(`   Logo: ${tokenInfo.logoURI}`);
        console.log(`   Price: $${tokenInfo.price || 'N/A'}`);
        console.log(`   Daily Volume: $${tokenInfo.daily_volume || 'N/A'}`);
      } else {
        console.log(`❌ ${symbol} 信息获取失败`);
      }
    } catch (error) {
      console.error(`❌ 获取 ${symbol} 信息时出错:`, error.message);
    }
    
    // 添加延迟避免API限制
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

// 测试批量获取
async function testBatchTokens() {
  console.log('\n🧪 测试批量token信息获取...\n');
  
  const symbols = ['SOL', 'BONK', 'USDC', 'JUP'];
  const results = await getMultipleTokenInfo(symbols);
  
  console.log(`✅ 批量获取完成，成功获取 ${results.length}/${symbols.length} 个token:`);
  results.forEach(token => {
    console.log(`   ${token.symbol}: ${token.name} (${token.decimals} decimals)`);
  });
}

// 主测试函数
async function runTests() {
  console.log('🚀 开始测试Jupiter API token信息获取...\n');
  
  await testSingleToken();
  await testBatchTokens();
  
  console.log('\n✅ 所有测试完成!');
}

// 运行测试
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests }; 