const express = require('express')
const router = express.Router()
const transactionProcessor = require('../services/TransactionProcessor')
const { Address } = require('../models')
const config = require('../config')
const logger = require('../utils/logger')

// Получить список отслеживаемых адресов
router.get('/addresses', async (req, res) => {
  try {
    const monitoredAddresses = transactionProcessor.getMonitoredAddresses()
    
    const addresses = await Address.findAll({
      where: {
        network_id: config.network.id,
        is_monitoring: true,
      },
      attributes: ['id', 'address', 'ts_add', 'is_monitoring']
    })

    res.json({
      success: true,
      data: {
        count: monitoredAddresses.length,
        addresses: addresses,
        active_monitoring: monitoredAddresses
      }
    })
  } catch (error) {
    logger.error('Error getting monitored addresses:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get monitored addresses'
    })
  }
})

// Перезагрузить список отслеживаемых адресов
router.post('/reload', async (req, res) => {
  try {
    const count = await transactionProcessor.reloadMonitoredAddresses()
    
    res.json({
      success: true,
      message: `Reloaded ${count} monitored addresses`,
      count: count
    })
  } catch (error) {
    logger.error('Error reloading monitored addresses:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to reload monitored addresses'
    })
  }
})

// Включить/выключить мониторинг для адреса
router.patch('/addresses/:address/toggle', async (req, res) => {
  try {
    const { address } = req.params
    const { is_monitoring } = req.body

    const addressRecord = await Address.findOne({
      where: {
        address: address,
        network_id: config.network.id
      }
    })

    if (!addressRecord) {
      return res.status(404).json({
        success: false,
        error: 'Address not found'
      })
    }

    await addressRecord.update({ is_monitoring })

    if (is_monitoring) {
      transactionProcessor.addMonitoredAddress(address)
    } else {
      transactionProcessor.removeMonitoredAddress(address)
    }

    res.json({
      success: true,
      message: `Monitoring ${is_monitoring ? 'enabled' : 'disabled'} for address ${address}`,
      data: {
        address: address,
        is_monitoring: is_monitoring
      }
    })
  } catch (error) {
    logger.error('Error toggling address monitoring:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to toggle address monitoring'
    })
  }
})

module.exports = router