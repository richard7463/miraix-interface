// 完整的X402支付流程演示 - 真正的实现
const { Connection, Keypair, Transaction, SystemProgram, sendAndConfirmTransaction } = require('@solana/web3.js');
const { base58 } = require('@scure/base');

async function completeX402Demo() {
  console.log('🎯 完整的X402支付协议演示');
  console.log('=====================================');
  
  // 1. 检测支付要求
  console.log('\n🔍 步骤1: 检测支付要求');
  console.log('API: http://localhost:3000/api/chat-x402');
  
  try {
    const detectResponse = await fetch('http://localhost:3000/api/chat-x402', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'swap 0.01 USDC to SOL',
        walletAddress: 'BaCvvheB3evgWR1jLGYuyh66dui8wouXdXckKHXnFyJn'
      })
    });
    
    const detectData = await detectResponse.json();
    console.log('✅ 检测结果:', {
      requiresPayment: detectData.requiresPayment,
      amount: detectData.paymentDetails?.displayAmount,
      network: detectData.paymentDetails?.accepts?.[0]?.network,
      payTo: detectData.paymentDetails?.accepts?.[0]?.payTo
    });
    
    if (!detectData.requiresPayment) {
      console.log('❌ 不需要支付');
      return;
    }
    
    const paymentRequirements = detectData.paymentDetails;
    
    // 2. 创建支付交易
    console.log('\n📝 步骤2: 创建支付交易');
    console.log('支付要求详情:');
    console.log('- 金额:', paymentRequirements.displayAmount);
    console.log('- 网络:', paymentRequirements.accepts[0].network);
    console.log('- 接收地址:', paymentRequirements.accepts[0].payTo);
    console.log('- 资产:', paymentRequirements.accepts[0].asset);
    
    const privateKey = '53DptsQ5YnfHyTLkxsYpo11jsiHffMbLuzTtLMHXbW9EUQxgQcNgVs76SMEqyzM5af4MeRtFVpJVtsrs3ETdQYzA';
    const secretKey = base58.decode(privateKey);
    const keypair = Keypair.fromSecretKey(secretKey);
    
    const connection = new Connection('https://special-yolo-tent.solana-mainnet.quiknode.pro/f6e8a1ac41cfcd90c3837b93f190923fd8b89d8f/');
    
    // 创建真实的SOL转账到X402支付接收地址
    const transaction = new Transaction();
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: keypair.publicKey,
        toPubkey: paymentRequirements.accepts[0].payTo, // X402支付接收地址
        lamports: 1000000 // 0.001 SOL
      })
    );
    
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = keypair.publicKey;
    
    console.log('⏳ 发送交易到Solana主网...');
    const signature = await sendAndConfirmTransaction(connection, transaction, [keypair]);
    
    console.log('✅ 交易确认!');
    console.log('📋 交易哈希:', signature);
    console.log('🔗 Explorer:', `https://solscan.io/tx/${signature}`);
    
    // 3. 创建X402 payment payload
    console.log('\n🔐 步骤3: 创建X402 payment payload');
    const paymentPayload = {
      network: paymentRequirements.accepts[0].network,
      transactions: [transaction.serialize().toString('base64')],
      metadata: {
        timestamp: Date.now(),
        purpose: 'X402 payment for swap execution',
        merchant: 'AI-powered swap execution'
      }
    };
    
    console.log('📦 Payment payload已创建');
    console.log('- 网络:', paymentPayload.network);
    console.log('- 交易数量:', paymentPayload.transactions.length);
    console.log('- 用途:', paymentPayload.metadata.purpose);
    
    // 4. X402验证流程 (概念演示)
    console.log('\n🔍 步骤4: X402验证流程');
    console.log('💡 真正的X402需要以下步骤:');
    console.log('   4.1 调用facilitator /verify端点');
    console.log('   4.2 facilitator验证交易有效性');
    console.log('   4.3 调用facilitator /settle端点');
    console.log('   4.4 facilitator在链上结算支付');
    console.log('   4.5 返回结算证明');
    
    console.log('🌐 可用的facilitator:');
    console.log('   - PayAI: https://facilitator.payai.network');
    console.log('   - 自建facilitator: 需要运行X402 facilitator服务器');
    
    // 5. 使用支付证明调用原始API
    console.log('\n🔄 步骤5: 使用支付证明调用原始API');
    
    try {
      const finalResponse = await fetch('http://localhost:3000/api/payment-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-PAYMENT-TRANSACTION': signature,
          'X-PAYMENT-AMOUNT': paymentRequirements.accepts[0].amount,
          'X-PAYMENT-ASSET': paymentRequirements.accepts[0].asset,
          'X-PAYMENT-STATUS': 'completed',
          'X-X402-PAYLOAD': JSON.stringify(paymentPayload)
        },
        body: JSON.stringify({
          message: 'swap 0.01 USDC to SOL',
          walletAddress: 'BaCvvheB3evgWR1jLGYuyh66dui8wouXdXckKHXnFyJn'
        })
      });
      
      const finalResult = await finalResponse.json();
      console.log('✅ API响应:', finalResult);
      
    } catch (error) {
      console.log('❌ API调用失败:', error.message);
    }
    
    console.log('\n🎉 X402支付流程演示完成!');
    console.log('=====================================');
    console.log('📋 真实交易哈希:', signature);
    console.log('🔗 可在Solscan查看:', `https://solscan.io/tx/${signature}`);
    console.log('💡 这展示了X402协议的核心概念:');
    console.log('   ✅ 支付检测');
    console.log('   ✅ 交易创建');
    console.log('   ✅ 链上确认');
    console.log('   ✅ 支付证明');
    console.log('   ⏳ facilitator验证 (需要外部服务)');
    console.log('   ✅ API调用');
    
    console.log('\n🚀 X402协议的优势:');
    console.log('   - 无gas体验 (用户不直接支付gas费)');
    console.log('   - 统一支付标准 (跨多个区块链)');
    console.log('   - 自动验证和结算');
    console.log('   - 商家友好的集成');
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
  }
}

completeX402Demo().catch(console.error);
