'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create Comments table
    await queryInterface.createTable('Comments', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      demoId: {
        type: Sequelize.STRING,
        allowNull: false
      },
      userId: {
        type: Sequelize.STRING,
        allowNull: false
      },
      username: {
        type: Sequelize.STRING,
        allowNull: false
      },
      timestamp: {
        type: Sequelize.FLOAT,
        allowNull: false,
        comment: 'Timestamp in seconds'
      },
      comment: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      position: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Optional screen position {x, y}'
      },
      status: {
        type: Sequelize.ENUM('open', 'resolved'),
        defaultValue: 'open'
      },
      aiGenerated: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      suggestionType: {
        type: Sequelize.ENUM('trim', 'clarify', 'cta', 'pace', 'general'),
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Additional AI or user metadata'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Create DemoLanguages table
    await queryInterface.createTable('DemoLanguages', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      demoId: {
        type: Sequelize.STRING,
        allowNull: false
      },
      language: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'ISO language code (en, es, fr, etc.)'
      },
      subtitles: {
        type: Sequelize.JSON,
        allowNull: false,
        comment: 'Array of subtitle cues with timing'
      },
      translatedSummary: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      translatedTitle: {
        type: Sequelize.STRING,
        allowNull: true
      },
      ctaText: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Translated CTA buttons and text'
      },
      translationQuality: {
        type: Sequelize.FLOAT,
        allowNull: true,
        comment: 'AI confidence score 0-1'
      },
      isDefault: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Create AIReviews table
    await queryInterface.createTable('AIReviews', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      demoId: {
        type: Sequelize.STRING,
        allowNull: false
      },
      reviewType: {
        type: Sequelize.ENUM('pre_publish', 'periodic', 'on_demand'),
        defaultValue: 'on_demand'
      },
      insights: {
        type: Sequelize.JSON,
        allowNull: false,
        comment: 'AI-generated insights and suggestions'
      },
      commonIssues: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Issues mentioned by multiple reviewers'
      },
      translationWarnings: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Translation quality warnings'
      },
      overallScore: {
        type: Sequelize.FLOAT,
        allowNull: true,
        comment: 'Overall demo quality score 0-10'
      },
      status: {
        type: Sequelize.ENUM('pending', 'completed', 'dismissed'),
        defaultValue: 'pending'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Add indexes
    await queryInterface.addIndex('Comments', ['demoId', 'timestamp']);
    await queryInterface.addIndex('Comments', ['demoId', 'status']);
    await queryInterface.addIndex('Comments', ['aiGenerated']);
    
    await queryInterface.addIndex('DemoLanguages', ['demoId', 'language'], { unique: true });
    await queryInterface.addIndex('DemoLanguages', ['language']);
    
    await queryInterface.addIndex('AIReviews', ['demoId', 'reviewType']);
    await queryInterface.addIndex('AIReviews', ['status']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('AIReviews');
    await queryInterface.dropTable('DemoLanguages');
    await queryInterface.dropTable('Comments');
  }
};