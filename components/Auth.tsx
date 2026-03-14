
import React, { useState } from 'react';
import { User } from '../types';
import { Logo } from './Logo';

interface AuthProps {
  onLogin: (email: string, password?: string) => void;
  onRegister: (name: string, email: string, password?: string, companyName?: string, tenantId?: string) => { error?: string; tenantId?: string };
  users: User[];
  showRegSuccess: boolean;
  provisionedTenantId?: string | null;
  onBackToLogin: () => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin, onRegister, users, showRegSuccess, provisionedTenantId, onBackToLogin }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'provision'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    await new Promise(resolve => setTimeout(resolve, 800));

    if (mode === 'login') {
      if (!email || !password) {
        setError('Operational email and password are required for authentication.');
        setIsLoading(false);
        return;
      }
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!user) {
        setError('No active account found with this identity. Please verify or register.');
      } else if (user.password && user.password !== password) {
        setError('Invalid password. Access denied.');
      } else {
        onLogin(email, password);
      }
    } else if (mode === 'register') {
      if (!name || !email || !password || !tenantId) {
        setError('Please provide name, email, password, and Workspace Tenant ID.');
        setIsLoading(false);
        return;
      }
      const result = await onRegister(name, email, password, undefined, tenantId);
      if (result.error) setError(result.error);
    } else if (mode === 'provision') {
      if (!name || !email || !password || !companyName) {
        setError('All fields are required to provision a new workspace.');
        setIsLoading(false);
        return;
      }
      const result = await onRegister(name, email, password, companyName);
      if (result.error) setError(result.error);
    }
    setIsLoading(false);
  };

  const getEmailHint = () => {
    if (mode === 'login') return null;
    if (mode === 'provision') return "You will be registered as the Master Admin for this new ecosystem.";
    return "Ensure you have the Tenant ID provided by your administrator.";
  };

  if (showRegSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-[3rem] shadow-hard border border-slate-100 dark:border-white/5 p-12 text-center animate-in zoom-in-95 duration-500">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8 border shadow-lg ${
            provisionedTenantId ? 'bg-brand-blue/10 text-brand-blue border-brand-blue/20' : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
          }`}>
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
          </div>
          
          <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-4 tracking-tight">
            {provisionedTenantId ? 'Workspace Provisioned' : 'Welcome to the Team'}
          </h2>
          
          {provisionedTenantId ? (
            <div className="space-y-6">
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                Your ecosystem is active. **Share the following Tenant ID** with your staff so they can join this unit:
              </p>
              <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-2xl border-2 border-dashed border-brand-blue/30 group relative cursor-copy active:scale-95 transition-all"
                onClick={() => {
                  if (provisionedTenantId) {
                    navigator.clipboard.writeText(provisionedTenantId);
                    alert('Tenant ID copied to clipboard!');
                  }
                }}
              >
                <span className="text-2xl font-black text-brand-blue tracking-[0.2em]">{provisionedTenantId}</span>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-2 group-hover:text-brand-blue transition-colors">Click to Copy ID</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6">
                <a 
                  href={`https://wa.me/?text=Join%20my%20workspace%20on%20CraveOps!%20Use%20Tenant%20ID:%20${provisionedTenantId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all shadow-lg"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  WhatsApp
                </a>
                <a 
                  href={`mailto:?subject=Join%20my%20workspace%20on%20CraveOps&body=Hi,%20please%20join%20my%20workspace%20on%20CraveOps.%20Use%20the%20following%20Tenant%20ID:%20${provisionedTenantId}`}
                  className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all shadow-lg"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  Email
                </a>
              </div>
              <p className="text-[10px] text-slate-400 font-medium italic">You are now registered as the **Admin** for this unit.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                You have successfully joined the workspace. Your account is active and ready for operational deployment.
              </p>
            </div>
          )}

          <div className="mt-10">
            <button 
              onClick={onBackToLogin}
              className="w-full bg-brand-blue hover:bg-blue-700 text-white font-black py-5 rounded-2xl shadow-xl transition-all transform active:scale-[0.98] text-[10px] uppercase tracking-widest"
            >
              {provisionedTenantId ? 'Initialize Session' : 'Enter Dashboard'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-lg w-full bg-white dark:bg-slate-900 rounded-[3.5rem] shadow-2xl border border-slate-200/50 dark:border-white/5 overflow-hidden transition-all duration-500">
        <div className="p-10 sm:p-14">
          <div className="flex flex-col items-center mb-12">
            <Logo className="h-14 mb-4" />
            <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <p className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Global Ops Portal v1.0</p>
            </div>
          </div>

          <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl mb-10 border border-slate-200 dark:border-slate-700">
            <button 
              onClick={() => { setMode('login'); setError(''); }}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${mode === 'login' ? 'bg-white dark:bg-slate-700 text-brand-blue dark:text-white shadow-sm' : 'text-slate-400'}`}
            >
              Sign In
            </button>
            <button 
              onClick={() => { setMode('register'); setError(''); }}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${mode === 'register' ? 'bg-white dark:bg-slate-700 text-brand-blue dark:text-white shadow-sm' : 'text-slate-400'}`}
            >
              Join Team
            </button>
            <button 
              onClick={() => { setMode('provision'); setError(''); }}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${mode === 'provision' ? 'bg-white dark:bg-slate-700 text-brand-blue dark:text-white shadow-sm' : 'text-slate-400'}`}
            >
              New Org
            </button>
          </div>

          <form onSubmit={handleAction} className="space-y-6" autoComplete="off">
            {mode !== 'login' && (
              <div className="space-y-2 group">
                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] ml-1">Identity Full Name</label>
                <input 
                  type="text" 
                  value={name}
                  autoComplete="off"
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-6 py-4 text-slate-800 dark:text-white font-bold focus:border-brand-blue outline-none transition-all placeholder-slate-400 shadow-sm" 
                  placeholder="Full name"
                />
              </div>
            )}

            {mode === 'register' && (
              <div className="space-y-2 group animate-in slide-in-from-top-2">
                <label className="text-[10px] font-black text-brand-blue dark:text-brand-cyan uppercase tracking-[0.2em] ml-1">Target Workspace Tenant ID</label>
                <input 
                  type="text" 
                  value={tenantId}
                  autoComplete="off"
                  onChange={e => setTenantId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-6 py-4 text-slate-800 dark:text-white font-bold focus:border-brand-blue outline-none transition-all placeholder-slate-400 shadow-sm" 
                  placeholder="Ex: tenant-cc-001"
                />
              </div>
            )}

            {mode === 'provision' && (
              <div className="space-y-2 animate-in slide-in-from-top-2">
                <label className="text-[10px] font-black text-brand-blue dark:text-brand-cyan uppercase tracking-[0.2em] ml-1">Company / Workspace Authority</label>
                <input 
                  type="text" 
                  value={companyName}
                  autoComplete="off"
                  onChange={e => setCompanyName(e.target.value)}
                  className="w-full bg-brand-blue/5 dark:bg-brand-cyan/5 border border-brand-blue/30 dark:border-brand-cyan/30 rounded-2xl px-6 py-4 text-slate-800 dark:text-white font-black focus:ring-4 focus:ring-brand-blue/10 outline-none transition-all placeholder-slate-400 shadow-sm" 
                  placeholder="Ex: Nexus Group Ltd."
                />
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] ml-1">Operational Email</label>
              <input 
                type="email" 
                value={email}
                autoComplete="off"
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-6 py-4 text-slate-800 dark:text-white font-bold focus:border-brand-blue outline-none transition-all placeholder-slate-400 shadow-sm" 
                placeholder="identity@domain.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] ml-1">Secure Password</label>
              <input 
                type="password" 
                value={password}
                autoComplete="new-password"
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-6 py-4 text-slate-800 dark:text-white font-bold focus:border-brand-blue outline-none transition-all placeholder-slate-400 shadow-sm" 
                placeholder="••••••••"
              />
              {getEmailHint() && (
                <p className={`text-[9px] font-bold italic ml-1 mt-1 ${mode === 'provision' ? 'text-brand-blue animate-pulse' : 'text-slate-400'}`}>
                  {getEmailHint()}
                </p>
              )}
            </div>

            {error && (
              <div className="p-4 bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20 rounded-2xl animate-in shake duration-500">
                <p className="text-[11px] font-black text-rose-600 text-center tracking-wide leading-relaxed">{error}</p>
              </div>
            )}

            <button 
              type="submit"
              disabled={isLoading}
              className={`w-full font-black py-5 rounded-2xl shadow-xl transition-all transform active:scale-[0.98] text-[11px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 disabled:opacity-70 ${
                mode === 'provision' ? 'bg-brand-dark text-white hover:bg-slate-800' : 'bg-brand-blue text-white hover:bg-blue-700'
              }`}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                mode === 'login' ? 'Authenticate Session' : mode === 'register' ? 'Join Workspace Unit' : 'Provision Ecosystem'
              )}
            </button>
          </form>

          <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800 text-center space-y-6">
            {mode === 'login' ? (
              <div className="space-y-4">
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">New to CraveOps?</p>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => { setMode('register'); setError(''); }}
                    className="group py-4 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 text-[9px] font-black rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-brand-blue transition-all uppercase tracking-widest"
                  >
                    Join a Team
                  </button>
                  <button 
                    onClick={() => { setMode('provision'); setError(''); }}
                    className="group py-4 bg-brand-blue/5 text-brand-blue text-[9px] font-black rounded-2xl border border-brand-blue/20 hover:border-brand-blue transition-all uppercase tracking-widest"
                  >
                    Start Workspace
                  </button>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => setMode('login')}
                className="text-[11px] font-black uppercase text-brand-cyan tracking-widest hover:text-brand-blue transition-colors underline underline-offset-8"
              >
                Return to Secure Entry
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
