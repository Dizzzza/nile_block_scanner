const { DataTypes } = require("sequelize")
const { sequelize } = require("../database/connection")

class ScannedBlocksFactory {
  constructor() {
    this.models = new Map()
  }

  getModel(tableName) {
    if (!this.models.has(tableName)) {
      const model = sequelize.define(
        `ScannedBlocks_${tableName}`,
        {
          id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
          },
          num: {
            type: DataTypes.BIGINT,
            allowNull: false,
            unique: true,
          },
          hash: {
            type: DataTypes.STRING(64),
            allowNull: false,
          },
        },
        {
          tableName: tableName,
          timestamps: false,
          indexes: [
            {
              fields: ["num"],
            },
          ],
        },
      )

      this.models.set(tableName, model)
    }

    return this.models.get(tableName)
  }

  async createTableIfNotExists(tableName) {
    try {
      const model = this.getModel(tableName)
      await model.sync({ alter: false })
    } catch (error) {
      console.error(`Error creating table ${tableName}:`, error)
    }
  }
}

module.exports = new ScannedBlocksFactory()
