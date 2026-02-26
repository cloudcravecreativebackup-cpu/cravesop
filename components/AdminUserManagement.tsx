
import React, { useEffect } from 'react';
import { User, UserRole } from '../types';

interface AdminUserManagementProps {
  users: User[];
  currentUser: User;
  onUpdateUser: (userId: string, updates: Partial<User>) => void;
  onDeleteUser: (userId: string) => void;
  highlightUserId?: string | null;
  onHighlightClear?: () => void;
  onDrillDown: (userId: string) => void;
}

const AdminUserManagement: React.FC<AdminUserManagementProps> = ({ users, currentUser, onUpdateUser, onDeleteUser, highlightUserId, onHighlightClear, onDrillDown }) => {
  const isAdmin = currentUser.role === 'Admin';
  const leads = users.filter(u => u.role === 'Staff Lead' && u.registrationStatus === 'approved');

  useEffect(() => {
    if (highlightUserId) {
      const element = document.getElementById(`user-row-${highlightUserId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => {
          if (onHighlightClear) onHighlightClear();
        }, 3000);
      }
    }
  }, [highlightUserId, onHighlightClear]);

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div>
        <h2 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight leading-none">User Moderation</h2>
        <p className="text-slate-500 dark:text-slate-400 font-medium text-lg mt-3">Moderate workspace units and tactical roles within your scope.</p>
      </div>

      <div className="bg-white dark:bg-slate-900/60 backdrop-blur-xl rounded-[2.5rem] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Identity</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Status</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Role</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Assigned Lead</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
            {users.map(user => {
              const canEditRole = isAdmin;
              const canEditLead = isAdmin || (currentUser.role === 'Staff Lead' && (!user.mentorId || user.mentorId === currentUser.id));
              
              return (
                <tr 
                  key={user.id} 
                  id={`user-row-${user.id}`}
                  onClick={() => onDrillDown(user.id)}
                  className={`cursor-pointer hover:bg-brand-blue/5 dark:hover:bg-white/5 transition-all duration-300 group ${highlightUserId === user.id ? 'bg-brand-blue/10' : ''}`}
                >
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden shadow-sm flex-shrink-0">
                        <img src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} alt="avatar" />
                      </div>
                      <div>
                        <p className="text-base font-black text-slate-800 dark:text-white leading-tight">{user.name}</p>
                        <p className="text-[10px] text-brand-blue font-bold tracking-widest mt-1">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`text-[10px] font-black uppercase px-4 py-2 rounded-xl border tracking-widest ${
                      user.registrationStatus === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100 animate-pulse'
                    }`}>
                      {user.registrationStatus}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    {canEditRole ? (
                      <select 
                        value={user.role}
                        onClick={e => e.stopPropagation()}
                        onChange={e => onUpdateUser(user.id, { role: e.target.value as UserRole })}
                        className="text-xs font-black uppercase tracking-widest bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl px-4 py-2 outline-none"
                      >
                        <option value="Admin">Admin</option>
                        <option value="Staff Lead">Staff Lead</option>
                        <option value="Staff Member">Staff Member</option>
                        <option value="Mentee">Mentee</option>
                      </select>
                    ) : (
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{user.role}</span>
                    )}
                  </td>
                  <td className="px-8 py-6">
                    {(user.role === 'Staff Member' || user.role === 'Mentee') ? (
                      canEditLead ? (
                        <select 
                          value={user.mentorId || ''}
                          onClick={e => e.stopPropagation()}
                          onChange={e => onUpdateUser(user.id, { mentorId: e.target.value })}
                          className="text-[10px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 border border-transparent text-slate-800 dark:text-white rounded-xl px-4 py-2 outline-none"
                        >
                          <option value="">Unassigned</option>
                          {isAdmin ? (
                            leads.map(l => <option key={l.id} value={l.id}>{l.name}</option>)
                          ) : (
                            <option value={currentUser.id}>{currentUser.name} (You)</option>
                          )}
                        </select>
                      ) : (
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                          {leads.find(l => l.id === user.mentorId)?.name || 'Unassigned'}
                        </span>
                      )
                    ) : (
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">N/A</span>
                    )}
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-3" onClick={e => e.stopPropagation()}>
                      {isAdmin && user.registrationStatus === 'pending' ? (
                        <button 
                          onClick={() => onUpdateUser(user.id, { registrationStatus: 'approved' })}
                          className="bg-brand-blue text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all"
                        >
                          Authorize
                        </button>
                      ) : isAdmin ? (
                        <button 
                          disabled={user.email === 'support@cloudcraves.com'}
                          onClick={() => onUpdateUser(user.id, { registrationStatus: 'pending' })}
                          className="text-[10px] font-black uppercase text-rose-600 hover:text-rose-800 tracking-widest disabled:opacity-0"
                        >
                          Suspend
                        </button>
                      ) : null}
                      <button 
                        onClick={() => onDrillDown(user.id)}
                        className="bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-brand-blue p-3 rounded-xl transition-all"
                        title="View Profile"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      </button>
                      {isAdmin && (
                        <button 
                          onClick={() => onDeleteUser(user.id)}
                          className="bg-rose-50 dark:bg-rose-900/10 text-rose-600 hover:bg-rose-600 hover:text-white p-3 rounded-xl transition-all"
                          title="Delete Profile"
                          disabled={user.email === 'support@cloudcraves.com'}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminUserManagement;
