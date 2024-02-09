const { Model, DataTypes } = require('sequelize')


module.exports = function(sequelize) {
    class Provider extends Model {
        static associate(models){
            Provider.hasMany(models.Product, {foreignKey: 'providerId', as: 'products'}) 
        }
    }
    Provider.init({
        name: {
            type: DataTypes.STRING,
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
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    }, {
        sequelize, modelName: 'Provider', freezeTableName: true, timestamps: true
    })

    return Provider;
}