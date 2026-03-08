## MetaNodeStake 架构说明
MetaNodeStake 是一个基于 UUPSUpgradeable + AccessControl 的多池质押挖矿合约，支持 ETH 与 ERC20 两类质押资产。

### 核心特性
- 支持多 Pool 权重分配
- 按区块发放 MetaNode 奖励
- 使用 accMetaNodePerST 模型累计池子奖励
- 使用 finishedMetaNode / pendingMetaNode 结算用户奖励
- 支持 unstake 后锁仓，再 withdraw 提现
- 支持 claim / withdraw 独立暂停
- 支持 UUPS 升级

### 奖励模型
奖励先在 Pool 维度累计到 `accMetaNodePerST`，用户在交互时再根据：
`user.stAmount * pool.accMetaNodePerST - user.finishedMetaNode + user.pendingMetaNode`
计算出当前可领取奖励。

### 质押与提现
- ETH 通过 `depositETH()` 进入 0 号池
- ERC20 通过 `deposit(pid, amount)` 进入对应池
- `unstake()` 只会生成解质押请求，不立即到账
- `withdraw()` 只能提取已经达到 unlockBlocks 的请求金额

### 权限模型
- `ADMIN_ROLE` 负责参数配置、加池、调权重、暂停功能
- `UPGRADE_ROLE` 负责实现合约升级  
![合约流程图](https://github.com/flysnow1231/stake-contract/blob/main/mermaid-diagram.png)


# MetaNode stake contract
这个项目两个坑：
1.存在pckage_lock.json文件
2.没有.env文件。
操作流程以及命令
npx hardhat coverage
## 拉取项目

```zsh
git clone https://github.com/MetaNodeAcademy/Advanced2-contract-stake/tree/main/stake-contract
```

## 安装依赖

```zsh
npm install
```

## 编译

```
npx hardhat compile
```

**注意!!!!** 

`hardhat` 这个库有个巨坑!!! 他自己生成的文件无论你的 solidity 文件叫什么名字, 编译出来统一叫:

`stake-contract/ignition/modules/Rcc.js`

还要自己将其重命名为 `stake-contract/ignition/modules/MetaNode.js` . 差点没被害死╮(╯_╰)╭ AI也查不出来!!!

所以这步完全可以用 Remix 取代!


## 部署 MetaNode token

```zsh
npx hardhat ignition deploy ./ignition/modules/MetaNode.js
```

部署之后在 terminal 拿到合约地址,比如: `0x264e0349deEeb6e8000D40213Daf18f8b3dF02c3`

## 部署完 MetaNode Token,拿以上地址作为 MetaNodeStake 合约的初始化参数,在 MetaNodeStake 中设置

```js
const MetaNodeToken = "0x264e0349deEeb6e8000D40213Daf18f8b3dF02c3";
```

## 将 stake 合约部署到 sepolia 上

```zsh
npx hardhat run scripts/MetaNodeStake.js --network sepolia
```

## 运行资金池函数 `addPool`:

```zsh
npx hardhat run scripts/addPool.js --network sepolia
```
