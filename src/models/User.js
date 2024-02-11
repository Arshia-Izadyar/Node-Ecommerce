const { Model, DataTypes } = require("sequelize");
const bcrypt = require("bcrypt");
async function hashPassword(user) {
  if (user.changed("password")) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
  }
}

module.exports = function (sequelize) {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.Review, { foreignKey: "userId", as: "reviews" });
      User.hasOne(models.Cart, { foreignKey: "userId", as: "cart" });
      User.hasMany(models.Payment, { foreignKey: "userId", as: "payments" });
      User.hasMany(models.Shipping, { foreignKey: "userId", as: "shippings" });
    }
  }
  User.init(
    {
      username: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
        validate: {
          len: [4, 30],
        },
      },
      full_name: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          len: [3, 60],
        },
      },
      roles: {
        type: DataTypes.ENUM,
        allowNull: false,
        values: ["admin", "user", "staff", "delivery"],
        defaultValue: "user",
      },
      phone_number: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          is: /^\+\d{1,14}$/,
        },
      },
      score: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: {
          min: { args: [0], msg: 'lowest value for score is "0"' },
          max: { args: [1000], msg: 'highest value for score is "1000"' },
        },
      },
      wallet: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      user_uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        unique: true,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      is_verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      address: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "User",
      freezeTableName: true,
      timestamps: true,
      hooks: { beforeUpdate: hashPassword, beforeCreate: hashPassword },
    },
  );

  User.prototype.isValidPassword = async function (password) {
    return await bcrypt.compare(password, this.password);
  };

  return User;
};
