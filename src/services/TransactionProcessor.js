const { Address, Balance, Token, Tx } = require("../models")
const tronGridService = require("./TronGridService")
const config = require("../config")
const logger = require("../utils/logger")
const { address } = require("tronweb")

class TransactionProcessor {
  constructor() {
    this.monitoredAddresses = new Set()
    this.tokens = new Map()

    // Инициализация данных
    this.initialize()
  }

  async initialize() {
    try {
      await this.loadMonitoredAddresses()
      await this.loadTokens()
      logger.info("TransactionProcessor initialized successfully")
    } catch (error) {
      logger.error("Failed to initialize TransactionProcessor:", error)
      throw error
    }
  }

  async loadMonitoredAddresses() {
    try {
      logger.info("Loading monitored addresses from database...")

      const addresses = await Address.findAll({
        where: {
          network_id: config.network.id,
          is_monitoring: true,
        },
      })

      this.monitoredAddresses.clear()
      addresses.forEach((addr) => {
        this.monitoredAddresses.add(addr.address.toLowerCase())
        logger.debug(`Added address to monitoring: ${addr.address}`)
      })

      logger.info(`Successfully loaded ${this.monitoredAddresses.size} monitored addresses`)

      if (this.monitoredAddresses.size === 0) {
        logger.warn("No addresses found for monitoring. Please add addresses to the database with is_monitoring = true")
      }

      return this.monitoredAddresses.size
    } catch (error) {
      logger.error("Error loading monitored addresses:", error)
      throw error
    }
  }

  async loadTokens() {
    try {
      const tokens = await Token.findAll({
        where: {
          network_id: config.network.id,
        },
      })

      this.tokens.clear()
      tokens.forEach((token) => {
        if (token.standard === "native") {
          this.tokens.set("TRX", token)
        } else if (token.standard === "trc20" && token.contract) {
          this.tokens.set(token.contract.toLowerCase(), token)
        } else if (token.standard === "trc10" && token.token_key) {
          // Для TRC10 токенов используем token_key как идентификатор
          this.tokens.set(token.token_asset, token)
        }
      })

      logger.info(`Loaded ${this.tokens.size} tokens`)
    } catch (error) {
      logger.error("Error loading tokens:", error)
    }
  }

  async processBlockTransactions(blockData) {
    if (!blockData.transactions) return

    for (const tx of blockData.transactions) {
      try {
        await this.processTransaction(tx, blockData.block_header.raw_data.number)
      } catch (error) {
        logger.error(`Error processing transaction ${tx.txID}:`, error)
      }
    }
  }

  async processTransaction(tx, blockNumber) {
    const txHash = tx.txID
    const contract = tx.raw_data.contract[0]

    if (!contract) return

    const contractType = contract.type
    const contractData = contract.parameter.value

    let fromAddress = ""
    let toAddress = ""
    let amount = "0"
    let tokenInfo = null

    switch (contractType) {
      case "TransferContract":
        // TRX transfer
        fromAddress = this.hexToBase58(contractData.owner_address)
        toAddress = this.hexToBase58(contractData.to_address)
        amount = contractData.amount.toString()
        tokenInfo = this.tokens.get("TRX")
        break

      case "TransferAssetContract":
        // TRC10 transfer
        fromAddress = this.hexToBase58(contractData.owner_address)
        toAddress = this.hexToBase58(contractData.to_address)
        amount = contractData.amount.toString()
        // Используем asset_name для поиска токена по token_key
        const assetName = contractData.asset_name
        tokenInfo = this.tokens.get(assetName) || this.tokens.get(assetName.toString())
        break

      case "TriggerSmartContract":
        // Potentially TRC20 transfer
        const result = await this.processTRC20Transaction(tx)
        if (result) {
          fromAddress = result.from
          toAddress = result.to
          amount = result.amount
          tokenInfo = result.token
        }
        break

      default:
        return // Неподдерживаемый тип транзакции
    }

    if (!tokenInfo || !fromAddress || !toAddress) return

    // Проверяем, участвуют ли отслеживаемые адреса в транзакции
    const fromMonitored = this.monitoredAddresses.has(fromAddress.toLowerCase())
    const toMonitored = this.monitoredAddresses.has(toAddress.toLowerCase())

    if (!fromMonitored && !toMonitored) return

    // Сохраняем транзакцию
    await this.saveTransaction({
      networkId: config.network.id,
      tokenId: tokenInfo.id,
      block: blockNumber,
      value: amount,
      hash: txHash,
      fromAddress,
      toAddress,
      ts: Math.floor(Date.now() / 1000),
    })

    // Обновляем балансы
    if (fromMonitored) {
      await this.updateBalance(fromAddress, tokenInfo, true)
    }
    if (toMonitored) {
      await this.updateBalance(toAddress, tokenInfo, true)
    }

    logger.info(
      `Processed transaction ${txHash}: ${fromAddress} -> ${toAddress}, amount: ${amount} ${tokenInfo.symbol}`,
    )
  }

  async processTRC20Transaction(tx) {
    try {
      const txInfo = await tronGridService.getTransactionInfo(tx.txID)

      if (!txInfo.log || txInfo.log.length === 0) return null

      // Ищем Transfer event
      const transferLog = txInfo.log.find(
        (log) =>
          log.topics &&
          log.topics.length === 3 &&
          log.topics[0] === "ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
      )

      if (!transferLog) return null

      const contractAddress = this.hexToBase58(txInfo.contract_address)
      const tokenInfo = this.tokens.get(contractAddress.toLowerCase())

      if (!tokenInfo) return null

      const fromAddress = this.hexToBase58("41" + transferLog.topics[1].slice(24))
      const toAddress = this.hexToBase58("41" + transferLog.topics[2].slice(24))
      const amount = Number.parseInt(transferLog.data, 16).toString()

      return {
        from: fromAddress,
        to: toAddress,
        amount,
        token: tokenInfo,
      }
    } catch (error) {
      logger.error("Error processing TRC20 transaction:", error)
      return null
    }
  }

  async saveTransaction(txData) {
    try {
      await Tx.create({
        network_id: txData.networkId,
        token_id: txData.tokenId,
        block: txData.block,
        value: txData.value,
        hash: txData.hash,
        from_address: txData.fromAddress,
        to_address: txData.toAddress,
        ts: txData.ts,
      })
    } catch (error) {
      if (!error.message.includes("duplicate key")) {
        logger.error("Error saving transaction:", error)
      }
    }
  }

  async updateBalance(address, tokenInfo, forceUpdate = false) {
    try {
      const addressRecord = await Address.findOne({
        where: { address: address },
      })

      if (!addressRecord) return

      let newBalance = "0"

      if (tokenInfo.standard === "native") {
        // TRX balance
        const accountInfo = await tronGridService.getAccount(address)
        newBalance = (accountInfo.balance || 0).toString()
      } else if (tokenInfo.standard === "trc20") {
        // TRC20 balance
        newBalance = await tronGridService.getTRC20Balance(tokenInfo.contract, address)
      } else if (tokenInfo.standard === "trc10") {
        // TRC10 balance
        newBalance = await tronGridService.getTRC10Balance(tokenInfo.token_key, address)
      }

      await Balance.upsert({
        address_id: addressRecord.id,
        token_id: tokenInfo.id,
        balance: newBalance / Math.pow(10, tokenInfo.decimals), // 10^decimals
        updated_at: new Date(),
      });

      logger.debug(`Updated balance for ${address}: ${newBalance} ${tokenInfo.symbol}`)
    } catch (error) {
      logger.error(`Error updating balance for ${address}:`, error)
    }
  }

  hexToBase58(hex) {
    // Простая конвертация hex в base58 для TRON адресов
    // В реальном проекте лучше использовать TronWeb
    if (!hex) return ""
    if (hex.length === 42 && hex.startsWith("41")) {
      // Это уже hex адрес, нужно конвертировать в base58
      // Для простоты возвращаем как есть, в реальности нужна полная конвертация
      return address.fromHex(hex)
    }
    return hex
  }

  addMonitoredAddress(address) {
    this.monitoredAddresses.add(address.toLowerCase())
  }

  removeMonitoredAddress(address) {
    this.monitoredAddresses.delete(address.toLowerCase())
  }

  async reloadMonitoredAddresses() {
    logger.info("Reloading monitored addresses...")
    const count = await this.loadMonitoredAddresses()
    return count
  }

  getMonitoredAddresses() {
    return Array.from(this.monitoredAddresses)
  }
}

module.exports = new TransactionProcessor()
