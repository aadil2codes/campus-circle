-- SQL Schema for TechLeaders.in Onboarding Application

-- 1. Create the Applications Table
CREATE TABLE IF NOT EXISTS public.applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(255) NOT NULL,
    work_email VARCHAR(255) NOT NULL UNIQUE,
    title VARCHAR(100) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    company_size VARCHAR(50) NOT NULL,
    linkedin_url VARCHAR(500) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    rejected_at TIMESTAMP WITH TIME ZONE
);

-- 2. Create Indexes for Quick Lookups and Administration
CREATE INDEX IF NOT EXISTS idx_applications_work_email ON public.applications(work_email);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON public.applications(created_at);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- 4. Create Security Policies

-- Policy A: Allow anyone (anonymous public visitors) to submit applications (INSERT)
CREATE POLICY "Allow public submissions" 
ON public.applications 
FOR INSERT 
TO public 
WITH CHECK (true);

-- Policy B: Allow only authenticated admins to view applications (SELECT)
CREATE POLICY "Allow only admins to view applications" 
ON public.applications 
FOR SELECT 
TO authenticated 
USING (true);

-- Policy C: Allow only authenticated admins to approve/reject applications (UPDATE)
CREATE POLICY "Allow only admins to update applications" 
ON public.applications 
FOR UPDATE 
TO authenticated 
USING (true)
WITH CHECK (true);

-- 5. Add triggers to automatically update approved_at / rejected_at upon status changes (Optional Admin Convenience)
CREATE OR REPLACE FUNCTION trigger_update_application_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
        NEW.approved_at = timezone('utc'::text, now());
    ELSIF NEW.status = 'rejected' AND OLD.status != 'rejected' THEN
        NEW.rejected_at = timezone('utc'::text, now());
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER tr_applications_status_update
    BEFORE UPDATE ON public.applications
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_application_status();
