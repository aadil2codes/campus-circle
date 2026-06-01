-- SQL Schema for CampusCircle Posts and Comments Tables
-- Run this in your Supabase SQL Editor (https://supabase.com) to initialize!

-- 1. Create the Posts Table linking to auth.users securely
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    category VARCHAR(100) NOT NULL, -- e.g., '#placement-prep', '#academic-notes', '#hackathons', '#campus-life'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create the Comments Table linking to posts and auth.users
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Indexes for High Performance Querying
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON public.comments(created_at ASC);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies for Posts Table

-- Policy A: Allow all authenticated users to read posts
CREATE POLICY "Allow authenticated select posts"
ON public.posts
FOR SELECT
TO authenticated
USING (true);

-- Policy B: Allow authenticated users to insert their own posts
CREATE POLICY "Allow authenticated insert own posts"
ON public.posts
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy C: Allow authenticated users to update/delete their own posts
CREATE POLICY "Allow authenticated update/delete own posts"
ON public.posts
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);


-- 6. Create RLS Policies for Comments Table

-- Policy A: Allow all authenticated users to read comments
CREATE POLICY "Allow authenticated select comments"
ON public.comments
FOR SELECT
TO authenticated
USING (true);

-- Policy B: Allow authenticated users to insert their own comments
CREATE POLICY "Allow authenticated insert own comments"
ON public.comments
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy C: Allow authenticated users to update/delete their own comments
CREATE POLICY "Allow authenticated update/delete own comments"
ON public.comments
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
