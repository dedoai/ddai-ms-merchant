const { HOT_WALLET_MNEMONIC } = require('../src/config')
const Wallet = require('../src/Wallet')

// testing getErc20Balance:

;(async () => {
  
  const wallet = new Wallet(HOT_WALLET_MNEMONIC)
  const address = '0xE9Cf4e6c8337096Ca76Ece24702aD1EB98639846'

  const balance = await wallet.getErc20Balance(address)
  console.log('balance:', balance)

})();
