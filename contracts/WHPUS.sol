// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Context.sol";

contract WHPLUS is Context, Ownable, ERC20Burnable {
  using SafeMath for uint256;
  using SafeERC20 for ERC20;

  ERC20 public HPLUS;

  constructor(address _nativeToken) ERC20("Wrapped HPLUS", "WHPLUS") {
    HPLUS = ERC20(_nativeToken);
  }

  event Wrapped(
    address indexed _wrapper,
    uint256 indexed _amountIn,
    uint256 indexed _amountWrapped
  );
  event Unwrapped(
    address indexed _unwrapper,
    uint256 indexed _amountUnwrapped,
    uint256 indexed _amountOut
  );

  function setHPLUS(address _nativeToken) public onlyOwner {
    HPLUS = ERC20(_nativeToken);
  }

  function wrap(uint256 _amount) public {
    uint256 balanceBefore = HPLUS.balanceOf(address(this));
    HPLUS.safeTransferFrom(_msgSender(), address(this), _amount);
    uint256 realAmount = HPLUS.balanceOf(address(this)).sub(balanceBefore);
    _mint(_msgSender(), realAmount);
    emit Wrapped(_msgSender(), _amount, realAmount);
  }

  function unwrap(uint256 _amount) public {
    uint256 balanceBefore = HPLUS.balanceOf(_msgSender());
    HPLUS.safeTransfer(_msgSender(), _amount);
    uint256 realAmount = HPLUS.balanceOf(_msgSender()).sub(balanceBefore);
    _burn(_msgSender(), _amount);
    emit Unwrapped(_msgSender(), _amount, realAmount);
  }
}
