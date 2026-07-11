import { Keypair, TransactionBuilder, rpc, Networks } from '@stellar/stellar-sdk';

const RPC_URL = process.env.VITE_STELLAR_RPC_URL || 'https://soroban-testnet.stellar.org';
const IS_TESTNET = process.env.VITE_STELLAR_NETWORK !== 'mainnet';
const networkPassphrase = IS_TESTNET ? Networks.TESTNET : Networks.PUBLIC;
const server = new rpc.Server(RPC_URL, { allowHttp: false });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { signedXdr } = req.body;
    if (!signedXdr) {
      return res.status(400).json({ error: 'signedXdr is required' });
    }

    const secret = process.env.STELLAR_TREASURY_SECRET;
    if (!secret) {
      console.error('STELLAR_TREASURY_SECRET is not set in environment.');
      return res.status(500).json({ error: 'Server configuration error: Treasury key missing.' });
    }

    const treasuryKeypair = Keypair.fromSecret(secret);
    const innerTransaction = TransactionBuilder.fromXDR(signedXdr, networkPassphrase);

    // Set a generous base fee to cover Soroban compute and standard network fees
    const baseFee = '100000'; 

    // Wrap the user's signed transaction with a fee-bump transaction
    const feeBumpTx = TransactionBuilder.buildFeeBumpTransaction(
      treasuryKeypair,
      baseFee,
      innerTransaction,
      networkPassphrase
    );

    // The treasury pays the fee and signs the outer envelope
    feeBumpTx.sign(treasuryKeypair);

    // Submit the sponsored transaction to the network
    const result = await server.sendTransaction(feeBumpTx);
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('Relay Error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
