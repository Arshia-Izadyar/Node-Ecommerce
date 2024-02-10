// product -> productCategory
const {Model, DataTypes} = require('sequelize');



module.exports = function(sequelize) {

    class Product extends Model {
        static associate(models){
            Product.belongsTo(models.ProductCategory, {foreignKey: 'categoryId', as: 'category'})
            Product.hasMany(models.Review, {foreignKey: 'productId', as: 'reviews'})
            Product.belongsToMany(models.Provider, {through: 'ProductProvider', foreignKey: 'productId', as: 'providers'})
            Product.hasMany(models.CartLines, {foreignKey: 'productId', as: 'cartLines'})
        }
    }
    Product.init({
        name: {
            type :DataTypes.STRING,
            allowNull: false,
            validate: {
                len: [5, 100]
            }
        },
        slug: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        price: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            validate: {
                min: {args: [0], msg: 'lowestPrice is 0'}
            }
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        image: {
            type: DataTypes.JSON,
            allowNull: true
        },
        off_percent: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        available: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        categoryId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references:{
                model: 'ProductCategory',
                key: 'id'
            }
        }
    }, {sequelize, modelName: 'Product', freezeTableName: true, timestamps: true})
    return Product
}


