const express = require("express")
const cors = require("cors")
const helmet = require("helmet")
const rateLimit = require("express-rate-limit")
const { testConnection } = require("./database/connection")
const blockScanner = require("./services/BlockScanner")
const config = require("./config")
const logger = require("./utils/logger")

// Routes
const walletRoutes = require("./routes/wallet")
const statusRoutes = require("./routes/status")
const tokenRoutes = require("./routes/tokens")
const monitoringRoutes = require("./routes/monitoring")

const app = express()

// Middleware
app.use(helmet())
app.use(cors())
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true }))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
})
app.use("/api/", limiter)

// Routes
app.use("/api/wallet", walletRoutes)
app.use("/api/status", statusRoutes)
app.use("/api/tokens", tokenRoutes)
app.use("/api/monitoring", monitoringRoutes)

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  })
})

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error("Unhandled error:", err)
  res.status(500).json({ error: "Internal server error" })
})

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" })
})

// Graceful shutdown
process.on("SIGTERM", async () => {
  logger.info("SIGTERM received, shutting down gracefully")
  await blockScanner.stop()
  process.exit(0)
})

process.on("SIGINT", async () => {
  logger.info("SIGINT received, shutting down gracefully")
  await blockScanner.stop()
  process.exit(0)
})

// Start server
async function startServer() {
  try {
    logger.info("Starting TRON Wallet Monitor...")

    // Test database connection
    logger.info("Testing database connection...")
    await testConnection()
    logger.info("Database connection successful")

    // Initialize transaction processor (this will load monitored addresses)
    logger.info("Initializing transaction processor...")
    const transactionProcessor = require("./services/TransactionProcessor")
    if (transactionProcessor.initialize) {
      await transactionProcessor.initialize()
    }

    // Start block scanner
    logger.info("Starting block scanner...")
    await blockScanner.start()
    logger.info("Block scanner started successfully")

    // Start HTTP server
    const server = app.listen(config.server.port, () => {
      logger.info(`Server running on port ${config.server.port}`)
      logger.info(`Environment: ${config.server.env}`)
      logger.info(`Network: ${config.network.name} (ID: ${config.network.id})`)
      logger.info("TRON Wallet Monitor is ready!")
    })

    return server
  } catch (error) {
    logger.error("Failed to start server:", error)
    process.exit(1)
  }
}

if (require.main === module) {
  startServer()
}

module.exports = app
