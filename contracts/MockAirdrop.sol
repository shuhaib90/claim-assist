// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20Mintable {
    function mint(address to, uint256 amount) external;
    function transfer(address to, uint256 amount) external returns (bool);
}

/// @title MockAirdrop
/// @notice A test contract simulating native and ERC-20 airdrop claims
contract MockAirdrop {
    address public erc20Token;
    mapping(address => bool) public hasClaimedNative;
    mapping(address => bool) public hasClaimedERC20;

    constructor(address _erc20Token) {
        erc20Token = _erc20Token;
    }

    /// @notice Simulates a native ETH/XLayer token claim
    function claimNativeAirdrop() external payable {
        require(!hasClaimedNative[msg.sender], "already claimed");
        hasClaimedNative[msg.sender] = true;

        // Send 1.0 native token to the caller (ClaimAssist contract)
        (bool sent, ) = msg.sender.call{value: 1 ether}("");
        require(sent, "native send failed");
    }

    /// @notice Simulates an ERC-20 token claim
    function claimERC20Airdrop() external {
        require(!hasClaimedERC20[msg.sender], "already claimed");
        hasClaimedERC20[msg.sender] = true;

        // Transfer 1000 tokens to caller (ClaimAssist contract)
        IERC20Mintable(erc20Token).transfer(msg.sender, 1000 * 1e18);
    }

    receive() external payable {}
}
