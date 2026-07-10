import { Address, nativeToScVal } from '@stellar/stellar-sdk';
import { readContract, invokeContract } from '../client';

export async function getTokenBalance(tokenAddress, userPublicKey) {
  try {
    const userScVal = new Address(userPublicKey).toScVal();
    const result = await readContract(tokenAddress, 'balance', [userScVal]);
    
    if (result) {
      // Amount is i128
      const rawVal = BigInt(result.i128().low.low) + (BigInt(result.i128().hi.low) << 64n);
      return rawVal.toString();
    }
    return "0";
  } catch (err) {
    console.warn(`[Token] Failed to get balance for ${tokenAddress}:`, err);
    return "0";
  }
}

export async function getTokenDecimals(tokenAddress) {
  try {
    const result = await readContract(tokenAddress, 'decimals', []);
    return result ? result.u32() : 7;
  } catch (err) {
    return 7; // Default SAC decimals
  }
}
