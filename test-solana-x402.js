// Solana-only X402 integration test
const { x402Client, wrapFetchWithPayment } = require('@x402/fetch');
const { registerExactSvmScheme } = require('@x402/svm/exact/client');
const { createKeyPairSignerFromBytes } = require('@solana/kit');
const { base58 } = require('@scure/base');

// Your Solana wallet details
const WALLET_ADDRESS = 'BaCvvheB3evgWR1jLGYuyh66dui8wouXdXckKHXnFyJn';
const PRIVATE_KEY = '53DptsQ5YnfHyTLkxsYpo11jsiHffMbLuzTtLMHXbW9EUQxgQcNgVs76SMEqyzM5af4MeRtFVpJVtsrs3ETdQYzA';

const API_URL = 'http://localhost:3009';

async function testSolanaX402() {
  console.log('🧪 Testing Solana X402 Integration...\n');
  console.log(`Wallet: ${WALLET_ADDRESS}`);
  console.log(`Private Key: ${PRIVATE_KEY.substring(0, 20)}...\n`);

  // Initialize X402 client
  const client = new x402Client();
  
  // Register Solana signer
  console.log('1. Registering Solana signer...');
  try {
    const keypairBytes = base58.decode(PRIVATE_KEY);
    const svmSigner = await createKeyPairSignerFromBytes(keypairBytes);
    registerExactSvmScheme(client, { signer: svmSigner });
    console.log('✅ Solana signer registered');
    console.log(`   Address: ${svmSigner.address}`);
  } catch (error) {
    console.error('❌ Failed to register Solana signer:', error.message);
    return;
  }

  // Create fetch with payment support
  const fetchWithPayment = wrapFetchWithPayment(fetch, client);

  // Test 1: Request without X402 client (should get 402)
  console.log('\n2. Testing without X402 client...');
  try {
    const response = await fetch(`${API_URL}/api/chat-new`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'swap 0.1 USDC to SOL',
        walletAddress: WALLET_ADDRESS
      }),
    });

    console.log(`Status: ${response.status}`);
    if (response.status === 402) {
      const paymentRequired = response.headers.get('PAYMENT-REQUIRED');
      if (paymentRequired) {
        const decoded = JSON.parse(Buffer.from(paymentRequired, 'base64').toString());
        console.log('✅ Correctly received 402 with payment requirements');
        console.log('   Network:', decoded.accepts[0].network);
        console.log('   Amount:', decoded.accepts[0].amount, 'USDC');
        console.log('   Pay to:', decoded.accepts[0].payTo);
      }
    }
  } catch (error) {
    console.error('❌ Test 1 failed:', error.message);
  }

  // Test 2: Request with X402 client
  console.log('\n3. Testing with X402 client...');
  try {
    const response = await fetchWithPayment(`${API_URL}/api/chat-new`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'swap 0.1 USDC to SOL',
        walletAddress: WALLET_ADDRESS
      }),
    });

    console.log(`Status: ${response.status}`);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Request successful!');
      console.log('   Response:', data);
      
      // Check for payment response header
      const paymentResponse = response.headers.get('PAYMENT-RESPONSE');
      if (paymentResponse) {
        const decoded = JSON.parse(Buffer.from(paymentResponse, 'base64').toString());
        console.log('   Payment settled:', decoded.success);
        console.log('   Transaction:', decoded.transaction);
      }
    } else {
      console.log('⚠️  Request failed');
      console.log('   Error:', data);
      
      if (response.status === 402) {
        console.log('   Note: Payment still required (wallet may need USDC on Solana mainnet)');
      }
    }
  } catch (error) {
    console.error('❌ Test 2 failed:', error.message);
  }

  console.log('\n🎯 Solana X402 Test Complete!');
  console.log('\n📝 Next Steps:');
  console.log('1. Ensure wallet has USDC on Solana mainnet');
  console.log('2. Test with real funded wallet');
  console.log('3. Integrate in frontend UI');
}

// Run the test
testSolanaX402().catch(console.error);
