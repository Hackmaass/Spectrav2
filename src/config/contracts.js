/**
 * Deployed Contract Addresses on Base Sepolia.
 * Source of truth: contracts/scripts/deployed-addresses.json (2026-07-11 redeploy)
 */
export const CONTRACT_ADDRESSES = {
  TYI: '0x27dc1c167aef232bb1e21073304b526726a8727e',
  SPECTRA_SAAS: '0x14363644D607d982C50a3923e12743cCf612AAd9',
  SPECTRA_NFT: '0x81508e908e61ae372bF4C584A7C09E703C11564C',
  SPECTRA_EXCHANGE: '0x760635A9B0df697eE91050Bb7d28a923D645e9DC',
  SPECTRA_PROFILE: '0xCBa9Cd6146D51E49043CB2Fd7Aa76DdF811624d2',
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
  USDC: TOKEN_ADDRESSES.USDC,
  WBTC: TOKEN_ADDRESSES.WBTC,
};

/**
 * Canonical decimal counts per token symbol.
 * Used by Exchange.jsx quote formatting to avoid wrong-decimal inflation.
 */
export const TOKEN_DECIMALS = {
  TYI: 6,
  MUSD: 6,
  USDC: 6,
  ETH: 18,
  SEPOLIA_ETH: 18,
  WETH: 18,
  WBTC: 8,
  XLM: 7,
};

export function resolveTokenDecimals(symbol) {
  return TOKEN_DECIMALS[String(symbol || '').toUpperCase()] ?? 18;
}

export const SAC_MAP = {
  'TYI': import.meta.env.VITE_STELLAR_SAC_TYI || 'CDLZFC3SYJYDZT7K67VZ75HPJVIEWBEJLY4U7O76T4N2S27ZEMB6M2XF',
  'USDC': import.meta.env.VITE_STELLAR_SAC_USDC || 'CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA',
  'XLM': import.meta.env.VITE_STELLAR_SAC_XLM || 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
  'EURC': import.meta.env.VITE_STELLAR_SAC_EURC || 'CCUUDM434BMZMYWYDITHFXHDMIVTGGD6T2I5UKNX5BSLXLW7HVR4MCGZ'
};

export function resolveSacAddress(assetId) {
  return SAC_MAP[String(assetId || '').toUpperCase()] || SAC_MAP['TYI'];
}

/**
 * Asserts that an address matches its expected network format.
 * EVM addresses must start with 0x. Soroban/Stellar addresses must start with C.
 * Throws if there is a cross-chain contamination detected.
 */
export function assertAddressFormat(address, expectedNetwork, label = 'token') {
  if (!address) throw new Error(`${label}: address is undefined`);
  if (expectedNetwork === 'evm' && !address.startsWith('0x')) {
    throw new Error(`[Cross-chain mismatch] ${label} address "${address}" is not a valid EVM address (must start with 0x). Aborting.`);
  }
  if (expectedNetwork === 'stellar' && !address.startsWith('C')) {
    throw new Error(`[Cross-chain mismatch] ${label} address "${address}" is not a valid Soroban SAC address (must start with C). Aborting.`);
  }
}

export function resolveTokenAddress(symbol) {
  return TOKEN_SYMBOL_TO_ADDRESS[String(symbol || '').toUpperCase()] || TOKEN_ADDRESSES.TYI;
}

export function resolveTokenLabel(symbol) {
  const normalized = String(symbol || '').toUpperCase();

  if (normalized === 'TYI' || normalized === 'MUSD') {
    return 'TYI';
  }

  if (normalized === 'SEPOLIA_ETH') {
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
