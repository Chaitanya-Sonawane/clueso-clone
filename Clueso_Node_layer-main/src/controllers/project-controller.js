const ProjectService = require('../services/project-service');
const { StatusCodes } = require('http-status-codes');
const { Logger } = require('../config');

class ProjectController {
  async createProject(req, res) {
    try {
      const { name, description } = req.body;
      const userId = req.user.id;

      if (!name) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: 'Project name is required'
        });
      }

      const project = await ProjectService.createProject({
        name,
        description,
        owner_id: userId
      });

      Logger.info(`Project created: ${project.id} by user ${userId}`);

      res.status(StatusCodes.CREATED).json({
        success: true,
        message: 'Project created successfully',
        data: project
      });
    } catch (error) {
      Logger.error('Create project error:', error);
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: error.message
      });
    }
  }

  async getUserProjects(req, res) {
    try {
      const userId = req.user.id;
      const projects = await ProjectService.getUserProjects(userId);

      res.status(StatusCodes.OK).json({
        success: true,
        data: projects
      });
    } catch (error) {
      Logger.error('Get user projects error:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message
      });
    }
  }

  async getProject(req, res) {
    try {
      const { projectId } = req.params;
      const userId = req.user.id;

      const project = await ProjectService.getProject(projectId, userId);

      if (!project) {
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: 'Project not found'
        });
      }

      res.status(StatusCodes.OK).json({
        success: true,
        data: project
      });
    } catch (error) {
      Logger.error('Get project error:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message
      });
    }
  }

  async updateProject(req, res) {
    try {
      const { projectId } = req.params;
      const { name, description } = req.body;
      const userId = req.user.id;

      const project = await ProjectService.updateProject(projectId, userId, {
        name,
        description
      });

      if (!project) {
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: 'Project not found'
        });
      }

      Logger.info(`Project updated: ${projectId} by user ${userId}`);

      res.status(StatusCodes.OK).json({
        success: true,
        message: 'Project updated successfully',
        data: project
      });
    } catch (error) {
      Logger.error('Update project error:', error);
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: error.message
      });
    }
  }

  async deleteProject(req, res) {
    try {
      const { projectId } = req.params;
      const userId = req.user.id;

      const deleted = await ProjectService.deleteProject(projectId, userId);

      if (!deleted) {
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: 'Project not found'
        });
      }

      Logger.info(`Project deleted: ${projectId} by user ${userId}`);

      res.status(StatusCodes.OK).json({
        success: true,
        message: 'Project deleted successfully'
      });
    } catch (error) {
      Logger.error('Delete project error:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message
      });
    }
  }

  async getProjectRecordings(req, res) {
    try {
      const { projectId } = req.params;
      const userId = req.user.id;

      // Verify user has access to project
      const project = await ProjectService.getProject(projectId, userId);
      if (!project) {
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: 'Project not found'
        });
      }

      const recordings = await ProjectService.getProjectRecordings(projectId);

      res.status(StatusCodes.OK).json({
        success: true,
        data: {
          project: project,
          recordings: recordings
        }
      });
    } catch (error) {
      Logger.error('Get project recordings error:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message
      });
    }
  }

  async startRecordingSession(req, res) {
    try {
      const { projectId } = req.params;
      const { sessionName, url, viewport } = req.body;
      const userId = req.user.id;

      // Verify user has access to project
      const project = await ProjectService.getProject(projectId, userId);
      if (!project) {
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: 'Project not found'
        });
      }

      const recordingSession = await ProjectService.createRecordingSession({
        project_id: projectId,
        user_id: userId,
        session_name: sessionName,
        url: url,
        viewport: viewport
      });

      Logger.info(`Recording session started: ${recordingSession.id} for project ${projectId}`);

      res.status(StatusCodes.CREATED).json({
        success: true,
        message: 'Recording session started',
        data: recordingSession
      });
    } catch (error) {
      Logger.error('Start recording session error:', error);
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: error.message
      });
    }
  }

  async stopRecordingSession(req, res) {
    try {
      const { projectId, sessionId } = req.params;
      const userId = req.user.id;

      // Verify user has access to project
      const project = await ProjectService.getProject(projectId, userId);
      if (!project) {
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: 'Project not found'
        });
      }

      const recordingSession = await ProjectService.stopRecordingSession(sessionId, userId);

      if (!recordingSession) {
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: 'Recording session not found'
        });
      }

      Logger.info(`Recording session stopped: ${sessionId} for project ${projectId}`);

      res.status(StatusCodes.OK).json({
        success: true,
        message: 'Recording session stopped',
        data: recordingSession
      });
    } catch (error) {
      Logger.error('Stop recording session error:', error);
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new ProjectController();