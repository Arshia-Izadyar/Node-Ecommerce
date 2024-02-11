const { Model, DataTypes } = require('sequelize')

module.exports = function (sequelize) {
    class Payment extends Model {
        static associate(models) {
            Payment.belongsTo(models.User, { foreignKey: 'userId', as: 'user' })
            Payment.belongsTo(models.Cart, { foreignKey: 'cartId', as: 'cart' })
        }
    }

    Payment.init(
        {
            userId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'User',
                    key: 'id',
                },
            },
            uuid: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                allowNull: false,
            },
            status: {
                type: DataTypes.ENUM,
                values: ['pending', 'paid', 'notPaid'],
                defaultValue: 'pending',
            },
            amount: {
                type: DataTypes.INTEGER,
                allowNull: false,
                validate: {
                    min: [10],
                },
            },
            cartId: {
                type: DataTypes.INTEGER,
                references: {
                    model: 'Cart',
                    key: 'id',
                },
            },
        },
        {
            sequelize,
            modelName: 'Payment',
            freezeTableName: true,
            timestamps: true,
        }
    )

    return Payment
}
