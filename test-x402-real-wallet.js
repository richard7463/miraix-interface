// 使用真实钱包地址测试 X402 功能
const fetch = require('node-fetch');
const { HttpsProxyAgent } = require('https-proxy-agent');

// 代理配置
const PROXY_URL = 'http://localhost:7890';
const agent = new HttpsProxyAgent(PROXY_URL);

// 真实的 Solana 钱包地址示例
const REAL_WALLET_ADDRESS = 'DjVE6JNiYqPL2QXyCUUh8rNjHrbz9hXHNYt99MQ59qw1';

async function testWithRealWallet() {
  console.log('使用真实钱包地址测试 X402 功能...\n');

  const testCases = [
    {
      name: 'X402 开启 - 真实钱包',
      url: 'http://localhost:3009/api/chat-new',
      params: {
        message: 'swap 0.001 SOL to USDC',
        walletAddress: REAL_WALLET_ADDRESS,
        mintPubkey: null,
        enableX402Payment: true
      }
    },
    {
      name: 'X402 关闭 - 真实钱包',
      url: 'http://localhost:3009/api/chat-new',
      params: {
        message: 'swap 0.001 SOL to USDC',
        walletAddress: REAL_WALLET_ADDRESS,
        mintPubkey: null,
        enableX402Payment: false
      }
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n========================================`);
    console.log(`测试: ${testCase.name}`);
    console.log(`========================================`);
    console.log('enableX402Payment:', testCase.params.enableX402Payment);

    try {
      const response = await fetch(testCase.url, {
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

      const responseData = await response.json();
      
      console.log('\n响应状态:', response.status);
      console.log('success:', responseData.success);
      console.log('message:', responseData.message?.substring(0, 150));
      console.log('error:', responseData.error || '无');
      
      // 详细检查 thoughts
      console.log('\n处理流程 (Thoughts):');
      if (responseData.thoughts) {
        responseData.thoughts.forEach((thought, index) => {
          console.log(`  ${index + 1}. ${thought}`);
        });
      }

      // 检查 quote
      console.log('\nQuote 信息:');
      console.log('  quote 存在:', !!responseData.quote);
      if (responseData.quote && Object.keys(responseData.quote).length > 0) {
        console.log('  quote 数据:', JSON.stringify(responseData.quote, null, 2));
      } else {
        console.log('  quote 数据: 空');
      }

    } catch (error) {
      console.error('测试失败:', error.message);
    }

    // 等待2秒
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('\n\n测试完成!');
}

testWithRealWallet().catch(console.error);
