const { DataTypes } = require('sequelize');

// Collaboration Session model for team collaboration
const CollaborationSession = (sequelize) => {
    return sequelize.define('CollaborationSession', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        videoId: {
            type: DataTypes.STRING,
            allowNull: false,
            index: true,
            comment: 'Associated video/recording session ID'
        },
        ownerId: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'User ID of session owner'
        },
        sessionName: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'Human-readable session name'
        },
        settings: {
            type: DataTypes.JSON,
            allowNull: false,
            defaultValue: {},
            comment: 'Session settings (permissions, limits, etc.)'
        },
        status: {
            type: DataTypes.ENUM('active', 'paused', 'ended'),
            defaultValue: 'active'
        },
        createdAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        updatedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    });
};

// Collaboration Participant model
const CollaborationParticipant = (sequelize) => {
    return sequelize.define('CollaborationParticipant', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        sessionId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'CollaborationSessions',
                key: 'id'
            }
        },
        userId: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'User ID from Supabase'
        },
        role: {
            type: DataTypes.ENUM('owner', 'admin', 'editor', 'viewer'),
            defaultValue: 'viewer'
        },
        permissions: {
            type: DataTypes.JSON,
            allowNull: false,
            defaultValue: {},
            comment: 'Specific permissions for this user'
        },
        joinedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        lastActive: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    });
};

// Collaboration Invite model
const CollaborationInvite = (sequelize) => {
    return sequelize.define('CollaborationInvite', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        sessionId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'CollaborationSessions',
                key: 'id'
            }
        },
        invitedBy: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'User ID who sent the invite'
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'Email address of invitee'
        },
        userId: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'User ID if user exists in system'
        },
        role: {
            type: DataTypes.ENUM('admin', 'editor', 'viewer'),
            defaultValue: 'viewer'
        },
        permissions: {
            type: DataTypes.JSON,
            allowNull: false,
            defaultValue: {}
        },
        inviteToken: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            comment: 'Unique token for accepting invite'
        },
        status: {
            type: DataTypes.ENUM('pending', 'accepted', 'declined', 'expired'),
            defaultValue: 'pending'
        },
        expiresAt: {
            type: DataTypes.DATE,
            allowNull: false
        },
        acceptedAt: {
            type: DataTypes.DATE,
            allowNull: true
        },
        createdAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    });
};

// Comment model for timestamped collaboration
const Comment = (sequelize) => {
    return sequelize.define('Comment', {
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
        sessionId: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'CollaborationSessions',
                key: 'id'
            },
            comment: 'Associated collaboration session'
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
            comment: 'Additional metadata (confidence, context, etc.)'
        },
        createdAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        updatedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    });
};

// Playback State model for real-time sync
const PlaybackState = (sequelize) => {
    return sequelize.define('PlaybackState', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        videoId: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            index: true
        },
        sessionId: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'CollaborationSessions',
                key: 'id'
            }
        },
        currentTime: {
            type: DataTypes.FLOAT,
            defaultValue: 0,
            comment: 'Current playback time in seconds'
        },
        isPlaying: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        playbackRate: {
            type: DataTypes.FLOAT,
            defaultValue: 1.0
        },
        originalDuration: {
            type: DataTypes.FLOAT,
            allowNull: false,
            comment: 'Original video duration in seconds'
        },
        hasAudio: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        audioTrackDuration: {
            type: DataTypes.FLOAT,
            defaultValue: 0
        },
        controlledBy: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'User ID who currently controls playback'
        },
        lastUpdate: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        metadata: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Additional playback metadata'
        }
    });
};

// Video Metadata model for enhanced video info
const VideoMetadata = (sequelize) => {
    return sequelize.define('VideoMetadata', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        videoId: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            index: true
        },
        originalDuration: {
            type: DataTypes.FLOAT,
            allowNull: false,
            comment: 'Original video duration in seconds'
        },
        hasAudio: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        audioTrackDuration: {
            type: DataTypes.FLOAT,
            defaultValue: 0
        },
        videoInfo: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Video stream information (resolution, fps, codec, etc.)'
        },
        audioInfo: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Audio stream information (codec, sample rate, channels, etc.)'
        },
        fileSize: {
            type: DataTypes.BIGINT,
            defaultValue: 0
        },
        bitrate: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        extractedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        rawMetadata: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Raw FFprobe output for debugging'
        }
    });
};

// Export all models
module.exports = {
    CollaborationSession,
    CollaborationParticipant,
    CollaborationInvite,
    Comment,
    PlaybackState,
    VideoMetadata
};