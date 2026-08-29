-- ====================================================================
-- Smart Farmer Management System (SFMS) - Complete Database Schema
-- Run this script in your Supabase SQL Editor for Project: utrqtyocuziqsxwborup
-- ====================================================================

-- 1. Users Table (Maps to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) DEFAULT 'farmer',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. User Profile Table
CREATE TABLE IF NOT EXISTS public.user_profile (
    profile_id SERIAL PRIMARY KEY,
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255),
    phone_number VARCHAR(15),
    address_line1 TEXT,
    address_line2 TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(15),
    country VARCHAR(100),
    dob DATE,
    gender VARCHAR(20),
    profile_picture TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Farms / Fields Table
CREATE TABLE IF NOT EXISTS public.farms (
    farm_id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    farm_name VARCHAR(255) NOT NULL,
    latitude NUMERIC(10, 6),
    longitude NUMERIC(10, 6),
    area NUMERIC(10, 2),
    soil_type VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Crops Table
CREATE TABLE IF NOT EXISTS public.crops (
    crop_id SERIAL PRIMARY KEY,
    farm_id INT REFERENCES public.farms(farm_id) ON DELETE CASCADE,
    crop_name VARCHAR(255) NOT NULL,
    crop_type VARCHAR(100),
    crop_variety VARCHAR(100),
    sowing_date DATE,
    expected_harvest DATE,
    area NUMERIC(10, 2),
    soil_type VARCHAR(100),
    status VARCHAR(50) DEFAULT 'planted',
    expected_yield NUMERIC(10, 2),
    actual_yield NUMERIC(10, 2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Inputs / Inventory Catalog
CREATE TABLE IF NOT EXISTS public.inputs (
    input_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    unit VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Inventory Table
CREATE TABLE IF NOT EXISTS public.inventory (
    inventory_id SERIAL PRIMARY KEY,
    farm_id INT REFERENCES public.farms(farm_id) ON DELETE CASCADE,
    input_id INT REFERENCES public.inputs(input_id) ON DELETE SET NULL,
    quantity NUMERIC(10, 2) DEFAULT 0,
    unit VARCHAR(50),
    added_on TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Marketplace Listings Table
CREATE TABLE IF NOT EXISTS public.marketplace_listings (
    listing_id SERIAL PRIMARY KEY,
    farm_id INT REFERENCES public.farms(farm_id) ON DELETE CASCADE,
    crop_id INT REFERENCES public.crops(crop_id) ON DELETE CASCADE,
    price_per_unit NUMERIC(10, 2) NOT NULL,
    available_qty NUMERIC(10, 2) NOT NULL,
    harvest_date DATE,
    status VARCHAR(50) DEFAULT 'active',
    notes TEXT,
    listed_on TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    order_id SERIAL PRIMARY KEY,
    listing_id INT REFERENCES public.marketplace_listings(listing_id) ON DELETE CASCADE,
    buyer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    quantity NUMERIC(10, 2) NOT NULL,
    total_price NUMERIC(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Tasks Table
CREATE TABLE IF NOT EXISTS public.tasks (
    task_id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    field VARCHAR(255),
    due_date DATE,
    notes TEXT,
    status VARCHAR(50) DEFAULT 'scheduled',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS) Enablement
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Permissive RLS Policies for authenticated users (customizable based on role)
CREATE POLICY "Allow individual read/write access on profile" ON public.user_profile
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow user access on farms" ON public.farms
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow user access on crops" ON public.crops
    FOR ALL USING (farm_id IN (SELECT farm_id FROM public.farms WHERE user_id = auth.uid()))
    WITH CHECK (farm_id IN (SELECT farm_id FROM public.farms WHERE user_id = auth.uid()));

CREATE POLICY "Allow public active marketplace read" ON public.marketplace_listings
    FOR SELECT USING (status = 'active' OR farm_id IN (SELECT farm_id FROM public.farms WHERE user_id = auth.uid()));

CREATE POLICY "Allow farmer edit marketplace" ON public.marketplace_listings
    FOR ALL USING (farm_id IN (SELECT farm_id FROM public.farms WHERE user_id = auth.uid()));

CREATE POLICY "Allow user access on tasks" ON public.tasks
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Automatic Auth Sync Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profile (user_id, first_name, last_name, email)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'first_name', 'Farmer'),
    COALESCE(new.raw_user_meta_data->>'last_name', 'User'),
    new.email
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
