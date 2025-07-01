const { DataTypes } = require("sequelize")
const { sequelize } = require("../database/connection")

const Address = sequelize.define(
  "Address",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    network_id: {
      type: DataTypes.SMALLINT,
      allowNull: false,
    },
    ts_add: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    address_b: {
      type: DataTypes.STRING,
      unique: true,
    },
    is_monitoring: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "addresses",
    timestamps: false,
    indexes: [
      {
        fields: ["address"],
      },
      {
        fields: ["network_id"],
      },
      {
        fields: ["is_monitoring"],
      },
    ],
  },
)

module.exports = Address
