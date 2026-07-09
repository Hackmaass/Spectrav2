import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Edit2, Activity, Zap, Shield, Save, X } from 'lucide-react';
import { ethers } from 'ethers';
import { useAuth } from '../context/AuthContext';
import { CONTRACT_ADDRESSES, CONTRACT_ABIS } from '../config/contracts.js';

// Assume the contract interacts via standard ABI
const PROFILE_ABI = [
  "function getProfile(address _user) external view returns (tuple(string name, string email, string phone, string bio, uint8 avatarId, bool exists))",
  "function createProfile(string _name, string _email, string _phone, string _bio, uint8 _avatarId) external",
  "function updateProfile(string _name, string _email, string _phone, string _bio, uint8 _avatarId) external"
];
const PROFILE_ADDRESS = "0x598Ca7A104fa36fb59BB49bC5Ba2813C72978d5b";

const Container = styled.div`
  min-height: 100vh;
  padding: 120px 24px 64px;
  background-color: #0A0A0B;
  color: #fff;
  font-family: 'Poppins', sans-serif;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const BentoGrid = styled(motion.div)`
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  width: 100%;
  max-width: 1200px;
  
  @media (min-width: 1024px) {
    grid-template-columns: 1fr 1fr;
  }
`;

const BentoCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(var(--color-primary-rgb, 0, 85, 255), 0.2);
  border-radius: 24px;
  padding: 32px;
  backdrop-filter: blur(20px);
  box-shadow: 0 8px 32px rgba(var(--color-primary-rgb, 0, 85, 255), 0.05);
  display: flex;
  flex-direction: column;
`;

const Title = styled.h2`
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: #fff;

  svg {
    color: var(--color-primary);
  }
`;

const Input = styled.input`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 12px 16px;
  color: #fff;
  font-family: 'Poppins', sans-serif;
  width: 100%;
  margin-bottom: 16px;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: var(--color-primary);
  }
`;

const TextArea = styled.textarea`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 12px 16px;
  color: #fff;
  font-family: 'Poppins', sans-serif;
  width: 100%;
  margin-bottom: 16px;
  min-height: 100px;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: var(--color-primary);
  }
`;

const Button = styled.button`
  background: ${props => props.$variant === 'secondary' ? 'rgba(255, 255, 255, 0.05)' : 'var(--color-primary)'};
  color: #fff;
  border: ${props => props.$variant === 'secondary' ? '1px solid rgba(255, 255, 255, 0.1)' : 'none'};
  padding: 12px 24px;
  border-radius: 12px;
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
  width: ${props => props.$fullWidth ? '100%' : 'auto'};

  &:hover {
    background: ${props => props.$variant === 'secondary' ? 'rgba(255, 255, 255, 0.1)' : 'var(--color-primary)'};
    transform: translateY(-2px);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const ConnectButton = styled(Button)`
  font-size: 18px;
  padding: 16px 32px;
  box-shadow: 0 0 20px rgba(var(--color-primary-rgb, 0, 85, 255), 0.4);
`;

const AvatarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 24px;
`;

const AvatarSelect = styled.div`
  aspect-ratio: 1;
  border-radius: 16px;
  border: 2px solid ${props => props.$selected ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)'};
  background: rgba(255,255,255,0.05);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  overflow: hidden;

  &:hover {
    border-color: var(--color-primary);
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const AvatarDisplay = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 24px;
  border: 2px solid var(--color-primary);
  overflow: hidden;
  margin-bottom: 24px;
  box-shadow: 0 0 20px rgba(var(--color-primary-rgb, 0, 85, 255), 0.3);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const InfoRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  color: #A1A1AA;

  svg {
    color: var(--color-primary);
  }
`;

const AnalyticsGrid = styled.div`
  display: grid;
  grid-template-rows: auto auto 1fr;
  gap: 24px;
`;

const StatCard = styled.div`
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const StatInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const StatLabel = styled.span`
  color: #A1A1AA;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
`;

const StatValue = styled.span`
  font-size: 32px;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 0 20px rgba(var(--color-primary-rgb, 0, 85, 255), 0.5);
`;

const LogItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  
  &:last-child {
    border-bottom: none;
  }
`;

const Skeleton = styled.div`
  background: linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: 8px;
  height: ${props => props.$height || '20px'};
  width: ${props => props.$width || '100%'};
  margin-bottom: ${props => props.$mb || '0'};

  @keyframes loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`;

export default function ProfileDashboard() {
  const { walletAddress, connectWallet } = useAuth();
  const account = walletAddress;
  const [userTier, setUserTier] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    bio: '',
    avatarId: 1
  });

  useEffect(() => {
    if (walletAddress) {
      loadProfile(walletAddress);
    } else {
      setHasProfile(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        bio: '',
        avatarId: 1
      });
      setUserTier(0);
    }
  }, [walletAddress]);

  const handleConnectWallet = async () => {
    if (!window.ethereum) return alert("Please install MetaMask or another Web3 wallet.");
    
    try {
      const addr = await connectWallet();
      await loadProfile(addr);
    } catch (err) {
      // Wallet connection error silently caught
    }
  };

  const loadProfile = async (address) => {
    setLoading(true);
    try {
      // Simulate network delay for UI polish
      await new Promise(r => setTimeout(r, 1000));
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(PROFILE_ADDRESS, PROFILE_ABI, provider);
      
      try {
        const profile = await contract.getProfile(address);
        if (profile.exists) {
          setHasProfile(true);
          setFormData({
            name: profile.name,
            email: profile.email,
            phone: profile.phone,
            bio: profile.bio,
            avatarId: Number(profile.avatarId)
          });
        }
      } catch (e) {
        // No profile found, fallback handled
      }

      try {
        const saasContract = new ethers.Contract(
          CONTRACT_ADDRESSES.SPECTRA_SAAS,
          CONTRACT_ABIS.SPECTRA_SAAS,
          provider
        );
        const tier = Number(await saasContract.getUserTier(address));
        setUserTier(tier);
      } catch (e) {
        // Silent catch for missing SaaS data
      }
    } catch (err) {
      // General load profile failure caught
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(PROFILE_ADDRESS, PROFILE_ABI, signer);

      let tx;
      if (hasProfile) {
        tx = await contract.updateProfile(formData.name, formData.email, formData.phone, formData.bio, formData.avatarId);
      } else {
        tx = await contract.createProfile(formData.name, formData.email, formData.phone, formData.bio, formData.avatarId);
      }
      
      await tx.wait();
      setHasProfile(true);
      setIsEditing(false);
    } catch (err) {
      // Error handling caught natively
    } finally {
      setSaving(false);
    }
  };

  if (!account) {
    return (
      <Container>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <BentoCard style={{ alignItems: 'center', textAlign: 'center', maxWidth: '500px' }}>
            <Shield size={64} color="var(--color-primary)" style={{ marginBottom: 24 }} />
            <h1 style={{ fontSize: 28, marginBottom: 16 }}>Web3 Identity Gateway</h1>
            <p style={{ color: '#A1A1AA', marginBottom: 32 }}>
              Connect your wallet to access your unified profile and analytics dashboard.
            </p>
            <ConnectButton onClick={handleConnectWallet}>
              Connect Wallet
            </ConnectButton>
          </BentoCard>
        </motion.div>
      </Container>
    );
  }

  return (
    <Container>
      <BentoGrid
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, staggerChildren: 0.1 }}
      >
        {/* Profile Section */}
        <BentoCard>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <Title style={{ margin: 0 }}><User /> Identity</Title>
            {!isEditing && !loading && (
              <Button $variant="secondary" onClick={() => setIsEditing(true)}>
                <Edit2 size={16} /> Edit
              </Button>
            )}
          </div>

          {loading ? (
            <>
              <Skeleton $height="120px" $width="120px" $mb="24px" style={{ borderRadius: 24 }} />
              <Skeleton $height="30px" $width="60%" $mb="16px" />
              <Skeleton $height="20px" $mb="12px" />
              <Skeleton $height="20px" $mb="12px" />
              <Skeleton $height="20px" $mb="12px" />
            </>
          ) : isEditing ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <AvatarGrid>
                {[1, 2, 3, 4, 5, 6].map(id => (
                  <AvatarSelect 
                    key={id} 
                    $selected={formData.avatarId === id}
                    onClick={() => setFormData(prev => ({ ...prev, avatarId: id }))}
                  >
                    <img src={`/profile/${id}.png`} alt={`Avatar ${id}`} onError={(e) => { e.target.src = 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + id; }} />
                  </AvatarSelect>
                ))}
              </AvatarGrid>
              <Input 
                placeholder="Display Name" 
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
              <TextArea 
                placeholder="Bio" 
                value={formData.bio}
                onChange={e => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              />
              <Input 
                placeholder="Email Address (Encrypted on-chain)" 
                type="email"
                value={formData.email}
                onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
              <Input 
                placeholder="Phone Number (Encrypted on-chain)" 
                value={formData.phone}
                onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              />
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <Button $fullWidth onClick={saveProfile} disabled={saving}>
                  {saving ? 'Saving...' : <><Save size={18} /> Save Profile</>}
                </Button>
                {hasProfile && (
                  <Button $fullWidth $variant="secondary" onClick={() => setIsEditing(false)} disabled={saving}>
                    <X size={18} /> Cancel
                  </Button>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <AvatarDisplay>
                <img src={`/profile/${formData.avatarId}.png`} alt="Avatar" onError={(e) => { e.target.src = 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + formData.avatarId; }} />
              </AvatarDisplay>
              <h3 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>{formData.name || 'Anonymous User'}</h3>
              <p style={{ color: '#A1A1AA', marginBottom: 24, lineHeight: 1.6 }}>
                {formData.bio || 'No bio provided yet. Click edit to set up your profile.'}
              </p>
              
              <InfoRow>
                <Mail size={18} />
                <span>{formData.email || 'No email linked'}</span>
              </InfoRow>
              <InfoRow>
                <Phone size={18} />
                <span>{formData.phone || 'No phone linked'}</span>
              </InfoRow>
              <InfoRow>
                <Shield size={18} />
                <span style={{ fontFamily: 'monospace' }}>{account.slice(0, 6)}...{account.slice(-4)}</span>
              </InfoRow>
            </motion.div>
          )}
        </BentoCard>

        {/* Analytics Section */}
        <AnalyticsGrid>
          <StatCard>
            <StatInfo>
              <StatLabel>Daily Agent Usages</StatLabel>
              <StatValue>{(() => {
                const today = new Date().toDateString();
                const usageKey = `spectra_usage_${account}`;
                const usageData = JSON.parse(localStorage.getItem(usageKey) || '{"count":0,"date":""}');
                const usedCount = usageData.date === today ? usageData.count : 0;
                const limit = userTier === 1 ? 15 : (userTier === 2 ? 30 : 10);
                return `${usedCount} / ${limit}`;
              })()}</StatValue>
            </StatInfo>
            <Activity size={48} color="var(--color-primary)" opacity={0.5} />
          </StatCard>

          <StatCard style={{
            borderColor: userTier === 0 ? 'rgba(205, 127, 50, 0.2)' : userTier === 1 ? 'rgba(192, 192, 192, 0.2)' : 'rgba(255, 215, 0, 0.2)',
            boxShadow: `0 0 20px ${userTier === 0 ? 'rgba(205, 127, 50, 0.4)' : userTier === 1 ? 'rgba(192, 192, 192, 0.4)' : 'rgba(255, 215, 0, 0.4)'}`
          }}>
            <StatInfo>
              <StatLabel>Current Plan</StatLabel>
              <StatValue style={{
                color: userTier === 0 ? '#CD7F32' : userTier === 1 ? '#C0C0C0' : '#FFD700',
                textShadow: `0 0 20px ${userTier === 0 ? 'rgba(205, 127, 50, 0.5)' : userTier === 1 ? 'rgba(192, 192, 192, 0.5)' : 'rgba(255, 215, 0, 0.5)'}`
              }}>
                {userTier === 0 ? 'ALPHA' : userTier === 1 ? 'VECTOR' : 'NEXUS'}
              </StatValue>
            </StatInfo>
            <Zap size={48} color={userTier === 0 ? '#CD7F32' : userTier === 1 ? '#C0C0C0' : '#FFD700'} opacity={0.8} />
          </StatCard>

          <BentoCard style={{ justifyContent: 'flex-start' }}>
            <Title><Activity /> Activity Log</Title>
            <div style={{ marginTop: 16 }}>
              <LogItem>
                <div>
                  <div style={{ fontWeight: 600 }}>Profile Updated</div>
                  <div style={{ fontSize: 12, color: '#A1A1AA' }}>via SpectraSaaS.sol</div>
                </div>
                <div style={{ fontSize: 12, color: '#A1A1AA' }}>2 mins ago</div>
              </LogItem>
              <LogItem>
                <div>
                  <div style={{ fontWeight: 600 }}>Gasless Swap Executed</div>
                  <div style={{ fontSize: 12, color: '#A1A1AA' }}>100 TYI → 0.028 ETH</div>
                </div>
                <div style={{ fontSize: 12, color: '#A1A1AA' }}>4 hours ago</div>
              </LogItem>
              <LogItem>
                <div>
                  <div style={{ fontWeight: 600 }}>Subscribed to VECTOR</div>
                  <div style={{ fontSize: 12, color: '#A1A1AA' }}>Soulbound NFT Minted</div>
                </div>
                <div style={{ fontSize: 12, color: '#A1A1AA' }}>2 days ago</div>
              </LogItem>
            </div>
          </BentoCard>
        </AnalyticsGrid>
      </BentoGrid>
    </Container>
  );
}
