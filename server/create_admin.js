const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

// Load env from the same pattern as the main server
const envPath = path.join(__dirname, '.env');
const parentEnvPath = path.join(__dirname, '../.env');
dotenv.config({ path: envPath });
dotenv.config({ path: parentEnvPath });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAdmin() {
  const adminPhone = process.env.ADMIN_PHONE_NUMBER;
  const adminName = process.env.ADMIN_NAME || 'System Admin';
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminNationalId = process.env.ADMIN_NATIONAL_ID;

  if (!adminPhone || !adminPassword) {
    console.error('Error: ADMIN_PHONE_NUMBER and ADMIN_PASSWORD must be set in .env');
    process.exit(1);
  }

  console.log(`Creating/Updating admin: ${adminName} (${adminPhone})...`);

  try {
    // 1. Check if user exists in Auth
    const { data: listUsers, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw listError;
    
    let existing = listUsers.users.find(u => u.phone === adminPhone || (adminEmail && u.email === adminEmail));
    let userId;

    if (existing) {
      console.log(`Admin user already exists in Auth (ID: ${existing.id}). Proceeding to sync DB...`);
      userId = existing.id;
    } else {
      console.log('Creating new Admin in Auth...');
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        phone: adminPhone,
        email: adminEmail,
        password: adminPassword,
        phone_confirm: true,
        user_metadata: { full_name: adminName }
      });

      if (authError) throw authError;
      userId = authUser.user.id;
      console.log('Admin auth account created.');
    }

    const hash = await bcrypt.hash(adminPassword, 10);

    // 2. Create/Update in public.users table
    const { error: dbError } = await supabase
      .from('users')
      .upsert({
        id: userId,
        full_name: adminName,
        phone_number: adminPhone,
        password_hash: hash,
        national_id: adminNationalId,
        role: 'admin',
        status: 'active'
      }, { onConflict: 'id' });

    if (dbError) throw dbError;

    console.log('Admin database record synchronized successfully.');
    console.log('Seeding complete.');
  } catch (error) {
    console.error('Error seeding admin:', error.message);
    process.exit(1);
  }
}

createAdmin();
