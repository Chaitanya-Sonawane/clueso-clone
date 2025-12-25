'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Comment extends Model {
    static associate(models) {
      // Define associations here if needed
    }
  }
  
  Comment.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    demoId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false
    },
    timestamp: {
      type: DataTypes.FLOAT,
      allowNull: false,
      comment: 'Timestamp in seconds'
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    position: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Optional screen position {x, y}'
    },
    status: {
      type: DataTypes.ENUM('open', 'resolved'),
      defaultValue: 'open'
    },
    aiGenerated: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    suggestionType: {
      type: DataTypes.ENUM('trim', 'clarify', 'cta', 'pace', 'general'),
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Additional AI or user metadata'
    }
  }, {
    sequelize,
    modelName: 'Comment',
    tableName: 'Comments',
    timestamps: true,
    underscored: false,
    indexes: [
      { fields: ['demoId', 'timestamp'] },
      { fields: ['demoId', 'status'] },
      { fields: ['aiGenerated'] }
    ]
  });
  
  return Comment;
};