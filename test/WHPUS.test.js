/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/ban-ts-comment */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { expect } = require('chai');

describe("WHPlus contract", function () {

  let hpContract, whpusContract;
  const marketMakingAddress = process.env.MARKET_MAKING_ADDRESS;
  const ERC20_SYMBOL = 'HedgePlus';
  const WRAPPER_CONTRACT_NAME = 'Wrapped HPLUS';
  const WRAPPER_SYMBOL = 'WHPLUS';
  let owner;
  let addr1;

  beforeEach(async function () {
    // Deploy erc20 contract to be Wrapped
    // eslint-disable-next-line no-undef
    // @ts-ignore
    const erc20Deployer = await ethers.getContractFactory(ERC20_SYMBOL);
    // eslint-disable-next-line no-undef
    // @ts-ignore
    const wrapperDeployer = await ethers.getContractFactory(WRAPPER_SYMBOL);
    // eslint-disable-next-line no-undef
    // @ts-ignore
    [owner, addr1] = await ethers.getSigners();
    hpContract = await erc20Deployer.deploy(marketMakingAddress);
    // Create wrapped contract from erc20 token
    whpusContract = await wrapperDeployer.deploy(hpContract.address);
  });

  afterEach(async function () {
    // Switch to owner wallet
    hpContract = hpContract.connect(owner);
    whpusContract = whpusContract.connect(owner);
  });

  describe("Deployment", function () {
    // Testing basic deployment and checking constructor
    it("Should set the right Owner", async function () {
      expect(await whpusContract.owner()).to.equal(owner.address);
    });

    it('Should have valid Name', async function () {
      expect(await whpusContract.name()).to.equal(WRAPPER_CONTRACT_NAME);
    });

    it('Should have valid Symbol', async function () {
      expect(await whpusContract.symbol()).to.equal(WRAPPER_SYMBOL);
    });
  });

  describe("Transactions", function () {
    it("Should wrap tokens and unwrap tokens", async function () {
      // Transfer 50 tokens to start
      await hpContract.transfer(addr1.address, 50);
      let balance = await hpContract.balanceOf(addr1.address);
      expect(balance).to.equal(50);

      // Switch to addr1 wallet
      hpContract = hpContract.connect(addr1);
      whpusContract = whpusContract.connect(addr1);

      // Important, have to allow whpusContract call hpContract to transfer
      await hpContract.increaseAllowance(whpusContract.address, 50);

      // Wrap
      await whpusContract.wrap(50);
      balance = await whpusContract.balanceOf(addr1.address);
      expect(balance).to.equal(50);
      balance = await hpContract.balanceOf(addr1.address);
      expect(balance).to.equal(0);

      // Unwrap
      await whpusContract.unwrap(50);
      balance = await whpusContract.balanceOf(addr1.address);
      expect(balance).to.equal(0);
      balance = await hpContract.balanceOf(addr1.address);
      expect(balance).to.equal(50);
    });

    it("Should fail to wrap tokens without a proper balance", async function () {
      await hpContract.transfer(addr1.address, 50);
      let balance = await hpContract.balanceOf(addr1.address);
      expect(balance).to.equal(50);

      hpContract = hpContract.connect(addr1);
      whpusContract = whpusContract.connect(addr1);
      await hpContract.increaseAllowance(whpusContract.address, 51);

      await expect(whpusContract.wrap(51)).to.be.revertedWith("Transfer amount exceeds balance");
    });

    it("Should fail to unwrap tokens without a proper balance", async function () {
      await hpContract.transfer(addr1.address, 50);
      let balance = await hpContract.balanceOf(addr1.address);
      expect(balance).to.equal(50);

      hpContract = hpContract.connect(addr1);
      whpusContract = whpusContract.connect(addr1);
      await hpContract.increaseAllowance(whpusContract.address, 50);

      await whpusContract.wrap(50);
      await expect(whpusContract.unwrap(51)).to.be.revertedWith("Transfer amount exceeds balance");
    });
  });

  describe("Changing HPLUS value after construction", function () {
    it("Should wrap tokens and unwrap tokens", async function () {
      await hpContract.transfer(addr1.address, 50);
      let balance = await hpContract.balanceOf(addr1.address);
      expect(balance).to.equal(50);

      hpContract = hpContract.connect(addr1);
      whpusContract = whpusContract.connect(addr1);

      // Important, have to allow whpusContract call hpContract to transfer
      await hpContract.increaseAllowance(whpusContract.address, 50);

      // Wrap
      await whpusContract.wrap(50);
      balance = await whpusContract.balanceOf(addr1.address);
      expect(balance).to.equal(50);

      // Change HPLUS to use DAI
      // @ts-ignore
      const daiAddress = ethers.utils.getAddress('0x6B175474E89094C44Da98b954EedeAC495271d0F'.toLowerCase());
      await whpusContract.connect(owner).setHPLUS(daiAddress);

      // Unwrap
      await whpusContract.unwrap(50);
      balance = await hpContract.balanceOf(addr1.address);
      expect(balance).to.equal(50);

    });
  });
});
