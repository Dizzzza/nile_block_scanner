const express = require("express")
const blockScanner = require("../services/BlockScanner")
const networkService = require("../services/NetworkService")
const { Address } = require("../models")
const config = require("../config")

const router = express.Router()

// Получить статус сервиса
router.get("/", async (req, res) => {
  try {
    const scannerStatus = blockScanner.getStatus()
    const lastScannedBlock = await blockScanner.getLastScannedBlock()

    const monitoredCount = await Address.count({
      where: {
        network_id: config.network.id,
        is_monitoring: true,
      },
    })

    res.json({
      service: process.env.SERVICE_NAME,
      version: process.env.VERSION,
      network: scannerStatus.networkInfo,
      scanner: {
        isScanning: scannerStatus.isScanning,
        currentBlock: scannerStatus.currentBlock,
        latestBlock: scannerStatus.latestBlock,
        blocksRemaining: scannerStatus.blocksRemaining,
        scanInterval: scannerStatus.scanInterval,
        batchSize: scannerStatus.batchSize,
        scannerTableName: scannerStatus.scannerTableName,
        lastScannedBlock: lastScannedBlock ? lastScannedBlock.num : null,
        lastScannedHash: lastScannedBlock ? lastScannedBlock.hash : null,
      },
      monitoring: {
        addressCount: monitoredCount,
      },
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error getting status:", error)
    res.status(500).json({ error: "Error getting status" })
  }
})

// Получить информацию о сети
router.get("/network", async (req, res) => {
  try {
    const networkInfo = networkService.getNetworkInfo()
    res.json(networkInfo)
  } catch (error) {
    console.error("Error getting network info:", error)
    res.status(500).json({ error: "Error getting network info" })
  }
})

module.exports = router
