import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { UGFClient as TestnetUGFClient } from '@tychilabs/ugf-testnet-js';

/**
 * Custom hook to provide pure UGF SDK execution without manual gas simulations.
 * This satisfies the Lead Web3 Frontend Architect's mandate for headless SDK integration.
 */
export function useUGF() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState('IDLE');

  const getClient = useCallback(() => {
    // Using TestnetUGFClient explicitly for Base Sepolia (testnet)
    return new TestnetUGFClient();
  }, []);

  const getForwarder = useCallback(async () => {
    const client = getClient();
    const option = await client.registry.getOption('TYI_MOCK_USD');
    if (!option || !option.receiver_address) {
      throw new Error('UGF_REGISTRY_ERROR: Could not resolve Forwarder address.');
    }
    return option.receiver_address;
  }, [getClient]);

  const quote = useCallback(async ({ target, data, paymentToken, signer }) => {
    const client = getClient();
    const address = await signer.getAddress();
    const addressLower = address.toLowerCase();
    const targetLower = target.toLowerCase();
    
    // Authenticate with UGF before quoting
    await client.auth.login(signer);

    /**
     * CRITICAL FIX: The UGF Relayer requires 'from' in the tx_object to simulate the transaction.
     * We use hex '0x0' for value to be safe with some relayer parsers.
     */
    const q = await client.quote.get({
      payment_coin: 'TYI_MOCK_USD', 
      payer_address: addressLower,
      payment_chain: '84532',
      payment_chain_type: 'evm',
      tx_object: JSON.stringify({
        from: addressLower,
        to: targetLower,
        data: data || '0x',
        value: '0x0'
      }),
      dest_chain_id: '84532',
      dest_chain_type: 'evm',
    });

    return q;
  }, [getClient]);

  const execute = useCallback(async ({ target, data, paymentToken, signer }) => {
    setLoading(true);
    setError(null);
    setStep('INITIALIZING');

    try {
      const client = getClient();
      const address = await signer.getAddress();

      // 1. Auth
      setStep('AUTHENTICATING');
      await client.auth.login(signer);

      // 2. Quote
      setStep('QUOTING');
      const q = await quote({ target, data, paymentToken, signer });

      // 3. Approval Check (Targeting UGF Forwarder)
      setStep('CHECKING_ALLOWANCE');
      const forwarder = await getForwarder();
      const tokenContract = new ethers.Contract(
        paymentToken,
        [
          'function allowance(address owner, address spender) view returns (uint256)',
          'function approve(address spender, uint256 amount) returns (bool)'
        ],
        signer
      );
      
      const allowance = await tokenContract.allowance(address, forwarder);
      
      // q.payment_amount is usually the raw value as a string
      const needed = ethers.toBigInt(q.payment_amount);

      if (allowance < needed) {
        setStep('APPROVING_FORWARDER');
        const tx = await tokenContract.approve(forwarder, ethers.MaxUint256);
        await tx.wait(1);
      }

      // 4. Payment
      setStep('SUBMITTING_PAYMENT');
      // For testnet, we settle in TYI_MOCK_USD
      await client.payment.x402.execute({ quote: q, signer, token: 'TYI_MOCK_USD' });

      // 5. Execution
      setStep('EXECUTING_ON_CHAIN');
      const result = await client.chains.evm.sponsorAndExecute(
        q.digest,
        signer,
        async (s) => {
           // Return the raw transaction request - Testnet SDK handles the rest
           return {
             to: target,
             data: data || '0x',
             value: 0n
           };
        }
      );

      setStep('SUCCESS');
      setLoading(false);
      return result;

    } catch (err) {
      console.error('[useUGF] Execution Pipeline Failed:', err);
      
      let friendlyMessage = err.message || 'UGF Execution Error';
      
      // Handle Contract Reverts / CALL_EXCEPTION / HTTP 500
      if (err.message?.includes('500') || err.message?.includes('Internal Server Error')) {
        friendlyMessage = 'Relayer Error: The UGF network rejected the transaction payload. Verify that the exchange has liquidity and the token addresses are correct.';
      } else if (err.message?.includes('CALL_EXCEPTION') || err.message?.includes('execution reverted')) {
        friendlyMessage = 'Transaction Reverted by Smart Contract. Ensure the Exchange has testnet liquidity and you have not exceeded your daily SaaS tier limits.';
      } else if (err.code === 4001 || err.message?.includes('rejected')) {
        friendlyMessage = 'Transaction rejected by user.';
      }

      setError(friendlyMessage);
      setStep('ERROR');
      setLoading(false);
      throw new Error(friendlyMessage);
    }
  }, [getClient, getForwarder, quote]);

  return { execute, quote, loading, error, step };
}
