// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-var-requires */
const { expect } = require('chai');
const { ether } = require('@openzeppelin/test-helpers');
describe("HedgePlus contract", function () {

  let hpContract;
  const marketMakingAddress = process.env.MARKET_MAKING_ADDRESS;
  const CONTRACT_NAME = 'HedgePlus';
  const SYMBOL = 'HPLUS';
  const TOTAL_SUPPLY = ether((21 * 1000 * 1000).toString());
  const NUM_DECIMALS = 18;
  let owner;
  let addr1;
  let addr2;
  let addrs;

  beforeEach(async function () {
    // eslint-disable-next-line no-undef
    const Contract = await ethers.getContractFactory(CONTRACT_NAME);
    // eslint-disable-next-line no-undef
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    hpContract = await Contract.deploy(marketMakingAddress);
  });

  describe("Deployment", function () {
    // If the callback function is async, Mocha will `await` it.
    it("Should set the right Owner", async function () {
      expect(await hpContract.owner()).to.equal(owner.address);
    });

    it("Should assign the total supply of tokens to the owner", async function () {
      const ownerBalance = await hpContract.balanceOf(owner.address);
      expect(await hpContract.totalSupply()).to.equal(ownerBalance);
    });

    it('Should have valid Name', async function () {
      expect(await hpContract.name()).to.equal(CONTRACT_NAME);
    });

    it('Should have valid Total Supply', async function () {
      expect(await hpContract.totalSupply()).to.equal(TOTAL_SUPPLY.toString());
    });

    it('Should have valid Symbol', async function () {
      expect(await hpContract.symbol()).to.equal(SYMBOL);
    });

    it('Should have 18 Decimal Places', async function () {
      expect(await hpContract.decimals()).to.equal(NUM_DECIMALS);
    });
  });

  describe("Transactions", function () {
    it("Should transfer tokens between accounts", async function () {
      await hpContract.transfer(addr1.address, 50);
      const addr1Balance = await hpContract.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(50);
      await hpContract.connect(addr1).transfer(addr2.address, 50);
      const addr2Balance = await hpContract.balanceOf(addr2.address);
      expect(addr2Balance).to.equal(50);
    });

    it("Should fail if sender doesn’t have enough tokens", async function () {
      const initialOwnerBalance = await hpContract.balanceOf(owner.address);
      await expect(
        hpContract.connect(addr1).transfer(owner.address, 1)
      ).to.be.revertedWith("Transfer amount exceeds balance");

      expect(await hpContract.balanceOf(owner.address)).to.equal(
        initialOwnerBalance
      );
    });

    it("Should update balances after transfers", async function () {
      const initialOwnerBalance = await hpContract.balanceOf(owner.address);
      const expectedBalance = initialOwnerBalance.sub(150);
      // Transfer 100 tokens from owner to addr1.
      await hpContract.transfer(addr1.address, '100');

      // Transfer another 50 tokens from owner to addr2.
      await hpContract.transfer(addr2.address, '50');

      // Check balances.
      const finalOwnerBalance = await hpContract.balanceOf(owner.address);
      expect(finalOwnerBalance).to.equal(expectedBalance);

      const addr1Balance = await hpContract.balanceOf(addr1.address);
      expect(addr1Balance).to.equal('100');

      const addr2Balance = await hpContract.balanceOf(addr2.address);
      expect(addr2Balance).to.equal('50');
    });
  });
});
