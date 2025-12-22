const { models } = require('../config/database');
const { Logger } = require('../config');

class CollaborationService {

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