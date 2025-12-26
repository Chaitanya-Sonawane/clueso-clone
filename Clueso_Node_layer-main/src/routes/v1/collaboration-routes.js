const express = require('express');
const { CollaborationController } = require('../../controllers');
const { authenticateToken } = require('../../middlewares/auth');

const router = express.Router();

// All collaboration routes require authentication
router.use(authenticateToken);

// ===== TEAM COLLABORATION & INVITES =====

// Create or get collaboration session for a video
router.post('/videos/:videoId/session', CollaborationController.createCollaborationSession);
router.get('/videos/:videoId/session', CollaborationController.getCollaborationSession);

// Invite users to collaboration session
router.post('/sessions/:sessionId/invite', CollaborationController.inviteUsers);

// Accept collaboration invite
router.post('/invites/:inviteToken/accept', CollaborationController.acceptInvite);

// Manage session participants
router.get('/sessions/:sessionId/participants', CollaborationController.getSessionParticipants);
router.delete('/sessions/:sessionId/participants/:userId', CollaborationController.removeParticipant);
router.put('/sessions/:sessionId/participants/:userId/role', CollaborationController.updateParticipantRole);

// ===== COMMENT MANAGEMENT =====

// Comment routes
router.post('/demos/:demoId/comments', CollaborationController.addComment);
router.get('/demos/:demoId/comments', CollaborationController.getComments);
router.put('/comments/:commentId', CollaborationController.updateComment);
router.delete('/comments/:commentId', CollaborationController.deleteComment);
router.patch('/comments/:commentId/resolve', CollaborationController.resolveComment);

// AI suggestion routes
router.post('/demos/:demoId/ai-suggestions', CollaborationController.generateAISuggestions);
router.post('/comments/:commentId/dismiss', CollaborationController.dismissAISuggestion);

// Language routes
router.post('/demos/:demoId/languages', CollaborationController.addLanguage);
router.get('/demos/:demoId/languages', CollaborationController.getLanguages);
router.get('/demos/:demoId/languages/:language/subtitles', CollaborationController.getSubtitles);
router.put('/demos/:demoId/languages/:language', CollaborationController.updateLanguage);

// AI Review routes
router.post('/demos/:demoId/ai-review', CollaborationController.generateAIReview);
router.get('/demos/:demoId/ai-review', CollaborationController.getAIReview);
router.patch('/demos/:demoId/ai-review/:reviewId/dismiss', CollaborationController.dismissAIReview);

module.exports = router;