const { Model, DataTypes } = require("sequelize")




module.exports = function(sequelize) {
    class Cart extends Model {
        static associate(models) {
            Cart.hasMany(models.CartLines, {foreignKey: 'cartId', as: 'cartLines'})
            Cart.belongsTo(models.User, {foreignKey: 'userId', as: 'user'})
        }
    }
    Cart.init({
        userId:{
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'User',
                key: 'id'
            },
            unique: true,
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        },
        cookieId: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true
        },
        uuid: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false
        }
        
    }, {sequelize, modelName: 'Cart', freezeTableName:true, timestamps: true})
    

    return Cart
}