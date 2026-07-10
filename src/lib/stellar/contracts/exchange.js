import { Address, nativeToScVal, scValToNative } from '@stellar/stellar-sdk';
import { CONTRACTS, invokeContract, readContract } from '../client';

/**
 * Execute a token swap via the Soroban exchange contract
 * Contract fn: swap(user, token_in, token_out, amount_in, min_amount_out)
 */
export async function swapTokens(publicKey, tokenIn, tokenOut, amountIn, minAmountOut = 0n) {
  const args = [
    new Address(publicKey).toScVal(),
    new Address(tokenIn).toScVal(),
    new Address(tokenOut).toScVal(),
    nativeToScVal(BigInt(amountIn), { type: 'i128' }),
    nativeToScVal(BigInt(minAmountOut), { type: 'i128' }),
  ];
  return await invokeContract(CONTRACTS.EXCHANGE, 'swap', args, publicKey);
}

/**
 * Get a price quote for a swap (read-only, free)
 * Returns amount out as a number, or 0 on failure
 */
export async function getQuote(tokenIn, tokenOut, amountIn, callerPublicKey) {
  try {
    const args = [
      new Address(tokenIn).toScVal(),
      new Address(tokenOut).toScVal(),
      nativeToScVal(BigInt(amountIn), { type: 'i128' }),
    ];
    const result = await readContract(CONTRACTS.EXCHANGE, 'get_quote', args, callerPublicKey);
    if (result === null || result === undefined) return 0;
    const native = scValToNative(result);
    return typeof native === 'bigint' ? Number(native) : Number(native) || 0;
  } catch (err) {
    console.warn('[Exchange] getQuote failed:', err.message);
    return 0;
  }
}
