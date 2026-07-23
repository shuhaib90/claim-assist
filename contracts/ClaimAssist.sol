// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ClaimAssist
/// @notice Lets a wallet owner claim from an external airdrop/claim contract
///         in the same transaction they initiate themselves, with a small
///         service fee taken from the claimed amount before the rest is
///         forwarded to the owner. The owner's wallet calls this contract
///         directly — there is no private key input, no custody step, and
///         no scenario where anyone other than the calling wallet receives
///         the claimed funds (minus the fee).
contract ClaimAssist {
    address public immutable feeRecipient;
    uint256 public constant FEE_BPS = 300; // 3.00% fee, in basis points
    uint256 public constant BPS_DENOMINATOR = 10_000;

    event ClaimExecuted(
        address indexed owner,
        address indexed targetContract,
        address indexed token, // address(0) for native token
        uint256 grossAmount,
        uint256 fee,
        uint256 netAmount
    );

    error ClaimCallFailed();
    error NoValueReceived();
    error TransferFailed();

    constructor(address _feeRecipient) {
        require(_feeRecipient != address(0), "fee recipient required");
        feeRecipient = _feeRecipient;
    }

    /// @notice Claims a native-token (e.g. testnet ETH-equivalent) airdrop by
    ///         forwarding the owner's calldata to the target contract, then
    ///         splits whatever native value this contract receives as a
    ///         result between the fee recipient and the caller.
    /// @param targetContract The airdrop/claim contract to call.
    /// @param claimCalldata The exact calldata for that contract's claim function.
    function claimNative(address targetContract, bytes calldata claimCalldata)
        external
        returns (uint256 netAmount)
    {
        uint256 balanceBefore = address(this).balance;

        (bool success, ) = targetContract.call(claimCalldata);
        if (!success) revert ClaimCallFailed();

        uint256 received = address(this).balance - balanceBefore;
        if (received == 0) revert NoValueReceived();

        uint256 fee = (received * FEE_BPS) / BPS_DENOMINATOR;
        netAmount = received - fee;

        (bool feeSent, ) = feeRecipient.call{value: fee}("");
        if (!feeSent) revert TransferFailed();

        (bool ownerSent, ) = msg.sender.call{value: netAmount}("");
        if (!ownerSent) revert TransferFailed();

        emit ClaimExecuted(msg.sender, targetContract, address(0), received, fee, netAmount);
    }

    /// @notice Claims an ERC-20 airdrop the same way, for a token whose
    ///         address is known ahead of time (the owner must know which
    ///         token the airdrop pays out in, since ERC-20 balance deltas
    ///         must be checked on that specific token).
    /// @param targetContract The airdrop/claim contract to call.
    /// @param claimCalldata The exact calldata for that contract's claim function.
    /// @param token The ERC-20 token this airdrop pays out.
    function claimERC20(address targetContract, bytes calldata claimCalldata, address token)
        external
        returns (uint256 netAmount)
    {
        IERC20 erc20 = IERC20(token);
        uint256 balanceBefore = erc20.balanceOf(address(this));

        (bool success, ) = targetContract.call(claimCalldata);
        if (!success) revert ClaimCallFailed();

        uint256 received = erc20.balanceOf(address(this)) - balanceBefore;
        if (received == 0) revert NoValueReceived();

        uint256 fee = (received * FEE_BPS) / BPS_DENOMINATOR;
        netAmount = received - fee;

        require(erc20.transfer(feeRecipient, fee), "fee transfer failed");
        require(erc20.transfer(msg.sender, netAmount), "owner transfer failed");

        emit ClaimExecuted(msg.sender, targetContract, token, received, fee, netAmount);
    }

    receive() external payable {}
}

interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
}
