import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #0A0A0B;
  color: #fff;
  padding: 24px;
`;

const LoginBox = styled.div`
  background: rgba(17, 19, 26, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 40px;
  border-radius: 12px;
  max-width: 400px;
  width: 100%;
  text-align: center;
  box-shadow: 0 0 40px rgba(176, 38, 255, 0.1);
`;

const Title = styled.h1`
  font-family: 'Oswald', sans-serif;
  font-size: 32px;
  margin-bottom: 12px;
  background: linear-gradient(90deg, #fff, #b026ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const Description = styled.p`
  font-family: 'Geist Mono', monospace;
  font-size: 14px;
  color: #a0a0a0;
  margin-bottom: 32px;
`;

const ConnectBtn = styled.button`
  background: rgba(176, 38, 255, 0.2);
  border: 1px solid #b026ff;
  color: #fff;
  font-family: 'JetBrains Mono', monospace;
  font-weight: 700;
  font-size: 16px;
  padding: 16px 24px;
  width: 100%;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(176, 38, 255, 0.3);
    box-shadow: 0 0 15px rgba(176, 38, 255, 0.4);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ErrorText = styled.div`
  color: #ef4444;
  margin-top: 16px;
  font-family: 'Geist Mono', monospace;
  font-size: 13px;
`;

export default function Login() {
  const { connectWallet, isLoggedIn, profile, isLoadingProfile, isInitialized } = useAuth();
  const [error, setError] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const navigate = useNavigate();

  if (!isInitialized) {
    return (
      <LoginContainer>
        <Description style={{ color: '#b026ff', letterSpacing: '0.2em', textTransform: 'uppercase' }}>INITIALIZING_SESSION...</Description>
      </LoginContainer>
    );
  }

  // If already logged in, redirect them away
  if (isLoggedIn) {
    if (isLoadingProfile) {
      return (
        <LoginContainer>
          <LoginBox>
            <Description>Syncing Profile Data...</Description>
          </LoginBox>
        </LoginContainer>
      );
    }
    if (!profile.exists) {
      return <Navigate to="/profile?mode=onboarding" replace />;
    }
    return <Navigate to="/" replace />;
  }

  const handleConnect = async () => {
    setError('');
    setIsConnecting(true);
    try {
      await connectWallet();
      // On success, the AuthContext state updates isLoggedIn=true.
      // The re-render will hit the `if (isLoggedIn)` block above, wait for profile loading, and redirect.
    } catch (err) {
      setError(err.message || 'Failed to connect wallet');
      setIsConnecting(false);
    }
  };

  return (
    <LoginContainer>
      <LoginBox>
        <Title>SPECTRA OS</Title>
        <Description>Authenticate to access the agent ecosystem.</Description>
        
        <ConnectBtn onClick={handleConnect} disabled={isConnecting}>
          {isConnecting ? 'CONNECTING...' : 'CONNECT METAMASK'}
        </ConnectBtn>
        
        {error && <ErrorText>{error}</ErrorText>}
      </LoginBox>
    </LoginContainer>
  );
}
