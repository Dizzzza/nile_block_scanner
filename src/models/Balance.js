const { DataTypes } = require("sequelize")
const { sequelize } = require("../database/connection")

const Balance = sequelize.define(
  "Balance",
  {
    address_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: "addresses",
        key: "id",
      },
    },
    token_id: {
      type: DataTypes.SMALLINT,
      primaryKey: true,
      references: {
        model: "tokens",
        key: "id",
      },
    },
    balance: {
      type: DataTypes.DECIMAL(39, 0),
      defaultValue: 0,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "balances",
    timestamps: false,
    indexes: [
      {
        fields: ["address_id"],
      },
      {
        fields: ["token_id"],
      },
    ],
  },
)

module.exports = Balance
