// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title SpectraSaaS
 * @dev Subscription engine for Spectra platform. 
 * Manages tiers, daily transaction limits, and renewals using Mock USD.
 */
contract SpectraSaaS is Ownable, ReentrancyGuard {
    enum PlanTier { ALPHA, VECTOR, NEXUS }

    struct TierInfo {
        uint256 dailyTxLimit;
        uint256 monthlyFee; // In Mock USD (18 decimals)
        bool hasNFTAccess;
    }

    struct UserSubscription {
        PlanTier tier;
        uint256 lastBillingTimestamp;
        uint256 nextBillingTimestamp;
    }

    struct DailyUsage {
        uint256 count;
        uint256 firstTxTimestamp;
    }

    IERC20 public mockUSD;
    mapping(PlanTier => TierInfo) public tiers;
    mapping(address => UserSubscription) public userSubscriptions;
    mapping(address => DailyUsage) public userDailyUsage;

    event Subscribed(address indexed user, PlanTier tier);
    event Renewed(address indexed user, uint256 amount);
    event TransactionExecuted(address indexed user, uint256 dailyCount);
    event SubscriptionCancelled(address indexed user);

    constructor(address _mockUSD) Ownable(msg.sender) {
        mockUSD = IERC20(_mockUSD);

        // Alpha Tier: Free, 20 tx/day
        tiers[PlanTier.ALPHA] = TierInfo(20, 0, false);
        // Vector Tier: $15, 60 tx/day
        tiers[PlanTier.VECTOR] = TierInfo(60, 15 * 10**6, true);
        // Nexus Tier: $49, 100 tx/day
        tiers[PlanTier.NEXUS] = TierInfo(100, 49 * 10**6, true);
    }

    /**
     * @dev User subscribes to a specific tier.
     */
    function subscribe(PlanTier _tier) external nonReentrant {
        TierInfo memory tier = tiers[_tier];
        
        if (tier.monthlyFee > 0) {
            require(mockUSD.transferFrom(msg.sender, address(this), tier.monthlyFee), "Payment failed");
            emit Renewed(msg.sender, tier.monthlyFee);
        }

        userSubscriptions[msg.sender] = UserSubscription({
            tier: _tier,
            lastBillingTimestamp: block.timestamp,
            nextBillingTimestamp: block.timestamp + 30 days
        });

        emit Subscribed(msg.sender, _tier);
    }

    /**
     * @dev Cancels/unsubscribes the user, resetting their tier to ALPHA (free tier).
     */
    function cancelSubscription() external {
        userSubscriptions[msg.sender] = UserSubscription({
            tier: PlanTier.ALPHA,
            lastBillingTimestamp: block.timestamp,
            nextBillingTimestamp: block.timestamp
        });
        emit Subscribed(msg.sender, PlanTier.ALPHA);
    }

    /**
     * @dev Renews the subscription for the user. 
     * Can be called by the user or an automated bot if allowance exists.
     */
    function renewSubscription(address _user) external nonReentrant {
        UserSubscription storage sub = userSubscriptions[_user];
        require(block.timestamp >= sub.nextBillingTimestamp, "Too early to renew");
        
        TierInfo memory tier = tiers[sub.tier];
        if (tier.monthlyFee > 0) {
            require(mockUSD.transferFrom(_user, address(this), tier.monthlyFee), "Auto-deduct failed");
            emit Renewed(_user, tier.monthlyFee);
        }

        sub.lastBillingTimestamp = block.timestamp;
        sub.nextBillingTimestamp = block.timestamp + 30 days;
    }

    /**
     * @dev External function to record a transaction and check limits.
     * To be called by SpectraExchange or other platform contracts.
     */
    function recordTransaction(address _user) external {
        // In production, this would be restricted to authorized contracts
        // For this prototype, we'll allow it or use a modifier
        
        UserSubscription memory sub = userSubscriptions[_user];
        TierInfo memory tier = tiers[sub.tier];
        DailyUsage storage usage = userDailyUsage[_user];

        // Reset logic: 24 hours after their first transaction of the cycle
        if (block.timestamp >= usage.firstTxTimestamp + 1 days) {
            usage.count = 1;
            usage.firstTxTimestamp = block.timestamp;
        } else {
            usage.count++;
        }

        require(usage.count <= tier.dailyTxLimit, "Daily transaction limit exceeded");
        
        emit TransactionExecuted(_user, usage.count);
    }

    /**
     * @dev View functions for integration
     */
    function getUserTier(address _user) external view returns (PlanTier) {
        return userSubscriptions[_user].tier;
    }

    function checkNFTAccess(address _user) external view returns (bool) {
        return tiers[userSubscriptions[_user].tier].hasNFTAccess;
    }

    function getRemainingTransactions(address _user) external view returns (uint256) {
        DailyUsage memory usage = userDailyUsage[_user];
        TierInfo memory tier = tiers[userSubscriptions[_user].tier];

        if (block.timestamp >= usage.firstTxTimestamp + 1 days) {
            return tier.dailyTxLimit;
        }

        if (usage.count >= tier.dailyTxLimit) {
            return 0;
        }
        
        return tier.dailyTxLimit - usage.count;
    }

    /**
     * @dev Admin functions
     */
    function updateTierInfo(PlanTier _tier, uint256 _limit, uint256 _fee, bool _nft) external onlyOwner {
        tiers[_tier] = TierInfo(_limit, _fee, _nft);
    }

    function withdrawFees() external onlyOwner {
        uint256 balance = mockUSD.balanceOf(address(this));
        require(mockUSD.transfer(owner(), balance), "Withdrawal failed");
    }
}
