import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useLocation } from 'wouter';
import { useState } from 'react';

export default function Dashboard() {
  const [_, setLocation] = useLocation();
  const [smsStatus, setSmsStatus] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState<'none' | 'sending' | 'input'>('none');

  const { data: user, isLoading: userLoading, error: userError } = useQuery<any, any>({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await axios.get('/auth/me');
      return res.data.user;
    },
    retry: false
  });

  const { data: deposits, isLoading: depositsLoading } = useQuery<any, any>({
    queryKey: ['deposits'],
    queryFn: async () => (await axios.get('/deposits')).data,
    enabled: !!user
  });

  const totalWeight = deposits?.reduce((acc: number, d: any) => acc + Number(d.weight_kg), 0) || 0;

  if (userLoading) return <div className="p-8 text-center text-xl font-bold animate-pulse text-primary">Loading Identity...</div>;

  if (userError || !user) {
    setLocation('/auth');
    return null;
  }

  const handleLogout = async () => {
    await axios.post('/auth/logout');
    setLocation('/');
  }

  const generateReport = async (type: string) => {
    const res = await axios.get(`/reports?type=${type}&scope=individual`);
    window.open(`${window.location.origin}${res.data.url}`, '_blank');
  };

  const requestSmsReport = async (type: string) => {
    setSmsStatus('Sending...');
    try {
      const res = await axios.post('/reports/send-sms-report', { type });
      setSmsStatus(res.data.message || 'SMS Sent!');
      setTimeout(() => setSmsStatus(''), 4000);
    } catch (err: any) {
      setSmsStatus(err.response?.data?.error || 'Failed to send SMS');
      setTimeout(() => setSmsStatus(''), 4000);
    }
  }

  const handleSendOtp = async () => {
    setStep('sending');
    try {
      await axios.post('/auth/send-otp', { phone_number: user.phone_number });
      setStep('input');
    } catch (err: any) {
      setSmsStatus(err.response?.data?.error || 'Failed to send OTP');
      setStep('none');
    }
  };

  const handleVerifyOtp = async () => {
    setVerifying(true);
    try {
      await axios.post('/auth/verify-otp', { phone_number: user.phone_number, code: otpCode });
      setSmsStatus('Phone Verified Successfully!');
      setStep('none');
      // @ts-ignore
      await axios.get('/auth/me'); // Trigger a refetch if needed or just use window.location.reload()
      window.location.reload(); 
    } catch (err: any) {
      setSmsStatus(err.response?.data?.error || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-bold mb-1 tracking-tight">Welcome, {user.full_name}</h1>
          <p className="text-muted-foreground flex items-center gap-2">
            Phone: {user.phone_number} 
            {user.is_phone_verified ? (
              <span className="bg-green-500/10 text-green-500 px-3 py-0.5 rounded-full text-xs font-bold border border-green-500/20 flex items-center gap-1">
                <span>✓</span> Verified
              </span>
            ) : (
              <span className="bg-yellow-500/10 text-yellow-500 px-3 py-0.5 rounded-full text-xs font-bold border border-yellow-500/20 flex items-center gap-1">
                <span>⚠️</span> Unverified
              </span>
            )}
          </p>
        </div>
        <button onClick={handleLogout} className="px-5 py-2.5 bg-destructive/10 text-destructive rounded-full font-bold hover:bg-destructive hover:text-white transition-all">
          Logout
        </button>
      </div>

      {!user.is_phone_verified && (
        <div className="bg-primary/10 border border-primary/20 p-6 rounded-3xl animate-in slide-in-from-top-4 duration-500">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="max-w-xl">
              <h3 className="text-xl font-bold mb-2">Enable Deposit Notifications</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Link and verify your phone number to receive instant SMS notifications whenever a coffee deposit is recorded for your account. This ensures you have real-time tracking of your produce.
              </p>
            </div>
            <div className="w-full md:w-auto shrink-0">
              {step === 'none' && (
                <button onClick={handleSendOtp} className="w-full md:w-auto px-8 py-3 bg-primary text-black font-bold rounded-xl hover:brightness-110 active:scale-95 transition-all">
                  Verify & Enable Now
                </button>
              )}
              {step === 'sending' && (
                <button disabled className="w-full md:w-auto px-8 py-3 bg-primary/50 text-black font-bold rounded-xl animate-pulse">
                  Sending OTP...
                </button>
              )}
              {step === 'input' && (
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    maxLength={6}
                    placeholder="Enter OTP"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="w-32 p-3 rounded-xl bg-black/40 border border-white/20 focus:ring-2 ring-primary outline-none text-white text-center font-mono tracking-widest"
                  />
                  <button 
                    onClick={handleVerifyOtp}
                    disabled={verifying || otpCode.length < 6}
                    className="px-6 py-3 bg-primary text-black font-bold rounded-xl hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {verifying ? '...' : 'Confirm'}
                  </button>
                  <button onClick={() => setStep('none')} className="p-3 text-muted-foreground hover:text-white">✕</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-primary">Download Your Reports</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <button onClick={() => generateReport('daily')} className="glass-effect p-6 rounded-3xl flex flex-col items-center justify-center hover:bg-primary/20 border-primary/10 transition-all group">
            <span className="text-4xl mb-3 group-hover:-translate-y-1 transition-transform">🧾</span>
            <span className="font-bold text-sm text-center">Daily Summary</span>
          </button>
          <button onClick={() => generateReport('weekly')} className="glass-effect p-6 rounded-3xl flex flex-col items-center justify-center hover:bg-primary/20 border-primary/10 transition-all group">
            <span className="text-4xl mb-3 group-hover:-translate-y-1 transition-transform">📅</span>
            <span className="font-bold text-sm text-center">Weekly Report</span>
          </button>
          <button onClick={() => generateReport('monthly')} className="glass-effect p-6 rounded-3xl flex flex-col items-center justify-center hover:bg-primary/20 border-primary/10 transition-all group">
            <span className="text-4xl mb-3 group-hover:-translate-y-1 transition-transform">📊</span>
            <span className="font-bold text-sm text-center">Monthly Report</span>
          </button>
          <button onClick={() => generateReport('annual')} className="glass-effect p-6 rounded-3xl flex flex-col items-center justify-center hover:bg-primary/20 border-primary/10 transition-all group">
            <span className="text-4xl mb-3 group-hover:-translate-y-1 transition-transform">📆</span>
            <span className="font-bold text-sm text-center">Annual Report</span>
          </button>
        </div>
      </div>

      <div className="glass-effect p-6 rounded-3xl border border-white/10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Request SMS Summaries</h2>
          {smsStatus && <span className="text-sm font-bold text-primary animate-pulse">{smsStatus}</span>}
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => requestSmsReport('daily')} className="px-6 py-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-sm font-bold flex items-center gap-2">📱 Send Today's Stats</button>
          <button onClick={() => requestSmsReport('weekly')} className="px-6 py-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-sm font-bold flex items-center gap-2">📱 Send Weekly Stats</button>
          <button onClick={() => requestSmsReport('monthly')} className="px-6 py-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-sm font-bold flex items-center gap-2">📱 Send Monthly Stats</button>
          <button onClick={() => requestSmsReport('annual')} className="px-6 py-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-sm font-bold flex items-center gap-2">📱 Send Annual Stats</button>
        </div>
      </div>

      <div>
        <div className="bg-primary/5 border border-primary/20 p-6 rounded-3xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-sm font-bold text-primary uppercase tracking-widest mb-1">Lifetime Deposit Summary</h2>
              <div className="text-4xl font-black">{totalWeight.toFixed(2)} <span className="text-lg font-normal text-muted-foreground">Kg</span></div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-black/20 px-4 py-2 rounded-full border border-white/5">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              {deposits?.length || 0} Total Transactions
            </div>
          </div>
        </div>

        <div className="pt-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Deposit Ledger</h2>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold px-3 py-1 bg-white/5 rounded-full border border-white/10">Immutable History</div>
          </div>
          {depositsLoading ? (
            <div className="animate-pulse flex space-x-4 glass-effect p-6 rounded-2xl">
              <div className="flex-1 space-y-4 py-1">
                <div className="h-4 bg-white/10 rounded w-3/4"></div>
                <div className="h-4 bg-white/10 rounded"></div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {deposits?.length === 0 && <p className="text-muted-foreground p-6 text-center border border-dashed border-border rounded-xl">No deposits recorded yet.</p>}
              {deposits?.map((d: any) => (
                <div key={d.id} className="glass-effect p-5 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center hover:bg-white/5 transition-colors group">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                      <span className="font-bold text-lg">{d.weight_kg} Kg - {d.quality_grade || 'Standard'} Grade</span>
                    </div>
                    <span className="text-sm text-muted-foreground ml-5">{new Date(d.created_at).toLocaleString()}</span>
                  </div>
                  {d.receipt_url ? (
                    <a href={`${window.location.origin}${d.receipt_url}`} target="_blank" rel="noreferrer" className="mt-3 sm:mt-0 px-5 py-2 bg-primary/20 text-primary border border-primary/30 rounded-lg font-bold hover:bg-primary hover:text-primary-foreground transition-all text-sm group-hover:shadow-[0_0_15px_rgba(var(--primary),0.3)]">View Receipt PDF</a>
                  ) : (
                    <span className="text-yellow-500 bg-yellow-500/10 px-3 py-1 rounded-full text-xs font-bold sm:mt-0 mt-3 border border-yellow-500/20">Processing PDF...</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
