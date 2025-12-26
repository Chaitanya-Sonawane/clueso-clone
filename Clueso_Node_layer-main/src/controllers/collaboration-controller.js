const { StatusCodes } = require('http-status-codes');
const { CollaborationService, AIService, FrontendService } = require('../services');
const { Logger } = require('../config');

class CollaborationController {
    
    // ===== TEAM COLLABORATION & INVITES =====
    
    async createCollaborationSession(req, res) {
        try {
            const { videoId } = req.params;
            const { sessionName, allowComments, allowPlaybackControl, requireApproval, maxParticipants } = req.body;
            const userId = req.user.id;

            const session = await CollaborationService.createCollaborationSession(videoId, userId, {
                sessionName,
                allowComments,
                allowPlaybackControl,
                requireApproval,
                maxParticipants
            });

            Logger.info(`[Collaboration] Created session ${session.id} for video ${videoId}`);

            res.status(StatusCodes.CREATED).json({
                success: true,
                data: session
            });

        } catch (error) {
            Logger.error('[Collaboration] Create session error:', error);
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: error.message
            });
        }
    }

    async inviteUsers(req, res) {
        try {
            const { sessionId } = req.params;
            const { invites } = req.body; // Array of { email, role, permissions }
            const userId = req.user.id;

            if (!Array.isArray(invites) || invites.length === 0) {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    success: false,
                    message: 'Invites array is required and must not be empty'
                });
            }

            const results = await CollaborationService.inviteUsers(sessionId, invites, userId);

            const successCount = results.filter(r => r.status === 'sent').length;
            const failureCount = results.filter(r => r.status === 'failed').length;

            Logger.info(`[Collaboration] Sent ${successCount} invites, ${failureCount} failed for session ${sessionId}`);

            res.status(StatusCodes.OK).json({
                success: true,
                data: {
                    results,
                    summary: {
                        total: results.length,
                        sent: successCount,
                        failed: failureCount
                    }
                }
            });

        } catch (error) {
            Logger.error('[Collaboration] Invite users error:', error);
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: error.message
            });
        }
    }

    async acceptInvite(req, res) {
        try {
            const { inviteToken } = req.params;
            const userId = req.user.id;

            const result = await CollaborationService.acceptInvite(inviteToken, userId);

            Logger.info(`[Collaboration] User ${userId} accepted invite for session ${result.sessionId}`);

            res.status(StatusCodes.OK).json({
                success: true,
                data: result
            });

        } catch (error) {
            Logger.error('[Collaboration] Accept invite error:', error);
            res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: error.message
            });
        }
    }

    async getSessionParticipants(req, res) {
        try {
            const { sessionId } = req.params;
            const userId = req.user.id;

            // Verify user is participant
            const participants = await CollaborationService.getSessionParticipants(sessionId);
            const userParticipant = participants.find(p => p.userId === userId);

            if (!userParticipant) {
                return res.status(StatusCodes.FORBIDDEN).json({
                    success: false,
                    message: 'Access denied to this collaboration session'
                });
            }

            res.status(StatusCodes.OK).json({
                success: true,
                data: {
                    participants,
                    userRole: userParticipant.role,
                    userPermissions: userParticipant.permissions
                }
            });

        } catch (error) {
            Logger.error('[Collaboration] Get participants error:', error);
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: error.message
            });
        }
    }

    async removeParticipant(req, res) {
        try {
            const { sessionId, userId: targetUserId } = req.params;
            const userId = req.user.id;

            const success = await CollaborationService.removeParticipant(sessionId, targetUserId, userId);

            if (!success) {
                return res.status(StatusCodes.NOT_FOUND).json({
                    success: false,
                    message: 'Participant not found or already removed'
                });
            }

            Logger.info(`[Collaboration] User ${targetUserId} removed from session ${sessionId} by ${userId}`);

            res.status(StatusCodes.OK).json({
                success: true,
                message: 'Participant removed successfully'
            });

        } catch (error) {
            Logger.error('[Collaboration] Remove participant error:', error);
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: error.message
            });
        }
    }

    async updateParticipantRole(req, res) {
        try {
            const { sessionId, userId: targetUserId } = req.params;
            const { role, permissions } = req.body;
            const userId = req.user.id;

            const participant = await CollaborationService.addParticipant(sessionId, targetUserId, role, permissions);

            Logger.info(`[Collaboration] Updated ${targetUserId} role to ${role} in session ${sessionId}`);

            res.status(StatusCodes.OK).json({
                success: true,
                data: participant
            });

        } catch (error) {
            Logger.error('[Collaboration] Update participant role error:', error);
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: error.message
            });
        }
    }

    async getCollaborationSession(req, res) {
        try {
            const { videoId } = req.params;
            const userId = req.user.id;

            const session = await CollaborationService.createCollaborationSession(videoId, userId);
            const participants = await CollaborationService.getSessionParticipants(session.id);

            res.status(StatusCodes.OK).json({
                success: true,
                data: {
                    session,
                    participants,
                    userRole: participants.find(p => p.userId === userId)?.role || 'viewer'
                }
            });

        } catch (error) {
            Logger.error('[Collaboration] Get session error:', error);
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: error.message
            });
        }
    }
    
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
            const { context } = req.body;

            // 🛡️ INPUT VALIDATION (CRITICAL)
            if (!demoId || typeof demoId !== 'string') {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid or missing demo ID'
                });
            }

            Logger.info(`[AI] Generating suggestions for demo ${demoId}`);

            // Mock data for testing if no context provided
            const mockContext = context || {
                transcript: "Welcome to this demonstration. We will show you how to use this application step by step. This is a comprehensive guide that covers all the main features.",
                pauseDurations: [0.5, 1.2, 3.1, 0.8, 2.5],
                replayFrequency: 2
            };

            // Validate context data
            if (mockContext.transcript && typeof mockContext.transcript !== 'string') {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid transcript format'
                });
            }

            if (mockContext.pauseDurations && !Array.isArray(mockContext.pauseDurations)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid pause durations format'
                });
            }

            const suggestions = await AIService.generateDemoSuggestions({
                demoId,
                ...mockContext
            });

            // Validate suggestions response
            if (!Array.isArray(suggestions)) {
                Logger.error('[AI] AI service returned invalid suggestions format');
                return res.status(500).json({
                    success: false,
                    message: 'Failed to generate AI suggestions'
                });
            }

            // Convert AI service suggestions to the format expected by frontend
            const formattedSuggestions = suggestions.map((suggestion, index) => {
                // Safe property access with defaults
                return {
                    id: suggestion?.id || `suggestion_${Date.now()}_${index}`,
                    type: suggestion?.type || 'improvement',
                    title: suggestion?.title || 'AI Suggestion',
                    description: suggestion?.description || suggestion?.suggestion || 'AI-generated improvement suggestion',
                    timestamp: typeof suggestion?.timestamp === 'number' ? suggestion.timestamp : 0,
                    priority: suggestion?.priority || 'medium',
                    implemented: Boolean(suggestion?.implemented)
                };
            });

            // Broadcast AI suggestions
            FrontendService.broadcastToDemo(demoId, 'ai_suggestions', formattedSuggestions);

            Logger.info(`[AI] Generated ${formattedSuggestions.length} suggestions for demo ${demoId}`);

            return res.status(StatusCodes.OK).json({
                success: true,
                data: formattedSuggestions,
                count: formattedSuggestions.length
            });

        } catch (error) {
            Logger.error('[AI] Generate suggestions error:', error);
            console.error('AI SUGGESTIONS ERROR:', error); // Additional console logging
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

            // 🛡️ INPUT VALIDATION (CRITICAL)
            if (!demoId || typeof demoId !== 'string') {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid or missing demo ID'
                });
            }

            if (reviewType && typeof reviewType !== 'string') {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid review type format'
                });
            }

            Logger.info(`[AI Review] Generating ${reviewType} review for demo ${demoId}`);

            // Get all comments and demo data with error handling
            let comments = [];
            let languages = [];
            
            try {
                comments = await CollaborationService.getComments(demoId, { includeResolved: true, includeAI: true });
                languages = await CollaborationService.getLanguages(demoId);
            } catch (dataError) {
                Logger.error('[AI Review] Error fetching demo data:', dataError);
                // Continue with empty arrays rather than failing
            }

            // Ensure arrays are valid
            if (!Array.isArray(comments)) comments = [];
            if (!Array.isArray(languages)) languages = [];

            const reviewData = await AIService.generateDemoReview({
                demoId,
                comments,
                languages,
                reviewType
            });

            // Validate review data
            if (!reviewData || typeof reviewData !== 'object') {
                Logger.error('[AI Review] AI service returned invalid review data');
                return res.status(500).json({
                    success: false,
                    message: 'Failed to generate AI review'
                });
            }

            // Ensure required fields exist with safe defaults
            const safeReviewData = {
                demoId,
                reviewType,
                insights: Array.isArray(reviewData.insights) ? reviewData.insights : ['AI review completed'],
                commonIssues: Array.isArray(reviewData.commonIssues) ? reviewData.commonIssues : [],
                translationWarnings: Array.isArray(reviewData.translationWarnings) ? reviewData.translationWarnings : [],
                recommendations: Array.isArray(reviewData.recommendations) ? reviewData.recommendations : [],
                publishReadiness: Boolean(reviewData.publishReadiness),
                overallScore: typeof reviewData.overallScore === 'number' ? reviewData.overallScore : 5.0
            };

            const aiReview = await CollaborationService.createAIReview(safeReviewData);

            Logger.info(`[AI Review] Generated review for demo ${demoId} with score ${safeReviewData.overallScore}`);

            return res.status(StatusCodes.CREATED).json({
                success: true,
                data: aiReview
            });

        } catch (error) {
            Logger.error('[AI Review] Generate review error:', error);
            console.error('AI REVIEW ERROR:', error); // Additional console logging
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