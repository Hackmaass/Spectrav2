import React, { useState, useRef, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { ChevronDown, ArrowUpRight, Menu, X } from 'lucide-react';
import { FaVolumeMute, FaVolumeUp } from 'react-icons/fa';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import WalletSelectorModal from './auth/WalletSelectorModal';

/* ─── Styled Components for Nav Shell ────────────────────────────────────── */

const NavWrap = styled.nav`
  position: fixed;
  top: 3.25%;
  left: 50%;
  transform: translateX(-50%);
  padding: 1.2% 2%;
  background: var(--bg, #0a0a0b);
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 65%;
  margin: 0 auto;
  z-index: 50;
  border-radius: 9999px;
  border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));

  @media (max-width: 1024px) {
    width: 90%;
  }

  @media (max-width: 768px) {
    padding: 12px 16px;
    top: 16px;
    width: 92%;
  }
`;

const NavInner = styled.div`
  display: flex;
  align-items: center;
  gap: 32px;
  width: 100%;
  justify-content: space-between;
`;

const Logo = styled(Link)`
  font-family: 'Geist', monospace;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--color-primary, #ffffff);
  text-decoration: none;
  flex-shrink: 0;
`;

const NavRight = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
`;

const ProfileIcon = styled.button`
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 1px solid var(--border-color, rgba(255, 255, 255, 0.15));
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.2s;

  &:hover {
    border-color: var(--color-primary, #ffffff);
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const AuthButton = styled.button`
  background: transparent;
  border: none;
  color: var(--color-primary, #ffffff);
  font-family: 'Geist', monospace;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
  transition: color 0.2s;

  &:hover {
    color: var(--color-primary, #ffffff);
    opacity: 0.8;
  }
`;

/* ─── INITIAL Nav Data Only (Products & Resources) ───────────────────────── */

const PRODUCTS_DATA = [
  { to: '/agent',    label: 'Agent',      desc: 'Intent-driven DeFi assistant powered by Sarvam AI.', colors: ['#818cf8', '#4f46e5', '#a5b4fc'] },
  { to: '/exchange', label: 'Exchange',   desc: 'Cross-chain swaps with optimal routing.',          colors: ['#a78bfa', '#7c3aed', '#c4b5fd'] },
  { to: '/spectra',  label: 'Spectra AI', desc: '24/7 AI help desk & support center.',              colors: ['#67e8f9', '#0891b2', '#a5f3fc'] },
];

const RESOURCES_DATA = [
  { to: '/guide',    label: 'Guide',      desc: 'Interactive documentation & tutorials.',            colors: ['#fbbf24', '#d97706', '#fde68a'] },
  { to: '/journal',  label: 'Journal',    desc: 'Execution logs & protocol research.',               colors: ['#86efac', '#16a34a', '#bbf7d0'] },
  { to: '/about',    label: 'About',      desc: 'Architecture overview & mission statement.',        colors: ['#f472b6', '#db2777', '#fbcfe8'] },
];

const NAV_TABS = ["Products", "Resources"];

function getTabItems(tab) {
  switch (tab) {
    case "Products":
      return PRODUCTS_DATA;
    case "Resources":
      return RESOURCES_DATA;
    default:
      return [];
  }
}

/* ─── Dropdown Animations & Visual Card ───────────────────────────────────── */

const springVisual = { type: "spring", stiffness: 350, damping: 20, mass: 0.7 };
const smoothSpring = { type: "spring", stiffness: 400, damping: 28 };

function NavVisual({ colors }) {
  return (
    <motion.div
      style={{
        width: '100%',
        height: '100%',
        borderRadius: '16px',
        overflow: 'hidden',
        position: 'relative',
        background: colors[0],
      }}
      initial={{ opacity: 0, scale: 0.88, rotate: -3 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      exit={{ opacity: 0, scale: 0.88, rotate: 3 }}
      transition={springVisual}
    >
      {/* Large circle — bottom right */}
      <motion.div
        style={{
          position: 'absolute',
          width: '70%',
          height: '70%',
          borderRadius: '50%',
          background: colors[1],
          right: '-10%',
          bottom: '-10%',
        }}
        initial={{ scale: 0.5, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 0.7, y: 0 }}
        transition={{ ...springVisual, delay: 0.04 }}
      />
      {/* Small circle — accent */}
      <motion.div
        style={{
          position: 'absolute',
          width: '45%',
          height: '45%',
          borderRadius: '50%',
          background: colors[2],
          right: '5%',
          bottom: '5%',
        }}
        initial={{ scale: 0.3, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 0.6, y: 0 }}
        transition={{ ...springVisual, delay: 0.08 }}
      />
      {/* Vertical gradient bar */}
      <motion.div
        style={{
          position: 'absolute',
          width: '40%',
          height: '100%',
          background: `linear-gradient(180deg, ${colors[1]}88, ${colors[2]}44)`,
          left: '30%',
          top: 0,
        }}
        initial={{ opacity: 0, x: -30, scaleY: 0.8 }}
        animate={{ opacity: 0.5, x: 0, scaleY: 1 }}
        transition={{ ...smoothSpring, delay: 0.06 }}
      />
    </motion.div>
  );
}

function NavItem({ item, layoutScope, isHovered, onHover, onClick }) {
  return (
    <Link
      to={item.to}
      onClick={onClick}
      onMouseEnter={onHover}
      style={{
        textDecoration: 'none',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 16px',
        borderRadius: '12px',
        cursor: 'pointer',
      }}
    >
      {/* Animated hover highlight */}
      {isHovered && (
        <motion.div
          layoutId={`nav-highlight-${layoutScope}`}
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.06)',
          }}
          transition={smoothSpring}
        />
      )}
      <div style={{ minWidth: 0, position: 'relative', zIndex: 1 }}>
        <span
          style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: 700,
            color: '#ffffff',
            fontFamily: "'Geist', sans-serif",
          }}
        >
          {item.label}
        </span>
        <span
          style={{
            display: 'block',
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.4)',
            marginTop: '3px',
            lineHeight: 1.4,
            fontFamily: "'Geist', sans-serif",
          }}
        >
          {item.desc}
        </span>
      </div>
      <ArrowUpRight
        style={{
          width: '14px',
          height: '14px',
          color: 'rgba(255, 255, 255, 0.25)',
          flexShrink: 0,
          marginLeft: '12px',
          position: 'relative',
          zIndex: 1,
        }}
      />
    </Link>
  );
}

function DropdownMenu({ tab, hoveredIdx, setHoveredIdx, onItemClick }) {
  const items = getTabItems(tab);
  const activeColors = items[hoveredIdx]?.colors || items[0]?.colors || ['#333', '#555', '#777'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ type: "spring", stiffness: 500, damping: 35 }}
      style={{
        display: 'flex',
        width: '540px',
        borderRadius: '20px',
        background: '#141414',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 24px 64px -12px rgba(0, 0, 0, 0.6)',
        overflow: 'hidden',
      }}
    >
      {/* Left — Items */}
      <LayoutGroup id={tab}>
        <div style={{ flex: 1, padding: '12px 8px', minWidth: 0 }}>
          {items.map((item, idx) => (
            <NavItem
              key={item.to}
              item={item}
              layoutScope={tab}
              isHovered={hoveredIdx === idx}
              onHover={() => setHoveredIdx(idx)}
              onClick={onItemClick}
            />
          ))}
        </div>
      </LayoutGroup>

      {/* Right — Visual Card */}
      <div style={{ width: '210px', padding: '12px 12px 12px 0', flexShrink: 0 }}>
        <AnimatePresence mode="wait">
          <NavVisual key={`${tab}-${hoveredIdx}`} colors={activeColors} />
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* ─── Main Navbar Component ───────────────────────────────────────────────── */

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    isLoggedIn,
    disconnectWallet
  } = useAuth();

  const [activeTab, setActiveTab] = useState(null);
  const [hoveredIdx, setHoveredIdx] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const timeoutRef = useRef(null);

  const [isMuted, setIsMuted] = useState(true);
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.3;
      audioRef.current.play().then(() => {
        setIsMuted(false);
        audioRef.current.muted = false;
      }).catch(e => {
        console.warn("Autoplay blocked by browser:", e);
        setIsMuted(true);
        audioRef.current.muted = true;
      });
    }
  }, []);

  const toggleMute = () => {
    if (audioRef.current) {
      if (audioRef.current.paused) {
        audioRef.current.play().catch(console.error);
        audioRef.current.muted = false;
        setIsMuted(false);
      } else {
        const nextMuted = !audioRef.current.muted;
        audioRef.current.muted = nextMuted;
        setIsMuted(nextMuted);
      }
    }
  };

  const handleTabHover = useCallback((tab) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveTab(prev => {
      if (prev !== tab) setHoveredIdx(0);
      return tab;
    });
  }, []);

  const handleTabLeave = useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      setActiveTab(null);
    }, 200);
  }, []);

  const handleFlyoutEnter = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  const handleItemClick = useCallback(() => {
    setActiveTab(null);
  }, []);

  const handleLogout = () => {
    disconnectWallet();
  };

  const userData = { avatarId: 1 };

  const handleProfileClick = () => {
    if (isLoggedIn) {
      navigate('/profile');
    } else {
      setIsWalletModalOpen(true);
    }
  };

  return (
    <>
      <NavWrap>
        <NavInner>
          {/* Brand Logo */}
          <Logo to="/">SPECTRA</Logo>

          {/* Nav Items: Home, Products ▾, Resources ▾, Pricing */}
          <div className="hidden md:flex flex-col items-center relative">
            <div className="flex items-center gap-6" onMouseLeave={handleTabLeave}>
              <Link
                to="/"
                onMouseEnter={() => {
                  if (timeoutRef.current) clearTimeout(timeoutRef.current);
                  setActiveTab(null);
                }}
                className={`px-4 py-2 text-sm font-medium rounded-full transition-colors duration-150 ${
                  location.pathname === '/' ? "text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                Home
              </Link>

              {NAV_TABS.map(tab => (
                <button
                  key={tab}
                  onMouseEnter={() => handleTabHover(tab)}
                  className={`relative flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-full transition-colors duration-150 cursor-pointer ${
                    activeTab === tab ? "text-white" : "text-gray-400 hover:text-white"
                  }`}
                >
                  {activeTab === tab && (
                    <motion.div
                      layoutId="tab-pill"
                      className="absolute inset-0 bg-white/10 rounded-full"
                      transition={smoothSpring}
                    />
                  )}
                  <span className="relative z-10">{tab}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 relative z-10 transition-transform duration-200 ${
                      activeTab === tab ? "rotate-180" : ""
                    }`}
                  />
                </button>
              ))}

              <Link
                to="/mint"
                onMouseEnter={() => {
                  if (timeoutRef.current) clearTimeout(timeoutRef.current);
                  setActiveTab(null);
                }}
                className={`px-4 py-2 text-sm font-medium rounded-full transition-colors duration-150 ${
                  location.pathname === '/mint' ? "text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                Pricing
              </Link>
            </div>

            {/* Dropdown Menu flyout */}
            <AnimatePresence mode="popLayout">
              {activeTab && (
                <div
                  key={activeTab}
                  className="absolute top-full pt-3 z-50"
                  onMouseEnter={handleFlyoutEnter}
                  onMouseLeave={handleTabLeave}
                >
                  <DropdownMenu
                    tab={activeTab}
                    hoveredIdx={hoveredIdx}
                    setHoveredIdx={setHoveredIdx}
                    onItemClick={handleItemClick}
                  />
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Section */}
          <NavRight>
            <audio ref={audioRef} src="/aud.mp3" loop />
            <button 
              onClick={toggleMute} 
              title={isMuted ? "Play Music" : "Mute Music"}
              style={{ 
                background: 'transparent', 
                border: 'none', 
                color: isMuted ? 'var(--color-secondary)' : 'var(--color-primary)', 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center',
                padding: '4px'
              }}
            >
              {isMuted ? <FaVolumeMute size={18} /> : <FaVolumeUp size={18} />}
            </button>
            
            {isLoggedIn ? (
              <>
                <ProfileIcon onClick={handleProfileClick} title="Go to Profile">
                  <img
                    src={`/profile/${userData.avatarId}.png`}
                    alt="Profile"
                    onError={(e) => { e.target.src = 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + userData.avatarId; }}
                  />
                </ProfileIcon>
                <AuthButton onClick={handleLogout}>Sign Out</AuthButton>
              </>
            ) : (
              <AuthButton onClick={() => setIsWalletModalOpen(true)}>Connect</AuthButton>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 text-gray-400 hover:text-white cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </NavRight>
        </NavInner>
      </NavWrap>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden fixed top-20 left-1/2 -translate-x-1/2 w-[90%] z-50 bg-[#1a1a1a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
          >
            <div className="p-5 space-y-3">
              <Link to="/" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium py-1.5 text-gray-300 hover:text-white">Home</Link>
              <Link to="/exchange" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium py-1.5 text-gray-300 hover:text-white">Exchange</Link>
              <Link to="/agent" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium py-1.5 text-gray-300 hover:text-white">Agent</Link>
              <Link to="/mint" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium py-1.5 text-gray-300 hover:text-white">Pricing</Link>
              
              <div className="pt-2 border-t border-white/10 flex justify-between items-center">
                {isLoggedIn ? (
                  <AuthButton onClick={handleLogout}>Sign Out</AuthButton>
                ) : (
                  <AuthButton onClick={() => { setMobileMenuOpen(false); setIsWalletModalOpen(true); }}>Connect</AuthButton>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Wallet Selector Modal */}
      <WalletSelectorModal 
        isOpen={isWalletModalOpen} 
        onClose={() => setIsWalletModalOpen(false)} 
      />
    </>
  );
}
