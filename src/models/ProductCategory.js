
const {Model, DataTypes} = require('sequelize');



module.exports = (sequelize) => {
    class ProductCategory extends Model{
        static associate(models){
            ProductCategory.hasMany(models.Product, {foreignKey: 'categoryId', as: 'products'})
        }
    }
    ProductCategory.init({
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                len: [4, 100]
            }
        },
        slug: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
    }, {sequelize, modelName: 'ProductCategory', freezeTableName: true, timestamps: true})
    return ProductCategory
}