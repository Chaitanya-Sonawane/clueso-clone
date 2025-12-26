-- Demo Tables for Clueso Collaboration Features
-- Run this SQL in your Supabase database to create the necessary tables

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'active',
    visibility VARCHAR(50) DEFAULT 'private',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Demo comments table
CREATE TABLE IF NOT EXISTS demo_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    demo_id VARCHAR(255) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    comment TEXT NOT NULL,
    timestamp DECIMAL(10,3) DEFAULT 0,
    ai_generated BOOLEAN DEFAULT FALSE,
    resolved BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Demo languages table
CREATE TABLE IF NOT EXISTS demo_languages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    demo_id VARCHAR(255) NOT NULL,
    language VARCHAR(10) NOT NULL,
    subtitles JSONB NOT NULL DEFAULT '[]',
    translated_title VARCHAR(500),
    translated_summary TEXT,
    cta_text JSONB DEFAULT '{}',
    translation_quality DECIMAL(3,2) DEFAULT 0.0,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(demo_id, language)
);

-- AI reviews table
CREATE TABLE IF NOT EXISTS ai_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    demo_id VARCHAR(255) NOT NULL,
    overall_score DECIMAL(3,1) DEFAULT 0.0,
    insights JSONB DEFAULT '[]',
    suggestions JSONB DEFAULT '[]',
    status VARCHAR(50) DEFAULT 'pending',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Demo sessions table (for tracking recording sessions)
CREATE TABLE IF NOT EXISTS demo_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(255) UNIQUE NOT NULL,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(500),
    description TEXT,
    status VARCHAR(50) DEFAULT 'recording',
    duration INTEGER DEFAULT 0,
    file_paths JSONB DEFAULT '{}',
    transcription JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Collaboration invites table
CREATE TABLE IF NOT EXISTS collaboration_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    demo_id VARCHAR(255) NOT NULL,
    inviter_id UUID REFERENCES users(id) ON DELETE CASCADE,
    invitee_email VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'viewer',
    status VARCHAR(50) DEFAULT 'pending',
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_demo_comments_demo_id ON demo_comments(demo_id);
CREATE INDEX IF NOT EXISTS idx_demo_comments_user_id ON demo_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_demo_comments_timestamp ON demo_comments(timestamp);
CREATE INDEX IF NOT EXISTS idx_demo_languages_demo_id ON demo_languages(demo_id);
CREATE INDEX IF NOT EXISTS idx_demo_languages_language ON demo_languages(language);
CREATE INDEX IF NOT EXISTS idx_ai_reviews_demo_id ON ai_reviews(demo_id);
CREATE INDEX IF NOT EXISTS idx_demo_sessions_session_id ON demo_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_demo_sessions_project_id ON demo_sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_invites_demo_id ON collaboration_invites(demo_id);

-- Add RLS (Row Level Security) policies
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo_languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaboration_invites ENABLE ROW LEVEL SECURITY;

-- Projects policies
CREATE POLICY "Users can view their own projects" ON projects
    FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can create projects" ON projects
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own projects" ON projects
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own projects" ON projects
    FOR DELETE USING (auth.uid() = owner_id);

-- Demo comments policies (allow viewing all comments for collaboration)
CREATE POLICY "Anyone can view demo comments" ON demo_comments
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create comments" ON demo_comments
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own comments" ON demo_comments
    FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

-- Demo languages policies
CREATE POLICY "Anyone can view demo languages" ON demo_languages
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create languages" ON demo_languages
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- AI reviews policies
CREATE POLICY "Anyone can view AI reviews" ON ai_reviews
    FOR SELECT USING (true);

CREATE POLICY "System can create AI reviews" ON ai_reviews
    FOR INSERT WITH CHECK (true);

-- Demo sessions policies
CREATE POLICY "Users can view demo sessions for their projects" ON demo_sessions
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM projects WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can create demo sessions for their projects" ON demo_sessions
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT id FROM projects WHERE owner_id = auth.uid()
        )
    );

-- Collaboration invites policies
CREATE POLICY "Users can view invites for their demos" ON collaboration_invites
    FOR SELECT USING (auth.uid() = inviter_id);

CREATE POLICY "Users can create collaboration invites" ON collaboration_invites
    FOR INSERT WITH CHECK (auth.uid() = inviter_id);

-- Create functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_demo_comments_updated_at BEFORE UPDATE ON demo_comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_demo_languages_updated_at BEFORE UPDATE ON demo_languages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_reviews_updated_at BEFORE UPDATE ON ai_reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_demo_sessions_updated_at BEFORE UPDATE ON demo_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collaboration_invites_updated_at BEFORE UPDATE ON collaboration_invites
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();