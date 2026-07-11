import { nativeToScVal, scValToNative, Address, Keypair } from '@stellar/stellar-sdk';
import { CONTRACTS, invokeContract, readContract } from '../client';

const getEphemeralAddress = () => Keypair.random().publicKey();

export async function saveFeedback(name, email, designation, company, thoughts, rating) {
  if (!CONTRACTS.FEEDBACK) {
    console.warn('[Feedback] VITE_STELLAR_FEEDBACK_CONTRACT not set. Skipping on-chain save.');
    return null;
  }
  
  const userPubKey = getEphemeralAddress();
  const userScVal = new Address(userPubKey).toScVal();
  
  const args = [
    userScVal,
    nativeToScVal(name, { type: 'string' }),
    nativeToScVal(email, { type: 'string' }),
    nativeToScVal(designation || '', { type: 'string' }),
    nativeToScVal(company || '', { type: 'string' }),
    nativeToScVal(thoughts, { type: 'string' }),
    nativeToScVal(rating, { type: 'u32' }),
  ];

  try {
    return await invokeContract(CONTRACTS.FEEDBACK, 'save_feedback', args, userPubKey);
  } catch (err) {
    console.warn('[Feedback] Error saving to blockchain:', err);
    return null;
  }
}

export async function getFeedbackCount() {
  if (!CONTRACTS.FEEDBACK) return 0;
  try {
    const result = await readContract(CONTRACTS.FEEDBACK, 'get_feedback_count', [], getEphemeralAddress());
    const count = scValToNative(result);
    return typeof count === 'number' ? count : 0;
  } catch (err) {
    console.error('[Feedback] getFeedbackCount error:', err);
    return 0;
  }
}

export async function getFeedbackEntry(id) {
  if (!CONTRACTS.FEEDBACK) return null;
  try {
    const args = [nativeToScVal(id, { type: 'u32' })];
    const result = await readContract(CONTRACTS.FEEDBACK, 'get_feedback', args, getEphemeralAddress());
    const data = scValToNative(result);
    return {
      id,
      user: data.user,
      name: data.name,
      email: data.email,
      designation: data.designation,
      company: data.company,
      thoughts: data.thoughts,
      rating: data.rating,
      timestamp: data.timestamp
    };
  } catch (err) {
    console.error('[Feedback] getFeedbackEntry error for id', id, ':', err);
    return null;
  }
}

export async function getAllFeedback() {
  const count = await getFeedbackCount();
  const entries = [];
  for (let i = 0; i < count; i++) {
    const entry = await getFeedbackEntry(i);
    if (entry) entries.push(entry);
  }
  return entries;
}
