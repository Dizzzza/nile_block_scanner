const tronGridService = require("./TronGridService")
const transactionProcessor = require("./TransactionProcessor")
const networkService = require("./NetworkService")
const scannedBlocksFactory = require("../models/ScannedBlocks")
const config = require("../config")
const logger = require("../utils/logger")

class BlockScanner {
  constructor() {
    this.isScanning = false
    this.currentBlock = 0
    this.latestBlock = 0
    this.scanInterval = config.scanner.interval
    this.batchSize = config.scanner.batchSize
    this.maxRetries = config.scanner.maxRetries
    this.retryDelay = config.scanner.retryDelay
    this.scannedBlocksModel = null
    this.scannerTableName = null
  }

  async start() {
    if (this.isScanning) {
      logger.warn("Scanner is already running")
      return
    }

    logger.info("Starting block scanner...")

    try {
      // Инициализируем сетевой сервис
      await networkService.initialize()
      this.scannerTableName = networkService.getScannerTableName()

      // Получаем модель для таблицы отсканированных блоков
      this.scannedBlocksModel = scannedBlocksFactory.getModel(this.scannerTableName)

      // Создаем таблицу если не существует
      await scannedBlocksFactory.createTableIfNotExists(this.scannerTableName)

      this.isScanning = true

      // Получаем последний отсканированный блок
      await this.initializeStartBlock()

      // Запускаем основной цикл сканирования
      this.scanLoop()
    } catch (error) {
      logger.error("Error starting block scanner:", error)
      throw error
    }
  }

  async stop() {
    logger.info("Stopping block scanner...")
    this.isScanning = false
  }

  async initializeStartBlock() {
    try {
      const lastScannedBlock = await this.scannedBlocksModel.findOne({
        order: [["num", "DESC"]],
      })

      if (lastScannedBlock) {
        // Проверяем, есть ли пропуски в отсканированных блоках
        const nextBlock = Number.parseFloat(lastScannedBlock.num) + 1

        // Проверяем несколько блоков назад на случай пропусков
        let startFromBlock = nextBlock
        for (let i = 1; i <= 10; i++) {
          const checkBlock = Number.parseFloat(lastScannedBlock.num) - i
          if (checkBlock < 0) break

          const exists = await this.scannedBlocksModel.findOne({
            where: { num: checkBlock },
          })

          if (!exists) {
            startFromBlock = checkBlock
            logger.info(`Found gap at block ${checkBlock}, will start from there`)
          }
        }

        this.currentBlock = startFromBlock
        logger.info(`Resuming from block ${this.currentBlock} (table: ${this.scannerTableName})`)
      } else {
        this.currentBlock = config.scanner.startBlock
        logger.info(`Starting from configured block ${this.currentBlock} (table: ${this.scannerTableName})`)
      }
    } catch (error) {
      logger.error("Error initializing start block:", error)
      this.currentBlock = config.scanner.startBlock
    }
  }

  async scanLoop() {
    while (this.isScanning) {
      try {
        await this.scanBlocks()
        await this.sleep(this.scanInterval)
      } catch (error) {
        logger.error("Error in scan loop:", error)
        await this.sleep(this.retryDelay)
      }
    }
  }

  async scanBlocks() {
    try {
      // Получаем последний блок в сети
      const latestBlockData = await tronGridService.getLatestBlock()
      this.latestBlock = latestBlockData.block_header.raw_data.number

      if (this.currentBlock > this.latestBlock) {
        // Мы опережаем сеть, ждем
        return
      }

      const blocksToScan = Math.min(this.batchSize, this.latestBlock - this.currentBlock + 1)

      logger.info(
        `Scanning blocks ${this.currentBlock} to ${this.currentBlock + blocksToScan - 1} (${this.scannerTableName})`,
      )

      for (let i = 0; i < blocksToScan; i++) {
        const blockNumber = Number.parseFloat(this.currentBlock) + i
        await this.scanBlock(blockNumber)
      }

      this.currentBlock += blocksToScan
    } catch (error) {
      logger.error("Error scanning blocks:", error)
      throw error
    }
  }

  async scanBlock(blockNumber) {
    let retries = 0

    while (retries < this.maxRetries) {
      try {
        // Проверяем, не был ли блок уже отсканирован
        const existingBlock = await this.scannedBlocksModel.findOne({
          where: { num: blockNumber },
        })

        if (existingBlock) {
          logger.debug(`Block ${blockNumber} already scanned, skipping (${this.scannerTableName})`)
          return
        }

        const blockData = await tronGridService.getBlockByNumber(blockNumber)

        if (!blockData || !blockData.blockID) {
          logger.warn(`Block ${blockNumber} not found`)
          return
        }

        // Обрабатываем транзакции в блоке
        if (blockData.transactions && blockData.transactions.length > 0) {
          await transactionProcessor.processBlockTransactions(blockData)
        }

        // Используем findOrCreate для безопасной вставки
        const [scannedBlock, created] = await this.scannedBlocksModel.findOrCreate({
          where: { num: blockNumber },
          defaults: {
            num: blockNumber,
            hash: blockData.blockID,
          },
        })

        if (created) {
          logger.debug(`Block ${blockNumber} scanned successfully (${this.scannerTableName})`)
        } else {
          logger.debug(`Block ${blockNumber} was already scanned by another process (${this.scannerTableName})`)
        }

        return
      } catch (error) {
        retries++

        // Если это ошибка уникального ограничения, просто пропускаем блок
        if (error.name === "SequelizeUniqueConstraintError") {
          logger.debug(`Block ${blockNumber} already exists, skipping (${this.scannerTableName})`)
          return
        }

        logger.error(`Error scanning block ${blockNumber} (attempt ${retries}):`, error.message)

        if (retries < this.maxRetries) {
          await this.sleep(this.retryDelay)
        } else {
          throw error
        }
      }
    }
  }

  async sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  async getLastScannedBlock() {
    if (!this.scannedBlocksModel) {
      return null
    }

    try {
      return await this.scannedBlocksModel.findOne({
        order: [["num", "DESC"]],
      })
    } catch (error) {
      logger.error("Error getting last scanned block:", error)
      return null
    }
  }

  getStatus() {
    return {
      isScanning: this.isScanning,
      currentBlock: this.currentBlock,
      latestBlock: this.latestBlock,
      blocksRemaining: Math.max(0, this.latestBlock - this.currentBlock),
      scanInterval: this.scanInterval,
      batchSize: this.batchSize,
      scannerTableName: this.scannerTableName,
      networkInfo: networkService.getNetworkInfo(),
    }
  }
}

module.exports = new BlockScanner()
