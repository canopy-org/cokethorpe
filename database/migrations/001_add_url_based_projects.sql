-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    project_name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Add project_id to json_submissions if it doesn't exist
ALTER TABLE json_submissions 
ADD COLUMN IF NOT EXISTS project_id INTEGER REFERENCES projects(id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_json_submissions_project_id ON json_submissions(project_id);

-- Insert default project
INSERT INTO projects (project_name, description) VALUES 
    ('default', 'Default project for uncategorized data')
ON CONFLICT (project_name) DO NOTHING;

-- Assign all existing data to default project
UPDATE json_submissions 
SET project_id = (SELECT id FROM projects WHERE project_name = 'default')
WHERE project_id IS NULL;