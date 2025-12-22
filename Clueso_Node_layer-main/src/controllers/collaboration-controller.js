const { StatusCodes } = require('http-status-codes');
const { CollaborationService, AIService } = require('../services');
const { Logger } = require('../config');

class CollaborationController {
    
    // ===== COMMENT MANAGEMENT =====
    
    async addComment(req, res) {
        try {
            const { demoId } = req.params;
            const { userId, username, timestamp, comment, position } = req.body;

            if (!userId || !username || timestamp === undefined || !comment) {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    success: false,
                    message: 'Missing required fields: userId, username, timestamp, comment'
                });
            }

            const newComment = await CollaborationService.addComment({
                demoId,
                userId,
                username,
                timestamp,
                comment,
                position
            });

            // Emit to other connected users via WebSocket
            const { FrontendService } = require('../services');
            FrontendService.broadcastToDemo(demoId, 'new_comment', newComment);

            Logger.info(`[Collaboration] Comment added to demo ${demoId} by ${username}`);

            return res.status(StatusCodes.CREATED).json({
                success: true,
                data: newComment
            });

        } catch (error) {
            Logger.error('[Collaboration] Add comment error:', error);
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Failed to add comment'
            });
        }
    }

    async getComments(req, res) {
        try {
            const { demoId } = req.params;
            const { includeResolved = 'true', includeAI = 'true' } = req.query;

            const comments = await CollaborationService.getComments(demoId, {
                includeResolved: includeResolved === 'true',
                includeAI: includeAI === 'true'
            });

            return res.status(StatusCodes.OK).json({
                success: true,
                data: comments,
                count: comments.length
            });

        } catch (error) {
            Logger.error('[Collaboration] Get comments error:', error);
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Failed to retrieve comments'
            });
        }
    }

    async updateComment(req, res) {
        try {
            const { commentId } = req.params;
            const { comment, position } = req.body;

            const updatedComment = await CollaborationService.updateComment(commentId, {
                comment,
                position
            });

            if (!updatedComment) {
                return res.status(StatusCodes.NOT_FOUND).json({
                    success: false,
                    message: 'Comment not found'
                });
            }

            // Broadcast update
            const { FrontendService } = require('../services');
            FrontendService.broadcastToDemo(updatedComment.demoId, 'comment_updated', updatedComment);

            return res.status(StatusCodes.OK).json({
                success: true,
                data: updatedComment
            });

        } catch (error) {
            Logger.error('[Collaboration] Update comment error:', error);
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Failed to update comment'
            });
        }
    }

    async deleteComment(req, res) {
        try {
            const { commentId } = req.params;

            const deleted = await CollaborationService.deleteComment(commentId);

            if (!deleted) {
                return res.status(StatusCodes.NOT_FOUND).json({
                    success: false,
                    message: 'Comment not found'
                });
            }

            return res.status(StatusCodes.OK).json({
                success: true,
                message: 'Comment deleted successfully'
            });

        } catch (error) {
            Logger.error('[Collaboration] Delete comment error:', error);
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Failed to delete comment'
            });
        }
    }

    async resolveComment(req, res) {
        try {
            const { commentId } = req.params;
            const { userId } = req.body;

            const resolvedComment = await CollaborationService.resolveComment(commentId, userId);

            if (!resolvedComment) {
                return res.status(StatusCodes.NOT_FOUND).json({
                    success: false,
                    message: 'Comment not found'
                });
            }

            // Broadcast resolution
            const { FrontendService } = require('../services');
            FrontendService.broadcastToDemo(resolvedComment.demoId, 'comment_resolved', resolvedComment);

            return res.status(StatusCodes.OK).json({
                success: true,
                data: resolvedComment
            });

        } catch (error) {
            Logger.error('[Collaboration] Resolve comment error:', error);
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Failed to resolve comment'
            });
        }
    }

    // ===== AI SUGGESTIONS =====

    async generateAISuggestions(req, res) {
        try {
            const { demoId } = req.params;
            const { transcript, pauseDurations, replayFrequency } = req.body;

            Logger.info(`[AI] Generating suggestions for demo ${demoId}`);

            const suggestions = await AIService.generateDemoSuggestions({
                demoId,
                transcript,
                pauseDurations,
                replayFrequency
            });

            // Store AI suggestions as comments
            const aiComments = [];
            for (const suggestion of suggestions) {
                const aiComment = await CollaborationService.addComment({
                    demoId,
                    userId: 'ai-assistant',
                    username: 'AI Assistant',
                    timestamp: suggestion.timestamp,
                    comment: suggestion.suggestion,
                    aiGenerated: true,
                    suggestionType: suggestion.type,
                    metadata: suggestion.metadata
                });
                aiComments.push(aiComment);
            }

            // Broadcast AI suggestions
            const { FrontendService } = require('../services');
            FrontendService.broadcastToDemo(demoId, 'ai_suggestions', aiComments);

            Logger.info(`[AI] Generated ${suggestions.length} suggestions for demo ${demoId}`);

            return res.status(StatusCodes.OK).json({
                success: true,
                data: aiComments,
                count: aiComments.length
            });

        } catch (error) {
            Logger.error('[AI] Generate suggestions error:', error);
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Failed to generate AI suggestions'
            });
        }
    }

    async dismissAISuggestion(req, res) {
        try {
            const { commentId } = req.params;
            const { userId, reason } = req.body;

            const dismissedComment = await CollaborationService.dismissAISuggestion(commentId, userId, reason);

            if (!dismissedComment) {
                return res.status(StatusCodes.NOT_FOUND).json({
                    success: false,
                    message: 'AI suggestion not found'
                });
            }

            return res.status(StatusCodes.OK).json({
                success: true,
                data: dismissedComment
            });

        } catch (error) {
            Logger.error('[AI] Dismiss suggestion error:', error);
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Failed to dismiss AI suggestion'
            });
        }
    }

    // ===== LANGUAGE MANAGEMENT =====

    async addLanguage(req, res) {
        try {
            const { demoId } = req.params;
            const { language, originalTranscript } = req.body;

            if (!language || !originalTranscript) {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    success: false,
                    message: 'Missing required fields: language, originalTranscript'
                });
            }

            Logger.info(`[Language] Adding ${language} support for demo ${demoId}`);

            // Generate translation and subtitles
            const languageData = await AIService.generateLanguageSupport({
                demoId,
                language,
                originalTranscript
            });

            const newLanguage = await CollaborationService.addLanguage({
                demoId,
                language,
                ...languageData
            });

            Logger.info(`[Language] Added ${language} support for demo ${demoId}`);

            return res.status(StatusCodes.CREATED).json({
                success: true,
                data: newLanguage
            });

        } catch (error) {
            Logger.error('[Language] Add language error:', error);
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Failed to add language support'
            });
        }
    }

    async getLanguages(req, res) {
        try {
            const { demoId } = req.params;

            const languages = await CollaborationService.getLanguages(demoId);

            return res.status(StatusCodes.OK).json({
                success: true,
                data: languages
            });

        } catch (error) {
            Logger.error('[Language] Get languages error:', error);
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Failed to retrieve languages'
            });
        }
    }

    async getSubtitles(req, res) {
        try {
            const { demoId, language } = req.params;

            const subtitles = await CollaborationService.getSubtitles(demoId, language);

            if (!subtitles) {
                return res.status(StatusCodes.NOT_FOUND).json({
                    success: false,
                    message: 'Subtitles not found for this language'
                });
            }

            return res.status(StatusCodes.OK).json({
                success: true,
                data: subtitles
            });

        } catch (error) {
            Logger.error('[Language] Get subtitles error:', error);
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Failed to retrieve subtitles'
            });
        }
    }

    async updateLanguage(req, res) {
        try {
            const { demoId, language } = req.params;
            const updateData = req.body;

            const updatedLanguage = await CollaborationService.updateLanguage(demoId, language, updateData);

            if (!updatedLanguage) {
                return res.status(StatusCodes.NOT_FOUND).json({
                    success: false,
                    message: 'Language not found'
                });
            }

            return res.status(StatusCodes.OK).json({
                success: true,
                data: updatedLanguage
            });

        } catch (error) {
            Logger.error('[Language] Update language error:', error);
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Failed to update language'
            });
        }
    }

    // ===== AI REVIEW =====

    async generateAIReview(req, res) {
        try {
            const { demoId } = req.params;
            const { reviewType = 'on_demand' } = req.body;

            Logger.info(`[AI Review] Generating ${reviewType} review for demo ${demoId}`);

            // Get all comments and demo data
            const comments = await CollaborationService.getComments(demoId, { includeResolved: true, includeAI: true });
            const languages = await CollaborationService.getLanguages(demoId);

            const reviewData = await AIService.generateDemoReview({
                demoId,
                comments,
                languages,
                reviewType
            });

            const aiReview = await CollaborationService.createAIReview({
                demoId,
                reviewType,
                ...reviewData
            });

            Logger.info(`[AI Review] Generated review for demo ${demoId} with score ${reviewData.overallScore}`);

            return res.status(StatusCodes.CREATED).json({
                success: true,
                data: aiReview
            });

        } catch (error) {
            Logger.error('[AI Review] Generate review error:', error);
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Failed to generate AI review'
            });
        }
    }

    async getAIReview(req, res) {
        try {
            const { demoId } = req.params;

            const aiReview = await CollaborationService.getLatestAIReview(demoId);

            if (!aiReview) {
                return res.status(StatusCodes.NOT_FOUND).json({
                    success: false,
                    message: 'No AI review found for this demo'
                });
            }

            return res.status(StatusCodes.OK).json({
                success: true,
                data: aiReview
            });

        } catch (error) {
            Logger.error('[AI Review] Get review error:', error);
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Failed to retrieve AI review'
            });
        }
    }
    async dismissAIReview(req, res) {
        try {
            const { reviewId } = req.params;
            const { userId } = req.body;

            const dismissedReview = await CollaborationService.dismissAIReview(reviewId, userId);

            if (!dismissedReview) {
                return res.status(StatusCodes.NOT_FOUND).json({
                    success: false,
                    message: 'AI review not found'
                });
            }

            return res.status(StatusCodes.OK).json({
                success: true,
                data: dismissedReview
            });

        } catch (error) {
            Logger.error('[AI Review] Dismiss review error:', error);
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Failed to dismiss AI review'
            });
        }
    }
}

module.exports = new CollaborationController();