const { supabaseAdmin } = require('../config/supabase');
const { Logger } = require('../config');

class ProjectService {
  async createProject(projectData) {
    try {
      const { data, error } = await supabaseAdmin
        .from('projects')
        .insert([projectData])
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create project: ${error.message}`);
      }

      return data;
    } catch (error) {
      Logger.error('ProjectService.createProject error:', error);
      throw error;
    }
  }

  async getUserProjects(userId) {
    try {
      const { data, error } = await supabaseAdmin
        .from('projects')
        .select(`
          *,
          recording_sessions(
            id,
            session_name,
            status,
            start_time,
            end_time,
            duration
          )
        `)
        .eq('owner_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to get user projects: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      Logger.error('ProjectService.getUserProjects error:', error);
      throw error;
    }
  }

  async getProject(projectId, userId) {
    try {
      const { data, error } = await supabaseAdmin
        .from('projects')
        .select(`
          *,
          recording_sessions(
            id,
            session_name,
            status,
            start_time,
            end_time,
            duration,
            file_path,
            metadata
          )
        `)
        .eq('id', projectId)
        .eq('owner_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Project not found
        }
        throw new Error(`Failed to get project: ${error.message}`);
      }

      return data;
    } catch (error) {
      Logger.error('ProjectService.getProject error:', error);
      throw error;
    }
  }

  async updateProject(projectId, userId, updateData) {
    try {
      const { data, error } = await supabaseAdmin
        .from('projects')
        .update(updateData)
        .eq('id', projectId)
        .eq('owner_id', userId)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Project not found
        }
        throw new Error(`Failed to update project: ${error.message}`);
      }

      return data;
    } catch (error) {
      Logger.error('ProjectService.updateProject error:', error);
      throw error;
    }
  }

  async deleteProject(projectId, userId) {
    try {
      const { data, error } = await supabaseAdmin
        .from('projects')
        .delete()
        .eq('id', projectId)
        .eq('owner_id', userId)
        .select();

      if (error) {
        throw new Error(`Failed to delete project: ${error.message}`);
      }

      return data && data.length > 0;
    } catch (error) {
      Logger.error('ProjectService.deleteProject error:', error);
      throw error;
    }
  }

  async createRecordingSession(sessionData) {
    try {
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const recordingData = {
        ...sessionData,
        id: sessionId,
        status: 'active',
        start_time: new Date().toISOString(),
        metadata: {
          url: sessionData.url,
          viewport: sessionData.viewport,
          sessionId: sessionId
        }
      };

      const { data, error } = await supabaseAdmin
        .from('recording_sessions')
        .insert([recordingData])
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create recording session: ${error.message}`);
      }

      return data;
    } catch (error) {
      Logger.error('ProjectService.createRecordingSession error:', error);
      throw error;
    }
  }

  async stopRecordingSession(sessionId, userId) {
    try {
      const endTime = new Date().toISOString();
      
      // First get the session to calculate duration
      const { data: session, error: getError } = await supabaseAdmin
        .from('recording_sessions')
        .select('start_time, user_id')
        .eq('id', sessionId)
        .eq('user_id', userId)
        .single();

      if (getError) {
        if (getError.code === 'PGRST116') {
          return null; // Session not found
        }
        throw new Error(`Failed to get recording session: ${getError.message}`);
      }

      // Calculate duration in seconds
      const startTime = new Date(session.start_time);
      const duration = Math.floor((new Date(endTime) - startTime) / 1000);

      const { data, error } = await supabaseAdmin
        .from('recording_sessions')
        .update({
          status: 'completed',
          end_time: endTime,
          duration: duration
        })
        .eq('id', sessionId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to stop recording session: ${error.message}`);
      }

      return data;
    } catch (error) {
      Logger.error('ProjectService.stopRecordingSession error:', error);
      throw error;
    }
  }

  async getProjectRecordings(projectId) {
    try {
      const { data, error } = await supabaseAdmin
        .from('recording_sessions')
        .select(`
          *,
          files(
            id,
            filename,
            original_name,
            file_type,
            file_size,
            file_path,
            storage_url,
            created_at
          ),
          ai_analysis(
            id,
            analysis_type,
            result,
            confidence_score,
            created_at
          )
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to get project recordings: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      Logger.error('ProjectService.getProjectRecordings error:', error);
      throw error;
    }
  }

  async updateRecordingSession(sessionId, updateData) {
    try {
      const { data, error } = await supabaseAdmin
        .from('recording_sessions')
        .update(updateData)
        .eq('id', sessionId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update recording session: ${error.message}`);
      }

      return data;
    } catch (error) {
      Logger.error('ProjectService.updateRecordingSession error:', error);
      throw error;
    }
  }

  async saveRecordingFiles(sessionId, videoPath, audioPath) {
    try {
      const files = [];

      if (videoPath) {
        files.push({
          recording_session_id: sessionId,
          filename: `recording_${sessionId}_video.webm`,
          original_name: 'screen_recording.webm',
          file_type: 'video/webm',
          file_path: videoPath,
          metadata: { type: 'screen_recording' }
        });
      }

      if (audioPath) {
        files.push({
          recording_session_id: sessionId,
          filename: `recording_${sessionId}_audio.webm`,
          original_name: 'audio_recording.webm',
          file_type: 'audio/webm',
          file_path: audioPath,
          metadata: { type: 'audio_recording' }
        });
      }

      if (files.length > 0) {
        const { data, error } = await supabaseAdmin
          .from('files')
          .insert(files)
          .select();

        if (error) {
          throw new Error(`Failed to save recording files: ${error.message}`);
        }

        return data;
      }

      return [];
    } catch (error) {
      Logger.error('ProjectService.saveRecordingFiles error:', error);
      throw error;
    }
  }
}

module.exports = new ProjectService();