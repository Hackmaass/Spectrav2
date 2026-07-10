import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { useAuth } from '../../context/AuthContext';
import { getProfile } from '../../lib/stellar/contracts/profile';

const PROFILE_ABI = [
  "function getProfile(address _user) external view returns (tuple(string name, string email, string phone, string bio, uint8 avatarId, bool exists))"
];
const PROFILE_ADDRESS = "0x598Ca7A104fa36fb59BB49bC5Ba2813C72978d5b";

export default function OnboardingEnforcer({ children }) {
  const { walletAddress, stellarPublicKey, isStellarConnected } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    const activeAccount = isStellarConnected ? stellarPublicKey : walletAddress;
    
    // Don't enforce onboarding if they are already on the profile page or home page
    if (!activeAccount || location.pathname === '/profile' || location.pathname === '/') {
      return;
    }

    let isMounted = true;

    const checkProfile = async () => {
      setIsChecking(true);
      try {
        let exists = false;
        if (isStellarConnected) {
          const profile = await getProfile(activeAccount);
          if (profile && profile.name) {
            exists = true;
          }
        } else {
          if (window.ethereum) {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const contract = new ethers.Contract(PROFILE_ADDRESS, PROFILE_ABI, provider);
            const profile = await contract.getProfile(activeAccount);
            exists = profile.exists;
          }
        }

        if (isMounted && !exists) {
          navigate('/profile?onboard=true', { replace: true });
        }
      } catch (err) {
        console.warn('[OnboardingEnforcer] check failed:', err);
      } finally {
        if (isMounted) setIsChecking(false);
      }
    };

    checkProfile();

    return () => {
      isMounted = false;
    };
  }, [walletAddress, stellarPublicKey, isStellarConnected, location.pathname, navigate]);

  return children;
}
