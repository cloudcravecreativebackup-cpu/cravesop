import React from 'react';
import { StaffTask, User } from '../types';

interface AlertsPanelProps {
  tasks: StaffTask[];
  users: User[];
  onEditTask: (task: StaffTask) => void;
}

const AlertsPanel: React.FC<AlertsPanelProps> = ({ tasks, users, onEditTask }) => {
  const overdueTasks = tasks.filter(t => t.status !== 'Completed' && new Date(t.dueDate) < new Date());
  
  const staffOverload = users.map(user => {
    const userTasks = tasks.filter(t => t.staffName === user.name && t.status !== 'Completed');
    const totalHours = userTasks.reduce((acc, t) => acc + t.estimatedHours, 0);
    const capacity = user.weeklyCapacityHours || 40;
    const workload = (totalHours / capacity) * 100;
    return { user, workload, totalHours };
  }).filter(s => s.workload > 85);

  const upcomingDeadlines = tasks
    .filter(t => t.status !== 'Completed' && new Date(t.dueDate) > new Date())
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5);

  return (
    <div className="w-80 flex-shrink-0 space-y-6 animate-in slide-in-from-right-4 duration-500">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-soft">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
          Critical Alerts
        </h3>

        <div className="space-y-4">
          {overdueTasks.length > 0 ? (
            overdueTasks.map(task => (
              <div 
                key={task.id} 
                onClick={() => onEditTask(task)}
                className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 cursor-pointer hover:scale-[1.02] transition-transform"
              >
                <p className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase mb-1">Overdue</p>
                <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{task.taskTitle}</p>
                <p className="text-[9px] font-medium text-rose-500 mt-1">Due: {new Date(task.dueDate).toLocaleDateString()}</p>
              </div>
            ))
          ) : (
            <p className="text-[10px] font-bold text-slate-400 text-center py-4 italic">No overdue tasks.</p>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-soft">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          Capacity Warnings
        </h3>

        <div className="space-y-4">
          {staffOverload.length > 0 ? (
            staffOverload.map(({ user, workload }) => (
              <div key={user.id} className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20">
                <div className="flex items-center gap-3 mb-2">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} className="w-6 h-6 rounded-lg" referrerPolicy="no-referrer" />
                  <p className="text-xs font-black text-slate-800 dark:text-white">{user.name}</p>
                </div>
                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500" style={{ width: `${Math.min(workload, 100)}%` }}></div>
                </div>
                <p className="text-[9px] font-bold text-amber-600 dark:text-amber-400 mt-2 uppercase tracking-widest">{workload.toFixed(0)}% Utilized</p>
              </div>
            ))
          ) : (
            <p className="text-[10px] font-bold text-slate-400 text-center py-4 italic">All staff within capacity.</p>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-soft">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Upcoming Deadlines</h3>
        <div className="space-y-3">
          {upcomingDeadlines.map(task => (
            <div key={task.id} className="flex items-center justify-between gap-3">
              <div className="truncate">
                <p className="text-[10px] font-bold text-slate-800 dark:text-white truncate">{task.taskTitle}</p>
                <p className="text-[8px] font-medium text-slate-400 uppercase">{task.staffName}</p>
              </div>
              <span className="text-[9px] font-black text-brand-blue whitespace-nowrap">
                {new Date(task.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AlertsPanel;
