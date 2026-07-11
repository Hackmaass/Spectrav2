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
  background: blue;
  border: 1px solid #27272a;
  width: 100%;
  max-width: 500px;
  padding: 32px;
  position: relative;
  font-family: "Poppins", sans-serif;
  box-shadow: -12px 12px 0 2px white;
`;

const Title = styled.h1`
  font-size: 50px;
  font-weight: 600;
  color: #ffffff;
  text-align: center;
`;

const Description = styled.p`
  font-family: 'Geist Mono', monospace;
  font-size: 14px;
  color: #a0a0a0;
  margin-bottom: 32px;
`;

const ConnectBtn = styled.button`
  width: 100%;
  background: black;
  border: 1px solid rgba(var(--color-primary-rgb, 0, 85, 255), 0.3);
  color: #fff;
  padding: 14px;
  font-family: "Poppins", sans-serif;
  font-weight: 500;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: all ease .5s;

  &:hover {
    background: white;
    color: black;
    border-color: var(--color-primary);
    box-shadow: 0 0 16px rgba(var(--color-primary-rgb, 0, 85, 255), 0.2);
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
        <Title>Login.</Title>
        <p style={{ margin:"2%",marginBottom:"4%", textAlign: "center" }}>
             Get Started with your First Swapping Transaction, authenticate now.
            </p>
        <ConnectBtn onClick={handleConnect} disabled={isConnecting}>
          {isConnecting ? 'CONNECTING...' : 'CONNECT METAMASK'}
        </ConnectBtn>
        
        {error && <ErrorText>{error}</ErrorText>}
      </LoginBox>
    </LoginContainer>
  );
}
