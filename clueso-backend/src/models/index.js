'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);

// Use the sequelize instance from database config
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '../../database.sqlite'),
    logging: false,
    define: {
        timestamps: true,
        underscored: false
    }
});

const db = {};

// Import collaboration models
const {
  CollaborationSession,
  CollaborationParticipant,
  CollaborationInvite,
  Comment,
  PlaybackState,
  VideoMetadata
} = require('./collaboration-models');

// Register collaboration models
db.CollaborationSession = CollaborationSession(sequelize);
db.CollaborationParticipant = CollaborationParticipant(sequelize);
db.CollaborationInvite = CollaborationInvite(sequelize);
db.Comment = Comment(sequelize);
db.PlaybackState = PlaybackState(sequelize);
db.VideoMetadata = VideoMetadata(sequelize);

// Load other models from files
fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file !== 'collaboration-models.js' && // Skip collaboration models file
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    if (model && model.name) {
      db[model.name] = model;
    }
  });

// Set up associations
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// Define associations for collaboration models
if (db.CollaborationSession && db.CollaborationParticipant) {
  db.CollaborationSession.hasMany(db.CollaborationParticipant, { foreignKey: 'sessionId' });
  db.CollaborationParticipant.belongsTo(db.CollaborationSession, { foreignKey: 'sessionId' });
}

if (db.CollaborationSession && db.CollaborationInvite) {
  db.CollaborationSession.hasMany(db.CollaborationInvite, { foreignKey: 'sessionId' });
  db.CollaborationInvite.belongsTo(db.CollaborationSession, { foreignKey: 'sessionId' });
}

if (db.CollaborationSession && db.Comment) {
  db.CollaborationSession.hasMany(db.Comment, { foreignKey: 'sessionId' });
  db.Comment.belongsTo(db.CollaborationSession, { foreignKey: 'sessionId' });
}

if (db.CollaborationSession && db.PlaybackState) {
  db.CollaborationSession.hasOne(db.PlaybackState, { foreignKey: 'sessionId' });
  db.PlaybackState.belongsTo(db.CollaborationSession, { foreignKey: 'sessionId' });
}

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
