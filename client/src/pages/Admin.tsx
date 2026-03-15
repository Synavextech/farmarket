import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useLocation } from 'wouter';
import { useState, useEffect } from 'react';

export default function Admin() {
  const [_, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'register' | 'deposit' | 'reporting' | 'users'>('deposit');

  const { data: user, isLoading: userLoading, error: userError } = useQuery<any, any>({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await axios.get('/auth/me');
      return res.data.user;
    },
    retry: false
  });

  useEffect(() => {
    if (!userLoading && (userError || (queryClient.getQueryState(['me'])?.status === 'success' && (!user || !['admin', 'operator'].includes(user.role))))) {
      setLocation('/auth');
    }
  }, [user, userLoading, userError, setLocation, queryClient]);

  if (userLoading) return <div className="p-8 text-center animate-pulse">Verifying System Clearance...</div>;
  if (userError || !user || !['admin', 'operator'].includes(user.role)) return null;

  const { data: users } = useQuery<any, any>({
    queryKey: ['users'],
    queryFn: async () => (await axios.get('/auth')).data,
    enabled: !!user
  });

  const [regForm, setRegForm] = useState({ full_name: '', phone_number: '', password: '', national_id: '', role: 'user' });
  const [regMsg, setRegMsg] = useState({ type: '', text: '' });

  const [depForm, setDepForm] = useState({ user_id: '', weight_kg: '', quality_grade: 'AA', notes: '' });
  const [depMsg, setDepMsg] = useState({ type: '', text: '' });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegMsg({ type: '', text: '' });
    try {
      await axios.post('/auth/admin/register', regForm);
      setRegMsg({ type: 'success', text: 'Member securely registered to the grid.' });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setRegForm({ full_name: '', phone_number: '', password: '', national_id: '', role: 'user' });
    } catch (err: any) {
      setRegMsg({ type: 'error', text: err.response?.data?.error || 'Registration failed' });
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDepMsg({ type: 'info', text: 'Transmitting record. Generating secure PDF & SMS...' });
    try {
      const payload = {
        ...depForm,
        weight_kg: Number(depForm.weight_kg)
      };
      const res = await axios.post('/deposits', payload);
      setDepMsg({ type: 'success', text: `Deposit logged successfully. SMS Status: ${res.data.sms_status}` });
      setDepForm({ ...depForm, weight_kg: '', notes: '' });
    } catch (err: any) {
      setDepMsg({ type: 'error', text: err.response?.data?.error || 'Deposit workflow failed' });
    }
  };

  const handleUpdateUser = async (userId: string, updates: any) => {
    try {
      await axios.put(`/auth/admin/users/${userId}`, updates);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update user');
    }
  };

  const handleLogout = async () => {
    await axios.post('/auth/logout');
    setLocation('/');
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 w-full relative">
      <div className="flex justify-between items-center border-b border-white/10 pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-400">Admin Dashboard</h1>
          <p className="text-muted-foreground text-sm uppercase tracking-widest">{user.role} Clearance Active</p>
        </div>
        <button onClick={handleLogout} className="px-5 py-2 glass-effect text-destructive font-bold text-sm tracking-wider hover:bg-destructive/20 transition-all rounded-full border-destructive/20">Sign Out</button>
      </div>

      <div className="flex space-x-2 bg-black/40 p-1.5 rounded-full w-max border border-white/5 overflow-x-auto">
        <button
          onClick={() => setActiveTab('deposit')}
          className={`px-5 py-2 rounded-full font-bold transition-all text-sm whitespace-nowrap ${activeTab === 'deposit' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-white'}`}
        >
          Transact Deposit
        </button>
        <button
          onClick={() => setActiveTab('register')}
          className={`px-5 py-2 rounded-full font-bold transition-all text-sm whitespace-nowrap ${activeTab === 'register' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-white'}`}
        >
          Register Member
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-5 py-2 rounded-full font-bold transition-all text-sm whitespace-nowrap ${activeTab === 'users' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-white'}`}
        >
          User Management
        </button>
        <button
          onClick={() => setActiveTab('reporting')}
          className={`px-5 py-2 rounded-full font-bold transition-all text-sm whitespace-nowrap ${activeTab === 'reporting' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-white'}`}
        >
          Management Reports
        </button>
      </div>

      <div className="mt-8 glass-effect p-8 rounded-3xl relative overflow-hidden">
        {activeTab === 'register' && (
          <div className="relative z-10 animate-in slide-in-from-right-4 duration-300">
            <h2 className="text-2xl font-bold mb-6">Register New Member</h2>
            {regMsg.text && (
              <div className={`p-4 rounded-xl mb-6 font-semibold border ${regMsg.type === 'error' ? 'bg-destructive/10 text-destructive border-destructive/20' : 'bg-green-500/10 text-green-400 border-green-500/20'}`}>
                {regMsg.text}
              </div>
            )}
            <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm text-white/70 font-bold uppercase tracking-wider">Full Name</label>
                <input type="text" className="w-full bg-black/50 border border-white/10 rounded-xl p-3 outline-none focus:border-primary transition-colors text-white" required value={regForm.full_name} onChange={e => setRegForm({ ...regForm, full_name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-white/70 font-bold uppercase tracking-wider">Phone (+254...)</label>
                <input type="text" className="w-full bg-black/50 border border-white/10 rounded-xl p-3 outline-none focus:border-primary transition-colors text-white font-mono" required value={regForm.phone_number} onChange={e => setRegForm({ ...regForm, phone_number: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-white/70 font-bold uppercase tracking-wider">National ID Number</label>
                <input type="text" className="w-full bg-black/50 border border-white/10 rounded-xl p-3 outline-none focus:border-primary transition-colors text-white font-mono" required value={regForm.national_id} onChange={e => setRegForm({ ...regForm, national_id: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-white/70 font-bold uppercase tracking-wider">Secure Password</label>
                <input type="text" className="w-full bg-black/50 border border-white/10 rounded-xl p-3 outline-none focus:border-primary transition-colors text-white font-mono" required value={regForm.password} onChange={e => setRegForm({ ...regForm, password: e.target.value })} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm text-white/70 font-bold uppercase tracking-wider">System Clearance Tier</label>
                <select className="w-full bg-black/50 border border-white/10 rounded-xl p-3 outline-none focus:border-primary transition-colors text-white appearance-none" value={regForm.role} onChange={e => setRegForm({ ...regForm, role: e.target.value })}>
                  <option value="user">Member</option>
                  {user?.role === 'admin' && <option value="operator">Operator</option>}
                </select>
              </div>
              <button type="submit" className="w-full bg-primary text-black py-3 rounded-lg font-bold hover:brightness-110 active:scale-[98%] transition-all mt-4 uppercase tracking-widest">
                Register Identity
              </button>
            </form>
          </div>
        )}

        {activeTab === 'deposit' && (
          <div className="relative z-10 animate-in slide-in-from-left-4 duration-300">
            <h2 className="text-2xl font-bold mb-6">Process Coffee Metric</h2>
            {depMsg.text && (
              <div className={`p-4 rounded-xl mb-6 font-semibold border ${depMsg.type === 'error' ? 'bg-destructive/10 text-destructive border-destructive/20' : depMsg.type === 'info' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse' : 'bg-green-500/10 text-green-400 border-green-500/20'}`}>
                {depMsg.text}
              </div>
            )}
            <form onSubmit={handleDeposit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm text-white/70 font-bold uppercase tracking-wider">Target Member</label>
                <select className="w-full bg-black/50 border border-white/10 rounded-xl p-3 outline-none focus:border-primary transition-colors text-white" required value={depForm.user_id} onChange={e => setDepForm({ ...depForm, user_id: e.target.value })}>
                  <option value="" disabled> Select Member </option>
                  {users?.map((u: any) => (
                    <option key={u.id} value={u.id}>{u.full_name} ({u.phone_number}) - {u.national_id}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-white/70 font-bold uppercase tracking-wider">Weight (Kg)</label>
                <input type="number" step="0.01" className="w-full bg-black/50 border border-white/10 rounded-xl p-3 outline-none focus:border-primary transition-colors text-white font-mono text-xl" required value={depForm.weight_kg} onChange={e => setDepForm({ ...depForm, weight_kg: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-white/70 font-bold uppercase tracking-wider">Quality Grade</label>
                <select className="w-full bg-black/50 border border-white/10 rounded-xl p-3 outline-none focus:border-primary transition-colors text-white appearance-none" required value={depForm.quality_grade} onChange={e => setDepForm({ ...depForm, quality_grade: e.target.value })}>
                  <option value="AA">AA (Highest)</option>
                  <option value="AB">AB</option>
                  <option value="PB">PB</option>
                  <option value="C">C</option>
                  <option value="E">E</option>
                  <option value="TT">TT</option>
                  <option value="T">T</option>
                  <option value="UG">UG</option>
                </select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm text-white/70 font-bold uppercase tracking-wider">Operator Notes</label>
                <textarea className="w-full bg-black/50 border border-white/10 rounded-xl p-3 outline-none focus:border-primary transition-colors text-white min-h-[100px]" value={depForm.notes} onChange={e => setDepForm({ ...depForm, notes: e.target.value })} placeholder="Optional incidentals..." />
              </div>
              <button type="submit" disabled={depMsg.type === 'info'} className="md:col-span-2 mt-4 bg-primary text-primary-foreground py-4 rounded-xl font-bold uppercase tracking-widest hover:brightness-125 transition-all outline-none disabled:opacity-50 focus:ring-4 focus:ring-primary/30">
                Update deposit record
              </button>
            </form>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="relative z-10 animate-in slide-in-from-bottom-4 duration-300">
            <h2 className="text-2xl font-bold mb-6">User Database Management</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-xs uppercase tracking-widest text-muted-foreground">
                    <th className="py-4 px-2">Name</th>
                    <th className="py-4 px-2">ID/Phone</th>
                    <th className="py-4 px-2">Role</th>
                    <th className="py-4 px-2">Status</th>
                    <th className="py-4 px-2">Action</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {users?.map((u: any) => (
                    <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-4 px-2">
                        <div className="font-bold">{u.full_name}</div>
                        <div className="text-[10px] text-muted-foreground">{u.id}</div>
                      </td>
                      <td className="py-4 px-2">
                        <div className="font-mono text-xs">{u.national_id}</div>
                        <div className="text-xs text-muted-foreground">{u.phone_number}</div>
                      </td>
                      <td className="py-4 px-2">
                        <select
                          className="bg-black/50 border border-white/10 rounded px-2 py-1 text-xs text-white"
                          value={u.role}
                          onChange={(e) => handleUpdateUser(u.id, { role: e.target.value })}
                          disabled={u.id === user.id}
                        >
                          <option value="user">User</option>
                          <option value="operator">Operator</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="py-4 px-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${u.status === 'suspended' ? 'bg-destructive/20 text-destructive' : 'bg-green-500/20 text-green-400'}`}>
                          {u.status || 'active'}
                        </span>
                      </td>
                      <td className="py-4 px-2">
                        <button
                          onClick={() => handleUpdateUser(u.id, { status: u.status === 'suspended' ? 'active' : 'suspended' })}
                          className={`text-[10px] font-bold uppercase transition-colors ${u.status === 'suspended' ? 'text-green-400 hover:text-green-300' : 'text-destructive hover:text-destructive/80'}`}
                          disabled={u.id === user.id}
                        >
                          {u.status === 'suspended' ? 'Activate' : 'Suspend'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'reporting' && (
          <div className="relative z-10 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-primary">Society Reports</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-lg font-bold border-l-4 border-primary pl-3">Organization Summaries</h3>
                <p className="text-sm text-muted-foreground mb-4">Generate entire cooperative society report.</p>
                <div className="grid grid-cols-2 gap-3">
                  {['daily', 'weekly', 'monthly', 'annual'].map(time => (
                    <button
                      key={time}
                      onClick={async () => {
                        const res = await axios.get(`/reports?type=${time}&scope=company`);
                        window.open(`${window.location.origin}${res.data.url}`, '_blank');
                      }}
                      className="p-4 glass-effect rounded-2xl hover:bg-primary/20 transition-all font-bold text-sm uppercase tracking-wider"
                    >
                      {time} Summary
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-bold border-l-4 border-orange-400 pl-3">Member Specific Analysis</h3>
                <p className="text-sm text-muted-foreground mb-4">Select a target member.</p>
                <div className="space-y-4">
                  <select
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 outline-none focus:border-primary transition-colors text-white"
                    id="report_user_id"
                  >
                    <option value="">Select Target Member</option>
                    {users?.map((u: any) => (
                      <option key={u.id} value={u.id}>{u.full_name} ({u.phone_number})</option>
                    ))}
                  </select>
                  <div className="grid grid-cols-2 gap-3">
                    {['daily', 'weekly', 'monthly', 'annual'].map(time => (
                      <button
                        key={time}
                        onClick={async () => {
                          const uid = (document.getElementById('report_user_id') as HTMLSelectElement).value;
                          if (!uid) return alert('Please select a member first');
                          const res = await axios.get(`/reports?type=${time}&scope=individual&user_id=${uid}`);
                          window.open(`${window.location.origin}${res.data.url}`, '_blank');
                        }}
                        className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-xs font-bold uppercase tracking-tighter"
                      >
                        Individual {time}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12 p-6 rounded-3xl bg-primary/5 border border-primary/10">
              <h4 className="font-bold flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
                System Integrity Note
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                All management reports are generated using the live ledger. Admin actions and PDF generations are logged for audit purposes.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
