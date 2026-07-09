import React, { useMemo, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useUGF } from '../../hooks/useUGF';
import { tryParseDefiIntent } from '../../api/sarvamAgent.js';
import { CONTRACT_ABIS, CONTRACT_ADDRESSES, TOKEN_ADDRESSES, resolveTokenAddress, ensureBaseSepolia } from '../../config/contracts.js';

const ERC20_ABI = [
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
];

const SUGGESTION_PILLS = [
  "Swap 10 TYI to ETH",
  "Bridge 5 USDC to Optimism",
  "Mint Genesis Badge",
  "Transfer 100 USDC to 0x123..."
];

function buildIntentJson(intent) {
  return {
    intent_id: `0x${ethers.id(`${intent.action}:${intent.amount}:${intent.token}:${Date.now()}`).slice(2, 10)}...${Date.now().toString(16).slice(-4)}`,
    trigger: {
      type: 'USER_SIGNATURE',
      network: 'base_sepolia',
      condition: 'immediate',
    },
    execution_graph: [
      {
        step: 1,
        action: intent.action.toUpperCase(),
        amount: intent.amount,
        asset: intent.token,
        venue: 'SPECTRA_EXCHANGE',
      },
    ],
    estimated_fees: '~$0.00 (via UGF)',
  };
}

export default function AgentTerminal() {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExecutingState, setIsExecutingState] = useState(false);
  const [intent, setIntent] = useState(null);
  const [walletAddress, setWalletAddress] = useState('');
  const [status, setStatus] = useState('READY');
  const [error, setError] = useState('');
  const [executionError, setExecutionError] = useState('');
  const [txHash, setTxHash] = useState('');
  const [history, setHistory] = useState([]);

  const { execute, loading: sdkLoading, error: sdkError, step: sdkStep } = useUGF();

  const intentJson = useMemo(() => {
    if (!intent || intent.error) {
      return null;
    }
    return buildIntentJson(intent);
  }, [intent]);

  const connectWallet = async () => {
    if (!window.ethereum) {
      throw new Error('No injected wallet found. Install MetaMask or a compatible wallet.');
    }

    await ensureBaseSepolia();

    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    if (!accounts?.length) {
      throw new Error('Wallet returned no accounts.');
    }
    setWalletAddress(accounts[0]);
    return accounts[0];
  };

  const handleSubmit = async (event, customPrompt) => {
    if (event) event.preventDefault();
    const input = customPrompt || prompt;
    if (!input.trim() || isLoading) {
      return;
    }

    setPrompt(input);
    setIsLoading(true);
    setError('');
    setExecutionError('');
    setTxHash('');
    setStatus('PARSING');
    setIntent(null);

    try {
      const parsedResult = await tryParseDefiIntent(input.trim());
      if (!parsedResult) {
        setError('Agent parser request failed.');
        setStatus('ERROR');
      } else {
        setIntent(parsedResult);
        setStatus('READY');
        if (!parsedResult.error) {
          setHistory(prev => [input.trim(), ...prev]);
        }
      }
    } catch (parseError) {
      setError(parseError?.message || 'Agent parser request failed.');
      setStatus('ERROR');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignAndExecute = async () => {
    if (!intent || intent.error || isExecutingState || sdkLoading) {
      return;
    }

    setError('');
    setExecutionError('');
    setTxHash('');
    setIsExecutingState(true);
    setStatus('CONNECTING_WALLET');

    try {
      await connectWallet();
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      /**
       * TASK 1: Strict Payload Encoding
       * Order: tokenIn, tokenOut, amountIn, minAmountOut
       */
      const tokenIn = TOKEN_ADDRESSES.TYI;
      const tokenOut = resolveTokenAddress(intent.token);
      const amountIn = ethers.parseUnits(String(intent.amount || '0'), 6);
      const minAmountOut = 0n;

      const iface = new ethers.Interface(CONTRACT_ABIS.SPECTRA_EXCHANGE);
      const encodedData = iface.encodeFunctionData('swap', [
        tokenIn,
        tokenOut,
        amountIn,
        minAmountOut,
      ]);

      console.log('[AgentTerminal] Encoding Payload:', {
        target: CONTRACT_ADDRESSES.SPECTRA_EXCHANGE,
        data: encodedData,
        paymentToken: TOKEN_ADDRESSES.TYI
      });

      /**
       * TASK 1 & 2: Pure UGF SDK Execution
       * The hook handles forwarder approval and gasless execution lifecycle.
       */
      const result = await execute({
        target: CONTRACT_ADDRESSES.SPECTRA_EXCHANGE,
        data: encodedData,
        paymentToken: TOKEN_ADDRESSES.TYI,
        signer
      });

      if (result && result.userTxHash) {
        setTxHash(result.userTxHash);
        setStatus('EXECUTED');
      }

    } catch (execError) {
      console.error('[AgentTerminal] Pipeline Error:', execError);
      
      /**
       * TASK 2: Advanced Error Parsing UI
       */
      let message = execError.message || 'Intent Execution Failed';
      
      if (message.includes('500') || message.includes('Internal Server Error')) {
        message = 'Relayer Error: The UGF network rejected the transaction payload. Verify that the exchange has liquidity and the token addresses are correct.';
      }

      setExecutionError(message);
      setStatus('ERROR');
    } finally {
      setIsExecutingState(false);
    }
  };

  const renderStatusIndicator = () => {
    if (sdkLoading || status === 'CONNECTING_WALLET') {
      return (
        <div className="spectra-agent-loader-row">
          <div className="spectra-agent-geometric-spinner" />
          <span className="spectra-agent-loader-text">
            {status === 'CONNECTING_WALLET' && 'Connecting Agent Wallet...'}
            {sdkStep === 'AUTHENTICATING' && 'Authenticating Intent...'}
            {sdkStep === 'CHECKING_ALLOWANCE' && 'Verifying Permissions...'}
            {sdkStep === 'APPROVING_FORWARDER' && 'Approving UGF Relayer...'}
            {sdkStep === 'SUBMITTING_PAYMENT' && 'Sponsoring Gas...'}
            {sdkStep === 'EXECUTING_ON_CHAIN' && 'Finalizing Intent Execution...'}
          </span>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="spectra-agent-page">
      <div className="spectra-agent-terminal-header" style={{ marginBottom: '16px' }}>
        <div className="spectra-agent-header-left">
          <span className="material-symbols-outlined spectra-agent-header-icon">terminal</span>
          <span className="spectra-agent-header-title">AGENTIC_WALLET_OS // ACTIVE_MODE</span>
        </div>
      </div>
      
      <div className="spectra-agent-layout">
        
        {/* Sidebar History */}
        <div className="spectra-agent-sidebar">
          <div className="spectra-sidebar-title">Session History</div>
          {history.length === 0 ? (
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', fontFamily: 'Geist Mono' }}>
              No previous intents in this session.
            </div>
          ) : (
            history.map((h, i) => (
              <div 
                key={i} 
                className="spectra-history-item"
                onClick={() => setPrompt(h)}
              >
                {h}
              </div>
            ))
          )}
        </div>

        {/* Central Terminal */}
        <div className="spectra-agent-main">
          
          {/* Glassmorphic Pills */}
          <div className="spectra-agent-pills">
            {SUGGESTION_PILLS.map((pill, i) => (
              <div 
                key={i} 
                className="spectra-pill"
                onClick={() => handleSubmit(null, pill)}
              >
                {pill}
              </div>
            ))}
          </div>

          <div className="spectra-agent-chat-area">
            {prompt && (
              <div className="spectra-agent-card spectra-agent-card-user">
                <span className="spectra-agent-label">USER_INPUT</span>
                <div className="spectra-agent-bubble">{prompt}</div>
              </div>
            )}

            {(intent || isLoading || error || executionError) && (
              <div className="spectra-agent-card spectra-agent-card-system">
                <span className="spectra-agent-label">SYSTEM_AGENT</span>
                <div className="spectra-agent-bubble">
                  
                  {/* Handle AI-generated error (vague input) */}
                  {intent?.error ? (
                    <div className="spectra-agent-system-lines">
                      <p className="spectra-agent-line" style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>
                        &gt; [ CLARIFICATION_REQUIRED ]
                      </p>
                      <p className="spectra-agent-line">{intent.error}</p>
                    </div>
                  ) : (
                    <>
                      <div className="spectra-agent-system-lines">
                        {isLoading && <p className="spectra-agent-line">&gt; Parsing intent...</p>}
                        {intent && !intent.error && <p className="spectra-agent-line">&gt; Constructing transaction payload...</p>}
                        <p className="spectra-agent-line">
                          &gt; Status: <span className="spectra-agent-status">[ {status} ]</span>
                        </p>
                      </div>

                      {renderStatusIndicator()}

                      {/* Task 3: Red Alert Box for execution errors */}
                      {executionError && (
                        <div className="spectra-error-alert" style={{
                          background: 'rgba(255, 0, 0, 0.1)',
                          border: '1px solid rgba(255, 0, 0, 0.3)',
                          color: '#ff4d4d',
                          padding: '12px',
                          borderRadius: '4px',
                          margin: '12px 0',
                          fontSize: '0.85rem',
                          fontFamily: 'Geist Mono'
                        }}>
                          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>[ PIPELINE_FAILURE ]</div>
                          {executionError}
                        </div>
                      )}

                      {intent && !intent.error && (
                        <div className="spectra-agent-json">
                          <pre className="spectra-agent-pre">
                            {JSON.stringify(intentJson, null, 2)}
                          </pre>
                        </div>
                      )}

                      {intent && !intent.error && (
                        <button
                          type="button"
                          className="spectra-agent-cta"
                          onClick={handleSignAndExecute}
                          disabled={!intent || isExecutingState || sdkLoading}
                        >
                          <span className="material-symbols-outlined spectra-agent-cta-icon">signature</span>
                          <span className="spectra-agent-cta-text">{isExecutingState || sdkLoading ? 'PIPELINE_ACTIVE...' : 'Sign & Execute (UGF Gasless)'}</span>
                        </button>
                      )}
                    </>
                  )}

                  {walletAddress && (
                    <p className="spectra-agent-line spectra-agent-wallet">Connected: {walletAddress}</p>
                  )}
                  {txHash && (
                    <p className="spectra-agent-line spectra-agent-wallet">Tx Hash: {txHash}</p>
                  )}
                </div>
              </div>
            )}

            {error && <div className="spectra-agent-error">{error}</div>}
          </div>

          {/* Central Input Bar */}
          <div className="spectra-agent-input-container">
            <form className="spectra-agent-input-row" onSubmit={handleSubmit}>
              <span className="material-symbols-outlined spectra-agent-input-icon">chevron_right</span>
              <input
                className="spectra-agent-input"
                placeholder="What onchain action can I route for you?"
                type="text"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                disabled={isLoading || isExecutingState || sdkLoading}
              />
              <button className="spectra-agent-submit" type="submit" disabled={isLoading || isExecutingState || sdkLoading || !prompt.trim()}>
                {isLoading ? '[ PARSING ]' : '[ SUBMIT ]'}
              </button>
            </form>
          </div>
          
        </div>
      </div>
    </div>
  );
}
