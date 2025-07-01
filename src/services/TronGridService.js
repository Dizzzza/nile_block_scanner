const axios = require("axios")
const config = require("../config")
const logger = require("../utils/logger")
const TronWeb = require('tronweb')

class TronGridService {
  constructor() {
    this.apiUrl = config.tronGrid.apiUrl
    this.apiKey = config.tronGrid.apiKey
    this.timeout = config.tronGrid.timeout

    this.client = axios.create({
      baseURL: this.apiUrl,
      timeout: this.timeout,
      headers: {
        "TRON-PRO-API-KEY": this.apiKey,
      },
    })
  }

  async getLatestBlock() {
    try {
      const response = await this.client.get("/walletsolidity/getnowblock")
      return response.data
    } catch (error) {
      logger.error("Error getting latest block:", error.message)
      throw error
    }
  }

  async getBlockByNumber(blockNumber) {
    try {
      const response = await this.client.post("/walletsolidity/getblockbynum", {
        num: blockNumber,
      })
      return response.data
    } catch (error) {
      logger.error(`Error getting block ${blockNumber}:`, error.message)
      throw error
    }
  }

  async getAccount(address) {
    try {
      const response = await this.client.post("/walletsolidity/getaccount", {
        address: address,
        visible: true,
      })
      return response.data
    } catch (error) {
      logger.error(`Error getting account ${address}:`, error.message)
      throw error
    }
  }

  async getTRC20Balance(contractAddress, ownerAddress) {
    try {
      const response = await this.client.post("/wallet/triggerconstantcontract", {
        owner_address: ownerAddress,
        contract_address: contractAddress,
        function_selector: "balanceOf(address)",
        parameter: this.encodeAddress(ownerAddress),
        visible: true,
      })

      if (response.data.result && response.data.result.result) {
        const hexBalance = response.data.constant_result[0]
        return Number.parseInt(hexBalance, 16).toString()
      }
      return "0"
    } catch (error) {
      logger.error(`Error getting TRC20 balance for ${ownerAddress}:`, error.message)
      return "0"
    }
  }

  encodeAddress(address) {
    // Простое кодирование адреса для TRC20 вызовов
    const cleanAddress = TronWeb.address.toHex(address)
    return cleanAddress.padStart(64, "0")
  }

  async getTransactionInfo(txHash) {
    try {
      const response = await this.client.post("/walletsolidity/gettransactioninfobyid", {
        value: txHash,
      })
      return response.data
    } catch (error) {
      logger.error(`Error getting transaction info ${txHash}:`, error.message)
      throw error
    }
  }

  async getTRC10Balance(tokenId, ownerAddress) {
    try {
      const response = await this.client.post("/walletsolidity/getaccount", {
        address: ownerAddress,
        visible: true,
      })

      if (response.data && response.data.assetV2) {
        // Ищем баланс конкретного TRC10 токена
        const asset = response.data.assetV2.find((asset) => asset.key === tokenId)
        return asset ? asset.value.toString() : "0"
      }

      // Fallback для старого формата
      if (response.data && response.data.asset) {
        const asset = response.data.asset.find((asset) => asset.key === tokenId)
        return asset ? asset.value.toString() : "0"
      }

      return "0"
    } catch (error) {
      logger.error(`Error getting TRC10 balance for ${ownerAddress}, token ${tokenId}:`, error.message)
      return "0"
    }
  }
}

module.exports = new TronGridService()
