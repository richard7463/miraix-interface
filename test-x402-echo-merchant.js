// 使用PayAI Echo Merchant测试完整的X402流程
const { Connection, Keypair, Transaction, SystemProgram, sendAndConfirmTransaction } = require('@solana/web3.js');
const { base58 } = require('@scure/base');

async function testX402WithPayAIEcho() {
  console.log('🚀 使用PayAI Echo Merchant测试X402...');
  
  // PayAI Echo Merchant信息
  const echoMerchant = {
    url: 'https://echo.payai.network/api/chat-new',
    description: 'PayAI Echo Merchant for testing'
  };
  
  console.log('🔗 Echo Merchant:', echoMerchant.url);
  
  // 1. 检测支付要求
  console.log('🔍 步骤1: 检测支付要求...');
  const detectResponse = await fetch(echoMerchant.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'swap 0.01 USDC to SOL',
      walletAddress: 'BaCvvheB3evgWR1jLGYuyh66dui8wouXdXckKHXnFyJn'
    })
  });
  
  const detectData = await detectResponse.json();
  console.log('✅ 支付检测结果:', JSON.stringify(detectData, null, 2));
  
  if (detectData.error && detectData.error.includes('Payment required')) {
    console.log('💰 需要支付，开始X402流程...');
    
    // 2. 创建真实的Solana交易
    console.log('📝 步骤2: 创建支付交易...');
    const privateKey = '53DptsQ5YnfHyTLkxsYpo11jsiHffMbLuzTtLMHXbW9EUQxgQcNgVs76SMEqyzM5af4MeRtFVpJVtsrs3ETdQYzA';
    const secretKey = base58.decode(privateKey);
    const keypair = Keypair.fromSecretKey(secretKey);
    
    const connection = new Connection('https://special-yolo-tent.solana-mainnet.quiknode.pro/f6e8a1ac41cfcd90c3837b93f190923fd8b89d8f/');
    
    // 创建转账到PayAI feePayer地址
    const transaction = new Transaction();
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: keypair.publicKey,
        toPubkey: '2wKupLR9q6wXYppw8Gr2NvWxKBUqm4PPJKkQfoxHDBg4', // PayAI feePayer
        lamports: 1000000 // 0.001 SOL
      })
    );
    
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = keypair.publicKey;
    
    console.log('⏳ 发送交易到Solana网络...');
    const signature = await sendAndConfirmTransaction(connection, transaction, [keypair]);
    
    console.log('✅ 交易确认!');
    console.log('📋 交易哈希:', signature);
    console.log('🔗 Explorer:', `https://solscan.io/tx/${signature}`);
    
    // 3. 使用交易哈希调用Echo Merchant (模拟X402支付完成)
    console.log('🔄 步骤3: 使用交易证明调用Echo Merchant...');
    
    const finalResponse = await fetch(echoMerchant.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Payment-Transaction': signature,
        'X-Payment-Status': 'completed',
        'X-Payment-Amount': '10000',
        'X-Payment-Asset': 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
      },
      body: JSON.stringify({
        message: 'swap 0.01 USDC to SOL',
        walletAddress: 'BaCvvheB3evgWR1jLGYuyh66dui8wouXdXckKHXnFyJn'
      })
    });
    
    const finalResult = await finalResponse.json();
    console.log('✅ Echo Merchant响应:', finalResult);
    
    console.log('\n🎉 完整的X402支付流程完成!');
    console.log('📋 真实交易哈希:', signature);
    console.log('🔗 可在Solscan查看:', `https://solscan.io/tx/${signature}`);
    console.log('💡 这展示了X402的核心概念:');
    console.log('   1. 检测支付要求');
    console.log('   2. 创建支付交易');
    console.log('   3. 使用交易证明调用API');
    
  } else {
    console.log('❌ Echo Merchant响应异常');
  }
}

testX402WithPayAIEcho().catch(console.error);
