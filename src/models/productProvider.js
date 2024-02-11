const { Model, DataTypes } = require('sequelize')

module.exports = function (sequelize) {
    class ProductProvider extends Model {}
    ProductProvider.init(
        {
            productId: {
                type: DataTypes.INTEGER,
                references: {
                    model: 'Product',
                    key: 'id',
                },
            },
            providerId: {
                type: DataTypes.INTEGER,
                references: {
                    model: 'Provider',
                    key: 'id',
                },
            },
        },
        {
            sequelize,
            modelName: 'ProductProvider',
            timestamps: false,
            freezeTableName: true,
        }
    )

    return ProductProvider
}
