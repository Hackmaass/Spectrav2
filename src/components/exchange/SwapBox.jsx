import React, { useEffect, useMemo, useState } from 'react';
import { ethers } from 'ethers';
import { useUGF } from '../../hooks/useUGF';
import { useAuth } from '../../context/AuthContext';
import { CONTRACT_ABIS, CONTRACT_ADDRESSES, TOKEN_ADDRESSES, resolveTokenAddress, resolveTokenLabel, ensureBaseSepolia, assertAddressFormat } from '../../config/contracts.js';
import { getTokenBalance, getTokenDecimals } from '../../lib/stellar/contracts/token';
import { swapTokens } from '../../lib/stellar/contracts/exchange';

const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function decimals() view returns (uint8)',
];

export const ASSET_OPTIONS = [
  { id: 'TYI', label: 'TYI (Mock USD)', tokenAddress: TOKEN_ADDRESSES.TYI, symbol: 'TYI', decimals: 6 },
  { id: 'ETH', label: 'Ethereum (WETH)', tokenAddress: TOKEN_ADDRESSES.WETH, symbol: 'ETHUSDT', decimals: 18 },
  { id: 'BASE_SEPOLIA_ETH', label: 'Base Sepolia ETH', tokenAddress: TOKEN_ADDRESSES.WETH, symbol: 'ETHUSDT', decimals: 18 },
  { id: 'USDC', label: 'USDC', tokenAddress: TOKEN_ADDRESSES.USDC, symbol: 'USDC', decimals: 6 },
  { id: 'WBTC', label: 'Wrapped BTC', tokenAddress: TOKEN_ADDRESSES.WBTC, symbol: 'WBTC', decimals: 8 },
  { id: 'XLM', label: 'Stellar Lumens (XLM)', tokenAddress: TOKEN_ADDRESSES.TYI, symbol: 'XLM', decimals: 7 },
];

const SAC_MAP = {
  'TYI': import.meta.env.VITE_STELLAR_SAC_TYI || 'CDLZFC3SYJYDZT7K67VZ75HPJVIEWBEJLY4U7O76T4N2S27ZEMB6M2XF',
  'USDC': import.meta.env.VITE_STELLAR_SAC_USDC || 'CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA',
  'XLM': import.meta.env.VITE_STELLAR_SAC_XLM || 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
  'EURC': import.meta.env.VITE_STELLAR_SAC_EURC || 'CCUUDM434BMZMYWYDITHFXHDMIVTGGD6T2I5UKNX5BSLXLW7HVR4MCGZ'
};

const resolveSacAddress = (assetId) => {
  return SAC_MAP[assetId] || SAC_MAP['TYI'];
};

const ZERO = '0.00';

export default function SwapBox({
  payAmount,
  onPayAmountChange,
  receiveAmount,
  selectedAsset,
  onAssetChange,
  payAsset = 'TYI',
  onPayAssetChange,
  onTxHashChange,
  onError,
}) {
  const { walletAddress, connectWallet, stellarPublicKey, isStellarConnected, connectStellar } = useAuth();
  const account = walletAddress;
  const stellarAccount = stellarPublicKey;
  const [ethBalance, setEthBalance] = useState(ZERO);
  const [paymentTokenBalance, setPaymentTokenBalance] = useState(ZERO);
  const [rawPaymentTokenBalance, setRawPaymentTokenBalance] = useState('0');
  const [selectedAssetBalance, setSelectedAssetBalance] = useState(ZERO);
  const [isExecutingState, setIsExecutingState] = useState(false);
  const [executionError, setExecutionError] = useState('');

  const { execute, loading: sdkLoading, error: sdkError, step: sdkStep } = useUGF();

  const [localPayAsset, setLocalPayAsset] = useState('TYI');
  const activePayAsset = payAsset || localPayAsset;
  const handlePayAssetChange = onPayAssetChange || setLocalPayAsset;

  const activePayAssetMeta = useMemo(() => ASSET_OPTIONS.find((option) => option.id === activePayAsset) || ASSET_OPTIONS[0], [activePayAsset]);
  const activeAsset = selectedAsset || ASSET_OPTIONS[1].id;
  const activeAssetMeta = useMemo(() => ASSET_OPTIONS.find((option) => option.id === activeAsset) || ASSET_OPTIONS[1], [activeAsset]);

  const formatTokenBalance = async (contract, addr) => {
    try {
      const decimals = await contract.decimals();
      const balance = await contract.balanceOf(addr);
      return Number(ethers.formatUnits(balance, decimals)).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 6,
      });
    } catch (err) {
      console.warn('[SwapBox] Failed to fetch token balance:', err);
      return ZERO;
    }
  };

  const fetchBalances = async (provider, addr, stellarAddr) => {
    try {
      if (stellarAddr) {
        // Fetch Stellar Balances
        const paySacAddress = resolveSacAddress(activePayAssetMeta.id);
        
        const payDecimals = await getTokenDecimals(paySacAddress);
        const payBalanceRaw = await getTokenBalance(paySacAddress, stellarAddr);
        const payFormatted = Number(ethers.formatUnits(payBalanceRaw, payDecimals)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6});
        
        setEthBalance("0.0000"); // XLM balance would go here
        setPaymentTokenBalance(payFormatted);
        setSelectedAssetBalance("0.00");
        setRawPaymentTokenBalance(ethers.formatUnits(payBalanceRaw, payDecimals));
        return;
      }

      const selectedTokenAddress = activeAssetMeta.tokenAddress;
      const payTokenAddress = activePayAssetMeta.tokenAddress;
      const [ethRaw, paymentContract, selectedContract] = await Promise.all([
        provider.getBalance(addr).catch(() => 0n),
        Promise.resolve(new ethers.Contract(payTokenAddress, ERC20_ABI, provider)),
        Promise.resolve(new ethers.Contract(selectedTokenAddress, ERC20_ABI, provider)),
      ]);

      const [paymentTokenFormatted, selectedAssetFormatted] = await Promise.all([
        formatTokenBalance(paymentContract, addr),
        formatTokenBalance(selectedContract, addr),
      ]);

      setEthBalance(Number(ethers.formatEther(ethRaw)).toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 }));
      setPaymentTokenBalance(paymentTokenFormatted);
      setSelectedAssetBalance(selectedAssetFormatted);

      const payDec = await paymentContract.decimals();
      const payBal = await paymentContract.balanceOf(addr);
      setRawPaymentTokenBalance(ethers.formatUnits(payBal, payDec));
    } catch (err) {
      console.warn('[SwapBox] fetchBalances encountered an error:', err);
      setEthBalance(ZERO);
      setPaymentTokenBalance(ZERO);
      setSelectedAssetBalance(ZERO);
      setRawPaymentTokenBalance('0');
    }
  };

  const handleMaxClick = () => {
    onPayAmountChange(rawPaymentTokenBalance);
  };

  const connectWalletLocal = async () => {
    if (!window.ethereum) {
      throw new Error('No injected wallet found.');
    }

    try {
      // Always try connecting to Stellar first
      const stellarAddr = await connectStellar();
      if (stellarAddr) {
        await fetchBalances(null, null, stellarAddr);
        return { isStellar: true, account: stellarAddr };
      }
    } catch (err) {
      console.warn("Stellar connection skipped, falling back to EVM");
    }

    await ensureBaseSepolia();
    const addr = await connectWallet();
    const provider = new ethers.BrowserProvider(window.ethereum);
    await fetchBalances(provider, addr, null);
    return { isStellar: false, provider, account: addr };
  };

  useEffect(() => {
    const hydrate = async () => {
      if (!window.ethereum || (!walletAddress && !stellarPublicKey)) return;
      
      const provider = window.ethereum && walletAddress ? new ethers.BrowserProvider(window.ethereum) : null;
      await fetchBalances(provider, walletAddress, stellarPublicKey);
    };

    if (walletAddress || stellarPublicKey) {
      hydrate().catch((error) => console.warn('[SwapBox] Hydration failed:', error));
    } else {
      setEthBalance(ZERO);
      setPaymentTokenBalance(ZERO);
      setSelectedAssetBalance(ZERO);
      setRawPaymentTokenBalance('0');
    }
  }, [walletAddress, stellarPublicKey, activePayAsset, activeAsset]);

  const handleExecuteSwap = async () => {
    if (isExecutingState || sdkLoading) return;

    setIsExecutingState(true);
    setExecutionError('');
    onTxHashChange?.('');

    try {
      if (!window.ethereum) {
        throw new Error('No injected wallet found.');
      }

      const safeAmount = Number(payAmount);
      if (!Number.isFinite(safeAmount) || safeAmount <= 0) {
        throw new Error('Enter a valid pay amount before executing swap.');
      }

      if (activePayAsset === activeAsset) {
        throw new Error('Pay and Receive assets must be different.');
      }

      let isStellar = false;
      let currentAccount = '';
      let provider = null;
      
      const sessionStellar = localStorage.getItem('spectra_stellar_wallet');
      const sessionEVM = localStorage.getItem('spectra_wallet');

      if (sessionStellar) {
        isStellar = true;
        currentAccount = sessionStellar;
      } else if (sessionEVM) {
        isStellar = false;
        currentAccount = sessionEVM;
        provider = new ethers.BrowserProvider(window.ethereum);
      } else {
        const res = await connectWalletLocal();
        isStellar = res.isStellar;
        currentAccount = res.account;
        provider = res.provider;
      }
      
      if (isStellar) {
        // --- STELLAR EXECUTION PATH ---
        const tokenInSAC = resolveSacAddress(activePayAssetMeta.id);
        const tokenOutSAC = resolveSacAddress(activeAssetMeta.id);
        
        // PRE-FLIGHT VALIDATION: Prevent cross-contamination
        if (!tokenInSAC.startsWith('C') || !tokenOutSAC.startsWith('C') || tokenInSAC.length !== 56) {
          throw new Error('CRITICAL ROUTING ERROR: Stellar session attempted to execute using non-SAC (0x...) token addresses.');
        }
        
        // Convert input amount based on token decimals
        const decimalsIn = activePayAssetMeta.decimals;
        const amountInParsed = ethers.parseUnits(String(safeAmount), decimalsIn).toString();

        const result = await swapTokens(
          currentAccount,
          tokenInSAC,
          tokenOutSAC,
          amountInParsed,
          '0'
        );
        
        if (result && result.hash) {
          onTxHashChange?.(result.hash);
          fetchBalances(null, null, currentAccount).catch(() => {});
          setTimeout(() => fetchBalances(null, null, currentAccount).catch(() => {}), 3000);
        }
        
      } else {
        // --- ETHEREUM EXECUTION PATH ---
        const signer = await provider.getSigner();
        
        const decimalsIn = activePayAssetMeta.decimals;
        const amountIn = ethers.parseUnits(String(safeAmount), decimalsIn);
        const tokenIn = activePayAssetMeta.tokenAddress;
        const tokenOut = activeAssetMeta.tokenAddress;
        const minAmountOut = 0n;

        // Hard guard: reject immediately if either address is not EVM-format
        assertAddressFormat(tokenIn, 'evm', activePayAsset);
        assertAddressFormat(tokenOut, 'evm', activeAsset);

        // PRE-FLIGHT VALIDATION: Prevent cross-contamination
        if (!tokenIn.startsWith('0x') || !tokenOut.startsWith('0x') || tokenIn.length !== 42) {
          throw new Error('CRITICAL ROUTING ERROR: EVM session attempted to pass a Soroban Asset Contract (C...) address to UGF Relayer.');
        }

        const iface = new ethers.Interface(CONTRACT_ABIS.SPECTRA_EXCHANGE);
        const encodedData = iface.encodeFunctionData('swap', [
          tokenIn,
          tokenOut,
          amountIn,
          minAmountOut
        ]);

        if (activePayAsset !== 'ETH') {
          const tokenContract = new ethers.Contract(
            tokenIn,
            [
              'function allowance(address owner, address spender) view returns (uint256)',
              'function approve(address spender, uint256 amount) returns (bool)'
            ],
            signer
          );
          const ownerAddress = await signer.getAddress();
          const allowance = await tokenContract.allowance(ownerAddress, CONTRACT_ADDRESSES.SPECTRA_EXCHANGE);
          if (allowance < amountIn) {
            setExecutionError(`${activePayAsset} allowance is missing. Sending approval transaction first...`);
            const approveTx = await tokenContract.approve(CONTRACT_ADDRESSES.SPECTRA_EXCHANGE, ethers.MaxUint256);
            await approveTx.wait(1);
            setExecutionError('');
          }
        }

        const result = await execute({
          target: CONTRACT_ADDRESSES.SPECTRA_EXCHANGE,
          data: encodedData,
          paymentToken: TOKEN_ADDRESSES.TYI,
          signer
        });

        if (result && result.userTxHash) {
          onTxHashChange?.(result.userTxHash);
          fetchBalances(provider, currentAccount).catch(() => {});
          setTimeout(() => fetchBalances(provider, currentAccount).catch(() => {}), 3000);
        }
      }

    } catch (swapError) {
      console.error('[SwapBox] Pipeline Error:', swapError);
      
      let message = swapError.message || 'Pipeline Execution Failed';
      
      if (message.includes('500') || message.includes('Internal Server Error')) {
        message = 'Relayer Error: The UGF network rejected the transaction payload. Verify that the exchange has liquidity and the token addresses are correct.';
      }

      setExecutionError(message);
    } finally {
      setIsExecutingState(false);
    }
  };

  const handleConnect = async () => {
    try {
      await connectWalletLocal();
      setExecutionError('');
    } catch (connectError) {
      setExecutionError(connectError?.message || 'Wallet connection failed.');
    }
  };

  const renderPipelineStatus = () => {
    if (sdkLoading) {
      return (
        <div className="spectra-approval-loader">
          <div className="spectra-geometric-spinner" />
          <span className="spectra-approval-text">
            {sdkStep === 'AUTHENTICATING' && 'Authenticating with UGF...'}
            {sdkStep === 'CHECKING_ALLOWANCE' && 'Verifying Token Permissions...'}
            {sdkStep === 'APPROVING_FORWARDER' && 'Approving UGF Forwarder...'}
            {sdkStep === 'SUBMITTING_PAYMENT' && 'Processing Gasless Payment...'}
            {sdkStep === 'EXECUTING_ON_CHAIN' && 'Finalizing Swap Execution...'}
            {sdkStep === 'INITIALIZING' && 'Initializing Pipeline...'}
          </span>
        </div>
      );
    }
    return null;
  };

  const getButtonLabel = () => {
    if (sdkLoading) return `PIPELINE: ${sdkStep}`;
    if (isExecutingState) return 'PREPARING...';
    return 'Execute Gasless Swap (UGF)';
  };

  return (
    <div className="spectra-exchange-wrap">
      <div className="spectra-swap-box">
        <label className="spectra-swap-label">You Pay</label>
        <div className="spectra-swap-row">
          <input
            className="spectra-swap-input"
            type="text"
            inputMode="decimal"
            placeholder="0.0"
            value={payAmount}
            onChange={(event) => onPayAmountChange(event.target.value)}
          />
          <button
            type="button"
            onClick={handleMaxClick}
            style={{
              background: 'rgba(176, 38, 255, 0.12)',
              border: '1px solid rgba(176, 38, 255, 0.3)',
              borderRadius: '4px',
              color: '#ffffff',
              padding: '6px 12px',
              fontSize: '11px',
              cursor: 'pointer',
              textTransform: 'uppercase',
              marginRight: '8px',
              fontFamily: 'Geist, monospace',
              letterSpacing: '0.08em',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(176, 38, 255, 0.3)';
              e.currentTarget.style.borderColor = 'rgba(176, 38, 255, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(176, 38, 255, 0.12)';
              e.currentTarget.style.borderColor = 'rgba(176, 38, 255, 0.3)';
            }}
          >
            MAX
          </button>
          <select
            className="spectra-select"
            value={activePayAsset}
            onChange={(event) => handlePayAssetChange(event.target.value)}
          >
            {ASSET_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.id}
              </option>
            ))}
          </select>
        </div>
        <div className="spectra-balance-stack">
          <span className="spectra-balance-text">Base Sepolia ETH: {ethBalance}</span>
          <span className="spectra-balance-text">{activePayAssetMeta.label} Balance: {paymentTokenBalance}</span>
          {activePayAsset !== activeAsset && (
            <span className="spectra-balance-text">{activeAssetMeta.label} Balance: {selectedAssetBalance}</span>
          )}
        </div>
        {!account && !stellarPublicKey && (
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button className="spectra-connect-btn" type="button" onClick={handleConnect}>
              Connect Base (ETH)
            </button>
            <button className="spectra-connect-btn" type="button" onClick={async () => {
              try {
                await connectStellar();
                setExecutionError('');
              } catch (e) {
                setExecutionError(e.message || 'Stellar connect failed');
              }
            }} style={{ background: '#000', border: '1px solid #333' }}>
              Connect Stellar
            </button>
          </div>
        )}
      </div>

      <div className="spectra-swap-box">
        <label className="spectra-swap-label">You Receive</label>
        <div className="spectra-swap-row">
          <input className="spectra-swap-input" type="text" placeholder="0.0" value={receiveAmount} readOnly />
          <select
            className="spectra-select"
            value={activeAsset}
            onChange={(event) => onAssetChange(event.target.value)}
          >
            {ASSET_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="spectra-balance-row">
          <span className="spectra-balance-text">Live quote is pulled from the exchange contract for {activeAssetMeta.label}.</span>
        </div>
      </div>

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

      {renderPipelineStatus()}

      <button className="spectra-execute-btn" type="button" onClick={handleExecuteSwap} disabled={isExecutingState || sdkLoading}>
        {getButtonLabel()}
      </button>
    </div>
  );
}
