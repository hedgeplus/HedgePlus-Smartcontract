/* eslint-disable no-console */

import { ethers } from 'hardhat'

async function main() {
  const HPLUSToken = await ethers.getContractFactory('HedgePlus')
  const marketMakingAddress = process.env.MARKET_MAKING_ADDRESS

  console.log('Starting deployments...')

  const hplusToken = await HPLUSToken.deploy(marketMakingAddress)
  await hplusToken.deployed()
  console.log('HPLUS Token deployed to:', hplusToken.address)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
