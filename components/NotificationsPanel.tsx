
import React from 'react';
import { Notification } from '../types';

interface NotificationsPanelProps {
  notifications: Notification[];
  onNotificationClick: (notif: Notification) => void;
  onMarkAllRead: () => void;
  onClose: () => void;
}

const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ notifications, onNotificationClick, onMarkAllRead, onClose }) => {
  return (
    <div className="absolute right-0 mt-4 w-96 bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-hard border border-slate-200 dark:border-white/10 overflow-hidden animate-in fade-in slide-in-from-top-3 duration-200 z-[100]">
      <div className="px-8 py-6 border-b border-slate-100 dark:border-white/10 flex justify-between items-center">
        <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">Notifications</h3>
        <button 
          onClick={onMarkAllRead}
          className="text-[10px] font-black text-brand-blue dark:text-brand-cyan uppercase tracking-widest hover:underline"
        >
          Mark all as read
        </button>
      </div>

      <div className="max-h-[400px] overflow-y-auto scrollbar-hide divide-y divide-slate-50 dark:divide-slate-800">
        {notifications.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No active alerts</p>
          </div>
        ) : (
          notifications.map(n => (
            <div 
              key={n.id} 
              onClick={() => onNotificationClick(n)}
              className={`p-6 transition-colors cursor-pointer flex gap-4 items-start ${n.read ? 'opacity-60' : 'bg-brand-blue/5 dark:bg-brand-cyan/5 border-l-4 border-l-brand-blue'}`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                n.type === 'alert' || n.type === 'warning' ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' : 
                n.type === 'success' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 
                'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
              }`}>
                {n.type === 'alert' || n.type === 'warning' ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                ) : n.type === 'success' ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                )}
              </div>
              <div className="flex-grow">
                <p className={`text-xs leading-relaxed ${n.read ? 'font-medium text-slate-500' : 'font-black text-slate-800 dark:text-white'}`}>{n.message}</p>
                <div className="flex items-center justify-between mt-3">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {(n.relatedTaskId || n.relatedUserId) && (
                    <span className="text-[8px] font-black text-brand-blue dark:text-brand-cyan uppercase tracking-widest bg-brand-blue/10 dark:bg-brand-cyan/20 px-2.5 py-1 rounded-lg">Action Required</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-5 bg-slate-50 dark:bg-slate-800/50 text-center border-t border-slate-100 dark:border-white/5">
        <button onClick={onClose} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">Close Control Panel</button>
      </div>
    </div>
  );
};

export default NotificationsPanel;
