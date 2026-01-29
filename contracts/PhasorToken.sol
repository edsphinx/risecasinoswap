// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PhasorToken
 * @notice Governance token for the PhasorFi DEX ecosystem
 * @dev ERC20 token with governance capabilities (voting, delegation)
 */
contract PhasorToken is ERC20, ERC20Burnable, ERC20Permit, ERC20Votes, Ownable {
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18; // 1 billion tokens

    constructor(
        address initialOwner
    ) ERC20("Phasor Token", "PHASOR") ERC20Permit("Phasor Token") Ownable(initialOwner) {
        // Mint initial supply to owner
        _mint(initialOwner, MAX_SUPPLY);
    }

    // Required overrides for ERC20Votes

    function _update(address from, address to, uint256 value) internal override(ERC20, ERC20Votes) {
        super._update(from, to, value);
    }

    function nonces(address owner) public view override(ERC20Permit, Nonces) returns (uint256) {
        return super.nonces(owner);
    }
}
