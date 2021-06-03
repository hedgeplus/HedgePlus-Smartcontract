/* eslint-disable no-console */

import { ethers } from 'hardhat'

async function main() {
  const HPLUS = await ethers.getContractFactory('HedgePlus')
  const WHPLUS = await ethers.getContractFactory('WHPLUS')
  const marketMakingAddress = process.env.MARKET_MAKING_ADDRESS
  let hplusAddress = process.env.HPLUS_ADDRESS

  console.log('Starting deployments...')

  if (!hplusAddress) {
    const hplusToken = await HPLUS.deploy(marketMakingAddress)
    await hplusToken.deployed()
    console.log('HPLUS Token deployed to:', hplusToken.address)
    hplusAddress = hplusToken.address
  }

  const wPlusToken = await WHPLUS.deploy(hplusAddress)
  await wPlusToken.deployed()
  console.log('WHPLUS Token deployed to:', wPlusToken.address)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
