const { createClient } = require('@supabase/supabase-js');
const { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY } = require('./server-config');

// Client for frontend operations (with RLS)
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Admin client for backend operations (bypasses RLS)
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

module.exports = {
  supabaseClient,
  supabaseAdmin
};