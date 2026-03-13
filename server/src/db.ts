import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
}

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Log administrative activity to the database
 */
export const logActivity = async (userId: string | null, action: string, metadata: any = {}) => {
  try {
    await supabase.from('activity_logs').insert([{
      user_id: userId,
      action,
      metadata
    }]);
  } catch (err) {
    console.error("Activity Logging Error:", err);
  }
};
