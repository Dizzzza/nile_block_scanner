require("dotenv").config()

module.exports = {
  database: {
    url: process.env.DATABASE_URL,
    dialect: "postgres",
    logging: false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  },

  tronGrid: {
    apiUrl: process.env.TRONGRID_API_URL || "https://nile.trongrid.io",
    apiKey: process.env.TRONGRID_API_KEY,
    timeout: 10000,
  },

  network: {
    id: Number.parseInt(process.env.NETWORK_ID) || 1,
    name: process.env.NETWORK_NAME || "mainnet",
    scannerTableName: process.env.SCANNER_TABLE_NAME || "scanned_blocks",
  },

  scanner: {
    interval: Number.parseInt(process.env.SCAN_INTERVAL) || 3000,
    batchSize: Number.parseInt(process.env.BATCH_SIZE) || 10,
    startBlock: Number.parseInt(process.env.START_BLOCK) || 0,
    maxRetries: Number.parseInt(process.env.MAX_RETRIES) || 3,
    retryDelay: Number.parseInt(process.env.RETRY_DELAY) || 1000,
  },

  server: {
    port: Number.parseInt(process.env.PORT) || 3000,
    env: process.env.NODE_ENV || "development",
  },

  logging: {
    level: process.env.LOG_LEVEL || "false",
  },
}
