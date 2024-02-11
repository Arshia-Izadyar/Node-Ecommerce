const { Model, DataTypes } = require('sequelize')

module.exports = function (sequelize) {
    class CartLines extends Model {
        static associate(models) {
            CartLines.belongsTo(models.Cart, {
                foreignKey: 'cartId',
                as: 'cart',
            })
            CartLines.belongsTo(models.Product, {
                foreignKey: 'productId',
                as: 'product',
            })
        }
    }
    CartLines.init(
        {
            cartId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'Cart',
                    key: 'id',
                },
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
            },
            productId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'Product',
                    key: 'id',
                },
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
            },
            quantity: {
                type: DataTypes.INTEGER,
                defaultValue: 1,
            },
        },
        {
            sequelize,
            modelName: 'CartLines',
            freezeTableName: true,
            timestamps: true,
        }
    )

    return CartLines
}
