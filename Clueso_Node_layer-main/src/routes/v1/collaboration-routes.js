const express = require('express');
const { CollaborationController } = require('../../controllers');

const router = express.Router();

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