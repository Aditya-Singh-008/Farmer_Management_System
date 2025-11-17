// supabase.js – Browser-safe version using global UMD bundle
//
// Load Supabase before this script:
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

const SUPABASE_CONFIG =
  window.__SUPABASE_CONFIG__ || {
    url: (window.__ENV && window.__ENV.SUPABASE_URL) || '',
    anonKey: (window.__ENV && window.__ENV.SUPABASE_ANON_KEY) || '',
  };

const SUPABASE_URL = SUPABASE_CONFIG.url;
const SUPABASE_ANON_KEY = SUPABASE_CONFIG.anonKey;

// Create the global Supabase client only if supabase is available
if (typeof supabase !== 'undefined') {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn(
      '[Supabase] Missing URL or anon key. Inject window.__SUPABASE_CONFIG__ before loading supabase.js.'
    );
  } else {
    const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    window.supabase = supabaseClient;
    console.log('Supabase client initialized (browser UMD version)');
  }
} else {
  console.warn(
    "Supabase library not loaded. Please include: <script src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'></script>"
  );
  // Create a dummy client to prevent errors
  window.supabase = {
    auth: {},
    from: () => ({ select: () => Promise.resolve({ data: [], error: null }) }),
    storage: {},
  };
}
