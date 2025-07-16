#!/usr/bin/env node

/**
 * 测试 Jupiter API 返回的价格数据
 */

const https = require('https');

async function testJupiterQuote() {
  console.log('🔍 测试 Jupiter API 价格数据');
  console.log('=====================================');
  
  const quoteData = {
    "inputMint": "So11111111111111111111111111111111111111112", // SOL
    "outputMint": "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263", // BONK
    "amount": "1000000000", // 1 SOL (9 decimals)
    "slippageBps": 50,
    "swapMode": "ExactIn",
    "onlyDirectRoutes": false,
    "asLegacyTransaction": false
  };

  const postData = JSON.stringify(quoteData);
  
  const options = {
    hostname: 'quote-api.jup.ag',
    port: 443,
    path: '/v6/quote',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('📊 Jupiter API 响应:');
          console.log('Status:', res.statusCode);
          console.log('swapUsdValue:', response.swapUsdValue);
          console.log('inAmount:', response.inAmount);
          console.log('outAmount:', response.outAmount);
          console.log('priceImpactPct:', response.priceImpactPct);
          
          // 计算实际价格
          const inAmount = parseInt(response.inAmount);
          const outAmount = parseInt(response.outAmount);
          const usdValue = parseFloat(response.swapUsdValue);
          
          console.log('\n🔍 价格分析:');
          console.log('输入金额 (lamports):', inAmount);
          console.log('输出金额 (BONK):', outAmount);
          console.log('USD 价值:', usdValue);
          console.log('计算的 SOL 价格:', usdValue, 'USD');
          
          resolve(response);
        } catch (error) {
          console.error('❌ 解析响应失败:', error);
          console.log('原始响应:', data);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ 请求失败:', error);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// 测试多个不同的 swap
async function testMultipleQuotes() {
  console.log('🧪 测试多个 swap 的价格一致性');
  console.log('=====================================');
  
  const tests = [
    {
      name: 'SOL -> USDC',
      inputMint: 'So11111111111111111111111111111111111111112',
      outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      amount: '1000000000' // 1 SOL
    },
    {
      name: 'SOL -> BONK',
      inputMint: 'So11111111111111111111111111111111111111112',
      outputMint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
      amount: '1000000000' // 1 SOL
    }
  ];
  
  for (const test of tests) {
    console.log(`\n📊 测试: ${test.name}`);
    console.log('-'.repeat(30));
    
    try {
      const quoteData = {
        "inputMint": test.inputMint,
        "outputMint": test.outputMint,
        "amount": test.amount,
        "slippageBps": 50,
        "swapMode": "ExactIn",
        "onlyDirectRoutes": false,
        "asLegacyTransaction": false
      };

      const postData = JSON.stringify(quoteData);
      
      const options = {
        hostname: 'quote-api.jup.ag',
        port: 443,
        path: '/v6/quote',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
      };

      const response = await new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
          let data = '';
          res.on('data', (chunk) => data += chunk);
          res.on('end', () => {
            try {
              resolve(JSON.parse(data));
            } catch (error) {
              reject(error);
            }
          });
        });
        req.on('error', reject);
        req.write(postData);
        req.end();
      });
      
      console.log('swapUsdValue:', response.swapUsdValue);
      console.log('outAmount:', response.outAmount);
      
    } catch (error) {
      console.error('❌ 测试失败:', error.message);
    }
  }
}

// 运行测试
async function main() {
  try {
    await testJupiterQuote();
    console.log('\n' + '='.repeat(50));
    await testMultipleQuotes();
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

main(); 