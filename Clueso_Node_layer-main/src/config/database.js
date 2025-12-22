const { Sequelize } = require('sequelize');
const path = require('path');

// Initialize Sequelize with SQLite
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '../../database.sqlite'),
    logging: false,
    define: {
        timestamps: true,
        underscored: false
    }
});

// Import and initialize models
const collaborationModels = require('../models/collaboration-models')(sequelize);

// Sync database (create tables if they don't exist)
const initializeDatabase = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connection established successfully.');
        
        // Sync all models with force to avoid conflicts
        await sequelize.sync({ force: false, alter: false });
        console.log('Database synchronized successfully.');
        
        return true;
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        return false;
    }
};

module.exports = {
    sequelize,
    models: collaborationModels,
    initializeDatabase
};