const { ethers, upgrades } = require("hardhat")

async function deployFixture() {
  const [a0, admin, user1, user2, user3] = await ethers.getSigners()

  const metaNodePerBlock = 100n
  const blockHight = 10000
  const provider = ethers.provider
  const unstakeLockedBlocks = 10
  const zeroAddress = "0x0000000000000000000000000000000000000000"

  // 部署 ERC20 合约
  const erc20 = await ethers.getContractFactory("MetaNodeToken")
  const erc20Contract = await erc20.connect(admin).deploy()
  await erc20Contract.waitForDeployment()
  const erc20ddress = await erc20Contract.getAddress()

  // 当前区块高度
  const blockNumber = await provider.getBlockNumber()

  // 部署 MetaNodeStake 的 UUPS 代理
  const metaNodeStake = await ethers.getContractFactory("MetaNodeStake")
  const stakeProxyContract = await upgrades.deployProxy(
    metaNodeStake.connect(admin),
    [erc20ddress, blockNumber, blockNumber + blockHight, metaNodePerBlock],
    { kind: "uups" }
  )
  await stakeProxyContract.waitForDeployment()

  // 部署后新增 eth 质押池
  await stakeProxyContract
    .connect(admin)
    .addPool(zeroAddress, 5, 10n ** 15n, unstakeLockedBlocks, false)

  return {
    a0,
    admin,
    user1,
    user2,
    user3,
    erc20Contract,
    erc20ddress,
    blockNumber,
    blockHight,
    metaNodePerBlock,
    unstakeLockedBlocks,
    zeroAddress,
    stakeProxyContract,
  }
}

module.exports = { deployFixture }