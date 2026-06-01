-- SQL Schema for Reddit-Style College Social Network (CampusCircle)
-- Run this in your Supabase SQL Editor (https://supabase.com) to initialize!

-- 1. Drop old tables if they exist with CASCADE to guarantee a clean, unified migration
DROP TABLE IF EXISTS public.votes CASCADE;
DROP TABLE IF EXISTS public.comments CASCADE;
DROP TABLE IF EXISTS public.posts CASCADE;
DROP TABLE IF EXISTS public.communities CASCADE;

-- 2. Create the Communities Table
CREATE TABLE public.communities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    banner_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create the Posts Table referencing public.profiles(user_id) directly to enable the join relationship
CREATE TABLE public.posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL, -- Direct relation established!
    college_name VARCHAR(255) NOT NULL, -- Links directly to a community name (e.g. "IIT Bombay")
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL, -- Aligned to match the frontend select query
    category VARCHAR(255) NOT NULL DEFAULT '#general', -- Renders tags
    image_url TEXT, -- Client-side compressed Base64 JPEG string
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create the Comments Table referencing public.profiles(user_id) directly to enable the join relationship
CREATE TABLE public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL, -- Direct relation established!
    body TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create the Votes Table referencing public.profiles(user_id) directly (Reddit-style Upvote/Downvote System)
CREATE TABLE public.votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL, -- Direct relation established!
    vote_value INTEGER NOT NULL CHECK (vote_value IN (1, -1)), -- 1 for upvote, -1 for downvote
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_post_user_vote UNIQUE (post_id, user_id) -- ENFORCES SINGLE VOTE PER POST NATIVELY!
);

-- 6. Create Performance Indexing for Rapid Query Resolutions
CREATE INDEX idx_communities_slug ON public.communities(slug);
CREATE INDEX idx_posts_college_name ON public.posts(college_name);
CREATE INDEX idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX idx_comments_post_id ON public.comments(post_id);
CREATE INDEX idx_votes_post_user ON public.votes(post_id, user_id);

-- 7. Enable Row Level Security (RLS)
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS Policies for Communities
CREATE POLICY "Allow authenticated select communities"
ON public.communities FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert communities"
ON public.communities FOR INSERT TO authenticated WITH CHECK (true);

-- 9. Create RLS Policies for Posts
CREATE POLICY "Allow authenticated select posts"
ON public.posts FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert own posts"
ON public.posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow authenticated update/delete own posts"
ON public.posts FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 10. Create RLS Policies for Comments
CREATE POLICY "Allow authenticated select comments"
ON public.comments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert own comments"
ON public.comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow authenticated update/delete own comments"
ON public.comments FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 11. Create RLS Policies for Votes
CREATE POLICY "Allow authenticated select votes"
ON public.votes FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert own votes"
ON public.votes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow authenticated update/delete own votes"
ON public.votes FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- 12. Pre-seed Default College Communities
INSERT INTO public.communities (name, slug, description, banner_url) VALUES
('IIT Bombay', 'iit-bombay', 'The online community where IIT Bombay students actually interact.', 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)'),
('GGV Bilaspur', 'ggv-bilaspur', 'The online community where GGV Bilaspur students actually interact.', 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)'),
('NIT Raipur', 'nit-raipur', 'The online community where NIT Raipur students actually interact.', 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)'),
('IIIT Hyderabad', 'iiit-hyderabad', 'The online community where IIIT Hyderabad students actually interact.', 'linear-gradient(135deg, #db2777 0%, #be185d 100%)')
ON CONFLICT (name) DO NOTHING;
