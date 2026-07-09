// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./SpectraSaaS.sol";

/**
 * @title SpectraNFT
 * @dev Gated NFT minting logic for Spectra subscribers.
 * Interfaces with SpectraSaaS to enforce tier-based access.
 */
contract SpectraNFT is ERC721URIStorage, Ownable {
    error InsufficientTier();
    error AlreadyMintedThisCycle();
    error OnlyNexusCanUpdateMetadata();
    error NonTransferable();

    SpectraSaaS public saasContract;
    uint256 private _nextTokenId;

    // Mapping to track the last time a user minted a cycle-limited NFT
    mapping(address => uint256) public lastMintTimestamp;
    
    // Mapping to track which token belongs to which user (for simple dynamic update)
    mapping(address => uint256) public userTokenId;

    // On-Chain Hexagon Badge Integration
    mapping(address => uint256) public userTransactionCount;

    // Badge types
    uint256 public constant BADGE_GENESIS = 1;
    uint256 public constant BADGE_VECTOR = 2;
    uint256 public constant BADGE_NEXUS = 3;

    // Mappings to track if a user already has a specific badge
    mapping(address => mapping(uint256 => bool)) public hasBadge;

    event NFTMinted(address indexed user, uint256 tokenId, SpectraSaaS.PlanTier tier);
    event MetadataUpdated(uint256 indexed tokenId, string newURI);
    event BadgeMinted(address indexed user, uint256 badgeType);

    constructor(address _saasContract) ERC721("Spectra Subscriber NFT", "SNFT") Ownable(msg.sender) {
        saasContract = SpectraSaaS(_saasContract);
    }

    /**
     * @dev Add transaction count for a user. Restricted to owner (e.g. backend/relayer)
     */
    function addTransactionCount(address user, uint256 count) external onlyOwner {
        userTransactionCount[user] += count;
    }

    // --- Original Subscription Minting ---

    /**
     * @dev Mints an NFT based on the user's subscription tier.
     * Vector Tier: Static Badge (once per 30 days).
     * Nexus Tier: Dynamic Premium NFT (updateable metadata).
     */
    function mintSubscribedNFT(string calldata tokenURI) external {
        SpectraSaaS.PlanTier tier = saasContract.getUserTier(msg.sender);
        
        if (tier == SpectraSaaS.PlanTier.ALPHA) {
            revert InsufficientTier();
        }

        // Cycle check: Once per 30 days for Vector (Badge)
        if (tier == SpectraSaaS.PlanTier.VECTOR) {
            if (block.timestamp < lastMintTimestamp[msg.sender] + 30 days) {
                revert AlreadyMintedThisCycle();
            }
        }

        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, tokenURI);

        lastMintTimestamp[msg.sender] = block.timestamp;
        userTokenId[msg.sender] = tokenId;

        emit NFTMinted(msg.sender, tokenId, tier);
    }

    /**
     * @dev Updates metadata for Nexus tier users.
     */
    function updatePremiumMetadata(uint256 tokenId, string calldata newURI) external {
        if (ownerOf(tokenId) != msg.sender) revert ("Not owner");
        
        SpectraSaaS.PlanTier tier = saasContract.getUserTier(msg.sender);
        if (tier != SpectraSaaS.PlanTier.NEXUS) {
            revert OnlyNexusCanUpdateMetadata();
        }

        _setTokenURI(tokenId, newURI);
        emit MetadataUpdated(tokenId, newURI);
    }

    // --- On-Chain Hexagon Badges (Soulbound) ---

    function mintGenesisBadge() external {
        require(userTransactionCount[msg.sender] > 0, "Requires > 0 txs");
        require(!hasBadge[msg.sender][BADGE_GENESIS], "Badge already minted");

        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, "ipfs://badge-green");

        hasBadge[msg.sender][BADGE_GENESIS] = true;
        emit BadgeMinted(msg.sender, BADGE_GENESIS);
    }

    function mintVectorBadge() external {
        SpectraSaaS.PlanTier tier = saasContract.getUserTier(msg.sender);
        require(tier == SpectraSaaS.PlanTier.VECTOR || tier == SpectraSaaS.PlanTier.NEXUS, "Requires VECTOR tier");
        require(!hasBadge[msg.sender][BADGE_VECTOR], "Badge already minted");

        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, "ipfs://badge-yellow");

        hasBadge[msg.sender][BADGE_VECTOR] = true;
        emit BadgeMinted(msg.sender, BADGE_VECTOR);
    }

    function mintNexusBadge() external {
        SpectraSaaS.PlanTier tier = saasContract.getUserTier(msg.sender);
        require(tier == SpectraSaaS.PlanTier.NEXUS, "Requires NEXUS tier");
        require(!hasBadge[msg.sender][BADGE_NEXUS], "Badge already minted");

        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, "ipfs://badge-blue");

        hasBadge[msg.sender][BADGE_NEXUS] = true;
        emit BadgeMinted(msg.sender, BADGE_NEXUS);
    }

    /**
     * @dev Burns/cancels a specific NFT badge owned by the caller.
     */
    function burn(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "Not the owner");
        
        // Reset userTokenId if it's the one we're burning
        if (userTokenId[msg.sender] == tokenId) {
            userTokenId[msg.sender] = 0;
        }

        // Check if it's one of the badges and reset badge mapping
        if (hasBadge[msg.sender][BADGE_GENESIS]) {
            try this.tokenURI(tokenId) returns (string memory uri) {
                if (keccak256(bytes(uri)) == keccak256(bytes("ipfs://badge-green"))) {
                    hasBadge[msg.sender][BADGE_GENESIS] = false;
                }
            } catch {}
        }
        if (hasBadge[msg.sender][BADGE_VECTOR]) {
            try this.tokenURI(tokenId) returns (string memory uri) {
                if (keccak256(bytes(uri)) == keccak256(bytes("ipfs://badge-yellow"))) {
                    hasBadge[msg.sender][BADGE_VECTOR] = false;
                }
            } catch {}
        }
        if (hasBadge[msg.sender][BADGE_NEXUS]) {
            try this.tokenURI(tokenId) returns (string memory uri) {
                if (keccak256(bytes(uri)) == keccak256(bytes("ipfs://badge-blue"))) {
                    hasBadge[msg.sender][BADGE_NEXUS] = false;
                }
            } catch {}
        }

        _burn(tokenId);
    }

    // --- Soulbound Enforcement ---
    function _update(address to, uint256 tokenId, address auth) internal virtual override returns (address) {
        address from = _ownerOf(tokenId);
        // Prevent transfers. Allow mints (from == address(0)) and burns (to == address(0)).
        if (from != address(0) && to != address(0)) {
            revert NonTransferable();
        }
        return super._update(to, tokenId, auth);
    }

    /**
     * @dev Admin function to update the SaaS contract address.
     */
    function setSaasContract(address _saasContract) external onlyOwner {
        saasContract = SpectraSaaS(_saasContract);
    }
}
