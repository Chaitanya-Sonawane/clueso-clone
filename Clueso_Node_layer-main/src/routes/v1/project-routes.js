const express = require('express');
const ProjectController = require('../../controllers/project-controller');
const { authenticateToken } = require('../../middlewares/auth');

const router = express.Router();

// All project routes require authentication
router.use(authenticateToken);

// Project CRUD operations
router.post('/', ProjectController.createProject);
router.get('/', ProjectController.getUserProjects);
router.get('/:projectId', ProjectController.getProject);
router.put('/:projectId', ProjectController.updateProject);
router.delete('/:projectId', ProjectController.deleteProject);

// Project recording operations
router.get('/:projectId/recordings', ProjectController.getProjectRecordings);
router.post('/:projectId/recordings/start', ProjectController.startRecordingSession);
router.post('/:projectId/recordings/:sessionId/stop', ProjectController.stopRecordingSession);

module.exports = router;