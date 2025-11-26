-- Add doctor comment fields to vital_signs_history table
ALTER TABLE vital_signs_history 
ADD COLUMN doctor_comment TEXT,
ADD COLUMN commented_at TIMESTAMP NULL,
ADD COLUMN commented_by VARCHAR(100);

-- Add indexes for better performance
CREATE INDEX idx_vital_signs_history_commented_at ON vital_signs_history(commented_at);
CREATE INDEX idx_vital_signs_history_commented_by ON vital_signs_history(commented_by);
