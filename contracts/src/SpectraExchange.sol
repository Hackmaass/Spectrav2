// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./SpectraSaaS.sol";

/**
 * @title SpectraExchange
 * @dev Unified exchange router abstraction for Base Sepolia.
 * Enforces SaaS subscription limits on all trade executions.
 */
contract SpectraExchange is Ownable, ReentrancyGuard {
    SpectraSaaS public saasContract;
    IERC20 public mockUSD;

    // Base Sepolia WETH address often used as placeholder for native ETH swaps in dApps
    address public constant WETH = 0x4200000000000000000000000000000000000006;

    event SwapExecuted(
        address indexed user,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );
    event QuotaVerified(address indexed user, uint256 currentCount);

    /**
     * @dev Modifier to verify and record transaction usage via SpectraSaaS.
     */
    modifier enforceQuota(address _user) {
        saasContract.recordTransaction(_user);
        _;
        emit QuotaVerified(_user, 0); 
    }

    constructor(address _saasContract, address _mockUSD) Ownable(msg.sender) {
        saasContract = SpectraSaaS(_saasContract);
        mockUSD = IERC20(_mockUSD);
    }

    /**
     * @dev Fallback to receive ETH liquidity.
     */
    receive() external payable {}

    /**
     * @dev Calculates a trade quote. 
     */
    function getQuote(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) public view returns (uint256 amountOut) {
        // ETH/WETH price = $3500.00
        // TYI & USDC price = $1.00 (6 decimals)
        address usdc = 0x036cbd53842C5426634E7DE0Ee21189402Dbf3De;
        
        if (tokenIn == address(mockUSD) && tokenOut == WETH) {
            return (amountIn * 10**12) / 3500;
        } else if (tokenIn == WETH && tokenOut == address(mockUSD)) {
            return (amountIn * 3500) / 10**12;
        } else if (tokenIn == usdc && tokenOut == WETH) {
            return (amountIn * 10**12) / 3500;
        } else if (tokenIn == WETH && tokenOut == usdc) {
            return (amountIn * 3500) / 10**12;
        } else {
            // Default 1:1 for similar decimal stablecoins
            return amountIn;
        }
    }

    /**
     * @dev Executes an asset swap.
     * Strict quota enforcement ensures user is within their tier's daily limit.
     */
    function swap(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut
    ) external nonReentrant enforceQuota(msg.sender) {
        require(amountIn > 0, "Amount must be greater than 0");
        
        // 1. Transfer In (User must have approved this contract)
        require(IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn), "Spectra: TransferIn failed");

        // 2. Perform Swap Logic
        uint256 amountOut = getQuote(tokenIn, tokenOut, amountIn); 
        require(amountOut >= minAmountOut, "Spectra: Slippage too high");

        // 3. Transfer Out
        if (tokenOut == WETH) {
            // Treat WETH request as native ETH for this hackathon context
            require(address(this).balance >= amountOut, "Spectra: Insufficient ETH liquidity");
            (bool success, ) = msg.sender.call{value: amountOut}("");
            require(success, "Spectra: ETH TransferOut failed");
        } else {
            // Normal ERC20 transfer
            require(IERC20(tokenOut).balanceOf(address(this)) >= amountOut, "Spectra: Insufficient token liquidity");
            require(IERC20(tokenOut).transfer(msg.sender, amountOut), "Spectra: Token TransferOut failed");
        }

        emit SwapExecuted(msg.sender, tokenIn, tokenOut, amountIn, amountOut);
    }

    /**
     * @dev Admin function to update the SaaS contract address.
     */
    function setSaasContract(address _saasContract) external onlyOwner {
        saasContract = SpectraSaaS(_saasContract);
    }

    /**
     * @dev Admin function to update the Mock USD address.
     */
    function updateMockUSD(address _mockUSD) external onlyOwner {
        mockUSD = IERC20(_mockUSD);
    }

    /**
     * @dev Emergency withdrawal for stuck tokens.
     */
    function withdrawToken(address token, uint256 amount) external onlyOwner {
        IERC20(token).transfer(owner(), amount);
    }

    /**
     * @dev Emergency withdrawal for ETH.
     */
    function withdrawETH(uint256 amount) external onlyOwner {
        (bool success, ) = owner().call{value: amount}("");
        require(success, "Withdraw failed");
    }
}
