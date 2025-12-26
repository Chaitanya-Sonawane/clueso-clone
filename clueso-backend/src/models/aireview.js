'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class AIReview extends Model {
    static associate(models) {
      // Define associations here if needed
    }
  }
  
  AIReview.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    demoId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    reviewType: {
      type: DataTypes.ENUM('pre_publish', 'periodic', 'on_demand'),
      defaultValue: 'on_demand'
    },
    insights: {
      type: DataTypes.JSON,
      allowNull: false,
      comment: 'AI-generated insights and suggestions'
    },
    commonIssues: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Issues mentioned by multiple reviewers'
    },
    translationWarnings: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Translation quality warnings'
    },
    overallScore: {
      type: DataTypes.FLOAT,
      allowNull: true,
      comment: 'Overall demo quality score 0-10'
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'dismissed'),
      defaultValue: 'pending'
    }
  }, {
    sequelize,
    modelName: 'AIReview',
    tableName: 'AIReviews',
    timestamps: true,
    underscored: false,
    indexes: [
      { fields: ['demoId', 'reviewType'] },
      { fields: ['status'] }
    ]
  });
  
  return AIReview;
};