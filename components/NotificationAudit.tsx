
import React, { useState, useMemo } from 'react';
import { Notification, User, Organization } from '../types';

interface NotificationAuditProps {
  notifications: Notification[];
  users: User[];
  workspace: Organization;
  onClose: () => void;
}

const NotificationAudit: React.FC<NotificationAuditProps> = ({ notifications, users, workspace, onClose }) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [searchUser, setSearchUser] = useState<string>('');

  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      const typeMatch = filterType === 'all' || n.type === filterType;
      const user = users.find(u => u.id === n.userId);
      const userMatch = !searchUser || (user?.name.toLowerCase().includes(searchUser.toLowerCase()) || user?.email.toLowerCase().includes(searchUser.toLowerCase()));
      return typeMatch && userMatch;
    });
  }, [notifications, filterType, searchUser, users]);

  const getUserInfo = (userId: string) => {
    return users.find(u => u.id === userId);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight leading-none">Notification Audit</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-lg mt-3">Comprehensive log of all system alerts and user communications.</p>
        </div>
        <button 
          onClick={onClose}
          className="bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-brand-blue px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-sm transition-all active:scale-95"
        >
          Back to Dashboard
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-white/10 shadow-soft flex flex-col md:flex-row gap-6 items-center">
        <div className="flex-grow w-full">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2 block">Search Recipient</label>
          <input 
            type="text"
            placeholder="Search by name or email..."
            value={searchUser}
            onChange={(e) => setSearchUser(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-brand-blue transition-all"
          />
        </div>
        <div className="w-full md:w-64">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2 block">Filter Type</label>
          <select 
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl px-6 py-4 text-sm font-black uppercase tracking-widest outline-none focus:border-brand-blue transition-all"
          >
            <option value="all">All Types</option>
            <option value="info">Information</option>
            <option value="success">Success</option>
            <option value="warning">Warning</option>
            <option value="alert">Alert</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900/60 backdrop-blur-xl rounded-[2.5rem] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Timestamp</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Recipient</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Type</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Message</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
            {filteredNotifications.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-8 py-20 text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No matching notification logs found</p>
                </td>
              </tr>
            ) : (
              filteredNotifications.map(n => {
                const recipient = getUserInfo(n.userId);
                return (
                  <tr key={n.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-8 py-6">
                      <p className="text-xs font-bold text-slate-800 dark:text-white">
                        {new Date(n.timestamp).toLocaleDateString()}
                      </p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                        {new Date(n.timestamp).toLocaleTimeString()}
                      </p>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden shadow-sm">
                          <img src={recipient?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${recipient?.name || n.userId}`} alt="avatar" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-800 dark:text-white">{recipient?.name || 'Unknown User'}</p>
                          <p className="text-[10px] text-brand-blue font-bold tracking-widest">{recipient?.role || 'N/A'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-lg border tracking-widest ${
                        n.type === 'alert' || n.type === 'warning' ? 'bg-rose-50 text-rose-600 border-rose-100' : 
                        n.type === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                        'bg-blue-50 text-blue-600 border-blue-100'
                      }`}>
                        {n.type}
                      </span>
                    </td>
                    <td className="px-8 py-6 max-w-md">
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-400 leading-relaxed">{n.message}</p>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${n.read ? 'bg-slate-300' : 'bg-brand-blue animate-pulse'}`}></div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          {n.read ? 'Read' : 'Unread'}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default NotificationAudit;
