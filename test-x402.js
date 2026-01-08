// 测试后端 X402 自动支付功能的脚本
const fetch = require('node-fetch');
const { HttpsProxyAgent } = require('https-proxy-agent');

// 代理配置
const PROXY_URL = 'http://localhost:7890';
const agent = new HttpsProxyAgent(PROXY_URL);

// 测试配置
const PROD_API_URL = 'https://langgraph-defai.vercel.app/api/chat-new';
const LOCAL_API_URL = 'http://localhost:3009/api/chat-new';

// 测试用例
const testCases = [
  {
    name: '测试 X402 开启 (enableX402Payment: true)',
    params: {
      message: 'swap 0.1 SOL to USDC',
      walletAddress: 'test-wallet-address-12345',
      mintPubkey: 'test-mint-pubkey-67890',
      enableX402Payment: true
    }
  },
  {
    name: '测试 X402 关闭 (enableX402Payment: false)',
    params: {
      message: 'swap 0.1 SOL to USDC',
      walletAddress: 'test-wallet-address-12345',
      mintPubkey: 'test-mint-pubkey-67890',
      enableX402Payment: false
    }
  },
  {
    name: '测试创建代币 X402 开启',
    params: {
      message: 'create a token called TEST with description "This is a test token"',
      walletAddress: 'test-wallet-address-12345',
      mintPubkey: null,
      enableX402Payment: true
    }
  }
];

async function testX402(apiUrl, testCase) {
  console.log(`\n========================================`);
  console.log(`测试: ${testCase.name}`);
  console.log(`API URL: ${apiUrl}`);
  console.log(`========================================`);

  try {
    console.log('请求数据:');
    console.log(JSON.stringify(testCase.params, null, 2));

    const response = await fetch(apiUrl, {
      method: 'POST',
      agent: agent,
      headers: {
        'Content-Type': 'application/json',
        'signature': '0x1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890',
        'message': `AI response for: ${testCase.params.message}`,
        'address': testCase.params.walletAddress
      },
      body: JSON.stringify(testCase.params)
    });

    console.log('\n响应状态:', response.status, response.statusText);
    console.log('响应头:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('\n错误响应:', errorText);
      return { success: false, error: errorText };
    }

    const responseData = await response.json();
    console.log('\n✅ 成功响应:');
    console.log(JSON.stringify(responseData, null, 2));

    // 检查关键字段
    console.log('\n关键信息检查:');
    console.log('- success:', responseData.success);
    console.log('- message:', responseData.message?.substring(0, 100));
    console.log('- quote 存在:', !!responseData.quote);
    console.log('- result.quote.value 存在:', !!responseData.result?.quote?.value);
    console.log('- error 存在:', !!responseData.error);

    if (responseData.error) {
      console.log('- error 详情:', responseData.error);
    }

    return { success: true, data: responseData };

  } catch (error) {
    console.error('\n❌ 请求失败:', error.message);
    console.error('错误详情:', error);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('开始测试后端 X402 功能...\n');

  // 先测试本地后端（如果可用）
  console.log('首先测试本地后端 (localhost:3009)...');
  let localResults = [];

  for (const testCase of testCases) {
    const result = await testX402(LOCAL_API_URL, testCase);
    localResults.push({ name: testCase.name, ...result });
    // 等待1秒避免请求过快
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n\n========================================');
  console.log('本地后端测试结果汇总');
  console.log('========================================');
  localResults.forEach((result, index) => {
    console.log(`${index + 1}. ${result.name}: ${result.success ? '✅ 成功' : '❌ 失败'}`);
    if (!result.success) {
      console.log(`   错误: ${result.error}`);
    }
  });

  // 测试生产环境后端
  console.log('\n\n========================================');
  console.log('测试生产环境后端 (vercel.app)...');
  console.log('========================================');

  for (const testCase of testCases) {
    const result = await testX402(PROD_API_URL, testCase);
    // 等待1秒避免请求过快
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n\n测试完成!');
}

// 运行测试
runTests().catch(console.error);
