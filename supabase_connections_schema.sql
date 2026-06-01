-- ====================================================================
-- SUPABASE CONNECTIONS, CONVERSATIONS AND MESSAGING SCHEMAS
-- ====================================================================

-- 1. TABLE: connections (Handles relationship requests & friends state)
CREATE TABLE IF NOT EXISTS public.connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'rejected'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Prevent sending connection requests to oneself
  CONSTRAINT chk_no_self_connect CHECK (sender_id <> receiver_id),
  
  -- Restrict status values
  CONSTRAINT chk_connection_status CHECK (status IN ('pending', 'accepted', 'rejected')),
  
  -- Prevent duplicate requests between two users
  CONSTRAINT unique_connections_sender_receiver UNIQUE (sender_id, receiver_id)
);

-- 2. TABLE: conversations (Aggregates dialogue channels)
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user2_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  is_connected BOOLEAN DEFAULT false NOT NULL,
  free_message_count INTEGER DEFAULT 0 NOT NULL, -- tracks un-connected messages (max 2)
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Enforce UUID sorting: user1_id MUST be lexicographically smaller than user2_id
  -- This guarantees exactly ONE unique row exists for any two users, regardless of order.
  CONSTRAINT chk_user_sorting CHECK (user1_id < user2_id),
  
  -- Prevent duplicate conversation threads between the same two users
  CONSTRAINT unique_conversation_pairs UNIQUE (user1_id, user2_id)
);

-- 3. TABLE: messages (Stores individual message records)
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ====================================================================
-- RAPID SEARCH INDEXES
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_connections_composite ON public.connections (sender_id, receiver_id, status);
CREATE INDEX IF NOT EXISTS idx_conversations_user1 ON public.conversations (user1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user2 ON public.conversations (user2_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages (conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages (created_at DESC);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) ENABLEMENT
-- ====================================================================
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- ====================================================================
-- ROW LEVEL SECURITY POLICIES
-- ====================================================================

-- Connections policies:
-- Users can see connection rows they are a part of (sender or receiver)
CREATE POLICY "Allow users to view their own connections" 
  ON public.connections FOR SELECT 
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Any authenticated user can initiate a request
CREATE POLICY "Allow users to initiate connection requests" 
  ON public.connections FOR INSERT 
  WITH CHECK (auth.uid() = sender_id);

-- ONLY the receiver of a connection request can update the status (Accept / Reject)
CREATE POLICY "Allow receivers to accept or reject requests" 
  ON public.connections FOR UPDATE 
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

-- Users can retract requests or delete connections
CREATE POLICY "Allow users to delete or retract connections" 
  ON public.connections FOR DELETE 
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Conversations policies:
-- Users can read conversations they are a part of
CREATE POLICY "Allow users to view their own conversations" 
  ON public.conversations FOR SELECT 
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Users can insert/create conversations they are a part of
CREATE POLICY "Allow users to create conversations they belong to" 
  ON public.conversations FOR INSERT 
  WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Users can update conversations they are a part of
CREATE POLICY "Allow users to update conversations they belong to" 
  ON public.conversations FOR UPDATE 
  USING (auth.uid() = user1_id OR auth.uid() = user2_id)
  WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Messages policies:
-- Users can read messages if they are part of the parent conversation
CREATE POLICY "Allow users to read messages in their conversations" 
  ON public.messages FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c 
      WHERE c.id = conversation_id 
        AND (auth.uid() = c.user1_id OR auth.uid() = c.user2_id)
    )
  );

-- Users can send messages in their conversations
CREATE POLICY "Allow users to send messages in their conversations" 
  ON public.messages FOR INSERT 
  WITH CHECK (
    auth.uid() = sender_id 
    AND EXISTS (
      SELECT 1 FROM public.conversations c 
      WHERE c.id = conversation_id 
        AND (auth.uid() = c.user1_id OR auth.uid() = c.user2_id)
    )
  );
