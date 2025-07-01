const { Sequelize } = require("sequelize")
const config = require("../config")
const logger = require("../utils/logger")

const sequelize = new Sequelize(config.database.url, {
  dialect: config.database.dialect,
  logging: config.database.logging,
  pool: config.database.pool,
})

const testConnection = async () => {
  try {
    await sequelize.authenticate()
    logger.info("Database connection established successfully")
  } catch (error) {
    logger.error("Unable to connect to database:", error)
    process.exit(1)
  }
}

module.exports = { sequelize, testConnection }
