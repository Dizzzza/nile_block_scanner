const { DataTypes } = require("sequelize")
const { sequelize } = require("../database/connection")

const Token = sequelize.define(
  "Token",
  {
    id: {
      type: DataTypes.SMALLINT,
      primaryKey: true,
      autoIncrement: true,
    },
    external_id: {
      type: DataTypes.STRING,
      unique: true,
    },
    network_id: {
      type: DataTypes.SMALLINT,
      allowNull: false,
    },
    decimals: {
      type: DataTypes.SMALLINT,
      defaultValue: 6,
    },
    token_key: {
      type: DataTypes.STRING,
    },
    token_asset: {
      type: DataTypes.STRING,
    },
    symbol: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    contract: {
      type: DataTypes.STRING,
    },
    standard: {
      type: DataTypes.ENUM("native", "trc10", "trc20"),
      allowNull: false,
    },
    mechanism: {
      type: DataTypes.ENUM("api", "blackbox"),
      defaultValue: "api",
    },
    token_rate_to_usd: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
  },
  {
    tableName: "tokens",
    timestamps: false,
    indexes: [
      {
        fields: ["network_id"],
      },
      {
        fields: ["contract"],
      },
      {
        fields: ["standard"],
      },
    ],
  },
)

module.exports = Token
