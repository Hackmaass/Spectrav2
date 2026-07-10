import { Keypair, TransactionBuilder } from '@stellar/stellar-sdk';
import { server, networkPassphrase } from './client';

/**
 * Intercepts a signed user transaction and wraps it in a Fee-Bump Transaction
 * paid by the application's treasury account.
 */
export async function submitRelayedTransaction(signedXdr) {
  const secret = import.meta.env.VITE_STELLAR_TREASURY_SECRET;
  if (!secret) {
    throw new Error('VITE_STELLAR_TREASURY_SECRET is not set. Cannot sponsor transaction.');
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
  return await server.sendTransaction(feeBumpTx);
}
