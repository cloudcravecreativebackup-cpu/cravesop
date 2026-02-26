
import React, { useState, useMemo } from 'react';
import { User, StaffTask, TaskComment } from '../types';

interface PersonnelProtocolViewProps {
  userId: string;
  users: User[];
  tasks: StaffTask[];
  onBack: () => void;
  onAddComment: (taskId: string, text: string) => void;
}

type TimeFilter = 'All' | 'Today' | 'Week' | 'Month' | 'Year';

const PersonnelProtocolView: React.FC<PersonnelProtocolViewProps> = ({ userId, users, tasks, onBack, onAddComment }) => {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('All');
  
  const user = users.find(u => u.id === userId);
  const mentor = users.find(u => u.id === user?.mentorId);

  const filteredTasks = useMemo(() => {
    const rawTasks = tasks.filter(t => t.staffName === user?.name);
    if (timeFilter === 'All') return rawTasks;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return rawTasks.filter(task => {
      const taskDate = new Date(task.dueDate);
      if (isNaN(taskDate.getTime())) return false;

      switch (timeFilter) {
        case 'Today':
          return taskDate.toDateString() === today.toDateString();
        case 'Week': {
          const sevenDaysAgo = new Date(today);
          sevenDaysAgo.setDate(today.getDate() - 7);
          const sevenDaysFuture = new Date(today);
          sevenDaysFuture.setDate(today.getDate() + 7);
          return taskDate >= sevenDaysAgo && taskDate <= sevenDaysFuture;
        }
        case 'Month':
          return taskDate.getMonth() === today.getMonth() && taskDate.getFullYear() === today.getFullYear();
        case 'Year':
          return taskDate.getFullYear() === today.getFullYear();
        default:
          return true;
      }
    });
  }, [tasks, user?.name, timeFilter]);

  if (!user) return null;

  const totalHours = filteredTasks.reduce((acc, t) => acc + t.hoursSpent, 0);
  const completedCount = filteredTasks.filter(t => t.status === 'Completed').length;
  const completionRate = filteredTasks.length ? Math.round((completedCount / filteredTasks.length) * 100) : 0;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-8">
          <button 
            onClick={onBack}
            className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 hover:border-brand-blue transition-all shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </button>
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-3xl bg-slate-100 dark:bg-slate-800 overflow-hidden shadow-hard">
               <img src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">{user.name}</h2>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-[10px] font-black uppercase px-3 py-1 bg-brand-blue/10 text-brand-blue rounded-lg tracking-widest">
                  {user.role}
                </span>
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  {mentor ? `Lead: ${mentor.name}` : 'Unassigned'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 w-full md:w-auto">
           {[
             { label: 'Logged Effort', val: `${totalHours}h`, color: 'text-brand-blue' },
             { label: 'Scoped Units', val: filteredTasks.length, color: 'text-brand-cyan' },
             { label: 'Velocity', val: `${completionRate}%`, color: 'text-emerald-500' }
           ].map((stat, i) => (
             <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-white/5 shadow-soft min-w-[120px]">
                <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-1">{stat.label}</p>
                <p className={`text-xl font-black ${stat.color}`}>{stat.val}</p>
             </div>
           ))}
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <h3 className="text-[11px] font-black uppercase text-slate-400 tracking-[0.4em] ml-1">Assigned Deliverables</h3>
        
        {/* Time Filter Hub */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
          {(['All', 'Today', 'Week', 'Month', 'Year'] as TimeFilter[]).map(f => (
            <button
              key={f}
              onClick={() => setTimeFilter(f)}
              className={`px-5 py-2 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${
                timeFilter === f 
                  ? 'bg-white dark:bg-slate-700 text-brand-blue dark:text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-8">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/40 rounded-[3rem] border border-dashed border-slate-200 dark:border-white/10">
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No deliverables scoped for this period.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8">
            {filteredTasks.map(task => (
              <div key={task.id} className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-white/5 shadow-hard overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-10">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <span className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-lg border-2 mb-4 inline-block ${
                        task.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                        task.status === 'Blocked' ? 'bg-rose-50 text-rose-600 border-rose-100' : 
                        'bg-slate-50 text-slate-600 border-slate-100'
                      }`}>
                        {task.status}
                      </span>
                      <h4 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">{task.taskTitle}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">{task.category} • {task.frequency}</p>
                    </div>
                    <div className="text-right">
                       <p className="text-4xl font-black text-brand-blue">{task.hoursSpent}h</p>
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Logged</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div className="space-y-6">
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-8 rounded-[2rem] border border-slate-100 dark:border-white/5">
                        <div className="flex justify-between items-center mb-4">
                          <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Deliverable Spec</h5>
                          <span className="text-[10px] font-black text-brand-cyan uppercase tracking-widest">Due: {task.dueDate}</span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">{task.taskDescription}</p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Strategic Log Entries</h5>
                      <div className="space-y-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                        {task.comments.length === 0 ? (
                          <p className="text-xs font-medium text-slate-400 italic">No entries logged for this deliverable.</p>
                        ) : (
                          task.comments.map(comment => (
                            <div key={comment.id} className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-[10px] font-black text-brand-cyan uppercase tracking-tighter">{comment.authorName}</span>
                                <span className="text-[8px] text-slate-400 uppercase font-bold">{new Date(comment.timestamp).toLocaleDateString()}</span>
                              </div>
                              <p className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-relaxed">{comment.text}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PersonnelProtocolView;
