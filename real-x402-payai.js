// 真正的X402支付流程 - 使用PayAI Facilitator
const { Connection, Keypair, Transaction, SystemProgram, sendAndConfirmTransaction } = require('@solana/web3.js');
const { base58 } = require('@scure/base');

async function realX402WithPayAI() {
  console.log('🚀 开始使用PayAI Facilitator的真正X402支付流程...');
  
  // 1. 检测支付要求
  console.log('🔍 步骤1: 检测支付要求...');
  const detectResponse = await fetch('http://localhost:3000/api/chat-x402', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'swap 0.01 USDC to SOL',
      walletAddress: 'BaCvvheB3evgWR1jLGYuyh66dui8wouXdXckKHXnFyJn'
    })
  });
  
  const detectData = await detectResponse.json();
  console.log('✅ 支付检测结果:', JSON.stringify(detectData, null, 2));
  
  if (!detectData.requiresPayment) {
    console.log('❌ 不需要支付');
    return;
  }
  
  const paymentRequirements = detectData.paymentDetails;
  console.log('💰 支付要求:', {
    amount: paymentRequirements.displayAmount,
    network: paymentRequirements.accepts[0].network,
    payTo: paymentRequirements.accepts[0].payTo,
    asset: paymentRequirements.accepts[0].asset
  });
  
  // 2. 创建支付payload
  console.log('📝 步骤2: 创建支付payload...');
  const privateKey = '53DptsQ5YnfHyTLkxsYpo11jsiHffMbLuzTtLMHXbW9EUQxgQcNgVs76SMEqyzM5af4MeRtFVpJVtsrs3ETdQYzA';
  const secretKey = base58.decode(privateKey);
  const keypair = Keypair.fromSecretKey(secretKey);
  
  const connection = new Connection('https://special-yolo-tent.solana-mainnet.quiknode.pro/f6e8a1ac41cfcd90c3837b93f190923fd8b89d8f/');
  
  // 创建真实的SOL转账到支付接收地址
  const transaction = new Transaction();
  transaction.add(
    SystemProgram.transfer({
      fromPubkey: keypair.publicKey,
      toPubkey: '2wKupLR9q6wXYppw8Gr2NvWxKBUqm4PPJKkQfoxHDBg4', // X402支付接收地址
      lamports: 1000000 // 0.001 SOL
    })
  );
  
  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = keypair.publicKey;
  
  // 签名交易
  transaction.sign(keypair);
  
  // 创建X402 payment payload
  const paymentPayload = {
    network: paymentRequirements.accepts[0].network,
    transactions: [transaction.serialize().toString('base64')],
    metadata: {
      timestamp: Date.now(),
      purpose: 'X402 payment for swap execution via PayAI'
    }
  };
  
  console.log('📋 Payment payload created');
  console.log('🔗 PayAI Facilitator: https://facilitator.payai.network');
  
  // 3. 调用PayAI Facilitator进行验证
  console.log('🔍 步骤3: 调用PayAI Facilitator验证...');
  
  try {
    const verifyResponse = await fetch('https://facilitator.payai.network/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paymentPayload,
        paymentRequirements
      })
    });
    
    if (!verifyResponse.ok) {
      const errorText = await verifyResponse.text();
      console.log('❌ PayAI验证失败:', errorText);
      return;
    }
    
    const verifyResult = await verifyResponse.json();
    console.log('✅ PayAI验证结果:', verifyResult);
    
    if (!verifyResult.success) {
      console.log('❌ 支付验证失败');
      return;
    }
    
    // 4. 调用PayAI Facilitator进行结算
    console.log('⚡ 步骤4: 调用PayAI Facilitator结算...');
    
    const settleResponse = await fetch('https://facilitator.payai.network/settle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paymentPayload,
        paymentRequirements
      })
    });
    
    if (!settleResponse.ok) {
      const errorText = await settleResponse.text();
      console.log('❌ PayAI结算失败:', errorText);
      return;
    }
    
    const settleResult = await settleResponse.json();
    console.log('✅ PayAI结算结果:', settleResult);
    
    // 5. 使用结算结果调用原始API
    console.log('🔄 步骤5: 使用结算结果调用原始API...');
    
    const finalResponse = await fetch('http://localhost:3010/api/chat-new', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-X402-Verified': 'true',
        'X-X402-Settlement': JSON.stringify(settleResult)
      },
      body: JSON.stringify({
        message: 'swap 0.01 USDC to SOL',
        walletAddress: 'BaCvvheB3evgWR1jLGYuyh66dui8wouXdXckKHXnFyJn'
      })
    });
    
    const finalResult = await finalResponse.json();
    console.log('✅ 最终API结果:', finalResult);
    
    console.log('\n🎉 完整的X402支付流程完成!');
    console.log('📋 这才是真正的X402交易流程!');
    console.log('🔗 使用了PayAI Facilitator进行验证和结算');
    console.log('💰 支付了0.001 SOL到X402接收地址');
    console.log('✅ 通过PayAI进行了验证和结算');
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
  }
}

realX402WithPayAI().catch(console.error);
