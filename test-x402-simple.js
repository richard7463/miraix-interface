// 简化的 X402 测试
const fetch = require('node-fetch');
const { HttpsProxyAgent } = require('https-proxy-agent');

const PROXY_URL = 'http://localhost:7890';
const agent = new HttpsProxyAgent(PROXY_URL);

async function testX402() {
  console.log('测试 X402 参数传递...\n');

  const testData = {
    message: 'swap 0.001 SOL to USDC',
    walletAddress: 'DjVE6JNiYqPL2QXyCUUh8rNjHrbz9hXHNYt99MQ59qw1',
    mintPubkey: null,
    enableX402Payment: true
  };

  console.log('发送的数据:');
  console.log(JSON.stringify(testData, null, 2));

  try {
    const response = await fetch('http://localhost:3009/api/chat-new', {
      method: 'POST',
      agent: agent,
      headers: {
        'Content-Type': 'application/json',
        'signature': 'test-signature',
        'message': 'test',
        'address': testData.walletAddress
      },
      body: JSON.stringify(testData)
    });

    console.log('\n响应状态:', response.status);

    const responseData = await response.json();

    console.log('\n响应数据:');
    console.log('success:', responseData.success);
    console.log('enableX402Payment in thoughts:', responseData.thoughts?.some(t => t.includes('X402')));

    // 检查后端是否接收到参数
    if (responseData.data && responseData.data.enableX402Payment !== undefined) {
      console.log('\n✅ 后端接收到了 enableX402Payment 参数');
      console.log('值:', responseData.data.enableX402Payment);
    } else {
      console.log('\n⚠️  后端可能没有返回 enableX402Payment 参数');
    }

  } catch (error) {
    console.error('测试失败:', error.message);
  }
}

testX402();
