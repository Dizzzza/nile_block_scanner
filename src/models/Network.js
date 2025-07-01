const { DataTypes } = require("sequelize")
const { sequelize } = require("../database/connection")

const Network = sequelize.define(
  "Network",
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
    network_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    link: {
      type: DataTypes.STRING,
    },
    address_explorer: {
      type: DataTypes.STRING,
    },
    tx_explorer: {
      type: DataTypes.STRING,
    },
    block_explorer: {
      type: DataTypes.STRING,
    },
    status: {
      type: DataTypes.SMALLINT,
      defaultValue: 1,
    },
    scanner_table_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    prefix: {
      type: DataTypes.STRING,
    },
    address_length: {
      type: DataTypes.INTEGER,
    },
    is_hex: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    short_name: {
      type: DataTypes.STRING,
    },
    blackbox_connected: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "networks",
    timestamps: false,
    indexes: [
      {
        fields: ["external_id"],
      },
      {
        fields: ["scanner_table_name"],
      },
    ],
  },
)

module.exports = Network
