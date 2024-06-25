const assert = require('assert')
const { ethers } = require('ethers')
const { DEDO_CONTRACT_ADDRESS, HOT_WALLET_MNEMONIC, COLD_WALLET_ADDRESS, RPC_URL } = require('./config')
const GENERIC_ERC20_ABI = require('./utils/erc20.abi.json')

const MIN_CONFIRMATIONS = 1
const CONFIRMATION_TIMEOUT = 120_000 // 2 min

class Wallet {
  constructor(mnemonic) {
    this.ethersWallet = ethers.Wallet.fromPhrase(mnemonic || HOT_WALLET_MNEMONIC)
    this.provider = new ethers.JsonRpcProvider(RPC_URL)
    this.contract = new ethers.Contract(DEDO_CONTRACT_ADDRESS, GENERIC_ERC20_ABI, this.provider)
  }

  async getHotWalletAddress() {
    // main wallet, used as hot wallet and faucet to send ETH to top-up child wallets (to pay fees for ERC20 transfer)
    return this.ethersWallet.getAddress()
  }

  getHotWalletPrivateKey() {
    return this.ethersWallet.privateKey
  }

  getWalletFromMnemonic(mnemonic) {
    return ethers.Wallet.fromPhrase(mnemonic || HOT_WALLET_MNEMONIC)
  }

  getAddressFromChildIndex(index) {
    assert.ok(Number.isInteger(index), 'wallet childId must be an integer')
    const account = this.ethersWallet.deriveChild(index)
    return account.address
  }

  getPrivateKeyFromChildIndex(index) {
    assert.ok(Number.isInteger(index), 'wallet childId must be an integer')
    const account = this.ethersWallet.deriveChild(index)
    return account.privateKey
  }

  getAddressFromPrivateKey(privateKey) {
    assert.ok(privateKey, 'privateKey is mandatory')
    const wallet = new ethers.Wallet(privateKey)
    return wallet.address
  }

  isValidAddress(address) {
    try {
      ethers.getAddress(address)
      return true
    } catch (err) {
      return false
    }
  }

  throwOnInvalidAddress(address) {
    return ethers.getAddress(address)
  }

  async sendErc20Transaction ({ privateKey, to, amount }) {
    assert.ok(amount, 'amount is mandatory')
    const signer = new ethers.Wallet(privateKey, this.provider)
    const contract = new ethers.Contract(DEDO_CONTRACT_ADDRESS, GENERIC_ERC20_ABI, signer) // re-instantiate because we need to use signer with privateKey

    const tx = await contract.transfer(to || COLD_WALLET_ADDRESS, amount)
    return tx
  }

  async sendTransaction ({ privateKey, to, amount, gasPrice }) {
    assert.ok(amount, 'amount is mandatory')
    const signer = new ethers.Wallet(privateKey, this.provider)

    // transfer ETH
    const tx = await signer.sendTransaction({
      to: to || COLD_WALLET_ADDRESS,
      value: amount, // in DEDO unit (BigInt)
      gasPrice,
      gasLimit: BigInt(21000) // fixed
    })
    return tx
  }

  async getErc20Balance (address) {
    const balance = await this.contract.balanceOf(address)
    return balance // BigInt
  }

  async getBalance (address) {
    const balance = await this.provider.getBalance(address)
    return balance // BigInt
  }

  async getGasPrice() {
    const feeData = await this.provider.getFeeData()
    return feeData.gasPrice
  }

  getFee({ gasPrice = BigInt(0) }) {
    gasPrice = gasPrice || ethers.parseUnits('1.500000007', 'gwei') // fixed default
    const gasLimit = BigInt(21000) // fixed
    return gasPrice * gasLimit
  }

  async waitForConfirmation(txId) {
    return this.provider.waitForTransaction(txId, MIN_CONFIRMATIONS, CONFIRMATION_TIMEOUT)
  }

  async transferAllToColdWallet({ privateKey }) {
    // transfer all the token balance to the cold wallet address + remaining ETH left from fees
    assert.ok(privateKey, 'privateKey is mandatory')
    const address = this.getAddressFromPrivateKey(privateKey)

    const erc20Balance = await this.getErc20Balance(address)
    // All amount. Fees are paid in ETH
    let erc20Tx = null
    if (erc20Balance) erc20Tx = await this.sendErc20Transaction({ privateKey, to: COLD_WALLET_ADDRESS, amount: erc20Balance })
    // wait for confirmation.
    if (erc20Tx) await this.waitForConfirmation(erc20Tx.hash)
    const ethBalance = await this.getBalance(address)
    const gasPrice = await this.getGasPrice()
    const amount = ethBalance - this.getFee({ gasPrice }) // ETH
    let ethTx = null
    if (ethBalance) ethTx = await this.sendTransaction({ privateKey, to: COLD_WALLET_ADDRESS, gasPrice, amount })
    return [erc20Tx, ethTx]
  }

}

module.exports = Wallet
