// supabase.js — Browser-safe version using global UMD bundle

// ✅ Load Supabase library globally (must come before this script in HTML)
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

const SUPABASE_URL = "https://bmdypirsqwhghrvbhqoy.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtZHlwaXJzcXdoZ2hydmJocW95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4MjE5NzcsImV4cCI6MjA3NTM5Nzk3N30.2Mea6l7pn1l-qw28Nxk_m2weMajWlbca0M-ZybMs2xg"; // 🔑 replace with your anon key from Supabase

// Create the global Supabase client
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Make it available everywhere
window.supabase = supabaseClient;

console.log("✅ Supabase client initialized (browser UMD version)");