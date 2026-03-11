const { expect } = require("chai")
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers")
const { deployFixture } = require("./utils/fixture.js")
describe("MetaNodeStake", function () {

  it("pauseWithdraw", async function () {
    const {
      admin,
      user1,
      user2,
      user3,
      erc20Contract,
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
      admin,
      user1,
      user2,
      user3,
      erc20Contract,
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

  it("add pool.erc20", async function () {
    const {
      admin,
      user1,
      user2,
      user3,
      erc20Contract,
      stakeProxyContract }
      = await loadFixture(deployFixture)
    console.log("add pool start.stakeContract address", stakeProxyContract.getAddress())
    const minDepositAmount = BigInt(1E18)


    await stakeProxyContract
      .connect(admin)
      .addPool(stakeProxyContract.getAddress(), 5, minDepositAmount, 10, false)
    const poolLength = await stakeProxyContract.poolLength()
    expect(poolLength).to.length.eq(3)
  })


  it("deposit.eth", async function () {
    const {
      admin,
      user1,
      user2,
      user3,
      erc20Contract,
      stakeProxyContract }
      = await loadFixture(deployFixture)
    console.log("deposit start")

    await expect(
      await stakeProxyContract.connect(user1).depositETH({ value: ethers.parseEther("100") })
    ).to.emit(stakeProxyContract, "Deposit")

    const user1Stake = await stakeProxyContract.stakingBalance(0, user1.address)
    expect(user1Stake).to.eq(BigInt(100E18))
    console.log("deposit end")

    const user1BalanceBefore = await erc20Contract.balanceOf(user1.address)
    console.log("user1BalanceBefore withdraw:", user1BalanceBefore)

    console.log("current blockNum:", await ethers.provider.getBlockNumber())
    const pending0 = await stakeProxyContract.pendingMetaNode(0, user1.address)
    // 跳过 8 个区块 eth转账生效
    for (let i = 0; i < 100; i++) {
      await ethers.provider.send("evm_mine", []);
    }

    const pending1 = await stakeProxyContract.pendingMetaNode(0, user1.address)
    console.log("pending0 reward:", pending0.toString())
    console.log("pending1 reward:", pending1.toString())

    console.log("after 100 blockNum:", await ethers.provider.getBlockNumber())

    await stakeProxyContract.connect(user1).claim(0)

    const user1BalanceAfter = await erc20Contract.balanceOf(user1.address)

    console.log("user1BalanceAfter claim:", user1BalanceAfter)
    console.log("user1BalanceAfter-user1BalanceBefore:", user1BalanceAfter - user1BalanceBefore)
    const pending = await stakeProxyContract.pendingMetaNode(0, user1.address)
    console.log("pending reward:", pending.toString())
    const contractRewardBal = await erc20Contract.balanceOf(await stakeProxyContract.getAddress())
    console.log("stake contract MetaNode balance:", contractRewardBal.toString())

    expect(contractRewardBal - user1BalanceBefore).to.gt(0n)

  })

  it("deposit.erc20", async function () {
    const {
      admin,
      user1,
      user2,
      user3,
      erc20Contract,
      stakeProxyContract }
      = await loadFixture(deployFixture)
    console.log("deposit erc20 start", stakeProxyContract.getAddress())

    await erc20Contract.connect(admin).transfer(user3.address, ethers.parseEther("1000000000"))
    await erc20Contract.connect(user3).approve(stakeProxyContract.getAddress(), ethers.parseEther("3000000"))
    await expect(
      stakeProxyContract.connect(user3).deposit(1, ethers.parseEther("3000000"))
    ).to.emit(stakeProxyContract, "Deposit")

    const user3Stake = await stakeProxyContract.stakingBalance(1, user3.address)
    console.log("user3Stake:", user3Stake)
    expect(user3Stake - BigInt(3000000E18)).to.lt(BigInt(1E18))

    console.log("deposit erc20 end", stakeProxyContract.getAddress())
  })

  it("deposit.erc20", async function () {
    const {
      admin,
      user1,
      user2,
      user3,
      erc20Contract,
      stakeProxyContract }
      = await loadFixture(deployFixture)
    console.log("deposit erc20 start", stakeProxyContract.getAddress())

    await erc20Contract.connect(admin).transfer(user3.address, ethers.parseEther("3000000000"))
    await erc20Contract.connect(user3).approve(stakeProxyContract.getAddress(), ethers.parseEther("3000000000"))
    await expect(
      stakeProxyContract.connect(user3).deposit(1, ethers.parseEther("3000000000"))
    ).to.emit(stakeProxyContract, "Deposit")

    const user3Stake = await stakeProxyContract.stakingBalance(1, user3.address)
    console.log("user3Stake:", user3Stake)

    console.log("current blockNum:", await ethers.provider.getBlockNumber())
    // 跳过 100 个区块 eth转账生效
    for (let i = 0; i < 100; i++) {
      await ethers.provider.send("evm_mine", []);
    }
    console.log("after 8 blockNum:", await ethers.provider.getBlockNumber())
    const user3BalanceBefore = await erc20Contract.balanceOf(user3.address)
    await stakeProxyContract.connect(user3).claim(1)

    const user3BalanceAfter = await erc20Contract.balanceOf(user3.address)

    console.log("user3BalanceBefore withdraw:", user3BalanceBefore)
    console.log("user3BalanceAfter withdraw:", user3BalanceAfter)
    expect(
      user3BalanceAfter
    ).to.gt(user3BalanceBefore)

    const user3BeforeUnstake = await stakeProxyContract.stakingBalance(1, user3.address)

    await stakeProxyContract.connect(user3).unstake(1, ethers.parseEther("2000000000"))
    const user3AfterUnstake = await stakeProxyContract.stakingBalance(1, user3.address)
    expect(user3BeforeUnstake).to.gt(user3AfterUnstake)
    console.log("user3BeforeUnstake", user3BeforeUnstake)
    console.log("user3AfterUnstake", user3AfterUnstake)

    const balanceBeforeClaim = await erc20Contract.balanceOf(user3.address)
    await stakeProxyContract.connect(user3).claim(1)
    const balanceAfterClaim = await erc20Contract.balanceOf(user3.address)
    expect(balanceAfterClaim).to.gt(balanceBeforeClaim)

    console.log("balanceAfterClaim...", balanceAfterClaim - balanceBeforeClaim)

    const balanceBeforeWithdraw = await erc20Contract.balanceOf(user3.address)
    await stakeProxyContract.connect(user3).withdraw(1)
    const balanceAfterWithdraw = await erc20Contract.balanceOf(user3.address)
    //expect(balanceAfterWithdraw).to.gt(balanceBeforeWithdraw)

    console.log("balanceAfterWithdraw...", balanceAfterWithdraw - balanceBeforeWithdraw)

  })

  it("withdraw", async function () {
    const {
      admin,
      user1,
      user2,
      user3,
      erc20Contract,
      stakeProxyContract }
      = await loadFixture(deployFixture)
    console.log("withdraw start", stakeProxyContract.getAddress())

    await erc20Contract.connect(admin).transfer(user3.address, ethers.parseEther("3000000000"))
    await erc20Contract.connect(user3).approve(stakeProxyContract.getAddress(), ethers.parseEther("3000000000"))
    await expect(
      stakeProxyContract.connect(user3).deposit(1, ethers.parseEther("3000000000"))
    ).to.emit(stakeProxyContract, "Deposit")

    const user3Stake = await stakeProxyContract.stakingBalance(1, user3.address)
    console.log("user3Stake:", user3Stake)
    console.log("current blockNum:", await ethers.provider.getBlockNumber())
    // 跳过 100 个区块 eth转账生效
    for (let i = 0; i < 100; i++) {
      await ethers.provider.send("evm_mine", []);
    }
    await stakeProxyContract.connect(user3).unstake(1, ethers.parseEther("1000000000"))
    const pendingByBlockNum = await stakeProxyContract.connect(user3).pendingMetaNodeByBlockNumber(1, user3.address, await ethers.provider.getBlockNumber())
    console.log("pendingByBlockNum", pendingByBlockNum)
    for (let i = 0; i < 100; i++) {
      await ethers.provider.send("evm_mine", []);
    }
    const balanceBeforeWithdraw = await erc20Contract.balanceOf(user3.address)
    await stakeProxyContract.connect(user3).withdraw(1)
    const balanceAfterWithdraw = await erc20Contract.balanceOf(user3.address)    
    expect(balanceAfterWithdraw).to.gt(balanceBeforeWithdraw)
    console.log("withdraw... end", balanceAfterWithdraw - balanceBeforeWithdraw)

  })


  it("setPoolWeight.", async function () {
    const {
      admin,
      user1,
      user2,
      user3,
      erc20Contract,
      stakeProxyContract }
      = await loadFixture(deployFixture)
    console.log("setPoolWeight start")
    await expect(
      stakeProxyContract.connect(admin).setPoolWeight(1, 0, false)
    ).to.be.revertedWith("invalid pool weight")

    console.log("setPoolWeight end", stakeProxyContract.getAddress())
  })

  it("updatePool.", async function () {
    const {
      admin,
      user1,
      user2,
      user3,
      erc20Contract,
      stakeProxyContract }
      = await loadFixture(deployFixture)
    console.log("setPoolWeight start", 1E15)

    await stakeProxyContract.connect(admin).updatePool(1, 1E15, 1000)
    console.log("deposit erc20 end", stakeProxyContract.getAddress())
  })

  it("massUpdatePool.", async function () {
    const {
      admin,
      user1,
      user2,
      user3,
      erc20Contract,
      stakeProxyContract }
      = await loadFixture(deployFixture)
    console.log("massUpdatePool start")

    await stakeProxyContract.connect(admin).massUpdatePools()
    console.log("massUpdatePool end")
  })

  it("massUpdatePool.", async function () {
    const {
      admin,
      user1,
      user2,
      user3,
      erc20Contract,
      stakeProxyContract }
      = await loadFixture(deployFixture)
    console.log("massUpdatePool start")

    await stakeProxyContract.connect(admin).massUpdatePools()
    console.log("massUpdatePool end")
  })


  it("getMultiplier.", async function () {
    const {
      admin,
      user1,
      user2,
      user3,
      erc20Contract,
      stakeProxyContract }
      = await loadFixture(deployFixture)
    console.log("getMultiplier start")
    const blockNum = await ethers.provider.getBlockNumber()
    // 跳过 8 个区块 eth转账生效
    for (let i = 0; i < 8; i++) {
      await ethers.provider.send("evm_mine", []);
    }
    const reward = await stakeProxyContract.connect(admin).getMultiplier(blockNum, await ethers.provider.getBlockNumber())
    console.log("getMultiplier end", reward)
  })

  it("getMultiplier.", async function () {
    const {
      admin,
      user1,
      user2,
      user3,
      erc20Contract,
      stakeProxyContract }
      = await loadFixture(deployFixture)
    console.log("getMultiplier start")
    const blockNum = await ethers.provider.getBlockNumber()
    // 跳过 8 个区块 eth转账生效
    for (let i = 0; i < 8; i++) {
      await ethers.provider.send("evm_mine", []);
    }
    const reward = await stakeProxyContract.connect(admin).getMultiplier(blockNum, await ethers.provider.getBlockNumber())
    console.log("getMultiplier end", reward)
  })

  it("pauseWithdraw and unpauseWithdraw", async function () {
    const {
      admin,
      user1,
      user2,
      user3,
      erc20Contract,
      stakeProxyContract }
      = await loadFixture(deployFixture)
    console.log("pauseWithdraw start")
    
    await expect(
        stakeProxyContract.connect(admin).pauseWithdraw()).to.
        emit(stakeProxyContract, "PauseWithdraw")
   
      await expect(
        stakeProxyContract.connect(admin).unpauseWithdraw()).to.
        emit(stakeProxyContract, "UnpauseWithdraw")
    console.log("pauseWithdraw unpauseWithdraw end")
  })

   it("withdraw.eth", async function () {
    const {
      admin,
      user1,
      user2,
      user3,
      erc20Contract,
      stakeProxyContract }
      = await loadFixture(deployFixture)
    console.log("deposit start")
    const balance0 = await ethers.provider.getBalance(user1.address)
    console.log("1. user1 ETH balance:", balance0.toString())
   
    await expect(
      await stakeProxyContract.connect(user1).depositETH({ value: ethers.parseEther("1000")})
    ).to.emit(stakeProxyContract, "Deposit")
   
    const balance1 = await ethers.provider.getBalance(user1.address)
    console.log("left balance after stake:", balance1.toString())
    
    // 跳过 8 个区块
    for (let i = 0; i < 8; i++) {
      await ethers.provider.send("evm_mine", []);
    }   

    const stakeBalance = await stakeProxyContract.connect(user1).stakingBalance(0,user1.address)
    console.log("stakeBalance:", stakeBalance)

    await stakeProxyContract.connect(user1).unstake(0,stakeBalance)
    
    for (let i = 0; i < 100; i++) {
      await ethers.provider.send("evm_mine", []);
    }   

    const withDrawAmount = await stakeProxyContract.connect(user1).withdrawAmount(0,user1.address)
    expect(withDrawAmount.requestAmount).to.gt(0)
    expect(withDrawAmount.pendingWithdrawAmount).to.gt(0)
    await stakeProxyContract.connect(user1).withdraw(0)
    const balance2 = await ethers.provider.getBalance(user1.address)
    expect(balance2).to.gt(balance1);
    console.log("left balance after claim:", balance2.toString())
  })

it("withdraw.eth", async function () {
    const {
      admin,
      user1,
      user2,
      user3,
      erc20Contract,
      stakeProxyContract }
      = await loadFixture(deployFixture)
    console.log("deposit start")
    const balance0 = await ethers.provider.getBalance(user1.address)
    console.log("1. user1 ETH balance:", balance0.toString())
   
    await expect(
      await stakeProxyContract.connect(user1).depositETH({ value: ethers.parseEther("1000")})
    ).to.emit(stakeProxyContract, "Deposit")
   
    const balance1 = await ethers.provider.getBalance(user1.address)
    console.log("left balance after stake:", balance1.toString())
    
    // 跳过 8 个区块
    for (let i = 0; i < 8; i++) {
      await ethers.provider.send("evm_mine", []);
    }   

    const stakeBalance = await stakeProxyContract.connect(user1).stakingBalance(0,user1.address)
    console.log("stakeBalance:", stakeBalance)

    await stakeProxyContract.connect(user1).unstake(0,stakeBalance)
    
    for (let i = 0; i < 100; i++) {
      await ethers.provider.send("evm_mine", []);
    }   
    await stakeProxyContract.connect(user1).withdraw(0)
    const balance2 = await ethers.provider.getBalance(user1.address)
    expect(balance2).to.gt(balance1);
    console.log("left balance after claim:", balance2.toString())
  })

  it("pauseClaim", async function () {
    const {
      admin,
      stakeProxyContract }
      = await loadFixture(deployFixture)

    await expect(
      stakeProxyContract.connect(admin).pauseClaim()
    ).to.emit(stakeProxyContract, "PauseClaim")

    await expect(
      stakeProxyContract.connect(admin).unpauseClaim()
    ).to.emit(stakeProxyContract, "UnpauseClaim")
  })

  it("setStartBlock", async function () {
    const {
      admin,
      stakeProxyContract }
      = await loadFixture(deployFixture)

    await expect(
       stakeProxyContract.connect(admin).setStartBlock(20)
    ).to.emit(stakeProxyContract, "SetStartBlock")
  })

  it("SetEndBlock", async function () {
    const {
      admin,
      stakeProxyContract }
      = await loadFixture(deployFixture)

    await expect(
       stakeProxyContract.connect(admin).setEndBlock(300)
    ).to.emit(stakeProxyContract, "SetEndBlock")
  })

   it("SetMetaNodePerBlock", async function () {
    const {
      admin,
      stakeProxyContract }
      = await loadFixture(deployFixture)

    await expect(
       stakeProxyContract.connect(admin).setMetaNodePerBlock(30000000)
    ).to.emit(stakeProxyContract, "SetMetaNodePerBlock")
  })
})