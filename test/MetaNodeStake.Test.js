const { expect } = require("chai")
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers")
const { deployFixture } = require("./utils/fixture.js")
describe("MetaNodeStake", function () {

  it("pauseWithdraw", async function () {
    const {
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
      stakeProxyContract }
      = await loadFixture(deployFixture)

    const paused0 = await stakeProxyContract.withdrawPaused()
    await stakeProxyContract.connect(admin).pauseWithdraw()
    const paused1 = await stakeProxyContract.withdrawPaused()
    expect(paused1).to.equal(true)
    expect(paused0).to.equal(false)

    await expect(
      stakeProxyContract.connect(user1).pauseWithdraw()
    ).to.be.revertedWithCustomError(
      stakeProxyContract,
      "AccessControlUnauthorizedAccount"
    )

      // 第二次调用，应该 revert
    await expect(
      stakeProxyContract.connect(admin).pauseWithdraw()
    ).to.be.revertedWith("withdraw has been already paused")
    await expect(
      stakeProxyContract.connect(admin).unpauseWithdraw()
    ).to.emit(stakeProxyContract, "UnpauseWithdraw")
  })
  
  it("unpauseWithdraw", async function () {
    const {
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
      stakeProxyContract }
      = await loadFixture(deployFixture)

    await stakeProxyContract.connect(admin).pauseWithdraw()
    const paused1 = await stakeProxyContract.withdrawPaused()
    expect(paused1).to.equal(true)

    await stakeProxyContract.connect(admin).unpauseWithdraw()
    const paused2 = await stakeProxyContract.withdrawPaused()
    expect(paused2).to.equal(false)


    await expect(
      stakeProxyContract.connect(user1).unpauseWithdraw()
    ).to.be.revertedWithCustomError(
      stakeProxyContract,
      "AccessControlUnauthorizedAccount"
    )

    // 第二次调用，应该 revert
    await expect(
      stakeProxyContract.connect(admin).unpauseWithdraw()
    ).to.be.revertedWith("withdraw has been already unpaused")
    await stakeProxyContract.connect(admin).pauseWithdraw()
    await expect(
      stakeProxyContract.connect(admin).unpauseWithdraw()
    ).to.emit(stakeProxyContract, "UnpauseWithdraw")
    })

})