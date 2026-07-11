import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useNavigate } from 'react-router-dom';
import { CONTRACT_ADDRESSES, CONTRACT_ABIS } from '../config/contracts';
import { connectStellarSnap } from '../lib/stellar/snap';
import { getProfile } from '../lib/stellar/contracts/profile';
import { getUserTier as getStellarUserTier } from '../lib/stellar/contracts/saas';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const navigate = useNavigate();

  // --- Ethereum State ---
  const [walletAddress, setWalletAddress] = useState(() => {
    return localStorage.getItem('spectra_wallet') || '';
  });
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return !!localStorage.getItem('spectra_wallet') || !!localStorage.getItem('spectra_stellar_wallet');
  });

  // --- Profile & Tier State ---
  const [profile, setProfile] = useState({ exists: false, data: null });
  const [userTier, setUserTier] = useState(0); // 0=Alpha, 1=Vector, 2=Nexus
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // --- Stellar State ---
  const [stellarPublicKey, setStellarPublicKey] = useState(() => {
    return localStorage.getItem('spectra_stellar_wallet') || '';
  });
  const isStellarConnected = !!stellarPublicKey;

  const fetchProfileAndTier = useCallback(async (address, isStellar = false) => {
    if (!address) return;
    setIsLoadingProfile(true);
    try {
      if (isStellar) {
        // Fetch from Soroban
        const fetchedProfile = await getProfile(address);
        const fetchedTier = await getStellarUserTier(address);
        setProfile({ exists: !!fetchedProfile, data: fetchedProfile });
        setUserTier(Number(fetchedTier) || 0);
      } else {
        if (!window.ethereum) return;
        const provider = new ethers.BrowserProvider(window.ethereum);
        
        // Fetch Profile
        const profileContract = new ethers.Contract(CONTRACT_ADDRESSES.SPECTRA_PROFILE, CONTRACT_ABIS.SPECTRA_PROFILE, provider);
        const fetchedProfile = await profileContract.getProfile(address);
        setProfile({ exists: fetchedProfile.exists, data: fetchedProfile });
  
        // Fetch Tier
        const saasContract = new ethers.Contract(CONTRACT_ADDRESSES.SPECTRA_SAAS, CONTRACT_ABIS.SPECTRA_SAAS, provider);
        const fetchedTier = await saasContract.getUserTier(address);
        
        // Fetch NFT Badges
        const nftContract = new ethers.Contract(CONTRACT_ADDRESSES.SPECTRA_NFT, CONTRACT_ABIS.SPECTRA_NFT, provider);
        const hasVector = await nftContract.hasBadge(address, 2).catch(() => false);
        const hasNexus = await nftContract.hasBadge(address, 3).catch(() => false);
        
        let nftTier = 0;
        if (hasNexus) nftTier = 2;
        else if (hasVector) nftTier = 1;
  
        setUserTier(Math.max(Number(fetchedTier), nftTier));
      }
    } catch (err) {
      console.warn('[AuthContext] Failed to fetch profile/tier data:', err);
      setProfile({ exists: false, data: null });
      setUserTier(0);
    } finally {
      setIsLoadingProfile(false);
    }
  }, []);

  const login = useCallback((address) => {
    const normalized = address.toLowerCase();
    
    // Mutual Exclusion: Clear Stellar session
    localStorage.removeItem('spectra_stellar_wallet');
    setStellarPublicKey('');
    
    localStorage.setItem('spectra_wallet', normalized);
    setWalletAddress(normalized);
    setIsLoggedIn(true);
    fetchProfileAndTier(normalized, false);
  }, [fetchProfileAndTier]);

  const logout = useCallback(() => {
    localStorage.removeItem('spectra_wallet');
    localStorage.removeItem('spectra_stellar_wallet');
    setWalletAddress('');
    setIsLoggedIn(false);
    setStellarPublicKey('');
    setProfile({ exists: false, data: null });
    setUserTier(0);
    // Instant redirect to login when session ends
    navigate('/login');
  }, [navigate]);

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      throw new Error('No injected wallet found. Install MetaMask or a compatible wallet.');
    }
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    if (accounts && accounts.length > 0) {
      login(accounts[0]);
      return accounts[0];
    }
    throw new Error('No accounts returned from wallet.');
  }, [login]);

  const connectStellar = useCallback(async () => {
    try {
      const pubKey = await connectStellarSnap();
      if (pubKey) {
        // Mutual Exclusion: Clear EVM session
        localStorage.removeItem('spectra_wallet');
        setWalletAddress('');
        
        // Auto-fund testnet account via Friendbot to prevent "Account not found"
        try {
          await fetch(`https://friendbot.stellar.org/?addr=${pubKey}`);
        } catch (e) {
          console.warn('[AuthContext] Friendbot funding skipped or failed:', e);
        }
        
        localStorage.setItem('spectra_stellar_wallet', pubKey);
        setStellarPublicKey(pubKey);
        setIsLoggedIn(true);
        fetchProfileAndTier(pubKey, true);
        return pubKey;
      }
    } catch (err) {
      console.error('[AuthContext] connectStellar error:', err);
      throw err;
    }
  }, [fetchProfileAndTier]);

  // Initial load check
  useEffect(() => {
    const checkWalletConnection = async () => {
      let isAnyConnected = false;

      // 1. Check Stellar
      const savedStellarWallet = localStorage.getItem('spectra_stellar_wallet');
      if (savedStellarWallet) {
        setStellarPublicKey(savedStellarWallet);
        setIsLoggedIn(true);
        await fetchProfileAndTier(savedStellarWallet, true);
        isAnyConnected = true;
      }

      // 2. Check EVM
      if (!window.ethereum) {
        setIsInitialized(true);
        return;
      }
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send('eth_accounts', []);
        const savedWallet = localStorage.getItem('spectra_wallet');
        
        if (savedWallet) {
          if (accounts.length > 0) {
            const currentAccount = accounts[0].toLowerCase();
            if (currentAccount !== savedWallet) {
              login(currentAccount);
            } else {
              // Ensure profile is fetched on reload if already logged in
              await fetchProfileAndTier(currentAccount, false);
            }
            isAnyConnected = true;
          } else {
            // MetaMask is locked or disconnected on EVM
            if (!isAnyConnected) {
              logout();
            } else {
              localStorage.removeItem('spectra_wallet');
              setWalletAddress('');
            }
          }
        }
      } catch (err) {
        console.error('[AuthContext] checkWalletConnection error:', err);
      } finally {
        setIsInitialized(true);
      }
    };

    checkWalletConnection();

    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        const savedWallet = localStorage.getItem('spectra_wallet');
        if (savedWallet) {
          if (accounts.length > 0) {
            login(accounts[0]);
          } else {
            logout();
          }
        }
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, [login, logout, fetchProfileAndTier]);

  const value = {
    // Ethereum
    isLoggedIn,
    walletAddress,
    login,
    logout,
    connectWallet,
    // Profile & SaaS
    profile,
    userTier,
    isLoadingProfile,
    isInitialized,
    fetchProfileAndTier,
    // Stellar
    stellarPublicKey,
    isStellarConnected,
    connectStellar
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
