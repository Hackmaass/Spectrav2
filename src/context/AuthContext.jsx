import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

// Ponytail: Centralized authentication state using native React Context instead of Redux or a complex Web3 onboarding library.
const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [walletAddress, setWalletAddress] = useState(() => {
    return localStorage.getItem('spectra_wallet') || '';
  });
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return !!localStorage.getItem('spectra_wallet');
  });

  const login = useCallback((address) => {
    const normalized = address.toLowerCase();
    localStorage.setItem('spectra_wallet', normalized);
    setWalletAddress(normalized);
    setIsLoggedIn(true);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('spectra_wallet');
    setWalletAddress('');
    setIsLoggedIn(false);
  }, []);

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

  useEffect(() => {
    const checkWalletConnection = async () => {
      if (!window.ethereum) return;
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send('eth_accounts', []);
        const savedWallet = localStorage.getItem('spectra_wallet');
        
        if (savedWallet) {
          if (accounts.length > 0) {
            const currentAccount = accounts[0].toLowerCase();
            if (currentAccount !== savedWallet) {
              login(currentAccount);
            }
          } else {
            // MetaMask is locked or disconnected, log out
            logout();
          }
        }
      } catch (err) {
        console.error('[AuthContext] checkWalletConnection error:', err);
      }
    };

    checkWalletConnection();

    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        const savedWallet = localStorage.getItem('spectra_wallet');
        // Only update or logout if we were previously logged in (avoids auto-login on accountsChanged when logged out)
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
  }, [login, logout]);

  return (
    <AuthContext.Provider value={{ isLoggedIn, walletAddress, login, logout, connectWallet }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
