-- Create hooks table
CREATE TABLE IF NOT EXISTS hooks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create logos table
CREATE TABLE IF NOT EXISTS logos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  size INTEGER,
  mime_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create hook_files table to group hooks by file
CREATE TABLE IF NOT EXISTS hook_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, file_name)
);

-- Add foreign key to hooks table
ALTER TABLE hooks 
ADD COLUMN file_id UUID REFERENCES hook_files(id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX idx_hooks_user_id ON hooks(user_id);
CREATE INDEX idx_hooks_file_id ON hooks(file_id);
CREATE INDEX idx_logos_user_id ON logos(user_id);
CREATE INDEX idx_hook_files_user_id ON hook_files(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE hooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE logos ENABLE ROW LEVEL SECURITY;
ALTER TABLE hook_files ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for hooks
CREATE POLICY "Users can view their own hooks" ON hooks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own hooks" ON hooks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own hooks" ON hooks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own hooks" ON hooks
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for logos
CREATE POLICY "Users can view their own logos" ON logos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own logos" ON logos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own logos" ON logos
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own logos" ON logos
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for hook_files
CREATE POLICY "Users can view their own hook files" ON hook_files
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own hook files" ON hook_files
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own hook files" ON hook_files
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own hook files" ON hook_files
  FOR DELETE USING (auth.uid() = user_id);

-- Add updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_hooks_updated_at BEFORE UPDATE ON hooks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_logos_updated_at BEFORE UPDATE ON logos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hook_files_updated_at BEFORE UPDATE ON hook_files
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();