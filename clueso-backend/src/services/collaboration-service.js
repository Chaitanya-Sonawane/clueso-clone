const { models } = require('../config/database');
const { supabaseAdmin } = require('../config/supabase');
const { Logger } = require('../config');
const crypto = require('crypto');

class CollaborationService {

    // ===== TEAM COLLABORATION & INVITES =====

    /**
     * Create or get collaboration session for a video
     * @param {string} videoId - Video identifier
     * @param {string} ownerId - Owner user ID
     * @param {object} options - Session options
     */
    async createCollaborationSession(videoId, ownerId, options = {}) {
        try {
            // Check if session already exists
            let session = await models.CollaborationSession.findOne({
                where: { videoId }
            });

            if (!session) {
                session = await models.CollaborationSession.create({
                    videoId,
                    ownerId,
                    sessionName: options.sessionName || `Collaboration on Video ${videoId}`,
                    settings: {
                        allowComments: options.allowComments !== false,
                        allowPlaybackControl: options.allowPlaybackControl !== false,
                        requireApproval: options.requireApproval || false,
                        maxParticipants: options.maxParticipants || 50
                    },
                    status: 'active'
                });

                // Add owner as first participant
                await this.addParticipant(session.id, ownerId, 'owner');
                
                Logger.info(`[Collaboration] Created session ${session.id} for video ${videoId}`);
            }

            return session;
        } catch (error) {
            Logger.error('[Collaboration] Create session error:', error);
            throw error;
        }
    }

    /**
     * Invite users to collaboration session
     * @param {string} sessionId - Collaboration session ID
     * @param {Array} invites - Array of invite objects { email, role, permissions }
     * @param {string} invitedBy - User ID of inviter
     */
    async inviteUsers(sessionId, invites, invitedBy) {
        try {
            const session = await models.CollaborationSession.findByPk(sessionId);
            if (!session) {
                throw new Error('Collaboration session not found');
            }

            // Check if inviter has permission
            const inviterParticipant = await models.CollaborationParticipant.findOne({
                where: { sessionId, userId: invitedBy }
            });

            if (!inviterParticipant || !['owner', 'admin'].includes(inviterParticipant.role)) {
                throw new Error('Insufficient permissions to invite users');
            }

            const results = [];

            for (const invite of invites) {
                try {
                    // Generate invite token
                    const inviteToken = crypto.randomBytes(32).toString('hex');
                    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

                    // Check if user exists
                    const { data: existingUser } = await supabaseAdmin
                        .from('users')
                        .select('id, email, full_name')
                        .eq('email', invite.email)
                        .single();

                    // Create invite record
                    const inviteRecord = await models.CollaborationInvite.create({
                        sessionId,
                        invitedBy,
                        email: invite.email,
                        userId: existingUser?.id || null,
                        role: invite.role || 'viewer',
                        permissions: invite.permissions || this.getDefaultPermissions(invite.role || 'viewer'),
                        inviteToken,
                        expiresAt,
                        status: 'pending'
                    });

                    // Send notification
                    if (existingUser) {
                        // Real-time notification for existing users
                        await this.sendInviteNotification(inviteRecord, session, existingUser);
                    } else {
                        // Email invitation for non-users
                        await this.sendEmailInvite(inviteRecord, session);
                    }

                    results.push({
                        email: invite.email,
                        status: 'sent',
                        inviteId: inviteRecord.id,
                        userExists: !!existingUser
                    });

                    Logger.info(`[Collaboration] Invite sent to ${invite.email} for session ${sessionId}`);
                } catch (inviteError) {
                    Logger.error(`[Collaboration] Failed to invite ${invite.email}:`, inviteError);
                    results.push({
                        email: invite.email,
                        status: 'failed',
                        error: inviteError.message
                    });
                }
            }

            return results;
        } catch (error) {
            Logger.error('[Collaboration] Invite users error:', error);
            throw error;
        }
    }

    /**
     * Accept collaboration invite
     * @param {string} inviteToken - Invite token
     * @param {string} userId - User accepting invite
     */
    async acceptInvite(inviteToken, userId) {
        try {
            const invite = await models.CollaborationInvite.findOne({
                where: { 
                    inviteToken,
                    status: 'pending',
                    expiresAt: { [models.Sequelize.Op.gt]: new Date() }
                },
                include: [{ model: models.CollaborationSession }]
            });

            if (!invite) {
                throw new Error('Invalid or expired invite');
            }

            // Check if user matches invite (for existing users)
            if (invite.userId && invite.userId !== userId) {
                throw new Error('This invite is for a different user');
            }

            // Add user as participant
            await this.addParticipant(invite.sessionId, userId, invite.role, invite.permissions);

            // Update invite status
            await invite.update({
                status: 'accepted',
                acceptedAt: new Date(),
                userId: userId // Set userId if it wasn't set before
            });

            Logger.info(`[Collaboration] User ${userId} accepted invite ${invite.id}`);

            return {
                sessionId: invite.sessionId,
                role: invite.role,
                permissions: invite.permissions,
                session: invite.CollaborationSession
            };
        } catch (error) {
            Logger.error('[Collaboration] Accept invite error:', error);
            throw error;
        }
    }

    /**
     * Add participant to collaboration session
     * @param {string} sessionId - Session ID
     * @param {string} userId - User ID
     * @param {string} role - User role
     * @param {object} permissions - User permissions
     */
    async addParticipant(sessionId, userId, role = 'viewer', permissions = null) {
        try {
            // Check if already participant
            const existing = await models.CollaborationParticipant.findOne({
                where: { sessionId, userId }
            });

            if (existing) {
                // Update role and permissions if different
                if (existing.role !== role || JSON.stringify(existing.permissions) !== JSON.stringify(permissions)) {
                    await existing.update({
                        role,
                        permissions: permissions || this.getDefaultPermissions(role),
                        updatedAt: new Date()
                    });
                }
                return existing;
            }

            const participant = await models.CollaborationParticipant.create({
                sessionId,
                userId,
                role,
                permissions: permissions || this.getDefaultPermissions(role),
                joinedAt: new Date()
            });

            Logger.info(`[Collaboration] Added participant ${userId} to session ${sessionId} as ${role}`);
            return participant;
        } catch (error) {
            Logger.error('[Collaboration] Add participant error:', error);
            throw error;
        }
    }

    /**
     * Get default permissions for role
     * @param {string} role - User role
     * @returns {object} Default permissions
     */
    getDefaultPermissions(role) {
        const permissions = {
            owner: {
                canInvite: true,
                canRemove: true,
                canControlPlayback: true,
                canComment: true,
                canResolveComments: true,
                canEditSession: true,
                canDeleteSession: true
            },
            admin: {
                canInvite: true,
                canRemove: true,
                canControlPlayback: true,
                canComment: true,
                canResolveComments: true,
                canEditSession: true,
                canDeleteSession: false
            },
            editor: {
                canInvite: false,
                canRemove: false,
                canControlPlayback: true,
                canComment: true,
                canResolveComments: true,
                canEditSession: false,
                canDeleteSession: false
            },
            viewer: {
                canInvite: false,
                canRemove: false,
                canControlPlayback: false,
                canComment: true,
                canResolveComments: false,
                canEditSession: false,
                canDeleteSession: false
            }
        };

        return permissions[role] || permissions.viewer;
    }

    /**
     * Send real-time invite notification
     * @param {object} invite - Invite record
     * @param {object} session - Collaboration session
     * @param {object} user - User being invited
     */
    async sendInviteNotification(invite, session, user) {
        try {
            const FrontendService = require('./frontend-service');
            
            // Send WebSocket notification if user is online
            FrontendService.sendToUser(user.id, 'collaboration_invite', {
                inviteId: invite.id,
                sessionId: session.id,
                videoId: session.videoId,
                sessionName: session.sessionName,
                role: invite.role,
                invitedBy: invite.invitedBy,
                expiresAt: invite.expiresAt,
                acceptUrl: `/collaborate/accept/${invite.inviteToken}`
            });

            Logger.info(`[Collaboration] Sent real-time invite to user ${user.id}`);
        } catch (error) {
            Logger.error('[Collaboration] Send invite notification error:', error);
        }
    }

    /**
     * Send email invite (fallback for non-users)
     * @param {object} invite - Invite record
     * @param {object} session - Collaboration session
     */
    async sendEmailInvite(invite, session) {
        try {
            // TODO: Implement email service
            // For now, just log the invite details
            Logger.info(`[Collaboration] Email invite needed for ${invite.email}:`, {
                sessionName: session.sessionName,
                role: invite.role,
                acceptUrl: `/collaborate/accept/${invite.inviteToken}`
            });
        } catch (error) {
            Logger.error('[Collaboration] Send email invite error:', error);
        }
    }

    /**
     * Get collaboration session participants
     * @param {string} sessionId - Session ID
     */
    async getSessionParticipants(sessionId) {
        try {
            const participants = await models.CollaborationParticipant.findAll({
                where: { sessionId },
                include: [{
                    model: models.User,
                    attributes: ['id', 'email', 'full_name', 'username', 'avatar_url']
                }],
                order: [['joinedAt', 'ASC']]
            });

            return participants.map(p => ({
                userId: p.userId,
                role: p.role,
                permissions: p.permissions,
                joinedAt: p.joinedAt,
                user: p.User
            }));
        } catch (error) {
            Logger.error('[Collaboration] Get participants error:', error);
            throw error;
        }
    }

    /**
     * Remove participant from session
     * @param {string} sessionId - Session ID
     * @param {string} userId - User to remove
     * @param {string} removedBy - User performing removal
     */
    async removeParticipant(sessionId, userId, removedBy) {
        try {
            // Check permissions
            const remover = await models.CollaborationParticipant.findOne({
                where: { sessionId, userId: removedBy }
            });

            if (!remover || !remover.permissions.canRemove) {
                throw new Error('Insufficient permissions to remove participants');
            }

            // Cannot remove owner
            const target = await models.CollaborationParticipant.findOne({
                where: { sessionId, userId }
            });

            if (target?.role === 'owner') {
                throw new Error('Cannot remove session owner');
            }

            const removed = await models.CollaborationParticipant.destroy({
                where: { sessionId, userId }
            });

            if (removed > 0) {
                Logger.info(`[Collaboration] Removed participant ${userId} from session ${sessionId}`);
                
                // Notify user they were removed
                const FrontendService = require('./frontend-service');
                FrontendService.sendToUser(userId, 'collaboration_removed', {
                    sessionId,
                    message: 'You have been removed from the collaboration session'
                });
            }

            return removed > 0;
        } catch (error) {
            Logger.error('[Collaboration] Remove participant error:', error);
            throw error;
        }
    }

    // ===== COMMENT MANAGEMENT =====

    async addComment(commentData) {
        try {
            const comment = await models.Comment.create(commentData);
            Logger.info(`[Collaboration Service] Comment added: ${comment.id}`);
            return comment;
        } catch (error) {
            Logger.error('[Collaboration Service] Add comment error:', error);
            throw error;
        }
    }

    async getComments(demoId, options = {}) {
        try {
            const { includeResolved = true, includeAI = true } = options;
            
            const whereClause = { demoId };
            
            if (!includeResolved) {
                whereClause.status = 'open';
            }
            
            if (!includeAI) {
                whereClause.aiGenerated = false;
            }

            const comments = await models.Comment.findAll({
                where: whereClause,
                order: [['timestamp', 'ASC'], ['createdAt', 'ASC']]
            });

            Logger.info(`[Collaboration Service] Retrieved ${comments.length} comments for demo ${demoId}`);
            return comments;
        } catch (error) {
            Logger.error('[Collaboration Service] Get comments error:', error);
            throw error;
        }
    }

    async updateComment(commentId, updateData) {
        try {
            const [updatedRows] = await models.Comment.update(updateData, {
                where: { id: commentId },
                returning: true
            });

            if (updatedRows === 0) {
                return null;
            }

            const updatedComment = await models.Comment.findByPk(commentId);
            Logger.info(`[Collaboration Service] Comment updated: ${commentId}`);
            return updatedComment;
        } catch (error) {
            Logger.error('[Collaboration Service] Update comment error:', error);
            throw error;
        }
    }

    async deleteComment(commentId) {
        try {
            const deletedRows = await models.Comment.destroy({
                where: { id: commentId }
            });

            Logger.info(`[Collaboration Service] Comment deleted: ${commentId}`);
            return deletedRows > 0;
        } catch (error) {
            Logger.error('[Collaboration Service] Delete comment error:', error);
            throw error;
        }
    }

    async resolveComment(commentId, userId) {
        try {
            const comment = await models.Comment.findByPk(commentId);
            if (!comment) {
                return null;
            }

            comment.status = 'resolved';
            comment.metadata = {
                ...comment.metadata,
                resolvedBy: userId,
                resolvedAt: new Date()
            };

            await comment.save();
            Logger.info(`[Collaboration Service] Comment resolved: ${commentId} by ${userId}`);
            return comment;
        } catch (error) {
            Logger.error('[Collaboration Service] Resolve comment error:', error);
            throw error;
        }
    }

    async dismissAISuggestion(commentId, userId, reason) {
        try {
            const comment = await models.Comment.findOne({
                where: { id: commentId, aiGenerated: true }
            });

            if (!comment) {
                return null;
            }

            comment.status = 'resolved';
            comment.metadata = {
                ...comment.metadata,
                dismissed: true,
                dismissedBy: userId,
                dismissReason: reason,
                dismissedAt: new Date()
            };

            await comment.save();
            Logger.info(`[Collaboration Service] AI suggestion dismissed: ${commentId} by ${userId}`);
            return comment;
        } catch (error) {
            Logger.error('[Collaboration Service] Dismiss AI suggestion error:', error);
            throw error;
        }
    }

    // ===== LANGUAGE MANAGEMENT =====

    async addLanguage(languageData) {
        try {
            // Check if language already exists for this demo
            const existing = await models.DemoLanguage.findOne({
                where: { demoId: languageData.demoId, language: languageData.language }
            });

            if (existing) {
                // Update existing
                await existing.update(languageData);
                Logger.info(`[Collaboration Service] Language updated: ${languageData.language} for demo ${languageData.demoId}`);
                return existing;
            } else {
                // Create new
                const newLanguage = await models.DemoLanguage.create(languageData);
                Logger.info(`[Collaboration Service] Language added: ${languageData.language} for demo ${languageData.demoId}`);
                return newLanguage;
            }
        } catch (error) {
            Logger.error('[Collaboration Service] Add language error:', error);
            throw error;
        }
    }

    async getLanguages(demoId) {
        try {
            const languages = await models.DemoLanguage.findAll({
                where: { demoId },
                order: [['isDefault', 'DESC'], ['language', 'ASC']]
            });

            Logger.info(`[Collaboration Service] Retrieved ${languages.length} languages for demo ${demoId}`);
            return languages;
        } catch (error) {
            Logger.error('[Collaboration Service] Get languages error:', error);
            throw error;
        }
    }

    async getSubtitles(demoId, language) {
        try {
            const languageData = await models.DemoLanguage.findOne({
                where: { demoId, language }
            });

            if (!languageData) {
                return null;
            }

            Logger.info(`[Collaboration Service] Retrieved subtitles for ${language} in demo ${demoId}`);
            return {
                language,
                subtitles: languageData.subtitles,
                translatedTitle: languageData.translatedTitle,
                ctaText: languageData.ctaText
            };
        } catch (error) {
            Logger.error('[Collaboration Service] Get subtitles error:', error);
            throw error;
        }
    }

    async updateLanguage(demoId, language, updateData) {
        try {
            const [updatedRows] = await models.DemoLanguage.update(updateData, {
                where: { demoId, language },
                returning: true
            });

            if (updatedRows === 0) {
                return null;
            }

            const updatedLanguage = await models.DemoLanguage.findOne({
                where: { demoId, language }
            });

            Logger.info(`[Collaboration Service] Language updated: ${language} for demo ${demoId}`);
            return updatedLanguage;
        } catch (error) {
            Logger.error('[Collaboration Service] Update language error:', error);
            throw error;
        }
    }

    // ===== AI REVIEW MANAGEMENT =====

    async createAIReview(reviewData) {
        try {
            const aiReview = await models.AIReview.create(reviewData);
            Logger.info(`[Collaboration Service] AI review created: ${aiReview.id} for demo ${reviewData.demoId}`);
            return aiReview;
        } catch (error) {
            Logger.error('[Collaboration Service] Create AI review error:', error);
            throw error;
        }
    }

    async getLatestAIReview(demoId) {
        try {
            const aiReview = await models.AIReview.findOne({
                where: { demoId },
                order: [['createdAt', 'DESC']]
            });

            if (aiReview) {
                Logger.info(`[Collaboration Service] Retrieved latest AI review for demo ${demoId}`);
            }

            return aiReview;
        } catch (error) {
            Logger.error('[Collaboration Service] Get AI review error:', error);
            throw error;
        }
    }

    async dismissAIReview(reviewId, userId) {
        try {
            const review = await models.AIReview.findByPk(reviewId);
            if (!review) {
                return null;
            }

            review.status = 'dismissed';
            review.insights = {
                ...review.insights,
                dismissedBy: userId,
                dismissedAt: new Date()
            };

            await review.save();
            Logger.info(`[Collaboration Service] AI review dismissed: ${reviewId} by ${userId}`);
            return review;
        } catch (error) {
            Logger.error('[Collaboration Service] Dismiss AI review error:', error);
            throw error;
        }
    }

    // ===== ANALYTICS & INSIGHTS =====

    async getDemoAnalytics(demoId) {
        try {
            const [comments, languages, aiReviews] = await Promise.all([
                this.getComments(demoId, { includeResolved: true, includeAI: true }),
                this.getLanguages(demoId),
                models.AIReview.findAll({ where: { demoId }, order: [['createdAt', 'DESC']] })
            ]);

            const analytics = {
                totalComments: comments.length,
                humanComments: comments.filter(c => !c.aiGenerated).length,
                aiSuggestions: comments.filter(c => c.aiGenerated).length,
                resolvedComments: comments.filter(c => c.status === 'resolved').length,
                openComments: comments.filter(c => c.status === 'open').length,
                supportedLanguages: languages.length,
                aiReviewsCount: aiReviews.length,
                latestScore: aiReviews.length > 0 ? aiReviews[0].overallScore : null
            };

            Logger.info(`[Collaboration Service] Generated analytics for demo ${demoId}`);
            return analytics;
        } catch (error) {
            Logger.error('[Collaboration Service] Get analytics error:', error);
            throw error;
        }
    }
}

module.exports = new CollaborationService();