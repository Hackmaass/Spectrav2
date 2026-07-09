import React from "react";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import { X, Wallet } from "lucide-react";

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
  background: rgba(var(--color-primary-rgb, 0, 85, 255), 0.1);
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
  transition: all 0.2s;

  &:hover {
    background: rgba(var(--color-primary-rgb, 0, 85, 255), 0.2);
    border-color: var(--color-primary);
    box-shadow: 0 0 16px rgba(var(--color-primary-rgb, 0, 85, 255), 0.2);
  }
`;

export default function LoginModal({ isOpen, onClose, onLogin }) {
  if (!isOpen) return null;

  const handleConnect = async () => {
    try {
      if (!window.ethereum) {
        alert("Please install MetaMask or another Web3 wallet to continue.");
        return;
      }
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      if (accounts && accounts.length > 0) {
        onLogin(accounts[0]);
        onClose();
      }
    } catch (err) {
      console.error("Wallet connection failed:", err);
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

            {/* <div className="auth">
              <img className="authimage" src="auth.png" alt="design" />
            </div> */}
            <p style={{ margin:"2%",marginBottom:"4%", textAlign: "center" }}>
             Get Started with your First Swapping Transaction, authenticate now.
            </p>

            <ConnectButton onClick={handleConnect}>
              <Wallet size={18} />
              Connect Wallet
            </ConnectButton>
          </ModalContainer>
        </Overlay>
      )}
    </AnimatePresence>
  );
}
