const { Model, DataTypes } = require("sequelize");
const sequelize = require("../config/connection");
const bcrypt = require("bcrypt");

// creates the user model
class User extends Model {
  checkPassword(loginPw) {
    return bcrypt.compareSync(loginPw, this.password);
  }
}

// defines table columns and configuration
User.init(
  {
    // define an id column
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true, 
      autoIncrement: true,
    },
    // define a username column
    username: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    // defines an email column
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      // this makes sure that this doesn't get duplicated,
      // if an input is, then an error will be thrown
      unique: true,
      // if 'allowNull' is set to false, we can run our data through validators
      // before creating the table data
      validate: {
        isEmail: true,
      },
    },
    // defines password column
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        // length permitted to be up to
        len: [4],
      },
    },
  },
  {
    hooks: {
      // you hash the password field before you create the table
      async beforeCreate(newUserData) {
        newUserData.password = await bcrypt.hash(newUserData.password, 10);
        return newUserData;
      },
      // you hash the password field when you update the table
      async beforeUpdate(updatedUserData) {
        updatedUserData.password = await bcrypt.hash(
          updatedUserData.password,
          10
        );
        return updatedUserData;
      },
    },
    
    // Table configuration options go here
    sequelize,
    // passes in the imported sequelize connection (the direct connection to our database) which in this case is sequelize

    // don't automatically create 'createAt/updateAt' timestamp fields
    timestamps: false,

    // 'false' pluralizes the name of database table
    // 'true' doesn't
    freeTableName: true,

    // use underscores instead of camel-casing
    underscored: true,

    // make it so our model name stays lowercase in the database
    modelName: "users",
  }
);

module.exports = User;