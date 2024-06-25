const { HOT_WALLET_MNEMONIC } = require('../src/config')
const Wallet = require('../src/Wallet')
// Sample script to generate multiple wallets:

const { ethers } = require('ethers')

const wallet = ethers.Wallet.fromPhrase(HOT_WALLET_MNEMONIC)
// const wallet = ethers.Wallet.createRandom()

console.log('main wallet:', wallet)

const words = wallet.mnemonic.phrase
console.log('mnemonic:', words)

const account1 = wallet.deriveChild(1)
console.log(`Address: ${account1.address}, private key: ${account1.privateKey}`)

const account2 = wallet.deriveChild(2)
console.log(`Address: ${account2.address}, private key: ${account2.privateKey}`)

// testing sending a tx:

;(async () => {
  
  const wallet = new Wallet(HOT_WALLET_MNEMONIC)

  const balance = await wallet.getErc20Balance(account1.address)
  console.log('ERC20 balance:', balance)
  const ethBalance = await wallet.getBalance(account1.address)
  console.log('ETH balance:', ethBalance)

  if (balance || ethBalance) {
    const txs = await wallet.transferAllToColdWallet({ privateKey: account1.privateKey })
    console.log('sent tx:', txs)
  }

})();
