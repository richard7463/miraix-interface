const { privateKeyToAccount } = require('viem/accounts');

// Test different private key formats
const testKeys = [
  '0x1111111111111111111111111111111111111111111111111111111111111111111111111111111111111',
  '0x1111111111111111111111111111111111111111111111111111111111111111',
  '1111111111111111111111111111111111111111111111111111111111111111111'
];

testKeys.forEach((key, index) => {
  try {
    console.log(`Testing key ${index + 1}: ${key.substring(0, 20)}...`);
    const account = privateKeyToAccount(key);
    console.log(`  ✅ Success: ${account.address}`);
  } catch (error) {
    console.log(`  ❌ Failed: ${error.message}`);
  }
});
