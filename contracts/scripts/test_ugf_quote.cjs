const { ethers } = require('ethers');
const { UGFClient } = require('@tychilabs/ugf-testnet-js');
require('dotenv').config({ path: '.env' });

const TARGET_EXCHANGE = '0xd1516568681e759859720d1d97fd4c416975bd10';
const TYI_ADDRESS = '0x27dc1c167aef232bb1e21073304b526726a8727e';

async function main() {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("Missing PRIVATE_KEY");
  }

  const provider = new ethers.JsonRpcProvider('https://sepolia.base.org');
  const wallet = new ethers.Wallet(privateKey, provider);
  
  const client = new UGFClient();
  
  console.log("Logging into UGF...");
  await client.auth.login(wallet);
  console.log("Logged in successfully!");

  const amountIn = ethers.parseUnits("1", 18);
  const iface = new ethers.Interface([
    'function swap(address tokenIn, address tokenOut, uint256 amountIn, uint256 minAmountOut) external'
  ]);
  // swap 1 TYI for WETH
  const encodedData = iface.encodeFunctionData('swap', [
    TYI_ADDRESS, 
    '0x4200000000000000000000000000000000000006', 
    amountIn, 
    0n
  ]);

  // Test Case 1: value as "0x0"
  console.log("\n--- Testing Case 1: value = '0x0' ---");
  try {
    const q1 = await client.quote.get({
      payment_coin: 'TYI_MOCK_USD',
      payer_address: wallet.address.toLowerCase(),
      payment_chain: '84532',
      payment_chain_type: 'evm',
      tx_object: JSON.stringify({
        from: wallet.address.toLowerCase(),
        to: TARGET_EXCHANGE.toLowerCase(),
        data: encodedData,
        value: '0x0'
      }),
      dest_chain_id: '84532',
      dest_chain_type: 'evm',
    });
    console.log("Case 1 Success! Quote payment amount:", q1.payment_amount);
  } catch (err) {
    console.error("Case 1 Failed:", err.message);
  }

  // Test Case 2: value as "0"
  console.log("\n--- Testing Case 2: value = '0' ---");
  try {
    const q2 = await client.quote.get({
      payment_coin: 'TYI_MOCK_USD',
      payer_address: wallet.address.toLowerCase(),
      payment_chain: '84532',
      payment_chain_type: 'evm',
      tx_object: JSON.stringify({
        from: wallet.address.toLowerCase(),
        to: TARGET_EXCHANGE.toLowerCase(),
        data: encodedData,
        value: '0'
      }),
      dest_chain_id: '84532',
      dest_chain_type: 'evm',
    });
    console.log("Case 2 Success! Quote payment amount:", q2.payment_amount);
  } catch (err) {
    console.error("Case 2 Failed:", err.message);
  }
}

main().catch(console.error);
