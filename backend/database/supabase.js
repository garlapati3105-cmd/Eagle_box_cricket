const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://dummy.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'dummy-key';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
  console.warn('⚠️ Missing SUPABASE_URL or SUPABASE_KEY in environment variables. Database calls will fail.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
