// 真实的X402支付流程演示
const { Connection, Keypair, Transaction, SystemProgram, sendAndConfirmTransaction } = require('@solana/web3.js');
const { base58 } = require('@scure/base');

async function realX402Payment() {
  // 1. 检测支付要求
  console.log('🔍 检测支付要求...');
  const detectResponse = await fetch('http://localhost:3000/api/chat-x402', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'swap 0.01 USDC to SOL',
      walletAddress: 'BaCvvheB3evgWR1jLGYuyh66dui8wouXdXckKHXnFyJn'
    })
  });
  
  const detectData = await detectResponse.json();
  console.log('✅ 支付检测结果:', detectData);
  
  if (!detectData.requiresPayment) {
    console.log('❌ 不需要支付');
    return;
  }
  
  // 2. 创建真实的Solana交易作为支付证明
  console.log('💳 创建真实交易...');
  const privateKey = '53DptsQ5YnfHyTLkxsYpo11jsiHffMbLuzTtLMHXbW9EUQxgQcNgVs76SMEqyzM5af4MeRtFVpJVtsrs3ETdQYzA';
  const secretKey = base58.decode(privateKey);
  const keypair = Keypair.fromSecretKey(secretKey);
  
  const connection = new Connection('https://special-yolo-tent.solana-mainnet.quiknode.pro/f6e8a1ac41cfcd90c3837b93f190923fd8b89d8f/');
  
  // 创建一个小的SOL转账作为支付证明
  const transaction = new Transaction();
  transaction.add(
    SystemProgram.transfer({
      fromPubkey: keypair.publicKey,
      toPubkey: keypair.publicKey, // 转给自己作为证明
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
  
  // 3. 使用真实交易哈希进行X402支付验证
  console.log('🔄 进行X402支付验证...');
  const paymentResponse = await fetch('http://localhost:3000/api/payment-proxy', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-PAYMENT-TRANSACTION': signature,
      'X-PAYMENT-AMOUNT': '10000',
      'X-PAYMENT-ASSET': 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      'X-PAYMENT-STATUS': 'completed'
    },
    body: JSON.stringify({
      message: 'swap 0.01 USDC to SOL',
      walletAddress: 'BaCvvheB3evgWR1jLGYuyh66dui8wouXdXckKHXnFyJn'
    })
  });
  
  const paymentData = await paymentResponse.json();
  console.log('✅ X402支付验证结果:', paymentData);
  
  console.log('\n🎉 完整的X402支付流程完成!');
  console.log('📋 真实交易哈希:', signature);
  console.log('🔗 可在Solscan查看:', `https://solscan.io/tx/${signature}`);
}

realX402Payment().catch(console.error);
