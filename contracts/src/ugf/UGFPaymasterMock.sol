// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title UGFPaymasterMock
 * @dev A simple mock paymaster mimicking the Universal Gas Framework.
 * It accepts Mock USD to sponsor transaction execution costs.
 */
contract UGFPaymasterMock is Ownable {
    IERC20 public mockUSD;
    uint256 public constant GAS_PRICE_MODIFIER = 1; // Simplified 1:1 for mock

    event GasSponsored(address indexed user, uint256 mockUSDAmount, bytes4 targetFunction);

    constructor(address _mockUSD) Ownable(msg.sender) {
        mockUSD = IERC20(_mockUSD);
    }

    /**
     * @dev Simple mock function to 'sponsor' a transaction.
     * In a real UGF scenario, this would involve EIP-712 signature verification
     * and a bundler executing the transaction on-chain.
     */
    function sponsorTransaction(
        address user,
        uint256 estimatedGas,
        bytes4 selector
    ) external {
        uint256 fee = estimatedGas * GAS_PRICE_MODIFIER;
        
        // In this mock, we just transfer the fee from the user to the paymaster
        // mimicking the deduction of "gas" in Mock USD.
        require(mockUSD.transferFrom(user, address(this), fee), "UGF: Fee payment failed");
        
        emit GasSponsored(user, fee, selector);
    }

    /**
     * @dev Allows the owner to withdraw the collected "gas" fees.
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = mockUSD.balanceOf(address(this));
        require(mockUSD.transfer(owner(), balance), "UGF: Withdrawal failed");
    }

    /**
     * @dev Updates the mock USD token address.
     */
    function setMockUSD(address _mockUSD) external onlyOwner {
        mockUSD = IERC20(_mockUSD);
    }
}
