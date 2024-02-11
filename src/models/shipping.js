const { Model, DataTypes } = require("sequelize");

module.exports = function (sequelize) {
  class Shipping extends Model {
    static associate(models) {
      Shipping.belongsTo(models.User, { foreignKey: "userId", as: "user" });
      Shipping.belongsTo(models.Cart, { foreignKey: "cartId", as: "cart" });
    }
  }
  Shipping.init(
    {
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "User",
          key: "id",
        },
      },
      status: {
        type: DataTypes.ENUM,
        values: ["pending", "sent", "receivedInBase", "userReceived"],
        defaultValue: "pending",
        allowNull: false,
      },
      address: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      deliverTime: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      deliveryCode: {
        type: DataTypes.INTEGER,
        unique: true,
        allowNull: false,
      },
      cartId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Cart",
          key: "id",
        },
      },
      shippingFee: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "Shipping",
      freezeTableName: true,
      timestamps: true,
    },
  );

  return Shipping;
};
