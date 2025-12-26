'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class DemoLanguage extends Model {
    static associate(models) {
      // Define associations here if needed
    }
  }
  
  DemoLanguage.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    demoId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    language: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'ISO language code (en, es, fr, etc.)'
    },
    subtitles: {
      type: DataTypes.JSON,
      allowNull: false,
      comment: 'Array of subtitle cues with timing'
    },
    translatedSummary: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    translatedTitle: {
      type: DataTypes.STRING,
      allowNull: true
    },
    ctaText: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Translated CTA buttons and text'
    },
    translationQuality: {
      type: DataTypes.FLOAT,
      allowNull: true,
      comment: 'AI confidence score 0-1'
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'DemoLanguage',
    tableName: 'DemoLanguages',
    timestamps: true,
    underscored: false,
    indexes: [
      { fields: ['demoId'] },
      { fields: ['language'] },
      { fields: ['demoId', 'language'] }
    ]
  });
  
  return DemoLanguage;
};