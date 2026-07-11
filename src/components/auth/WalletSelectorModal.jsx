import React, { useState } from "react";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import { X, Wallet, Hexagon } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const Overlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
`;

const ModalContainer = styled(motion.div)`
  background: blue;
  border: 1px solid #27272a;
  width: 100%;
  max-width: 500px;
  padding: 32px;
  position: relative;
  font-family: "Poppins", sans-serif;
  box-shadow: -12px 12px 0 2px white;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
  background: transparent;
  border: none;
  color: #a1a1aa;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 50%;
  transition: all 0.2s;

  &:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.05);
  }
`;

const Title = styled.h2`
  font-size: 50px;
  font-weight: 600;
  color: #ffffff;
  text-align: center;
`;

const ConnectButton = styled.button`
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
  margin-bottom: 12px;

  &:hover {
    background: white;
    color: black;
    border-color: var(--color-primary);
    box-shadow: 0 0 16px rgba(var(--color-primary-rgb, 0, 85, 255), 0.2);
  }
  
  &:disabled {
    background: #333;
    color: #888;
    cursor: not-allowed;
    border-color: #444;
    box-shadow: none;
  }
`;

const ErrorText = styled.div`
  color: #ef4444;
  margin-top: 16px;
  font-family: 'Geist Mono', monospace;
  font-size: 13px;
  text-align: center;
`;

export default function WalletSelectorModal({ isOpen, onClose }) {
  const { connectWallet, connectStellar } = useAuth();
  const [error, setError] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  if (!isOpen) return null;

  const handleEvmConnect = async () => {
    setError('');
    setIsConnecting(true);
    try {
      await connectWallet();
      onClose();
    } catch (err) {
      console.error("EVM connection failed:", err);
      setError(err.message || 'Failed to connect EVM wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleStellarConnect = async () => {
    setError('');
    setIsConnecting(true);
    try {
      await connectStellar();
      onClose();
    } catch (err) {
      console.error("Stellar connection failed:", err);
      setError(err.message || 'Failed to connect Stellar wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Overlay
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <ModalContainer
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <CloseButton onClick={onClose}>
              <X size={20} />
            </CloseButton>

            <Title>Login.</Title>

            <p style={{ margin:"2%",marginBottom:"4%", textAlign: "center" }}>
             Select your preferred network engine to authenticate.
            </p>

            <ConnectButton onClick={handleEvmConnect} disabled={isConnecting}>
              <Wallet size={18} />
              {isConnecting ? 'CONNECTING...' : 'Connect EVM (Base Sepolia)'}
            </ConnectButton>

            <ConnectButton onClick={handleStellarConnect} disabled={isConnecting}>
              <Hexagon size={18} />
              {isConnecting ? 'CONNECTING...' : 'Connect Stellar (Soroban Snap)'}
            </ConnectButton>

            {error && <ErrorText>{error}</ErrorText>}
          </ModalContainer>
        </Overlay>
      )}
    </AnimatePresence>
  );
}
