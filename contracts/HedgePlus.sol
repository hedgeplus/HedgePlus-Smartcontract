// // SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Context.sol";

import "./libraries/Math.sol";

contract HedgePlus is Context, IERC20, Ownable {
  using Math for uint256;
  using SafeMath for uint256;

  uint256 public taxPercentage = 200;

  uint256 private constant BP_DIVISOR = 10000;

  mapping(address => uint256) private _balances;
  mapping(address => mapping(address => uint256)) private _allowances;
  mapping(address => bool) private _isBlacklisted;

  address private _marketMakingAddress;
  uint256 private _totalSupply;
  string private _name;
  string private _symbol;

  constructor(address marketMakingAddress_) {
    require(marketMakingAddress_ != address(0), "Invalid market wallet");

    _totalSupply = 21 * 1000 * 1000 ether;
    _marketMakingAddress = marketMakingAddress_;
    _name = "HedgePlus";
    _symbol = "HPLUS";

    _mint(_msgSender(), _totalSupply);
  }

  function name() public view returns (string memory) {
    return _name;
  }

  function symbol() public view returns (string memory) {
    return _symbol;
  }

  function decimals() public pure returns (uint8) {
    return 18;
  }

  function totalSupply() public view override returns (uint256) {
    return _totalSupply;
  }

  function balanceOf(address account) public view override returns (uint256) {
    return _balances[account];
  }

  function transfer(address recipient, uint256 amount)
    public
    override
    returns (bool)
  {
    _transfer(_msgSender(), recipient, amount);
    return true;
  }

  function allowance(address owner, address spender)
    public
    view
    override
    returns (uint256)
  {
    return _allowances[owner][spender];
  }

  function approve(address spender, uint256 amount)
    public
    override
    returns (bool)
  {
    _approve(_msgSender(), spender, amount);
    return true;
  }

  function transferFrom(
    address sender,
    address recipient,
    uint256 amount
  ) public override returns (bool) {
    _transfer(sender, recipient, amount);

    uint256 currentAllowance = _allowances[sender][_msgSender()];
    require(currentAllowance >= amount, "Transfer amount exceeds allowance");
    unchecked {_approve(sender, _msgSender(), currentAllowance - amount);}

    return true;
  }

  function increaseAllowance(address spender, uint256 addedValue)
    public
    returns (bool)
  {
    _approve(
      _msgSender(),
      spender,
      _allowances[_msgSender()][spender] + addedValue
    );
    return true;
  }

  function decreaseAllowance(address spender, uint256 subtractedValue)
    public
    virtual
    returns (bool)
  {
    uint256 currentAllowance = _allowances[_msgSender()][spender];
    require(
      currentAllowance >= subtractedValue,
      "Decreased allowance below zero"
    );
    unchecked {
      _approve(_msgSender(), spender, currentAllowance - subtractedValue);
    }

    return true;
  }

  function burn(uint256 _amount) external returns (bool) {
    _burn(_msgSender(), _amount);
    return true;
  }

  function burnFrom(address _spender, uint256 _amount) external returns (bool) {
    uint256 senderAllowance = _allowances[_spender][_msgSender()];
    require(senderAllowance >= _amount, "Burn amount exceeds allowance");

    _allowances[_spender][_msgSender()] = senderAllowance.sub(_amount);
    _burn(_msgSender(), _amount);
    return true;
  }

  function setMarketMakingAddress(address marketMakingAddress_)
    external
    onlyOwner
    returns (bool)
  {
    require(marketMakingAddress_ != address(0), "Invalid address");
    _marketMakingAddress = marketMakingAddress_;
    return true;
  }

  function blackListAddresses(address[] calldata _addresses)
    external
    onlyOwner
  {
    _setBlackList(_addresses, true);
  }

  function whiteListAddresses(address[] calldata _addresses)
    external
    onlyOwner
  {
    _setBlackList(_addresses, false);
  }

  function _calculateTaxAmount(uint256 amount) internal view returns (uint256) {
    uint256 roundValue = amount.ceilDiv(taxPercentage);
    uint256 taxAmout = roundValue.mul(taxPercentage).div(BP_DIVISOR);

    return taxAmout;
  }

  function _mint(address account, uint256 amount) internal {
    require(account != address(0), "Invalid address");

    _balances[account] = _balances[account].add(amount);
    emit Transfer(address(0), account, amount);
  }

  function _transfer(
    address sender,
    address recipient,
    uint256 amount
  ) internal {
    require(sender != address(0), "Transfer from the zero address");
    require(recipient != address(0), "Transfer to the zero address");
    require(
      !_isBlacklisted[sender] && !_isBlacklisted[recipient],
      "Blacklisted sender or recipient"
    );
    require(amount > 0, "Invalid transfer amount");

    uint256 senderBalancee = balanceOf(sender);
    require(senderBalancee >= amount, "Transfer amount exceeds balance");

    _beforeTokenTransfer(sender, recipient, amount);

    uint256 taxAmount = _calculateTaxAmount(amount);
    uint256 tokensToTransfer = amount.sub(taxAmount);
    uint256 tokensToBurn = taxAmount.div(2);

    unchecked {_balances[sender] = senderBalancee - amount;}
    _balances[recipient] += tokensToTransfer;

    _balances[_marketMakingAddress] += tokensToBurn;
    _totalSupply -= tokensToBurn;

    emit Transfer(sender, recipient, tokensToTransfer);
    emit Transfer(sender, address(0), tokensToBurn);
  }

  function _approve(
    address owner,
    address spender,
    uint256 amount
  ) internal virtual {
    require(owner != address(0), "Approve from the zero address");
    require(spender != address(0), "Approve to the zero address");
    require(
      !_isBlacklisted[owner] && !_isBlacklisted[spender],
      "Blacklisted address"
    );

    _allowances[owner][spender] = amount;
    emit Approval(owner, spender, amount);
  }

  function _setBlackList(address[] calldata addresses, bool blackListed)
    internal
  {
    uint256 n = addresses.length;

    for (uint256 i = 0; i < n; i++) {
      require(
        _isBlacklisted[addresses[i]] != blackListed,
        "Invalid blacklist address"
      );
      _isBlacklisted[addresses[i]] = blackListed;
    }
  }

  function _burn(address account, uint256 amount) internal {
    require(!_isBlacklisted[account], "Blacklisted address");
    require(account != address(0), "Burn from the zero address");
    require(amount > 0, "Invalid amount");

    _beforeTokenTransfer(account, address(0), amount);

    uint256 accountBalance = _balances[account];
    require(accountBalance >= amount, "Burn amount exceeds balance");
    unchecked {_balances[account] = accountBalance - amount;}
    _totalSupply -= amount;

    emit Transfer(account, address(0), amount);
  }

  function _beforeTokenTransfer(
    address from,
    address to,
    uint256 amount
  ) internal virtual {}
}
