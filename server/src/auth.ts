import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase, logActivity } from './db';
import { requireAuth, requireAdmin } from './middleware';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

// Public Registration
router.post('/register', async (req: Request, res: Response): Promise<any> => {
  try {
    const { full_name, phone_number, email, national_id, password } = req.body;
    
    if (!full_name || !phone_number || !password || !national_id) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    const hash = await bcrypt.hash(password, 10);

    // 1. Create in auth.users first
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      phone: phone_number,
      password: password,
      user_metadata: { full_name, national_id },
      email: email || undefined,
      phone_confirm: false // We need them to verify via OTP later
    });

    if (authError) {
      return res.status(400).json({ error: authError.message || 'Auth system error' });
    }

    const { data: userData, error } = await supabase
      .from('users')
      .insert([{
        id: authData.user.id,
        full_name,
        email: email || null,
        phone_number,
        password_hash: hash,
        national_id,
        role: 'user',
        is_phone_verified: false
      }])
      .select('id, full_name, phone_number, role, national_id, email, is_phone_verified')
      .single();

    if (error) {
      console.error("Database Insert Error:", error);
      await supabase.auth.admin.deleteUser(authData.user.id); // Rollback
      if (error.code === '23505') return res.status(409).json({ error: 'User (phone, email, or national ID) already exists' });
      return res.status(500).json({ error: `Database error: ${error.message}` });
    }

    return res.status(201).json({ message: 'User registered successfully. Please verify OTP.', user: userData });
  } catch (err) {
    console.error("Registration Error:", err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Admin ONLY: Construct users directly with specific roles
router.post('/admin/register', requireAuth, requireAdmin, async (req: any, res: Response): Promise<any> => {
  try {
    const { full_name, phone_number, email, national_id, password, role } = req.body;
    
    if (!full_name || !phone_number || !password || !national_id) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    const hash = await bcrypt.hash(password, 10);
    const userRole = role || 'user';

    // 1. Create in auth.users first
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      phone: phone_number,
      password: password,
      user_metadata: { full_name, national_id },
      email: email || undefined,
      phone_confirm: true // Admin created users are pre-verified
    });

    if (authError) {
      return res.status(400).json({ error: authError.message || 'Auth system error' });
    }

    const { data: userData, error } = await supabase
      .from('users')
      .insert([{
        id: authData.user.id,
        full_name,
        email: email || null,
        phone_number,
        password_hash: hash,
        national_id,
        role: userRole,
        is_phone_verified: true
      }])
      .select('id, full_name, phone_number, role, national_id, email, is_phone_verified')
      .single();

    if (error) {
      await supabase.auth.admin.deleteUser(authData.user.id); // Rollback
      if (error.code === '23505') return res.status(409).json({ error: 'User already exists' });
      return res.status(500).json({ error: 'Database error' });
    }

    await logActivity(req.user.id, 'ADMIN_REGISTER_USER', { target_user_id: authData.user.id, role: userRole });

    return res.status(201).json({ message: 'User created successfully', user: userData });
  } catch (err) {
    console.error("Admin Registration Error", err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Login route (Accepts Phone OR Email)
router.post('/login', async (req: Request, res: Response): Promise<any> => {
  try {
    const { identifier, password } = req.body; // Can be phone or email
    if (!identifier || !password) return res.status(400).json({ error: 'Email/Phone and password required' });

    // Find user in local DB
    const cleanIdentifier = identifier.trim();
    const isEmail = cleanIdentifier.includes('@');
    
    // Using a more robust query for the identifier
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .or(`phone_number.eq."${cleanIdentifier}",email.ilike."${cleanIdentifier}"`)
      .maybeSingle();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Attempt Sign In with Supabase strictly via password
    const authPayload = isEmail 
      ? { email: user.email!, password }
      : { phone: user.phone_number!, password };
      
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword(authPayload);
    
    // Fallback: If they haven't set up Supabase properly but exist in users, fallback to local hash check
    if (signInError) {
        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Set HttpOnly jwt cookie (Our system relies heavily on this server-side pattern)
    const token = jwt.sign({ 
        id: user.id, 
        phone_number: user.phone_number, 
        role: user.role,
        is_phone_verified: user.is_phone_verified
    }, JWT_SECRET, {
      expiresIn: '7d',
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' && req.secure, // Only secure if production AND https
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return res.json({ 
      message: 'Logged in successfully', 
      user: { id: user.id, name: user.full_name, role: user.role, is_phone_verified: user.is_phone_verified },
      supabase_session: signInData?.session || null
    });
  } catch (err) {
    console.error("Login Error", err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Rely on Supabase Auth native OTP for Phone Verification 
router.post('/send-otp', async (req: Request, res: Response): Promise<any> => {
  try {
    const { phone_number } = req.body;
    if (!phone_number) return res.status(400).json({ error: 'Phone number required' });

    // Triggers our custom SMS edge function hook on the Supabase side
    const { error } = await supabase.auth.signInWithOtp({
        phone: phone_number
    });

    if (error) {
        return res.status(400).json({ error: error.message });
    }

    return res.json({ message: 'OTP sent successfully' });
  } catch (err) {
    console.error("Send OTP Error", err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Verify OTP via Supabase Native Auth
router.post('/verify-otp', async (req: Request, res: Response): Promise<any> => {
  try {
    const { phone_number, code } = req.body;
    if (!phone_number || !code) return res.status(400).json({ error: 'Phone number and code required' });

    const { data: authData, error } = await supabase.auth.verifyOtp({
        phone: phone_number,
        token: code,
        type: 'sms'
    });

    if (error || !authData.user) {
        return res.status(400).json({ error: error?.message || 'Invalid OTP code' });
    }

    // Mark as verified in our DB
    await supabase.from('users').update({ 
      is_phone_verified: true, 
    }).eq('id', authData.user.id);

    return res.json({ message: 'Phone number verified successfully' });
  } catch (err) {
    console.error("Verify OTP Error", err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Reset Password via OTP
router.post('/reset-password', async (req: Request, res: Response): Promise<any> => {
  try {
    const { phone_number, code, new_password } = req.body;
    if (!phone_number || !code || !new_password) {
      return res.status(400).json({ error: 'Phone number, code, and new password required' });
    }

    // 1. Verify OTP first
    const { data: authData, error: verifyError } = await supabase.auth.verifyOtp({
      phone: phone_number,
      token: code,
      type: 'sms'
    });

    if (verifyError || !authData.user) {
      return res.status(400).json({ error: verifyError?.message || 'Invalid or expired OTP' });
    }

    // 2. Update password in auth.users
    const { error: authUpdateError } = await supabase.auth.admin.updateUserById(authData.user.id, {
      password: new_password
    });

    if (authUpdateError) {
      return res.status(500).json({ error: 'Failed to update auth password' });
    }

    // 3. Update local hash in public.users
    const hash = await bcrypt.hash(new_password, 10);
    const { error: dbUpdateError } = await supabase
      .from('users')
      .update({ password_hash: hash, is_phone_verified: true })
      .eq('id', authData.user.id);

    if (dbUpdateError) {
      console.error("Local password update error:", dbUpdateError);
    }

    return res.json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error("Reset Password Error", err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Setup Cookie Restoration Endpoint (Session Persistence Pattern)
router.get('/me', requireAuth, async (req: any, res: Response): Promise<any> => {
    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('id, full_name, email, phone_number, national_id, role, created_at, is_phone_verified')
            .eq('id', req.user.id)
            .single();

        if (error) {
            console.error("Session User Fetch Error:", error);
            return res.status(500).json({ error: 'Failed to fetch user session data' });
        }
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        return res.json({ user });
    } catch (err) {
        return res.status(500).json({ error: 'Server error' });
    }
});


// Profile update route
router.put('/me', requireAuth, async (req: any, res: Response): Promise<any> => {
  try {
    const { full_name, email, national_id } = req.body;
    
    // Explicitly don't allow modifying role, is_phone_verified, or phone_number through this basic update
    const { error } = await supabase
      .from('users')
      .update({ full_name, email, national_id })
      .eq('id', req.user.id);

    if (error) return res.status(500).json({ error: 'Failed to update user profile' });
    
    return res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});


// Admin ONLY: Fetch all users
router.get('/', requireAuth, requireAdmin, async (req: Request, res: Response): Promise<any> => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, full_name, email, phone_number, national_id, role, created_at, is_phone_verified')
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: 'Failed to fetch users' });
    return res.json(users);
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// Admin ONLY: Update user status or role
router.put('/admin/users/:id', requireAuth, requireAdmin, async (req: any, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const { role, status } = req.body;

    if (id === req.user.id) {
      return res.status(400).json({ error: 'Cannot modify your own administrative status' });
    }

    const { data: userData, error } = await supabase
      .from('users')
      .update({ role, status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error("User Update Error:", error);
      return res.status(500).json({ error: 'Failed to update user' });
    }

    await logActivity(req.user.id, 'ADMIN_UPDATE_USER', { target_user_id: id, updates: { role, status } });

    return res.json({ message: 'User updated successfully', user: userData });
  } catch (err) {
    console.error("User Update Route Error:", err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Logout
router.post('/logout', (req: Request, res: Response): any => {
  res.clearCookie('token');
  return res.json({ message: 'Logged out' });
});

export default router;
