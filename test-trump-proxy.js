#!/usr/bin/env node

/**
 * 使用代理和非代理测试Jupiter API获取TRUMP token数据
 * 基于之前成功的代理实现
 */

const http = require('http');
const https = require('https');

// Jupiter Quote API
const JUPITER_QUOTE_API = 'https://quote-api.jup.ag/v6';

// Token地址
const TOKENS = {
  SOL: 'So11111111111111111111111111111111111111112',
  TRUMP: '6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN',
  BONK: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263'
};

// 使用HTTP代理的fetch函数（基于之前成功的实现）
function fetchWithProxy(url, options = {}) {
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
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
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
        console.log(`📡 代理响应状态: ${res.statusCode}`);
        console.log(`📡 代理响应头:`, res.headers);
        if (data) {
          console.log(`📡 代理响应体:`, data.substring(0, 500));
        }
        
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          statusText: res.statusMessage,
          json: () => Promise.resolve(JSON.parse(data))
        });
      });
    });

    req.on('error', (error) => {
      console.error('📡 代理请求错误:', error.message);
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
}

// 直接fetch函数（不使用代理）
async function fetchDirect(url, options = {}) {
  const fetch = require('node-fetch');
  return fetch(url, {
    ...options,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Accept': 'application/json',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache',
      ...options.headers
    },
    timeout: 10000
  });
}

async function getJupiterQuote(inputMint, outputMint, amount, slippageBps = 50, useProxy = false) {
  try {
    const params = new URLSearchParams({
      inputMint: inputMint,
      outputMint: outputMint,
      amount: amount.toString(),
      slippageBps: slippageBps.toString()
    });
    
    const url = `${JUPITER_QUOTE_API}/quote?${params}`;
    console.log(`🔍 [${useProxy ? '代理' : '直连'}] 请求Jupiter Quote API:`);
    console.log(`URL: ${url}`);
    
    const startTime = Date.now();
    const response = useProxy ? await fetchWithProxy(url) : await fetchDirect(url);
    const endTime = Date.now();
    
    console.log(`⏱️ 请求耗时: ${endTime - startTime}ms`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`❌ [${useProxy ? '代理' : '直连'}] 获取quote失败:`, error.message);
    return null;
  }
}

function formatTokenAmount(amount, decimals) {
  return (parseInt(amount) / Math.pow(10, decimals)).toString();
}

async function testTrumpQuote() {
  console.log('🚀 测试TRUMP Token Quote数据（代理 vs 直连）');
  console.log('=====================================');
  
  const solAmount = 5 * Math.pow(10, 9); // 5 SOL (9 decimals)
  
  // 测试直连
  console.log('\n📊 测试直连请求:');
  const directQuoteData = await getJupiterQuote(
    TOKENS.SOL,
    TOKENS.TRUMP,
    solAmount,
    50,
    false
  );
  
  if (directQuoteData && directQuoteData.data) {
    const quote = directQuoteData.data;
    
    console.log('✅ 直连请求成功:');
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
    
  } else {
    console.log('❌ 直连请求失败');
  }
  
  // 等待一下再测试代理
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 测试代理
  console.log('\n📊 测试代理请求:');
  const proxyQuoteData = await getJupiterQuote(
    TOKENS.SOL,
    TOKENS.TRUMP,
    solAmount,
    50,
    true
  );
  
  if (proxyQuoteData && proxyQuoteData.data) {
    const quote = proxyQuoteData.data;
    
    console.log('✅ 代理请求成功:');
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
    
  } else {
    console.log('❌ 代理请求失败');
  }
  
  // 测试BONK -> TRUMP作为对比
  console.log('\n📊 测试 BONK -> TRUMP (对比):');
  const bonkAmount = 1000000 * Math.pow(10, 5); // 1M BONK (5 decimals)
  
  const bonkQuoteData = await getJupiterQuote(
    TOKENS.BONK,
    TOKENS.TRUMP,
    bonkAmount,
    50,
    true // 使用代理
  );
  
  if (bonkQuoteData && bonkQuoteData.data) {
    const bonkQuote = bonkQuoteData.data;
    
    console.log('\n✅ BONK Quote数据:');
    console.log('In Amount (raw):', bonkQuote.inAmount);
    console.log('Out Amount (raw):', bonkQuote.outAmount);
    
    const bonkDecimals = 5;
    const trumpDecimals = 6;
    const bonkAmountFormatted = formatTokenAmount(bonkQuote.inAmount, bonkDecimals);
    const trumpAmountFormatted2 = formatTokenAmount(bonkQuote.outAmount, trumpDecimals);
    
    console.log('BONK Amount:', bonkAmountFormatted);
    console.log('TRUMP Amount:', trumpAmountFormatted2);
  }
  
  // 使用curl测试
  console.log('\n🔧 使用curl测试:');
  const { exec } = require('child_process');
  
  // 测试SOL -> TRUMP
  const curlCommand = `curl -s -x http://127.0.0.1:7890 "https://quote-api.jup.ag/v6/quote?inputMint=${TOKENS.SOL}&outputMint=${TOKENS.TRUMP}&amount=${solAmount}&slippageBps=50"`;
  
  exec(curlCommand, (error, stdout, stderr) => {
    if (error) {
      console.log('❌ curl命令失败:', error.message);
      return;
    }
    
    console.log('✅ curl命令成功');
    console.log('curl响应:', stdout.substring(0, 500));
    
    try {
      const data = JSON.parse(stdout);
      if (data.data) {
        console.log('Out Amount (raw):', data.data.outAmount);
        const trumpAmount = formatTokenAmount(data.data.outAmount, 6);
        console.log('TRUMP Amount:', trumpAmount);
      } else if (data.error) {
        console.log('API错误:', data.error);
      }
    } catch (parseError) {
      console.log('❌ 解析curl响应失败:', parseError.message);
    }
  });
}

// 运行测试
testTrumpQuote().catch(console.error); 