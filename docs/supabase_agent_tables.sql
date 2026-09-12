-- ====================================================================
-- ENTE WARD — WARD SAHAYAKAN AGENT LOGGING TABLES & SECURITY POLICIES
-- ====================================================================

-- 1. AGENT RUNS TABLE
CREATE TABLE IF NOT EXISTS public.agent_runs (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    conversation_id TEXT,
    user_input TEXT NOT NULL,
    intent TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('started', 'running', 'completed', 'failed')),
    final_response TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- 2. AGENT TOOL CALLS TABLE
-- CRITICAL: Uses agent_run_id (NOT run_id)
CREATE TABLE IF NOT EXISTS public.agent_tool_calls (
    id TEXT PRIMARY KEY,
    agent_run_id TEXT NOT NULL REFERENCES public.agent_runs(id) ON DELETE CASCADE,
    tool_name TEXT NOT NULL,
    input JSONB DEFAULT '{}'::jsonb,
    output JSONB DEFAULT '{}'::jsonb,
    status TEXT NOT NULL CHECK (status IN ('running', 'success', 'failed')),
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_agent_runs_user_id ON public.agent_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_runs_started_at ON public.agent_runs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_tool_calls_agent_run_id ON public.agent_tool_calls(agent_run_id);

-- 4. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_tool_calls ENABLE ROW LEVEL SECURITY;

-- Drop prior policies if recreating
DROP POLICY IF EXISTS "Users can read own agent runs" ON public.agent_runs;
DROP POLICY IF EXISTS "Users can insert agent runs" ON public.agent_runs;
DROP POLICY IF EXISTS "Users can update own agent runs" ON public.agent_runs;
DROP POLICY IF EXISTS "Users can read tool calls for own runs" ON public.agent_tool_calls;
DROP POLICY IF EXISTS "Users can insert tool calls" ON public.agent_tool_calls;

-- Policies for agent_runs
CREATE POLICY "Users can read own agent runs"
ON public.agent_runs FOR SELECT
TO authenticated, anon
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert agent runs"
ON public.agent_runs FOR INSERT
TO authenticated, anon
WITH CHECK (true);

CREATE POLICY "Users can update own agent runs"
ON public.agent_runs FOR UPDATE
TO authenticated, anon
USING (true);

-- Policies for agent_tool_calls
CREATE POLICY "Users can read tool calls for own runs"
ON public.agent_tool_calls FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "Users can insert tool calls"
ON public.agent_tool_calls FOR INSERT
TO authenticated, anon
WITH CHECK (true);
