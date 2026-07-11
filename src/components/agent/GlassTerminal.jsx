import React, { useEffect, useMemo, useState, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import { ethers } from 'ethers';
import { tryParseDefiIntent } from '../../api/sarvamAgent.js';
import { CONTRACT_ABIS, CONTRACT_ADDRESSES, TOKEN_ADDRESSES, resolveTokenAddress, resolveTokenDecimals, resolveSacAddress } from '../../config/contracts.js';
import { swapTokens } from '../../lib/stellar/contracts/exchange';
import { useUGF } from '../../hooks/useUGF';
import { useAuth } from '../../context/AuthContext';
import { useRateLimit } from '../../context/RateLimitContext';

const Card = styled.section`
  width: 100%;
  max-width: 980px;
  background: rgba(10, 10, 11, 0.65);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow: 0 20px 70px rgba(176, 38, 255, 0.14);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  resize: vertical;
  min-height: 400px;
  max-height: 90vh;

  &::-webkit-resizer {
    background-color: transparent;
    border-style: solid;
    border-width: 0 0 14px 14px;
    border-color: transparent transparent rgba(176, 38, 255, 0.8) transparent;
  }
`;

const Header = styled.header`
  height: 52px;
  padding: 0 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const HeaderTitle = styled.div`
  font-family: 'Geist', monospace;
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  gap: 8px;
`;

const Dots = styled.div`
  display: inline-flex;
  gap: 8px;

  span {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    border: 1px solid rgba(255, 255, 255, 0.35);
  }
`;

const Body = styled.div`
  flex: 1;
  min-height: 150px;
  overflow-y: auto;
  padding: 22px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const EmptyState = styled.div`
  border: 1px dashed rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.02);
  color: #e5e5e5;
  font-family: 'Geist', monospace;
  font-size: 14px;
  padding: 18px;
`;

const Message = styled.div`
  align-self: ${({ $agent }) => ($agent ? 'flex-start' : 'flex-end')};
  width: min(88%, 760px);
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const MessageLabel = styled.span`
  font-family: 'Geist', monospace;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #e5e5e5;
`;

const MessageBubble = styled.div`
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: ${({ $agent }) => ($agent ? 'rgba(255,255,255,0.04)' : 'rgba(176,38,255,0.15)')};
  color: #ffffff;
  font-family: 'Geist', monospace;
  font-size: 14px;
  line-height: 1.6;
  padding: 12px 14px;
`;

const glowPulse = keyframes`
  0% { transform: scale(0.9) rotate(0deg); opacity: 0.35; }
  50% { transform: scale(1.08) rotate(180deg); opacity: 1; }
  100% { transform: scale(0.9) rotate(360deg); opacity: 0.35; }
`;

const LoaderWrap = styled.div`
  align-self: flex-start;
  width: min(88%, 760px);
  border: 1px solid rgba(176, 38, 255, 0.55);
  background: rgba(176, 38, 255, 0.08);
  padding: 14px;
  display: inline-flex;
  align-items: center;
  gap: 12px;
`;

const LoaderGeo = styled.div`
  width: 18px;
  height: 18px;
  border: 2px solid #b026ff;
  box-shadow: 0 0 14px rgba(176, 38, 255, 0.7);
  animation: ${glowPulse} 1.1s linear infinite;
`;

const LoaderText = styled.span`
  color: #ffffff;
  font-family: 'Geist', monospace;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const IntentCard = styled.article`
  border: 1px solid rgba(176, 38, 255, 0.6);
  background: rgba(176, 38, 255, 0.12);
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const IntentGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const SuggestionRail = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`;

const SuggestionButton = styled.button`
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(255, 255, 255, 0.03);
  color: #ffffff;
  padding: 10px 12px;
  font-family: 'Geist', monospace;
  font-size: 11px;
  letter-spacing: 0.06em;
  text-transform: uppercase;

  &:hover:not(:disabled) {
    border-color: rgba(176, 38, 255, 0.65);
    background: rgba(176, 38, 255, 0.14);
  }
`;

const IntentItem = styled.div`
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(10, 10, 11, 0.45);
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const IntentLabel = styled.span`
  font-family: 'Geist', monospace;
  font-size: 10px;
  color: #e5e5e5;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const IntentValue = styled.span`
  font-family: 'Geist', monospace;
  font-size: 14px;
  color: #ffffff;
  text-transform: uppercase;
`;

const ExecuteButton = styled.button`
  width: 100%;
  border: 1px solid #b026ff;
  color: #ffffff;
  background: rgba(176, 38, 255, 0.2);
  padding: 12px;
  font-family: 'Geist', monospace;
  font-size: 12px;
  letter-spacing: 0.1em;
  text-transform: uppercase;

  &:hover:not(:disabled) {
    box-shadow: 0 0 20px rgba(176, 38, 255, 0.45);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Footer = styled.form`
  height: 54px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 16px;
`;

const Input = styled.input`
  flex: 1;
  border: none;
  background: transparent;
  color: #ffffff;
  font-family: 'Geist', monospace;
  font-size: 15px;

  &::placeholder {
    color: #e5e5e5;
    opacity: 0.7;
  }

  &:focus {
    outline: none;
  }
`;

const SendButton = styled.button`
  border: 1px solid #b026ff;
  color: #ffffff;
  background: rgba(176, 38, 255, 0.2);
  padding: 9px 14px;
  font-family: 'Geist', monospace;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.1em;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const StatusText = styled.p`
  font-family: 'Geist', monospace;
  font-size: 12px;
  color: #e5e5e5;
`;

const ErrorBox = styled.div`
  border: 1px solid rgba(239, 68, 68, 0.65);
  background: rgba(239, 68, 68, 0.1);
  color: #ffffff;
  font-family: 'Geist', monospace;
  font-size: 12px;
  padding: 10px;
`;

const StatsBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  font-family: 'Geist', monospace;
  font-size: 11px;
  color: #a3a3a3;

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
`;

const StatsGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`;

const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 4px 8px;
  border-radius: 4px;
`;

const StatLabel = styled.span`
  color: #8a8a8a;
  text-transform: uppercase;
  font-size: 9px;
  letter-spacing: 0.05em;
`;

const StatValue = styled.span`
  color: #ffffff;
  font-weight: 600;
`;

const ConnectButtonMini = styled.button`
  background: rgba(176, 38, 255, 0.15);
  border: 1px solid rgba(176, 38, 255, 0.45);
  color: #ffffff;
  padding: 5px 10px;
  font-family: 'Geist', monospace;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(176, 38, 255, 0.3);
    border-color: rgba(176, 38, 255, 0.75);
    box-shadow: 0 0 10px rgba(176, 38, 255, 0.25);
  }
`;

const LayoutGrid = styled.div`
  display: flex;
  gap: 20px;
  width: 100%;
  max-width: 1280px;
  align-items: flex-start;

  @media (max-width: 1024px) {
    flex-direction: column;
  }
`;

const SidebarCard = styled.aside`
  flex: 0 0 320px;
  background: rgba(10, 10, 11, 0.65);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  overflow: hidden;
  backdrop-filter: blur(20px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  font-family: 'Geist', monospace;

  @media (max-width: 1024px) {
    flex: 1;
  }
`;

const SidebarHeader = styled.header`
  height: 54px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 16px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.15em;
  color: #888888;
  background: rgba(255, 255, 255, 0.01);
`;

const SidebarBody = styled.div`
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  flex: 1;
`;

const SidebarSectionTitle = styled.h3`
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #666666;
  margin: 0 0 8px 0;
`;

const BalanceBlock = styled.div`
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  position: relative;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 4px;
    height: 100%;
    background: ${props => props.$active ? '#b026ff' : 'transparent'};
  }
`;

const BalanceRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
`;

const BalanceLabel = styled.span`
  font-size: 10px;
  color: #888888;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const BalanceValue = styled.span`
  font-size: 20px;
  font-weight: 700;
  color: #ffffff;
`;

const BalanceToken = styled.span`
  font-size: 11px;
  color: #888888;
  margin-left: 4px;
`;

const BalanceRate = styled.span`
  font-size: 9px;
  color: #666666;
  font-family: 'Geist Mono', monospace;
  margin-top: 2px;
  letter-spacing: 0.02em;
`;

const SidebarConnectionStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: ${props => props.$connected ? '#10b981' : '#ef4444'};
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 12px;
`;

const ConnectionIndicator = styled.span`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${props => props.$connected ? '#10b981' : '#ef4444'};
  box-shadow: 0 0 8px ${props => props.$connected ? '#10b981' : '#ef4444'};
`;

const FaucetButton = styled.a`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: #10b981;
  text-decoration: none;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 600;

  &:hover {
    background: rgba(16, 185, 129, 0.2);
    border-color: rgba(16, 185, 129, 0.5);
    box-shadow: 0 0 12px rgba(16, 185, 129, 0.15);
  }
`;

const WarningBox = styled.div`
  border: 1px solid rgba(245, 158, 11, 0.65);
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
  font-family: 'Geist', monospace;
  font-size: 11px;
  padding: 12px;
  border-radius: 6px;
  margin-top: 10px;
  line-height: 1.5;
`;

const normalizeAmount = (value) => Number(String(value || '0').replace(/,/g, '')) || 0;

const formatSuggestionAmount = (value) => Number(value).toLocaleString('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
});

function buildTypedData(intent, chainId) {
  const domain = {
    name: 'SpectraIntentEngine',
    version: '1',
    chainId,
    verifyingContract: CONTRACT_ADDRESSES.SPECTRA_EXCHANGE,
  };

  const types = {
    EIP712Domain: [
      { name: 'name', type: 'string' },
      { name: 'version', type: 'string' },
      { name: 'chainId', type: 'uint256' },
      { name: 'verifyingContract', type: 'address' },
    ],
    SpectraIntent: [
      { name: 'action', type: 'string' },
      { name: 'amount', type: 'string' },
      { name: 'token', type: 'string' },
      { name: 'nonce', type: 'uint256' },
    ],
  };

  const message = {
    action: String(intent.action || ''),
    amount: String(intent.amount || '0'),
    token: String(intent.token || 'UNKNOWN').toUpperCase(),
    nonce: Date.now(),
  };

  return { domain, types, primaryType: 'SpectraIntent', message };
}

export default function GlassTerminal() {
  const { execute, loading: sdkLoading, error: sdkError, step: sdkStep } = useUGF();
  const { walletAddress, connectWallet, stellarPublicKey, connectStellar } = useAuth();
  const { consumeRequest } = useRateLimit();
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [intent, setIntent] = useState(null);
  const [flowState, setFlowState] = useState('IDLE');
  const [userTier, setUserTier] = useState(0);
  const [remainingTxs, setRemainingTxs] = useState(10);
  const [tokenBalances, setTokenBalances] = useState({});
  const [walletNonce, setWalletNonce] = useState(0);
  const [walletAllowance, setWalletAllowance] = useState('0.00');
  const [error, setError] = useState('');
  const [signature, setSignature] = useState('');
  const [hasHydratedWallet, setHasHydratedWallet] = useState(false);

  const TRADING_VIEW_SYMBOL = {
    TYI: "BINANCE:USDTUSD",
    WETH: "BINANCE:ETHUSDT",
    SEPOLIA_ETH: "BINANCE:ETHUSDT",
    USDC: "BINANCE:USDCUSDT",
    WBTC: "BINANCE:BTCUSDT",
    XLM: "BINANCE:XLMUSDT",
  };

  const statusText = useMemo(() => {
    if (sdkLoading) {
      if (sdkStep === 'AUTHENTICATING') return 'UGF: Authenticating Intent...';
      if (sdkStep === 'CHECKING_ALLOWANCE') return 'UGF: Verifying Permissions...';
      if (sdkStep === 'APPROVING_FORWARDER') return 'UGF: Approving UGF Relayer...';
      if (sdkStep === 'SUBMITTING_PAYMENT') return 'UGF: Sponsoring Gas...';
      if (sdkStep === 'EXECUTING_ON_CHAIN') return 'UGF: Finalizing Intent Execution...';
      return `UGF: ${sdkStep}...`;
    }
    if (isSigning) return 'Awaiting wallet signature...';
    if (signature) return `Signature captured: ${signature.slice(0, 16)}...`;
    if (walletAddress) return `Wallet connected: ${walletAddress}`;
    return 'Wallet disconnected';
  }, [sdkLoading, sdkStep, isSigning, signature, walletAddress]);

  const totalAssetValueUsd = useMemo(() => {
    let total = 0;
    Object.entries(tokenBalances).forEach(([symbol, bal]) => {
      const val = normalizeAmount(bal);
      if (symbol === 'ETH') total += val * 3500.00;
      else if (symbol === 'WBTC') total += val * 60000.00;
      else total += val * 1.00;
    });
    return total;
  }, [tokenBalances]);

  const walletSnapshot = useMemo(() => {
    if (!walletAddress) return 'Connect a wallet to fetch live balances.';
    const bals = Object.entries(tokenBalances).map(([s, b]) => `${s} ${b}`).join(' | ');
    return `Wallet ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)} | ${bals} | nonce ${walletNonce}`;
  }, [walletAddress, tokenBalances, walletNonce]);

  const suggestionChips = useMemo(() => {
    if (!walletAddress) return ['connect wallet to load live suggestions', 'check wallet balances', 'request a live swap quote'];
    
    const chips = [];
    Object.entries(tokenBalances).forEach(([symbol, bal]) => {
      const amount = normalizeAmount(bal);
      if (amount <= 0) return;
      
      const quarter = amount * 0.25;
      const half = amount * 0.5;
      
      if (symbol === 'ETH') {
        chips.push(`swap ${formatSuggestionAmount(quarter)} ETH to XLM`);
        chips.push(`swap ${formatSuggestionAmount(half)} ETH to TYI`);
      } else if (symbol === 'TYI') {
        chips.push(`swap ${formatSuggestionAmount(quarter)} TYI to ETH`);
        chips.push(`swap ${formatSuggestionAmount(half)} TYI to USDC`);
      } else {
        chips.push(`swap ${formatSuggestionAmount(quarter)} ${symbol} to XLM`);
      }
    });

    if (normalizeAmount(tokenBalances.TYI) > 0 && normalizeAmount(walletAllowance) <= 0) {
      chips.push('approve TYI for the exchange route');
    }

    if (chips.length === 0) {
      chips.push('Claim TYI from Faucet');
      chips.push('top up Base Sepolia ETH for gas');
      chips.push('check live UGF routing readiness');
    }

    return chips.slice(0, 4);
  }, [walletAddress, tokenBalances, walletAllowance]);

  const hasInsufficientBalance = useMemo(() => {
    if (!intent) return false;
    const needed = normalizeAmount(intent.amount);
    const token = String(intent.token || 'TYI').toUpperCase();
    const balance = normalizeAmount(tokenBalances[token] || 0);
    return needed > balance;
  }, [intent, tokenBalances]);

  const pushMessage = useCallback((from, content) => {
    setMessages((prev) => [...prev, { from, content }]);
  }, []);

  useEffect(() => {
    if (walletAddress && messages.length === 0 && !isLoading && hasHydratedWallet) {
      const balanceStrings = Object.entries(tokenBalances)
        .filter(([_, bal]) => Number(bal) > 0)
        .map(([symbol, bal]) => `${bal} ${symbol}`);
      
      const balanceText = balanceStrings.length > 0 
        ? `I see you have ${balanceStrings.join(', ')}.` 
        : `It looks like your wallet is currently empty.`;

      pushMessage('agent', `Terminal connected to ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}. ${balanceText} How can I assist you with your DeFi operations today?`);
    } else if (!walletAddress && messages.length === 0) {
      pushMessage('agent', `Welcome to Spectra Agent Terminal. Please connect your wallet to review your balances and execute swaps.`);
    }
  }, [walletAddress, tokenBalances, messages.length, isLoading, hasHydratedWallet, pushMessage]);

  const handleConnectWallet = async () => {
    try {
      await connectWallet();
    } catch (err) {
      setError(err.message || 'Failed to connect wallet.');
    }
  };

  const hydrateWallet = async () => {
    if (!window.ethereum || !walletAddress) {
      return;
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const account = walletAddress;

    try {
      const ethRaw = await provider.getBalance(account).catch(() => 0n);
      const txCount = await provider.getTransactionCount(account).catch(() => 0n);

      const fetchedBalances = {
        ETH: Number(ethers.formatEther(ethRaw)).toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })
      };

      const promises = Object.entries(TOKEN_ADDRESSES).map(async ([symbol, address]) => {
        if (symbol === 'ETH' || symbol === 'WETH' || address === ethers.ZeroAddress) return;
        const tokenContract = new ethers.Contract(address, [
          'function balanceOf(address owner) view returns (uint256)',
          'function decimals() view returns (uint8)'
        ], provider);
        try {
          const decimals = await tokenContract.decimals().catch(() => 18);
          const raw = await tokenContract.balanceOf(account).catch(() => 0n);
          fetchedBalances[symbol] = Number(ethers.formatUnits(raw, decimals)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        } catch(e) {}
      });

      await Promise.allSettled(promises);

      // Fetch TYI Allowance
      if (TOKEN_ADDRESSES.TYI) {
        const tyiContract = new ethers.Contract(TOKEN_ADDRESSES.TYI, ['function allowance(address owner, address spender) view returns (uint256)'], provider);
        const allowanceRaw = await tyiContract.allowance(account, CONTRACT_ADDRESSES.SPECTRA_EXCHANGE).catch(() => 0n);
        setWalletAllowance(Number(ethers.formatUnits(allowanceRaw, 18)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
      }

      let tier = 0;
      let remaining = 10;
      try {
        const saasContract = new ethers.Contract(
          CONTRACT_ADDRESSES.SPECTRA_SAAS,
          CONTRACT_ABIS.SPECTRA_SAAS,
          provider
        );
        tier = Number(await saasContract.getUserTier(account));
        remaining = Number(await saasContract.getRemainingTransactions(account));
      } catch (e) {
        console.warn('[GlassTerminal] Failed to fetch SaaS details:', e);
      }

      setTokenBalances(fetchedBalances);
      setWalletNonce(txCount || 0);
      setUserTier(tier);
      setRemainingTxs(remaining);
      setHasHydratedWallet(true);
    } catch (err) {
      console.warn('[GlassTerminal] Error in hydrateWallet:', err);
    }
  };

  const handleSuggestion = (value) => {
    if (value === 'Claim TYI from Faucet') {
      window.open('https://universalgasframework.com/faucets', '_blank');
      pushMessage('user', 'Claim TYI from Faucet');
      pushMessage('agent', 'Opening the Universal Gas Framework Faucet page in a new tab so you can request Mock USD (TYI) tokens.');
      return;
    }
    setInputValue(value);
  };

  const ensureAllowance = async (signer, spender, amountWei) => {
    const token = new ethers.Contract(TOKEN_ADDRESSES.TYI, ['function allowance(address owner, address spender) view returns (uint256)', 'function approve(address spender, uint256 amount) returns (bool)'], signer);
    const owner = await signer.getAddress();
    const allowance = await token.allowance(owner, spender);

    if (allowance >= amountWei) {
      return;
    }

    pushMessage('agent', 'TYI allowance is missing. Sending approval request through the wallet...');
    const approveTx = await token.approve(spender, ethers.MaxUint256);
    await approveTx.wait();
    pushMessage('agent', 'Approval confirmed. UGF routing can continue.');
  };

  useEffect(() => {
    if (walletAddress) {
      hydrateWallet().catch(() => undefined);
    } else {
      setTokenBalances({});
      setWalletNonce(0);
      setWalletAllowance('0.00');
      setUserTier(0);
      setRemainingTxs(10);
      setHasHydratedWallet(false);
    }
  }, [walletAddress]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!inputValue.trim() || isLoading) {
      return;
    }

    setError('');
    setIntent(null);
    setSignature('');
    setIsLoading(true);

    const userPrompt = inputValue.trim();
    pushMessage('user', userPrompt);

    const rateLimit = consumeRequest();
    if (!rateLimit) {
      pushMessage('agent', '[SYSTEM_ERROR] Please connect your wallet to access the Agent.');
      setInputValue('');
      setIsLoading(false);
      return;
    }

    if (!rateLimit.allowed) {
      const minutesLeft = Math.ceil(rateLimit.remainingTime / 60000);
      pushMessage('agent', `[RATE_LIMIT_EXCEEDED] You have reached your hourly limit of ${rateLimit.limit} requests for your current tier. Please upgrade your Spectra tier or wait ${minutesLeft} minutes.`);
      setInputValue('');
      setIsLoading(false);
      return;
    }

    try {
      const context = walletAddress
        ? `Active wallet connected: ${walletAddress}. Balances: ${Object.entries(tokenBalances).map(([s, b]) => `${b} ${s}`).join(', ')}.`
        : `No wallet connected.`;
      const parsed = await tryParseDefiIntent(userPrompt, { context });
      if (!parsed) {
        throw new Error('Agent could not contact backend.');
      }

      if (parsed.error) {
        pushMessage('agent', parsed.error);
        setInputValue('');
        return;
      }

      if (parsed.action === 'unknown') {
        throw new Error('Agent could not derive a valid on-chain intent from your input.');
      }

      pushMessage('agent', `Intent resolved: ${parsed.action.toUpperCase()} ${parsed.amount} ${String(parsed.token).toUpperCase()}`);
      setIntent(parsed);
      setFlowState('EU_CONSENT');
      setInputValue('');
    } catch (apiError) {
      setError(apiError?.message || 'Failed to contact agent backend.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGrantPermission = async () => {
    if (!walletAddress) {
      try {
        await connectWallet();
      } catch (err) {
        setError(err.message || 'Failed to connect wallet.');
        return;
      }
    }
    setFlowState('CHART_REVIEW');
  };

  const handleSignAndExecute = async () => {
    if (!intent || isSigning) {
      return;
    }

    setError('');
    setIsSigning(true);
    setFlowState('EXECUTING');

    try {
      let isStellar = false;
      let currentAccount = '';
      
      const sessionStellar = localStorage.getItem('spectra_stellar_wallet');
      const sessionEVM = localStorage.getItem('spectra_wallet');
      
      if (sessionStellar) {
        isStellar = true;
        currentAccount = sessionStellar;
      } else if (sessionEVM) {
        isStellar = false;
        currentAccount = sessionEVM;
      } else {
        throw new Error('No active wallet found for Agent routing.');
      }

      if (isStellar) {
        // --- STELLAR (SOROBAN) INTENT ROUTING ---
        const tokenIn = resolveSacAddress('TYI'); // Agent defaults to paying TYI for simplicity if not specified
        const tokenOut = resolveSacAddress(intent.token);
        const amountInParsed = ethers.parseUnits(String(intent.amount || '0'), 6).toString(); // TYI decimals = 6
        
        pushMessage('agent', 'Relaying intent to Stellar Testnet via Fee-Bump...');
        
        const result = await swapTokens(
          currentAccount,
          tokenIn,
          tokenOut,
          amountInParsed,
          '0'
        );
        
        if (result && result.hash) {
          pushMessage('agent', `✅ Gasless execution complete on Soroban! Hash: ${result.hash}`);
          // Reset state after success
          setIntent(null);
          setFlowState('IDLE');
        }
      } else {
        // --- EVM INTENT ROUTING ---
        if (!window.ethereum) {
          throw new Error('No injected wallet found.');
        }

        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        if (!accounts?.length) {
          throw new Error('Wallet returned no accounts.');
        }

        const from = accounts[0];
        // Wallet is already connected via handleGrantPermission if we got here.
        // We don't need to manually set it.
        await hydrateWallet();

      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      const typedData = buildTypedData(intent, Number(network.chainId));

      const signed = await window.ethereum.request({
        method: 'eth_signTypedData_v4',
        params: [from, JSON.stringify(typedData)],
      });

      setSignature(signed);
      pushMessage('agent', 'Signature captured. Relaying to UGF network...');

      const signer = await provider.getSigner();
      const tokenOut = resolveTokenAddress(intent.token);
      const amountIn = ethers.parseUnits(String(intent.amount || '0'), 18);

      // Ensure the exchange contract spender has allowance to transfer the user's TYI
      await ensureAllowance(signer, CONTRACT_ADDRESSES.SPECTRA_EXCHANGE, amountIn);

      const iface = new ethers.Interface(CONTRACT_ABIS.SPECTRA_EXCHANGE);
      const encodedData = iface.encodeFunctionData('swap', [TOKEN_ADDRESSES.TYI, tokenOut, amountIn, 0n]);

      const result = await execute({
        target: CONTRACT_ADDRESSES.SPECTRA_EXCHANGE,
        data: encodedData,
        paymentToken: TOKEN_ADDRESSES.TYI,
        signer
      });

      if (result && result.userTxHash) {
        pushMessage('agent', `✅ Transaction executed successfully on Base Sepolia via UGF. Hash: ${result.userTxHash}`);
        await hydrateWallet();
        // Poll balance updates to capture transaction confirmations
        setTimeout(() => hydrateWallet().catch(() => {}), 2000);
        setTimeout(() => hydrateWallet().catch(() => {}), 5000);
        setTimeout(() => hydrateWallet().catch(() => {}), 8000);
        
        // Reset state after success
        setIntent(null);
        setFlowState('IDLE');
      }
      } // End of EVM branch
    } catch (signError) {
      if (signError?.code === 4001) {
        setError('Signature or transaction rejected by user.');
      } else {
        setError(signError?.shortMessage || signError?.message || 'Execution failed.');
      }
      // Revert flow state so user can retry or cancel
      setFlowState('CHART_REVIEW');
    } finally {
      setIsSigning(false);
    }
  };

  return (
    <LayoutGrid>
      <Card style={{ flex: 1.8 }}>
        <Header>
          <HeaderTitle>
            <span className="material-symbols-outlined">terminal</span>
            AGENTIC_WALLET_OS // ACTIVE_MODE
          </HeaderTitle>
          <Dots>
            <span />
            <span />
            <span />
          </Dots>
        </Header>

        <StatsBar>
          {walletAddress ? (
            <StatsGroup>
              <StatItem>
                <StatLabel>Wallet</StatLabel>
                <StatValue>{`${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`}</StatValue>
              </StatItem>
              {Object.entries(tokenBalances).map(([symbol, bal]) => (
                <StatItem key={symbol}>
                  <StatLabel>{symbol}</StatLabel>
                  <StatValue>{bal}</StatValue>
                </StatItem>
              ))}
              <StatItem>
                <StatLabel>Allowance</StatLabel>
                <StatValue>{walletAllowance}</StatValue>
              </StatItem>
              <StatItem>
                <StatLabel>Nonce</StatLabel>
                <StatValue>{walletNonce}</StatValue>
              </StatItem>
            </StatsGroup>
          ) : (
            <span>No wallet connected. Connect to check live balances.</span>
          )}
          {!walletAddress && (
            <ConnectButtonMini type="button" onClick={handleConnectWallet}>
              Connect Wallet
            </ConnectButtonMini>
          )}
        </StatsBar>

        <Body>
          {messages.length === 0 && !isLoading && (
            <EmptyState>Agent terminal is idle. Send an on-chain instruction to start.</EmptyState>
          )}

          <SuggestionRail>
            {suggestionChips.map((suggestion) => (
              <SuggestionButton key={suggestion} type="button" onClick={() => handleSuggestion(suggestion)} disabled={isLoading || isSigning || sdkLoading}>
                {suggestion}
              </SuggestionButton>
            ))}
          </SuggestionRail>

          {messages.map((msg, idx) => (
            <Message key={`${msg.from}-${idx}`} $agent={msg.from === 'agent'}>
              <MessageLabel>{msg.from === 'agent' ? 'SYSTEM_AGENT' : 'USER_INPUT'}</MessageLabel>
              <MessageBubble $agent={msg.from === 'agent'}>{msg.content}</MessageBubble>
            </Message>
          ))}

          {isLoading && (
            <LoaderWrap>
              <LoaderGeo />
              <LoaderText>Parsing intent via Sarvam Agent...</LoaderText>
            </LoaderWrap>
          )}

          {intent && (
            <IntentCard>
              <IntentGrid>
                <IntentItem>
                  <IntentLabel>Action</IntentLabel>
                  <IntentValue>{intent.action}</IntentValue>
                </IntentItem>
                <IntentItem>
                  <IntentLabel>Amount</IntentLabel>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={intent.amount || ''}
                    onChange={(e) => setIntent({ ...intent, amount: e.target.value })}
                    style={{
                      background: 'rgba(255, 255, 255, 0.07)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#ffffff',
                      fontSize: '13px',
                      fontFamily: "'Geist Mono', monospace",
                      padding: '4px 6px',
                      width: '100%',
                      outline: 'none',
                      marginTop: '3px',
                      borderRadius: '4px'
                    }}
                    disabled={flowState !== 'EU_CONSENT' && flowState !== 'IDLE'}
                  />
                </IntentItem>
                <IntentItem>
                  <IntentLabel>Token</IntentLabel>
                  <IntentValue>{intent.token}</IntentValue>
                </IntentItem>
              </IntentGrid>

              {flowState === 'EU_CONSENT' && (
                <div style={{ marginTop: '10px' }}>
                  <WarningBox style={{ borderColor: 'rgba(16, 185, 129, 0.5)', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                    EU Compliance Check: You are requesting to swap {intent.amount} {intent.token}. Do you grant explicit consent to proceed with this evaluation?
                  </WarningBox>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <ExecuteButton type="button" onClick={handleGrantPermission} style={{ flex: 1, background: 'rgba(16, 185, 129, 0.2)', borderColor: 'rgba(16, 185, 129, 0.5)' }}>
                      Grant Permission
                    </ExecuteButton>
                    <ExecuteButton type="button" onClick={() => { setIntent(null); setFlowState('IDLE'); }} style={{ flex: 1, background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#ef4444' }}>
                      Cancel
                    </ExecuteButton>
                  </div>
                </div>
              )}

              {flowState === 'CHART_REVIEW' && (
                <div style={{ marginTop: '10px' }}>
                  <div style={{ height: '300px', width: '100%', marginBottom: '10px', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <iframe
                      title="tradingview"
                      src={`https://s.tradingview.com/widgetembed/?symbol=${encodeURIComponent(TRADING_VIEW_SYMBOL[String(intent.token).toUpperCase()] || TRADING_VIEW_SYMBOL.ETH)}&interval=60&hidesidetoolbar=1&hidetoptoolbar=0&symboledit=0&saveimage=0&toolbarbg=0A0A0B&theme=dark&style=1&locale=en`}
                      style={{ width: '100%', height: '100%', border: 'none' }}
                    />
                  </div>
                  {hasInsufficientBalance ? (
                    <WarningBox>
                      ⚠️ Insufficient {String(intent.token || 'TYI').toUpperCase()} balance. This transaction requires {intent.amount} {String(intent.token || 'TYI').toUpperCase()}, but your wallet only holds {tokenBalances[String(intent.token || 'TYI').toUpperCase()] || '0.00'} {String(intent.token || 'TYI').toUpperCase()}.
                    </WarningBox>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <WarningBox style={{ borderColor: 'rgba(176, 38, 255, 0.5)', background: 'rgba(176, 38, 255, 0.1)', color: '#b026ff' }}>
                        Review the live market data above. Do you confirm the final execution of this swap?
                      </WarningBox>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <ExecuteButton type="button" onClick={handleSignAndExecute} disabled={isSigning || sdkLoading} style={{ flex: 1 }}>
                          Confirm Execution
                        </ExecuteButton>
                        <ExecuteButton type="button" onClick={() => { setIntent(null); setFlowState('IDLE'); }} disabled={isSigning || sdkLoading} style={{ flex: 1, background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#ef4444' }}>
                          Cancel
                        </ExecuteButton>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {flowState === 'EXECUTING' && (
                <div style={{ marginTop: '10px' }}>
                  <ExecuteButton type="button" disabled style={{ width: '100%' }}>
                    {sdkLoading ? 'Relaying Gasless...' : isSigning ? 'Awaiting Signature...' : 'Executing...'}
                  </ExecuteButton>
                </div>
              )}
            </IntentCard>
          )}

          <StatusText>{statusText}</StatusText>
          {error && <ErrorBox>{error}</ErrorBox>}
        </Body>

        <Footer onSubmit={handleSubmit}>
          <span className="material-symbols-outlined">chevron_right</span>
          <Input
            type="text"
            placeholder="What onchain action can I route for you?"
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            disabled={isLoading || isSigning || sdkLoading}
          />
          <SendButton type="submit" disabled={isLoading || isSigning || sdkLoading || !inputValue.trim()}>
            Send
          </SendButton>
        </Footer>
      </Card>

      <SidebarCard>
        <SidebarHeader>
          <span className="material-symbols-outlined">account_balance_wallet</span>
          LIVE_WALLET_STATUS
        </SidebarHeader>
        <SidebarBody>
          <div>
            <SidebarSectionTitle>Connection</SidebarSectionTitle>
            <SidebarConnectionStatus $connected={!!walletAddress}>
              <ConnectionIndicator $connected={!!walletAddress} />
              {walletAddress ? 'Connected to Base Sepolia' : 'Disconnected'}
            </SidebarConnectionStatus>
          </div>

          <div>
            <SidebarSectionTitle>Portfolio Value</SidebarSectionTitle>
            <BalanceBlock $active={true} style={{ marginBottom: '16px', background: 'rgba(176, 38, 255, 0.08)', borderColor: 'rgba(176, 38, 255, 0.25)' }}>
              <BalanceLabel>Total Asset Value (USD)</BalanceLabel>
              <BalanceRow style={{ marginTop: '4px' }}>
                <BalanceValue>${totalAssetValueUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</BalanceValue>
                <BalanceToken>USD</BalanceToken>
              </BalanceRow>
            </BalanceBlock>

            <SidebarSectionTitle>Balances</SidebarSectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {Object.entries(tokenBalances).map(([symbol, bal]) => {
                const amount = normalizeAmount(bal);
                let price = 1.00;
                if (symbol === 'ETH') price = 3500.00;
                if (symbol === 'WBTC') price = 60000.00;
                
                return (
                  <BalanceBlock key={symbol} $active={false}>
                    <BalanceLabel>{symbol === 'ETH' ? 'Native Gas Balance' : `${symbol} Balance`}</BalanceLabel>
                    <BalanceRow style={{ marginTop: '4px' }}>
                      <BalanceValue>{bal}</BalanceValue>
                      <BalanceToken>{symbol}</BalanceToken>
                    </BalanceRow>
                    <BalanceRate>
                      Rate: ${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} | Holding: ${(amount * price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                    </BalanceRate>
                  </BalanceBlock>
                );
              })}
            </div>
          </div>

          <div>
            <SidebarSectionTitle>Contract Allowance</SidebarSectionTitle>
            <BalanceBlock $active={false} style={{ padding: '12px 16px' }}>
              <BalanceLabel>Exchange Spender</BalanceLabel>
              <BalanceRow style={{ marginTop: '4px' }}>
                <span style={{ fontSize: '12px', color: '#ffffff', fontWeight: '600' }}>
                  {walletAllowance} TYI
                </span>
              </BalanceRow>
            </BalanceBlock>
          </div>

          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <SidebarSectionTitle>Quick Actions</SidebarSectionTitle>
            <FaucetButton href="https://universalgasframework.com/faucets" target="_blank" rel="noopener noreferrer">
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>water_drop</span>
              Claim TYI Mock USD
            </FaucetButton>
          </div>
        </SidebarBody>
      </SidebarCard>
    </LayoutGrid>
  );
}
