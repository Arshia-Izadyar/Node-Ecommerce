const { Model, DataTypes } = require('sequelize')

module.exports = (sequelize) => {
    class Review extends Model {
        static associate(models) {
            Review.belongsTo(models.Product, {foreignKey: 'productId', as: "product_reviews"})
            Review.belongsTo(models.User, {foreignKey: 'userId', as: "user_reviews"})

        }
    }
    Review.init({
        rate: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                max: {args: [10], msg: 'max rating is "10"'},
                min: {args: [1], msg: 'lowest rating is "1"'}
            }
        },
        comment: {
            type:DataTypes.TEXT,
            allowNull: false,
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'User', 
                key: 'id'
            },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE'
        },
        productId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Product', 
                key: 'id'
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        },
        image: {
            type: DataTypes.STRING,
            allowNull: true
        }
    }, {
        sequelize, modelName: 'Review', freezeTableName: true, timestamps: true, indexes: [{unique: true, fields: ['userId', 'productId']}]
    })
    return Review
}