-- SQL Schema for CampusCircle Profiles Table
-- Run this in your Supabase SQL Editor (https://supabase.com) to initialize the profile tables!

-- 1. Create the Profiles Table linking to auth.users safely
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    username VARCHAR(100) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    college_name VARCHAR(255) NOT NULL,
    year VARCHAR(100) NOT NULL,
    branch VARCHAR(100) NOT NULL,
    graduation_year VARCHAR(50),
    interests TEXT[] NOT NULL DEFAULT '{}',
    instagram_url VARCHAR(255),
    linkedin_url VARCHAR(255),
    github_url VARCHAR(255),
    onboarding_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Indexes for Quick Lookups by user_id and username
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies

-- Policy A: Allow all authenticated users to select/read profiles
-- This is necessary to show member lists, directories, and community rosters.
CREATE POLICY "Allow authenticated select profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Policy B: Allow authenticated users to insert their own profile
CREATE POLICY "Allow authenticated insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy C: Allow authenticated users to update their own profile
CREATE POLICY "Allow authenticated update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
