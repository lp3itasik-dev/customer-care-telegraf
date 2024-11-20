'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Complaint extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Complaint.init({
    identity: DataTypes.STRING,
    title: DataTypes.STRING,
    category: DataTypes.STRING,
    message: DataTypes.STRING,
    reply: DataTypes.STRING,
    status: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'Complaint',
  });
  return Complaint;
};