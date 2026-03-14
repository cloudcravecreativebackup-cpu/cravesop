
import React, { useState } from 'react';
import { User } from '../types';

interface ProfileSettingsProps {
  currentUser: User;
  onUpdateUser: (userId: string, updates: Partial<User>) => void;
  onBack: () => void;
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ currentUser, onUpdateUser, onBack }) => {
  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      await onUpdateUser(currentUser.id, { name, email });
      setMessage({ type: 'success', text: 'Identity profile updated successfully.' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-brand-blue transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Profile Settings</h2>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-soft border border-slate-200 dark:border-white/5 overflow-hidden">
        <div className="p-10 sm:p-14">
          <div className="flex flex-col items-center mb-12">
            <div className="relative w-32 h-32 group">
              <img 
                src={currentUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.name}`} 
                className="w-full h-full rounded-[2.5rem] object-cover border-4 border-slate-50 dark:border-slate-800 shadow-xl" 
                referrerPolicy="no-referrer"
              />
              <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        onUpdateUser(currentUser.id, { avatar: reader.result as string });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
            </div>
            <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Click avatar to update</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] ml-1">Full Identity Name</label>
              <input 
                type="text" 
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-6 py-4 text-slate-800 dark:text-white font-bold focus:border-brand-blue outline-none transition-all shadow-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] ml-1">Operational Email</label>
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-6 py-4 text-slate-800 dark:text-white font-bold focus:border-brand-blue outline-none transition-all shadow-sm"
              />
            </div>

            <div className="pt-4">
              <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Workspace Role</p>
                <p className="text-sm font-black text-brand-blue dark:text-brand-cyan uppercase tracking-widest">{currentUser.role}</p>
                <p className="text-[9px] text-slate-500 mt-2 italic">Roles are managed by the workspace administrator.</p>
              </div>
            </div>

            {message && (
              <div className={`p-4 rounded-2xl text-center text-[11px] font-black uppercase tracking-widest animate-in zoom-in-95 ${
                message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
              }`}>
                {message.text}
              </div>
            )}

            <button 
              type="submit"
              disabled={isSaving}
              className="w-full bg-brand-blue hover:bg-blue-700 text-white font-black py-5 rounded-2xl shadow-xl transition-all transform active:scale-[0.98] text-[11px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 disabled:opacity-70"
            >
              {isSaving ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : 'Update Identity Profile'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
