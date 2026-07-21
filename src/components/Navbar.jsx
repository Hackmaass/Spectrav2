import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { ChevronDown, ArrowUpRight, Menu, X } from 'lucide-react';
import { FaVolumeMute, FaVolumeUp } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

// Exact navigation data structures from Ghost Finance
const PRODUCTS = [
  {
    category: "Individuals",
    items: [
      { 
        name: "Lend", 
        desc: "Deposit at your own sealed rate. Earn discriminatory yield.", 
        colors: ["#a78bfa", "#7c3aed", "#c4b5fd"], 
        link: "https://app.ghost-finance.xyz/" 
      },
      { 
        name: "Borrow", 
        desc: "Post collateral, set your max rate, get matched to cheapest lenders.", 
        colors: ["#818cf8", "#4f46e5", "#a5b4fc"], 
        link: "https://app.ghost-finance.xyz/" 
      }
    ]
  },
  {
    category: "Tools",
    items: [
      { 
        name: "Raycast Extension", 
        desc: "Use Ghost's confidential matching engine from Raycast.", 
        colors: ["#67e8f9", "#0891b2", "#a5f3fc"], 
        link: "https://github.com/snehendu098/ghost/tree/main/ghost-raycast" 
      },
      { 
        name: "Telegram Bot", 
        desc: "Access all of Ghost's features via Telegram.", 
        colors: ["#86efac", "#16a34a", "#bbf7d0"], 
        link: "https://t.me/ghostfinancetg_bot" 
      }
    ]
  },
  {
    category: "Institutions & Projects",
    items: [
      { 
        name: "Private Pools", 
        desc: "Institutional-grade private lending pools with custom parameters.", 
        colors: ["#f0abfc", "#a855f7", "#e9d5ff"], 
        link: "https://app.ghost-finance.xyz/explore" 
      }
    ]
  }
];

const RESOURCES = [
  { 
    name: "Blog", 
    desc: "Protocol updates and research insights.", 
    colors: ["#fbbf24", "#d97706", "#fde68a"], 
    link: "https://docs.ghost-finance.xyz/" 
  },
  { 
    name: "Documentation", 
    desc: "Protocol architecture & integration guides.", 
    colors: ["#a78bfa", "#7c3aed", "#c4b5fd"], 
    link: "https://docs.ghost-finance.xyz/" 
  },
  { 
    name: "Litepaper", 
    desc: "Read the Ghost protocol litepaper.", 
    colors: ["#f472b6", "#db2777", "#fbcfe8"], 
    link: "https://docs.ghost-finance.xyz/" 
  }
];

const TOKENS = [
  { 
    name: "$gUSD", 
    desc: "Privacy-preserving stablecoin for lending and borrowing.", 
    colors: ["#34d399", "#059669", "#a7f3d0"], 
    link: "https://docs.ghost-finance.xyz/protocol/tokenomics" 
  },
  { 
    name: "$gETH", 
    desc: "Shielded ETH for collateral and private transfers.", 
    colors: ["#60a5fa", "#2563eb", "#bfdbfe"], 
    link: "https://docs.ghost-finance.xyz/protocol/tokenomics" 
  }
];

const NAV_TABS = ["Products", "Resources", "Tokens"];

function getTabItems(tab) {
  switch (tab) {
    case "Products":
      return PRODUCTS.flatMap(cat => cat.items);
    case "Resources":
      return RESOURCES;
    case "Tokens":
      return TOKENS;
    default:
      return [];
  }
}

// Exact spring transitions from Ghost Finance
const springVisual = { type: "spring", stiffness: 350, damping: 20, mass: 0.7 };
const smoothSpring = { type: "spring", stiffness: 400, damping: 28 };

function NavVisual({ colors }) {
  return (
    <motion.div
      className="w-full h-full rounded-2xl overflow-hidden relative"
      style={{ background: colors[0] }}
      initial={{ opacity: 0, scale: 0.88, rotate: -3 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      exit={{ opacity: 0, scale: 0.88, rotate: 3 }}
      transition={springVisual}
    >
      <motion.div
        className="absolute rounded-full"
        style={{
          width: "70%",
          height: "70%",
          background: colors[1],
          right: "-10%",
          bottom: "-10%"
        }}
        initial={{ scale: 0.5, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 0.7, y: 0 }}
        transition={{ ...springVisual, delay: 0.04 }}
      />
      <motion.div
        className="absolute rounded-full"
        style={{
          width: "45%",
          height: "45%",
          background: colors[2],
          right: "5%",
          bottom: "5%"
        }}
        initial={{ scale: 0.3, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 0.6, y: 0 }}
        transition={{ ...springVisual, delay: 0.08 }}
      />
      <motion.div
        className="absolute"
        style={{
          width: "40%",
          height: "100%",
          background: `linear-gradient(180deg, ${colors[1]}88, ${colors[2]}44)`,
          left: "30%",
          top: 0
        }}
        initial={{ opacity: 0, x: -30, scaleY: 0.8 }}
        animate={{ opacity: 0.5, x: 0, scaleY: 1 }}
        transition={{ ...smoothSpring, delay: 0.06 }}
      />
    </motion.div>
  );
}

function NavItem({ item, layoutScope, isHovered, onHover }) {
  return (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className="relative flex items-center justify-between px-4 py-3 rounded-xl group"
      onMouseEnter={onHover}
    >
      {isHovered && (
        <motion.div
          layoutId={`nav-highlight-${layoutScope}`}
          className="absolute inset-0 bg-white/[0.06] rounded-xl"
          transition={smoothSpring}
        />
      )}
      <div className="min-w-0 relative z-10">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white">{item.name}</span>
          {item.badge && (
            <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded-md">
              {item.badge}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
      </div>
      <ArrowUpRight className="w-3.5 h-3.5 text-gray-600 shrink-0 ml-3 relative z-10 group-hover:text-gray-400 transition-colors" />
    </a>
  );
}

function NavDropdown({ tab, hoveredIdx, setHoveredIdx }) {
  const items = getTabItems(tab);
  const activeColors = items[hoveredIdx]?.colors || items[0]?.colors || ["#333", "#555", "#777"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ type: "spring", stiffness: 500, damping: 35 }}
      className="flex rounded-2xl shadow-[0_20px_60px_-10px_rgba(0,0,0,0.6)] border border-white/10 bg-[#1a1a1a] overflow-hidden"
      style={{ width: items.length > 3 ? 580 : 520 }}
    >
      <LayoutGroup id={tab}>
        <div className="flex-1 py-4 px-2 min-w-0">
          {tab === "Products" ? (
            PRODUCTS.map((cat, catIdx) => {
              const allProducts = getTabItems("Products");
              return (
                <div key={cat.category}>
                  {catIdx > 0 && <div className="h-px bg-white/5 mx-3 my-2" />}
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 px-4 mb-1 mt-1">
                    {cat.category}
                  </p>
                  {cat.items.map((item) => {
                    const idx = allProducts.findIndex(p => p.name === item.name);
                    return (
                      <NavItem
                        key={item.name}
                        item={item}
                        layoutScope={tab}
                        isHovered={hoveredIdx === idx}
                        onHover={() => setHoveredIdx(idx)}
                      />
                    );
                  })}
                </div>
              );
            })
          ) : (
            items.map((item, idx) => (
              <NavItem
                key={item.name}
                item={item}
                layoutScope={tab}
                isHovered={hoveredIdx === idx}
                onHover={() => setHoveredIdx(idx)}
              />
            ))
          )}
        </div>
      </LayoutGroup>

      <div className="w-[220px] p-3 shrink-0">
        <AnimatePresence mode="wait">
          <NavVisual key={`${tab}-${hoveredIdx}`} colors={activeColors} />
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default function Navbar() {
  const {
    stellarPublicKey: stellarAddress,
    connectWallet,
    disconnect,
    profile,
    isNewUser,
    isLoadingProfile
  } = useAuth();

  const [activeTab, setActiveTab] = useState(null);
  const [hoveredIdx, setHoveredIdx] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const timeoutRef = useRef(null);

  const [isMuted, setIsMuted] = useState(true);
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.225;
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

  const handleConnect = async () => {
    if (!window.freighterApi) {
      window.open('https://www.freighter.app/', '_blank');
      return;
    }
    await connectWallet('stellar');
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

  const renderActionButton = () => {
    if (!window.freighterApi) {
      return (
        <button
          onClick={handleConnect}
          className="px-5 py-2 text-gray-900 text-sm font-semibold rounded-full hover:opacity-90 transition-opacity shadow-md"
          style={{ backgroundColor: "#e2a9f1" }}
        >
          Install Freighter
        </button>
      );
    }

    if (isLoadingProfile) {
      return (
        <button 
          disabled 
          className="px-5 py-2 text-gray-900 text-sm font-semibold rounded-full flex items-center gap-2 opacity-80 cursor-not-allowed"
          style={{ backgroundColor: "#e2a9f1" }}
        >
          <svg className="animate-spin h-4 w-4 text-gray-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Syncing...
        </button>
      );
    }

    if (!stellarAddress) {
      return (
        <button
          onClick={handleConnect}
          className="px-5 py-2 text-gray-900 text-sm font-semibold rounded-full hover:opacity-90 transition-opacity shadow-md"
          style={{ backgroundColor: "#e2a9f1" }}
        >
          Connect Wallet
        </button>
      );
    }

    if (isNewUser && !profile) {
      return (
        <div className="flex items-center gap-3">
          <span className="text-orange-400 font-medium text-xs hidden sm:inline">Action Required:</span>
          <button
            onClick={() => window.location.href = '/mint'}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-full shadow-lg transition-transform transform hover:scale-105 text-sm"
          >
            Mint NFT
          </button>
          <button onClick={disconnect} className="text-gray-400 hover:text-white text-xs underline">
            Disconnect
          </button>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-3 bg-white/[0.06] border border-white/10 px-3 py-1.5 rounded-full">
        <div className="flex flex-col items-end leading-tight">
          <span className="text-gray-200 font-medium text-xs">
            {profile?.name || 'Spectra User'}
          </span>
          <span className="text-[10px] text-indigo-300 font-mono">
            {stellarAddress.substring(0, 4)}...{stellarAddress.substring(stellarAddress.length - 4)}
          </span>
        </div>

        {profile?.tier && (
          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
            profile.tier === 'Gold' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
            profile.tier === 'Silver' ? 'bg-gray-400/20 text-gray-300 border border-gray-400/30' :
            profile.tier === 'Bronze' ? 'bg-orange-700/20 text-orange-400 border border-orange-700/30' :
            'bg-indigo-500/20 text-indigo-300'
          }`}>
            {profile.tier}
          </span>
        )}

        <button
          onClick={disconnect}
          className="p-1 text-gray-400 hover:text-red-400 rounded-full transition-colors"
          title="Sign Out"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    );
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-transparent backdrop-blur-md">
      <audio ref={audioRef} src="/aud.mp3" loop autoPlay />

      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo / Brand */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.location.href = '/'}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <span className="text-white font-bold text-lg">S</span>
          </div>
          <span className="text-white font-bold text-lg tracking-tight hidden sm:block">Spectra</span>
        </div>

        {/* Center Nav Dropdowns */}
        <div className="hidden md:flex flex-col items-center relative">
          <div className="flex items-center gap-0.5" onMouseLeave={handleTabLeave}>
            {NAV_TABS.map(tab => (
              <button
                key={tab}
                onMouseEnter={() => handleTabHover(tab)}
                className={`relative flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-full transition-colors duration-150 ${
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

            <a
              href="https://tattered-elm-7ca.notion.site/Careers-at-Ghost-Finance-31c9eec45dff80b8989fdf81a7373b12"
              target="_blank"
              rel="noopener noreferrer"
              onMouseEnter={() => {
                if (timeoutRef.current) clearTimeout(timeoutRef.current);
                setActiveTab(null);
              }}
              className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white rounded-full transition-colors duration-150"
            >
              Careers
            </a>
          </div>

          <AnimatePresence>
            {activeTab && (
              <div
                className="absolute top-full pt-3 z-50"
                onMouseEnter={handleFlyoutEnter}
                onMouseLeave={handleTabLeave}
              >
                <AnimatePresence mode="wait">
                  <NavDropdown
                    key={activeTab}
                    tab={activeTab}
                    hoveredIdx={hoveredIdx}
                    setHoveredIdx={setHoveredIdx}
                  />
                </AnimatePresence>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Action Button & Audio Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleMute}
            className="text-gray-300 hover:text-white transition-colors p-2"
            title={isMuted ? "Play Music" : "Mute Music"}
          >
            {isMuted ? <FaVolumeMute size={18} /> : <FaVolumeUp size={18} />}
          </button>

          <div className="hidden md:block">
            {renderActionButton()}
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-400 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-[#1a1a1a] border-t border-white/[0.06] overflow-hidden"
          >
            <div className="p-6 space-y-4">
              <a href="#" className="block text-sm font-medium py-1.5 text-gray-300 hover:text-white">Products</a>
              <a href="#" className="block text-sm font-medium py-1.5 text-gray-300 hover:text-white">Resources</a>
              <a href="#" className="block text-sm font-medium py-1.5 text-gray-300 hover:text-white">Tokens</a>
              <a href="https://tattered-elm-7ca.notion.site/Careers-at-Ghost-Finance-31c9eec45dff80b8989fdf81a7373b12" target="_blank" rel="noopener noreferrer" className="block text-sm font-medium py-1.5 text-gray-300 hover:text-white">Careers</a>
              
              <div className="pt-2 border-t border-white/10">
                {renderActionButton()}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
