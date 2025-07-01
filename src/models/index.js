const Address = require("./Address")
const Balance = require("./Balance")
const Token = require("./Token")
const Network = require("./Network")
const scannedBlocksFactory = require("./ScannedBlocks")
const Tx = require("./Tx")

// Определяем связи между моделями
Address.hasMany(Balance, { foreignKey: "address_id" })
Balance.belongsTo(Address, { foreignKey: "address_id" })

Token.hasMany(Balance, { foreignKey: "token_id" })
Balance.belongsTo(Token, { foreignKey: "token_id" })

Token.hasMany(Tx, { foreignKey: "token_id" })
Tx.belongsTo(Token, { foreignKey: "token_id" })

Network.hasMany(Token, { foreignKey: "network_id" })
Token.belongsTo(Network, { foreignKey: "network_id" })

Network.hasMany(Address, { foreignKey: "network_id" })
Address.belongsTo(Network, { foreignKey: "network_id" })

module.exports = {
  Address,
  Balance,
  Token,
  Network,
  scannedBlocksFactory,
  Tx,
}
