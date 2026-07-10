/**
 * Deployed Contract Addresses on Base Sepolia
 */
export const CONTRACT_ADDRESSES = {
  TYI: '0x27dc1c167aef232bb1e21073304b526726a8727e',
  SPECTRA_SAAS: '0xa58ce4bac06e8723bbf45f595f2c8dbc0e021100',
  SPECTRA_NFT: '0x45935fa416e2fb9c08e784e4b816b29be4d031b3',
  SPECTRA_EXCHANGE: '0x27aa3d225d062d669279920727a8a1a438f4cd68',
  SPECTRA_PROFILE: '0x598Ca7A104fa36fb59BB49bC5Ba2813C72978d5b',
};

export const NETWORK_INFO = {
  name: 'Base Sepolia',
  chainId: 84532,
  rpcUrl: 'https://sepolia.base.org',
  explorerUrl: 'https://sepolia.basescan.org',
};

export const TOKEN_ADDRESSES = {
  TYI: '0x27dc1c167aef232bb1e21073304b526726a8727e',
  MUSD: '0x27dc1c167aef232bb1e21073304b526726a8727e',
  USDC: '0x036cbd53842c5426634e7de0ee21189402dbf3de',
  WETH: '0x4200000000000000000000000000000000000006',
  ETH: '0x4200000000000000000000000000000000000006', // WETH on Base Sepolia
  WBTC: '0x0000000000000000000000000000000000000000',
};

export const TOKEN_SYMBOL_TO_ADDRESS = {
  TYI: TOKEN_ADDRESSES.TYI,
  MUSD: TOKEN_ADDRESSES.TYI,
  ETH: TOKEN_ADDRESSES.WETH,
  SEPOLIA_ETH: TOKEN_ADDRESSES.WETH,
  BASE_SEPOLIA_ETH: TOKEN_ADDRESSES.WETH,
  USDC: TOKEN_ADDRESSES.USDC,
  WBTC: TOKEN_ADDRESSES.WBTC,
};

export function resolveTokenAddress(symbol) {
  return TOKEN_SYMBOL_TO_ADDRESS[String(symbol || '').toUpperCase()] || TOKEN_ADDRESSES.TYI;
}

export function resolveTokenLabel(symbol) {
  const normalized = String(symbol || '').toUpperCase();

  if (normalized === 'TYI' || normalized === 'MUSD') {
    return 'TYI';
  }

  if (normalized === 'SEPOLIA_ETH' || normalized === 'BASE_SEPOLIA_ETH') {
    return 'ETH';
  }

  return normalized || 'TYI';
}

export const ensureBaseSepolia = async () => {
  if (!window.ethereum) return;
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x14a34' }], // 84532 in hex
    });
  } catch (switchError) {
    // This error code indicates that the chain has not been added to MetaMask.
    if (switchError.code === 4902 || switchError?.data?.originalError?.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: '0x14a34',
              chainName: 'Base Sepolia',
              nativeCurrency: {
                name: 'ETH',
                symbol: 'ETH',
                decimals: 18,
              },
              rpcUrls: ['https://base-sepolia-rpc.publicnode.com', 'https://sepolia.base.org'],
              blockExplorerUrls: ['https://sepolia.basescan.org'],
            },
          ],
        });
      } catch (addError) {
        console.error('Failed to add Base Sepolia network', addError);
        throw addError;
      }
    } else {
      console.error('Failed to switch to Base Sepolia network', switchError);
      throw switchError;
    }
  }
};

export const CONTRACT_ABIS = {
  MOCK_USD: [
    'function balanceOf(address owner) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function allowance(address owner, address spender) view returns (uint256)',
    'function approve(address spender, uint256 amount) returns (bool)',
  ],
  SPECTRA_EXCHANGE: [
    'function swap(address tokenIn, address tokenOut, uint256 amountIn, uint256 minAmountOut) external',
    'function getQuote(address tokenIn, address tokenOut, uint256 amountIn) view returns (uint256 amountOut)',
  ],
  SPECTRA_NFT: [
    'function mintSubscribedNFT(string tokenURI) external',
    'function mintGenesisBadge() external',
    'function mintVectorBadge() external',
    'function mintNexusBadge() external',
    'function userTransactionCount(address user) view returns (uint256)',
    'function burn(uint256 tokenId) external',
    'function userTokenId(address user) view returns (uint256)',
    'function hasBadge(address user, uint256 badgeType) view returns (bool)',
  ],
  SPECTRA_SAAS: [
    'function subscribe(uint8 _tier) external',
    'function cancelSubscription() external',
    'function getUserTier(address _user) view returns (uint8)',
    'function getRemainingTransactions(address _user) view returns (uint256)',
  ],
  SPECTRA_PROFILE: [
    "function getProfile(address _user) external view returns (tuple(string name, string email, string phone, string bio, uint8 avatarId, bool exists))",
    "function createProfile(string _name, string _email, string _phone, string _bio, uint8 _avatarId) external",
    "function updateProfile(string _name, string _email, string _phone, string _bio, uint8 _avatarId) external"
  ]
};
