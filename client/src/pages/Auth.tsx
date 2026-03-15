import { useState } from 'react';
import axios from 'axios';
import { useLocation } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';

export default function Auth() {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<'login' | 'register' | 'verify' | 'forgot_password' | 'reset_password'>('login');

  // Form fields
  const [identifier, setIdentifier] = useState(''); // Email or Phone for login
  const [phone, setPhone] = useState(''); // Specific phone states for registration / OTP
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const [_, setLocation] = useLocation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccessMsg(''); setLoading(true);
    try {
      const res = await axios.post('/auth/login', { identifier, password });

      // Invalidate current user query to update global state
      await queryClient.invalidateQueries({ queryKey: ['me'] });

      if (res.data.user.role === 'admin' || res.data.user.role === 'operator') {
        setLocation('/admin');
      } else {
        setLocation('/dashboard'); // Correctly redirect users to their dashboard
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccessMsg(''); setLoading(true);
    try {
      await axios.post('/auth/register', {
        full_name: fullName,
        phone_number: phone,
        email,
        national_id: nationalId,
        password
      });
      setSuccessMsg('Registration successful. You can now log in with your credentials.');
      setMode('login');
      setPassword('');
      setIdentifier(phone || email);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccessMsg(''); setLoading(true);
    try {
      await axios.post('/auth/verify-otp', { phone_number: phone, code: otpCode });
      setMode('login');
      setSuccessMsg('Phone verified successfully. You can now log in.');
      setPassword('');
      setIdentifier(phone); // auto fill login identifier
    } catch (err: any) {
      setError(err.response?.data?.error || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccessMsg(''); setLoading(true);
    try {
      await axios.post('/auth/send-otp', { phone_number: phone });
      setMode('reset_password');
      setSuccessMsg('OTP sent to your phone for password reset.');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccessMsg(''); setLoading(true);
    try {
      await axios.post('/auth/reset-password', { phone_number: phone, code: otpCode, new_password: newPassword });
      setMode('login');
      setSuccessMsg('Password reset successfully. Please log in.');
      setPassword('');
      setOtpCode('');
      setIdentifier(phone);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Password reset failed');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] w-full py-12 px-4 sm:px-0">
      <div className="glass-effect p-8 rounded-2xl w-full max-w-md relative overflow-hidden shadow-2xl border border-white/10">
        {loading && <div className="absolute inset-0 bg-black/50 z-10 flex items-center justify-center backdrop-blur-sm"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div></div>}

        <h2 className="text-3xl font-bold mb-2 text-center tracking-tight">
          {mode === 'login' && 'Login'}
          {mode === 'register' && 'Register'}
          {mode === 'verify' && 'Verify Phone'}
          {mode === 'forgot_password' && 'Forgot Password'}
          {mode === 'reset_password' && 'Reset Password'}
        </h2>
        <p className="text-muted-foreground text-center mb-6 text-sm">SIMOTWET COFFEE SOCIETY Authentication</p>

        {error && <div className="bg-destructive/20 text-red-400 border border-destructive/30 p-3 rounded-lg mb-4 text-sm font-semibold">{error}</div>}
        {successMsg && <div className="bg-green-500/20 text-green-400 border border-green-500/30 p-3 rounded-lg mb-4 text-sm font-semibold">{successMsg}</div>}

        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
              <label className="block text-sm font-medium mb-1">Email or Phone Number</label>
              <input type="text" className="w-full p-3 rounded-lg bg-black/40 border border-white/20 focus:ring-2 ring-primary outline-none text-white focus:bg-black/60 transition-all font-mono" placeholder="Email or Phone (+254...)" value={identifier} onChange={e => setIdentifier(e.target.value)} required />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium">Password</label>
                <button type="button" onClick={() => { setMode('forgot_password'); setError(''); setSuccessMsg(''); }} className="text-xs text-primary hover:underline hover:text-white transition-colors">Forgot password?</button>
              </div>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} className="w-full p-3 rounded-lg bg-black/40 border border-white/20 focus:ring-2 ring-primary outline-none text-white focus:bg-black/60 transition-all font-mono pr-12" value={password} onChange={e => setPassword(e.target.value)} required />
                <button type="button" className="absolute right-3 top-3.5 text-muted-foreground hover:text-white text-sm font-bold tracking-wider transition-colors" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? "HIDE" : "SHOW"}
                </button>
              </div>
            </div>
            <button type="submit" className="w-full bg-primary text-black py-3 rounded-lg font-bold hover:brightness-110 active:scale-[98%] transition-all mt-4">
              Secure Authentication
            </button>
            <div className="text-center mt-6">
              <span className="text-muted-foreground text-sm">New here?, Create an account </span>
              <button type="button" onClick={() => { setMode('register'); setError(''); setSuccessMsg(''); }} className="text-white font-bold hover:underline transition-all">Sign Up</button>
            </div>
          </form>
        )}

        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
              <label className="block text-sm font-medium mb-1">Full Name</label>
              <input type="text" className="w-full p-3 rounded-lg bg-black/40 border border-white/20 focus:ring-2 ring-primary outline-none text-white focus:bg-black/60 transition-all" value={fullName} onChange={e => setFullName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone Number (+254...)</label>
              <input type="text" className="w-full p-3 rounded-lg bg-black/40 border border-white/20 focus:ring-2 ring-primary outline-none text-white focus:bg-black/60 transition-all font-mono" placeholder="+254700000000" value={phone} onChange={e => setPhone(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">National ID No</label>
              <input type="text" className="w-full p-3 rounded-lg bg-black/40 border border-white/20 focus:ring-2 ring-primary outline-none text-white focus:bg-black/60 transition-all font-mono" value={nationalId} onChange={e => setNationalId(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email <span className="text-muted-foreground">(Optional)</span></label>
              <input type="email" className="w-full p-3 rounded-lg bg-black/40 border border-white/20 focus:ring-2 ring-primary outline-none text-white focus:bg-black/60 transition-all" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} className="w-full p-3 rounded-lg bg-black/40 border border-white/20 focus:ring-2 ring-primary outline-none text-white focus:bg-black/60 transition-all font-mono pr-12" value={password} onChange={e => setPassword(e.target.value)} required />
                <button type="button" className="absolute right-3 top-3.5 text-muted-foreground hover:text-white text-sm font-bold tracking-wider transition-colors" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? "HIDE" : "SHOW"}
                </button>
              </div>
            </div>
            <button type="submit" className="w-full bg-primary text-black py-3 rounded-lg font-bold hover:brightness-110 active:scale-[98%] transition-all mt-4 uppercase tracking-widest">
              Create Account
            </button>
            <div className="text-center mt-6">
              <span className="text-muted-foreground text-sm">Have an account? Login </span>
              <button type="button" onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); }} className="text-white font-bold hover:underline transition-all">Login</button>
            </div>
          </form>
        )}

        {mode === 'verify' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <p className="text-sm text-center mb-4 text-muted-foreground">We sent an OTP to {phone || 'your phone number'}. Enter it below.</p>
            <div>
              <label className="block text-sm font-medium mb-1">6-Digit OTP Code</label>
              <input type="text" maxLength={6} className="w-full p-4 rounded-lg bg-black/40 border border-white/20 focus:ring-2 ring-primary outline-none text-white focus:bg-black/60 transition-all font-mono text-center text-2xl tracking-[0.5em]" placeholder="------" value={otpCode} onChange={e => setOtpCode(e.target.value)} required />
            </div>
            <button type="submit" className="w-full bg-primary text-black py-3 rounded-lg font-bold hover:brightness-110 active:scale-[98%] transition-all mt-4">
              Confirm Identity
            </button>
            <div className="text-center mt-6 text-sm">
              <button type="button" onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); setPassword(''); }} className="text-muted-foreground hover:text-white transition-colors flex items-center justify-center gap-2 w-full"><span className="text-lg">&larr;</span> Back to login</button>
            </div>
          </form>
        )}

        {mode === 'forgot_password' && (
          <form onSubmit={handleForgotPassword} className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <p className="text-sm text-center mb-4 text-muted-foreground">Enter your registered phone number. We'll send an OTP to verify your identity before resetting.</p>
            <div>
              <label className="block text-sm font-medium mb-1">Registered Phone Number</label>
              <input type="text" className="w-full p-3 rounded-lg bg-black/40 border border-white/20 focus:ring-2 ring-primary outline-none text-white focus:bg-black/60 transition-all font-mono" placeholder="+254700000000" value={phone} onChange={e => setPhone(e.target.value)} required />
            </div>
            <button type="submit" className="w-full bg-primary text-black py-3 rounded-lg font-bold hover:brightness-110 active:scale-[98%] transition-all mt-4">
              Request Reset OTP
            </button>
            <div className="text-center mt-6 text-sm">
              <button type="button" onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); }} className="text-muted-foreground hover:text-white transition-colors flex items-center justify-center gap-2 w-full"><span className="text-lg">&larr;</span> Back to login</button>
            </div>
          </form>
        )}

        {mode === 'reset_password' && (
          <form onSubmit={handleResetPassword} className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
              <label className="block text-sm font-medium mb-1">6-Digit OTP Code</label>
              <input type="text" maxLength={6} className="w-full p-4 rounded-lg bg-black/40 border border-white/20 focus:ring-2 ring-primary outline-none text-white focus:bg-black/60 transition-all font-mono text-center text-xl tracking-[0.3em]" placeholder="------" value={otpCode} onChange={e => setOtpCode(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">New Password</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} className="w-full p-3 rounded-lg bg-black/40 border border-white/20 focus:ring-2 ring-primary outline-none text-white focus:bg-black/60 transition-all font-mono pr-12" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
                <button type="button" className="absolute right-3 top-3.5 text-muted-foreground hover:text-white text-sm font-bold tracking-wider transition-colors" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? "HIDE" : "SHOW"}
                </button>
              </div>
            </div>
            <button type="submit" className="w-full bg-primary text-black py-3 rounded-lg font-bold hover:brightness-110 active:scale-[98%] transition-all mt-4">
              Reset Password
            </button>
            <div className="text-center mt-6 text-sm">
              <button type="button" onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); }} className="text-muted-foreground hover:text-white transition-colors flex items-center justify-center gap-2 w-full"><span className="text-lg">&larr;</span> Back to login</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
