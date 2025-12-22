const { DataTypes } = require('sequelize');

// Comment model for timestamped collaboration
module.exports = (sequelize) => {
    const Comment = sequelize.define('Comment', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        demoId: {
            type: DataTypes.STRING,
            allowNull: false,
            index: true
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
        timestamps: true,
        indexes: [
            { fields: ['demoId', 'timestamp'] },
            { fields: ['demoId', 'status'] },
            { fields: ['aiGenerated'] }
        ]
    });

    const DemoLanguage = sequelize.define('DemoLanguage', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        demoId: {
            type: DataTypes.STRING,
            allowNull: false,
            index: true
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
        timestamps: true,
        indexes: [
            { fields: ['demoId'] },
            { fields: ['language'] },
            { fields: ['demoId', 'language'] }
        ]
    });

    const AIReview = sequelize.define('AIReview', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        demoId: {
            type: DataTypes.STRING,
            allowNull: false,
            index: true
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
        timestamps: true,
        indexes: [
            { fields: ['demoId', 'reviewType'] },
            { fields: ['status'] }
        ]
    });

    return { Comment, DemoLanguage, AIReview };
};