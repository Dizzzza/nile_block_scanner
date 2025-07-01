const Network = require("../models/Network")
const config = require("../config")
const logger = require("../utils/logger")

class NetworkService {
  constructor() {
    this.currentNetwork = null
    this.scannerTableName = null
  }

  async initialize() {
    try {
      this.currentNetwork = await Network.findOne({
        where: {
          id: config.network.id,
        },
      })

      if (!this.currentNetwork) {
        throw new Error(`Network with ID ${config.network.id} not found in database`)
      }

      this.scannerTableName = this.currentNetwork.scanner_table_name

      logger.info(`Initialized network: ${this.currentNetwork.network_name}`)
      logger.info(`Scanner table: ${this.scannerTableName}`)

      return this.currentNetwork
    } catch (error) {
      logger.error("Error initializing network service:", error)
      throw error
    }
  }

  getCurrentNetwork() {
    if (!this.currentNetwork) {
      throw new Error("Network service not initialized. Call initialize() first.")
    }
    return this.currentNetwork
  }

  getScannerTableName() {
    if (!this.scannerTableName) {
      throw new Error("Network service not initialized. Call initialize() first.")
    }
    return this.scannerTableName
  }

  getNetworkInfo() {
    const network = this.getCurrentNetwork()
    return {
      id: network.id,
      name: network.network_name,
      external_id: network.external_id,
      scanner_table_name: network.scanner_table_name,
      address_explorer: network.address_explorer,
      tx_explorer: network.tx_explorer,
      block_explorer: network.block_explorer,
      prefix: network.prefix,
      address_length: network.address_length,
      is_hex: network.is_hex,
      short_name: network.short_name,
    }
  }
}

module.exports = new NetworkService()
