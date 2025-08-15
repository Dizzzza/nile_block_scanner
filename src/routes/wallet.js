const express = require("express")
const { Address, Balance, Token } = require("../models")
const tronGridService = require("../services/TronGridService")
const transactionProcessor = require("../services/TransactionProcessor")
const config = require("../config")
const logger = require("../utils/logger")

const router = express.Router()

// Добавить кошелек в мониторинг
router.post("/monitor", async (req, res) => {
  try {
    const { address } = req.body

    if (!address) {
      return res.status(400).json({ error: "Address is required" })
    }

    // Проверяем валидность адреса
    if (!address.startsWith(process.env.ADDRESS_PREFIX) || address.length !== Number(process.env.ADDRESS_LENGTH)) {
      return res.status(400).json({ error: "Invalid TRON address format" })
    }

    // Проверяем, существует ли уже такой адрес
    let addressRecord = await Address.findOne({
      where: { address: address },
    })

    if (addressRecord) {
      if (addressRecord.is_monitoring) {
        return res.status(400).json({ error: "Address is already being monitored" })
      } else {
        // Возобновляем мониторинг
        await addressRecord.update({ is_monitoring: true })
      }
    } else {
      // Создаем новую запись
      addressRecord = await Address.create({
        network_id: config.network.id,
        address: address,
        is_monitoring: true,
      })
    }

    // Добавляем адрес в процессор транзакций
    transactionProcessor.addMonitoredAddress(address, addressRecord.address_b)

    // Получаем начальные балансы
    await updateAddressBalances(addressRecord)

    logger.info(`Started monitoring address: ${address}`)

    res.json({
      success: true,
      message: "Address added to monitoring",
      address: address,
      id: addressRecord.id,
    })
  } catch (error) {
    logger.error("Error adding address to monitoring:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// Удалить кошелек из мониторинга
router.post("/stopMonitor", async (req, res) => {
  try {
    const { address } = req.body

    const addressRecord = await Address.findOne({
      where: { address: address },
    })

    if (!addressRecord) {
      return res.status(404).json({ error: "Address not found" })
    }

    await Promise.all([
      addressRecord.update({ is_monitoring: false }),
      transactionProcessor.removeMonitoredAddress(address, addressRecord.address_b)
    ])

    logger.info(`Stopped monitoring address: ${address}`)

    res.json({
      success: true,
      message: "Address removed from monitoring",
      address: address,
    })
  } catch (error) {
    logger.error("Error removing address from monitoring:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// Получить информацию о кошельке
router.get("/info/:address", async (req, res) => {
  try {
    const { address } = req.params

    const addressRecord = await Address.findOne({
      where: { address: address },
      include: [
        {
          model: Balance,
          include: [Token],
        },
      ],
    })

    if (!addressRecord) {
      return res.status(404).json({ error: "Address not found" })
    }

    const balances = addressRecord.Balances.map((balance) => ({
      token: {
        id: balance.Token.id,
        symbol: balance.Token.symbol,
        name: balance.Token.name,
        decimals: balance.Token.decimals,
        standard: balance.Token.standard,
      },
      balance: balance.balance,
      updated_at: balance.updated_at,
    }))

    res.json({
      address: addressRecord.address,
      network_id: addressRecord.network_id,
      is_monitoring: addressRecord.is_monitoring,
      ts_add: addressRecord.ts_add,
      balances: balances,
    })
  } catch (error) {
    logger.error("Error getting address info:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// Получить список отслеживаемых кошельков
router.get("/monitored", async (req, res) => {
  try {
    const addresses = await Address.findAll({
      where: {
        network_id: config.network.id,
        is_monitoring: true,
      },
      include: [
        {
          model: Balance,
          include: [Token],
        },
      ],
      order: [["ts_add", "DESC"]],
    })

    const result = addresses.map((addr) => ({
      id: addr.id,
      address: addr.address,
      ts_add: addr.ts_add,
      balances: addr.Balances.map((balance) => ({
        token: {
          symbol: balance.Token.symbol,
          name: balance.Token.name,
          decimals: balance.Token.decimals,
        },
        balance: balance.balance,
        updated_at: balance.updated_at,
      })),
    }))

    res.json({
      count: result.length,
      addresses: result,
    })
  } catch (error) {
    logger.error("Error getting monitored addresses:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// Обновить балансы кошелька вручную
router.post("/refresh/:address", async (req, res) => {
  try {
    const { address } = req.params

    const addressRecord = await Address.findOne({
      where: { address: address },
    })

    if (!addressRecord) {
      return res.status(404).json({ error: "Address not found" })
    }

    await updateAddressBalances(addressRecord)

    res.json({
      success: true,
      message: "Balances updated",
      address: address,
    })
  } catch (error) {
    logger.error("Error refreshing balances:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// Вспомогательная функция для обновления балансов
async function updateAddressBalances(addressRecord) {
  try {
    const tokens = await Token.findAll({
      where: { network_id: config.network.id },
    })

    for (const token of tokens) {
      await transactionProcessor.updateBalance(addressRecord.address, token)
    }
  } catch (error) {
    logger.error("Error updating address balances:", error)
  }
}

module.exports = router
