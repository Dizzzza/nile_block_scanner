const { DataTypes } = require("sequelize")
const { sequelize } = require("../database/connection")

const Tx = sequelize.define(
  "Tx",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    network_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    token_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    block: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    value: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    value_txt: {
      type: DataTypes.STRING,
    },
    hash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    tx_fee: {
      type: DataTypes.STRING,
    },
    tx_fee_txt: {
      type: DataTypes.STRING,
    },
    from_address: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    to_address: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    ts: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    info: {
      type: DataTypes.STRING,
    },
  },
  {
    tableName: "txes",
    timestamps: false,
    indexes: [
      {
        fields: ["hash"],
      },
      {
        fields: ["from_address"],
      },
      {
        fields: ["to_address"],
      },
      {
        fields: ["block"],
      },
    ],
  },
)

module.exports = Tx
