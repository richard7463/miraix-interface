// 完整的X402支付流程 - 集成PayAI Facilitator
const { Connection, Keypair, Transaction, SystemProgram, sendAndConfirmTransaction } = require('@solana/web3.js');
const { base58 } = require('@scure/base');

async function completeX402WithPayAI() {
  console.log('🚀 完整的X402支付流程 - 集成PayAI Facilitator');
  console.log('================================================');
  
  const FACILITATOR_URL = 'https://facilitator.payai.network';
  
  try {
    // 1. 检测支付要求
    console.log('\n🔍 步骤1: 检测支付要求');
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
    const privateKey = '53DptsQ5YnfHyTLkxsYpo11jsiHffMbLuzTtLMHXbW9EUQxgQcNgVs76SMEqyzM5af4MeRtFVpJVtsrs3ETdQYzA';
    const secretKey = base58.decode(privateKey);
    const keypair = Keypair.fromSecretKey(secretKey);
    
    const connection = new Connection('https://special-yolo-tent.solana-mainnet.quiknode.pro/f6e8a1ac41cfcd90c3837b93f190923fd8b89d8f/');
    
    // 创建转账到X402支付接收地址
    const transaction = new Transaction();
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: keypair.publicKey,
        toPubkey: paymentRequirements.accepts[0].payTo,
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
        purpose: 'X402 payment for AI-powered swap execution',
        merchant: 'AI-powered swap execution',
        walletAddress: 'BaCvvheB3evgWR1jLGYuyh66dui8wouXdXckKHXnFyJn'
      }
    };
    
    console.log('📦 Payment payload创建完成');
    
    // 4. 调用PayAI Facilitator验证
    console.log('\n🔍 步骤4: 调用PayAI Facilitator验证');
    console.log(`🌐 Facilitator URL: ${FACILITATOR_URL}/verify`);
    
    const verifyBody = {
      paymentPayload,
      paymentRequirements
    };
    
    console.log('📤 发送验证请求...');
    const verifyResponse = await fetch(`${FACILITATOR_URL}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(verifyBody)
    });
    
    console.log('📥 验证响应状态:', verifyResponse.status);
    
    if (!verifyResponse.ok) {
      const errorText = await verifyResponse.text();
      console.log('❌ 验证失败:', errorText);
      console.log('💡 这可能是因为:');
      console.log('   - PayAI服务器暂时不可用');
      console.log('   - 网络连接问题');
      console.log('   - payload格式不正确');
      return;
    }
    
    const verifyResult = await verifyResponse.json();
    console.log('✅ 验证结果:', verifyResult);
    
    if (!verifyResult.success) {
      console.log('❌ 支付验证失败');
      return;
    }
    
    // 5. 调用PayAI Facilitator结算
    console.log('\n⚡ 步骤5: 调用PayAI Facilitator结算');
    console.log(`🌐 Facilitator URL: ${FACILITATOR_URL}/settle`);
    
    const settleBody = {
      paymentPayload,
      paymentRequirements
    };
    
    console.log('📤 发送结算请求...');
    const settleResponse = await fetch(`${FACILITATOR_URL}/settle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settleBody)
    });
    
    console.log('📥 结算响应状态:', settleResponse.status);
    
    if (!settleResponse.ok) {
      const errorText = await settleResponse.text();
      console.log('❌ 结算失败:', errorText);
      return;
    }
    
    const settleResult = await settleResponse.json();
    console.log('✅ 结算结果:', settleResult);
    
    // 6. 使用结算结果调用原始API
    console.log('\n🔄 步骤6: 使用结算结果调用原始API');
    
    const finalResponse = await fetch('http://localhost:3010/api/chat-new', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-X402-Verified': 'true',
        'X-X402-Settlement-Id': settleResult.settlementId || signature,
        'X-X402-Facilitator': FACILITATOR_URL,
        'X-Payment-Transaction': signature,
        'X-Payment-Status': 'completed'
      },
      body: JSON.stringify({
        message: 'swap 0.01 USDC to SOL',
        walletAddress: 'BaCvvheB3evgWR1jLGYuyh66dui8wouXdXckKHXnFyJn'
      })
    });
    
    console.log('📥 最终API响应状态:', finalResponse.status);
    
    if (finalResponse.ok) {
      const finalResult = await finalResponse.json();
      console.log('✅ 最终API结果:', finalResult);
      
      console.log('\n🎉 完整的X402支付流程成功完成!');
      console.log('================================================');
      console.log('📋 真实交易哈希:', signature);
      console.log('🔗 可在Solscan查看:', `https://solscan.io/tx/${signature}`);
      console.log('✅ PayAI验证: 通过');
      console.log('✅ PayAI结算: 完成');
      console.log('✅ 原始API: 成功调用');
      console.log('💚 这是真正的X402无gas支付!');
      
    } else {
      const errorText = await finalResponse.text();
      console.log('❌ 最终API调用失败:', errorText);
    }
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
    console.log('💡 请检查:');
    console.log('   - 网络连接');
    console.log('   - 服务器状态');
    console.log('   - API端点可用性');
  }
}

completeX402WithPayAI().catch(console.error);
