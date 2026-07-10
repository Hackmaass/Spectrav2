import { Address, nativeToScVal, scValToNative } from '@stellar/stellar-sdk';
import { CONTRACTS, invokeContract, readContract } from '../client';

export async function mintVectorBadge(publicKey) {
  const userScVal = new Address(publicKey).toScVal();
  return await invokeContract(CONTRACTS.NFT, 'mint_vector_badge', [userScVal], publicKey);
}

export async function mintNexusBadge(publicKey) {
  const userScVal = new Address(publicKey).toScVal();
  return await invokeContract(CONTRACTS.NFT, 'mint_nexus_badge', [userScVal], publicKey);
}

export async function burn(publicKey, tokenId) {
  const userScVal = new Address(publicKey).toScVal();
  // We pass user as auth, and token id if required by contract. Most single-user badge contracts
  // on Soroban just take the user address, but we'll include both if needed.
  const tokenIdScVal = nativeToScVal(tokenId, { type: 'u32' });
  return await invokeContract(CONTRACTS.NFT, 'burn', [userScVal, tokenIdScVal], publicKey);
}

export async function userTokenId(publicKey) {
  try {
    const userScVal = new Address(publicKey).toScVal();
    const result = await readContract(CONTRACTS.NFT, 'user_token_id', [userScVal], publicKey);
    if (result === null || result === undefined) return 0;
    const native = scValToNative(result);
    return typeof native === 'number' ? native : 0;
  } catch (err) {
    return 0;
  }
}
