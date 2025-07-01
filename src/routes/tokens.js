const express = require("express")
const { Token } = require("../models")
const config = require("../config")
const logger = require("../utils/logger")

const router = express.Router()

// Получить список всех токенов
router.get("/", async (req, res) => {
  try {
    const { standard } = req.query

    const whereClause = {
      network_id: config.network.id,
    }

    if (standard) {
      whereClause.standard = standard
    }

    const tokens = await Token.findAll({
      where: whereClause,
      order: [["symbol", "ASC"]],
    })

    res.json({
      count: tokens.length,
      tokens: tokens.map((token) => ({
        id: token.id,
        symbol: token.symbol,
        name: token.name,
        standard: token.standard,
        decimals: token.decimals,
        contract: token.contract,
        token_key: token.token_key,
      })),
    })
  } catch (error) {
    logger.error("Error getting tokens:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// Получить информацию о конкретном токене
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params

    const token = await Token.findOne({
      where: {
        id: id,
        network_id: config.network.id,
      },
    })

    if (!token) {
      return res.status(404).json({ error: "Token not found" })
    }

    res.json({
      id: token.id,
      external_id: token.external_id,
      symbol: token.symbol,
      name: token.name,
      standard: token.standard,
      decimals: token.decimals,
      contract: token.contract,
      token_key: token.token_key,
      mechanism: token.mechanism,
      token_rate_to_usd: token.token_rate_to_usd,
    })
  } catch (error) {
    logger.error("Error getting token info:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// Добавить новый токен
router.post("/", async (req, res) => {
  try {
    const { external_id, symbol, name, standard, decimals = 6, contract, token_key, mechanism = "api" } = req.body

    if (!symbol || !name || !standard) {
      return res.status(400).json({
        error: "Required fields: symbol, name, standard",
      })
    }

    if (standard === "trc20" && !contract) {
      return res.status(400).json({
        error: "Contract address is required for TRC20 tokens",
      })
    }

    if (standard === "trc10" && !token_key) {
      return res.status(400).json({
        error: "Token key is required for TRC10 tokens",
      })
    }

    const token = await Token.create({
      external_id,
      network_id: config.network.id,
      symbol,
      name,
      standard,
      decimals,
      contract,
      token_key,
      mechanism,
    })

    logger.info(`Added new token: ${symbol} (${standard})`)

    res.status(201).json({
      success: true,
      message: "Token added successfully",
      token: {
        id: token.id,
        symbol: token.symbol,
        name: token.name,
        standard: token.standard,
      },
    })
  } catch (error) {
    logger.error("Error adding token:", error)
    if (error.name === "SequelizeUniqueConstraintError") {
      res.status(400).json({ error: "Token already exists" })
    } else {
      res.status(500).json({ error: "Internal server error" })
    }
  }
})

module.exports = router
