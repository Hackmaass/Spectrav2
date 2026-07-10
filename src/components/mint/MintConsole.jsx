import React, { useMemo, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useUGF } from '../../hooks/useUGF';
import { useAuth } from '../../context/AuthContext';
import { CONTRACT_ABIS, CONTRACT_ADDRESSES, TOKEN_ADDRESSES } from '../../config/contracts.js';

const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function decimals() view returns (uint8)',
];

const TIERS = [
  {
    id: 'alpha',
    name: 'ALPHA',
    price: 'FREE',
    deduction: '0.00',
    plan: 0,
    badge: '/1.png',
    spline: '/1.mp4',
    description: 'Read-only terminal access and public data feeds.',
    features: ['Read-only terminal access', 'Public data feeds', '10 Daily Agent Usages'],
  },
  {
    id: 'vector',
    name: 'VECTOR',
    price: '$15 / MO',
    deduction: '15.00',
    plan: 1,
    badge: '/2.png',
    spline: '/2.mp4',
    description: 'Standard terminal access with private data channels.',
    features: ['Standard terminal access', 'Private data channels', '15 Daily Agent Usages'],
  },
  {
    id: 'nexus',
    name: 'NEXUS',
    price: '$49 / MO',
    deduction: '49.00',
    plan: 2,
    badge: '/3.png',
    spline: '/3.mp4',
    description: 'Root terminal access with unlimited data pipelines.',
    features: ['Root terminal access', 'Unlimited data pipelines', '30 Daily Agent Usages'],
  },
];

const ZERO = '0.00';

export default function MintConsole() {
  const [selectedTier, setSelectedTier] = useState('nexus');
  const [ethBalance, setEthBalance] = useState(ZERO);
  const [mockUsdBalance, setMockUsdBalance] = useState(ZERO);
  const [isMinting, setIsMinting] = useState(false);
  const [status, setStatus] = useState('IDLE');
  const [executionError, setExecutionError] = useState('');
  const [txHash, setTxHash] = useState('');
  const [userTier, setUserTier] = useState(-1);
  const [ownedTokenId, setOwnedTokenId] = useState(0);
  const { walletAddress, connectWallet } = useAuth();
  const account = walletAddress;

  const { execute, loading: sdkLoading, step: sdkStep } = useUGF();

  const activeTier = useMemo(() => TIERS.find((tier) => tier.id === selectedTier) || TIERS[2], [selectedTier]);

  const fetchBalances = async (provider, addr) => {
    try {
      const [ethRaw, mockUsdContract, saasContract] = await Promise.all([
        provider.getBalance(addr).catch(() => 0n),
        Promise.resolve(new ethers.Contract(TOKEN_ADDRESSES.TYI, ERC20_ABI, provider)),
        Promise.resolve(new ethers.Contract(CONTRACT_ADDRESSES.SPECTRA_SAAS, CONTRACT_ABIS.SPECTRA_SAAS, provider))
      ]);

      let mockUsdRaw = 0n;
      let decimals = 18;
      try {
        decimals = await mockUsdContract.decimals();
        mockUsdRaw = await mockUsdContract.balanceOf(addr);
      } catch (e) {
        console.warn('[MintConsole] Failed to fetch TYI balance:', e);
      }
      
      let tier = -1;
      try {
        tier = Number(await saasContract.getUserTier(addr));
      } catch (e) {
        console.warn('[MintConsole] Failed to fetch active tier:', e);
      }

      let ownedTokenId = 0;
      try {
        const nftContract = new ethers.Contract(CONTRACT_ADDRESSES.SPECTRA_NFT, CONTRACT_ABIS.SPECTRA_NFT, provider);
        ownedTokenId = Number(await nftContract.userTokenId(addr));
      } catch (e) {
        console.warn('[MintConsole] Failed to fetch userTokenId:', e);
      }

      setEthBalance(Number(ethers.formatEther(ethRaw)).toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 }));
      setMockUsdBalance(Number(ethers.formatUnits(mockUsdRaw, decimals)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
      setUserTier(tier);
      setOwnedTokenId(ownedTokenId);
    } catch (err) {
      console.warn('[MintConsole] fetchBalances encountered a critical error:', err);
      setEthBalance(ZERO);
      setMockUsdBalance(ZERO);
      setUserTier(-1);
      setOwnedTokenId(0);
    }
  };

  const ensureBaseSepolia = async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x14a34' }], // 84532 in hex
      });
    } catch (switchError) {
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0x14a34',
            chainName: 'Base Sepolia',
            nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
            rpcUrls: ['https://sepolia.base.org'],
            blockExplorerUrls: ['https://sepolia.basescan.org'],
          }],
        });
      }
    }
  };

  const connectWalletLocal = async () => {
    if (!window.ethereum) {
      throw new Error('No injected wallet found.');
    }

    await ensureBaseSepolia();
    const addr = await connectWallet();
    const provider = new ethers.BrowserProvider(window.ethereum);
    await fetchBalances(provider, addr);
    return { provider, account: addr };
  };

  useEffect(() => {
    const hydrate = async () => {
      if (!window.ethereum || !walletAddress) return;
      const provider = new ethers.BrowserProvider(window.ethereum);
      await fetchBalances(provider, walletAddress);
    };
    if (walletAddress) {
      hydrate().catch(e => console.warn('[MintConsole] Hydration failed:', e));
    } else {
      setEthBalance(ZERO);
      setMockUsdBalance(ZERO);
      setUserTier(-1);
      setOwnedTokenId(0);
    }
  }, [walletAddress]);

  const handleMint = async () => {
    if (isMinting || sdkLoading) return;

    setIsMinting(true);
    setExecutionError('');
    setTxHash('');

    try {
      const tier = activeTier;
      if (tier.id === 'alpha') {
        throw new Error('Alpha tier is read-only and cannot mint a subscription badge.');
      }

      setStatus('CONNECTING');
      const { provider } = await connectWalletLocal();
      const signer = await provider.getSigner();
      const token = new ethers.Contract(TOKEN_ADDRESSES.TYI, ERC20_ABI, signer);
      const decimals = await token.decimals();
      const feeAmount = ethers.parseUnits(String(tier.deduction), decimals);

      // ── Preflight: check TYI balance BEFORE hitting the chain ──────────────
      const balance = await token.balanceOf(account);
      if (balance < feeAmount) {
        const have = Number(ethers.formatUnits(balance, decimals)).toFixed(2);
        const need = tier.deduction;
        throw new Error(
          `Insufficient TYI balance. You have ${have} TYI but need ${need} TYI.\n` +
          `(Note: TYI is the mock token for Base Sepolia tests. Please use the Stellar test flow instead!)`
        );
      }

      // Step 1: Approve SaaS contract to spend TYI
      setStatus('APPROVING_SAAS');
      const allowance = await token.allowance(account, CONTRACT_ADDRESSES.SPECTRA_SAAS);
      if (allowance < feeAmount) {
        const approveTx = await token.approve(CONTRACT_ADDRESSES.SPECTRA_SAAS, ethers.MaxUint256);
        await approveTx.wait(1);
      }

      // Step 2: Subscribe
      setStatus('SUBSCRIBING');
      const saas = new ethers.Contract(CONTRACT_ADDRESSES.SPECTRA_SAAS, CONTRACT_ABIS.SPECTRA_SAAS, signer);
      const subscribeTx = await saas.subscribe(tier.plan);
      await subscribeTx.wait(1);

      // Step 3: Gasless Minting via UGF
      let functionName = '';
      if (tier.id === 'vector') functionName = 'mintVectorBadge';
      else if (tier.id === 'nexus') functionName = 'mintNexusBadge';

      const iface = new ethers.Interface(CONTRACT_ABIS.SPECTRA_NFT);
      const data = iface.encodeFunctionData(functionName, []);

      setStatus('MINTING_BADGE');
      const result = await execute({
        target: CONTRACT_ADDRESSES.SPECTRA_NFT,
        data,
        paymentToken: TOKEN_ADDRESSES.TYI,
        signer
      });

      if (result && result.userTxHash) {
        setTxHash(result.userTxHash);
        setStatus('MINTED');
        await fetchBalances(provider, account);
      }

    } catch (err) {
      console.error('[MintConsole] Execution Error:', err);
      // Surface a clean message — strip the raw revert hex from ethers errors
      const msg = err.reason || err.shortMessage || err.message || 'Unknown error';
      setExecutionError(msg);
      setStatus('ERROR');
    } finally {
      setIsMinting(false);
    }
  };

  const handleCancelNFT = async () => {
    if (activeTier.id === 'alpha') return;
    if (isMinting || sdkLoading) return;
    if (!window.confirm('Are you sure you want to cancel the NFT? This will remove the benefits too.')) {
      return;
    }

    setIsMinting(true);
    setExecutionError('');
    setTxHash('');
    setStatus('CANCELLING');

    try {
      const { provider } = await connectWalletLocal();
      const signer = await provider.getSigner();

      // Step 1: Cancel subscription on SaaS Contract
      setStatus('CANCELLING_SAAS');
      const saas = new ethers.Contract(CONTRACT_ADDRESSES.SPECTRA_SAAS, CONTRACT_ABIS.SPECTRA_SAAS, signer);
      const cancelTx = await saas.cancelSubscription();
      await cancelTx.wait(1);

      // Step 2: Burn NFT on NFT Contract
      if (ownedTokenId > 0) {
        setStatus('BURNING_NFT');
        const nft = new ethers.Contract(CONTRACT_ADDRESSES.SPECTRA_NFT, CONTRACT_ABIS.SPECTRA_NFT, signer);
        const burnTx = await nft.burn(ownedTokenId);
        await burnTx.wait(1);
      }

      setStatus('CANCELLED');
      await fetchBalances(provider, account);
    } catch (err) {
      console.error('[MintConsole] Cancellation Error:', err);
      setExecutionError(err.message);
      setStatus('ERROR');
    } finally {
      setIsMinting(false);
    }
  };

  const renderStatusIndicator = () => {
    const isSdkActive = ['AUTHENTICATING', 'CHECKING_ALLOWANCE', 'APPROVING_FORWARDER', 'SUBMITTING_PAYMENT', 'EXECUTING_ON_CHAIN'].includes(sdkStep);
    
    if (isMinting || isSdkActive) {
      return (
        <div className="spectra-agent-loader-row" style={{ marginTop: '12px' }}>
          <div className="spectra-agent-geometric-spinner" />
          <span className="spectra-agent-loader-text">
            {status === 'CONNECTING' && 'Establishing Secure Connection...'}
            {status === 'APPROVING_SAAS' && 'Approving Subscription Fee...'}
            {status === 'SUBSCRIBING' && 'Confirming Plan Selection...'}
            {status === 'MINTING_BADGE' && (isSdkActive ? `UGF Pipeline: ${sdkStep}` : 'Preparing Gasless Mint...')}
            {status === 'CANCELLING' && 'Initializing Cancellation...'}
            {status === 'CANCELLING_SAAS' && 'Cancelling SaaS Plan...'}
            {status === 'BURNING_NFT' && 'Burning Subscription Badge NFT...'}
          </span>
        </div>
      );
    }
    return null;
  };

  const isBadgeOwned = activeTier.plan <= userTier;
  const badgeStyle = {
    filter: isBadgeOwned ? 'none' : 'grayscale(100%) opacity(50%)',
    transition: 'all 0.3s ease'
  };

  return (
    <div className="spectra-mint-grid">
      <div className="spectra-mint-left">
        <div className="spectra-render-box" style={{ position: 'relative' }}>
          {/* <div className="spectra-render-label">[ RENDER VIEW ]</div>
          <div className="spectra-status-badge">{status}</div> */}

          {activeTier.spline ? (
            <div className='nftdiv' style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <video 
              className='nftvideo'
                src={activeTier.spline} 
                autoPlay 
                loop 
                muted 
                playsInline 
                style={{ width: '100%', height: '100%', objectFit: 'cover', ...badgeStyle }}
              />
            </div>
          ) : (
            <img className="spectra-badge-image" style={badgeStyle} src={activeTier.badge} alt={`${activeTier.name} badge`} />
          )}
        </div>

        <div className="spectra-action-box">
          <div className="spectra-action-head">
            <span className="spectra-action-label">Estimated Deduction</span>
            <span className="spectra-action-value">{activeTier.deduction} UGF/MO</span>
          </div>

          {executionError && (
            <div className="spectra-error-alert" style={{
              background: 'rgba(255, 0, 0, 0.1)',
              border: '1px solid rgba(255, 0, 0, 0.3)',
              color: '#ff4d4d',
              padding: '12px',
              borderRadius: '4px',
              marginBottom: '12px',
              fontSize: '0.85rem',
              fontFamily: 'Geist Mono',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>[ PIPELINE_FAILURE ]</div>
              {executionError.split('\n').map((line, i) => {
                const urlMatch = line.match(/(https?:\/\/[^\s]+)/);
                if (urlMatch) {
                  const [before, url] = line.split(urlMatch[0]);
                  return (
                    <div key={i}>{before}
                      <a href={urlMatch[0]} target="_blank" rel="noopener noreferrer"
                        style={{ color: '#60a5fa', textDecoration: 'underline' }}>
                        {urlMatch[0]}
                      </a>
                      {url}
                    </div>
                  );
                }
                return <div key={i}>{line}</div>;
              })}
            </div>
          )}

          <button className="spectra-mint-btn" type="button" onClick={handleMint} disabled={isMinting || isBadgeOwned || sdkLoading}>
            {isMinting || sdkLoading ? 'PIPELINE_ACTIVE...' : isBadgeOwned ? 'BADGE_ALREADY_OWNED' : 'MINT_SUBSCRIPTION_BADGE'}
          </button>

          {isBadgeOwned && activeTier.id !== 'alpha' && (
            <button 
              className="spectra-mint-btn" 
              type="button" 
              onClick={handleCancelNFT}
              disabled={isMinting || sdkLoading}
              style={{
                marginTop: '12px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#fca5a5',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)';
                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
              }}
            >
              {isMinting ? 'CANCELLING...' : 'CANCEL SUBSCRIPTION & BURN NFT'}
            </button>
          )}
          
          {renderStatusIndicator()}

          {status !== 'IDLE' && (
            <div className="spectra-mint-status">{status === 'MINTED' ? 'SUCCESS: TRANSACTION CONFIRMED' : `STATUS: ${status}`}</div>
          )}

          <div className="spectra-balance-stack">
            <span className="spectra-balance-text">Base Sepolia ETH: {ethBalance}</span>
            <span className="spectra-balance-text">TYI Wallet Balance: {mockUsdBalance}</span>
          </div>
          {txHash && <div className="spectra-tx-panel">Mint confirmed: {txHash}</div>}
        </div>
      </div>

      <div className="spectra-mint-right">
        <div className="spectra-tier-label">Select Access Tier</div>
        <div className="spectra-tier-grid">
          {TIERS.map((tier) => {
            const isActive = tier.id === selectedTier;
            return (
              <div
                key={tier.id}
                className={`spectra-tier-card scroll-dribble-card ${isActive ? 'spectra-tier-card-active' : ''}`}
                onClick={() => setSelectedTier(tier.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    setSelectedTier(tier.id);
                  }
                }}
              >
                <div className="spectra-tier-top">
                  <h3 className="spectra-tier-name">{tier.name}</h3>
                  <div className="spectra-tier-price">{tier.price}</div>
                </div>
                <p className="spectra-tier-description">{tier.description}</p>
                <ul className="spectra-tier-list">
                  {tier.features.map((feature, index) => (
                    <li key={feature} className="spectra-tier-item">
                      <span className="material-symbols-outlined spectra-tier-icon">
                        {tier.id === 'alpha' && index === 2 ? 'close' : 'check'}
                      </span>
                      <span className="spectra-tier-feature">{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className={`spectra-tier-foot ${isActive ? 'spectra-tier-foot-active' : ''}`}>
                  {isActive ? 'ACTIVE SELECTION' : `SELECT [ ${tier.name.charAt(0)} ]`}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
