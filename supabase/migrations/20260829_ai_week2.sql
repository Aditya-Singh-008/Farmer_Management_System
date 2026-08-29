-- ====================================================================
-- Week 2 Gen AI: AI Yield Predictions Table
-- Run in Supabase SQL Editor for Project: utrqtyocuziqsxwborup
-- ====================================================================

-- Table to store AI yield predictions per crop
CREATE TABLE IF NOT EXISTS public.ai_yield_predictions (
    id SERIAL PRIMARY KEY,
    crop_id INT REFERENCES public.crops(crop_id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    predicted_min NUMERIC(10, 2),
    predicted_max NUMERIC(10, 2),
    confidence_pct INT CHECK (confidence_pct BETWEEN 0 AND 100),
    risks JSONB DEFAULT '[]',
    tips JSONB DEFAULT '[]',
    growth_stages JSONB DEFAULT '[]',
    summary TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.ai_yield_predictions ENABLE ROW LEVEL SECURITY;

-- Only the owner can read/write their predictions
CREATE POLICY "Users can manage their own AI yield predictions"
    ON public.ai_yield_predictions
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Index for fast lookup by crop
CREATE INDEX IF NOT EXISTS idx_ai_yield_predictions_crop_id
    ON public.ai_yield_predictions(crop_id);

-- Index for fast lookup by user
CREATE INDEX IF NOT EXISTS idx_ai_yield_predictions_user_id
    ON public.ai_yield_predictions(user_id);
