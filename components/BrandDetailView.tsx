
import React, { useMemo } from 'react';
import { Brand, StaffTask, User, TaskStatus, Organization } from '../types';

interface BrandDetailViewProps {
  brand: Brand;
  tasks: StaffTask[];
  users: User[];
  workspace: Organization;
  onBack: () => void;
  onEditTask: (task: StaffTask) => void;
  onAddComment: (taskId: string, comment: string) => void;
  currentUser: User; // Added currentUser for scoping
}

const BrandDetailView: React.FC<BrandDetailViewProps> = ({ brand, tasks, users, workspace, onBack, onEditTask, onAddComment, currentUser }) => {
  const terminology = workspace.config.clientTerminology;
  const terminologyPlural = workspace.config.clientTerminologyPlural;
  
  // Enforce Scoping for Staff Leads
  const brandTasks = useMemo(() => {
    const rawBrandTasks = tasks.filter(t => t.brandId === brand.id);
    if (currentUser.role === 'Admin') return rawBrandTasks;
    
    // For leads, show only self or squad members
    if (currentUser.role === 'Staff Lead') {
      const myTeamNames = new Set(users.filter(u => u.mentorId === currentUser.id || u.id === currentUser.id).map(u => u.name));
      return rawBrandTasks.filter(t => myTeamNames.has(t.staffName));
    }
    
    // Fallback for members (though they shouldn't reach this view)
    return rawBrandTasks.filter(t => t.staffName === currentUser.name);
  }, [tasks, brand.id, currentUser, users]);
  
  // Calculate team members involved with this brand based on assigned tasks
  const involvedStaffNames = Array.from(new Set(brandTasks.map(t => t.staffName)));
  const teamMembers = users.filter(u => involvedStaffNames.includes(u.name));

  const getStaffRole = (name: string) => {
    return users.find(u => u.name === name)?.role || 'Member';
  };

  const stats = {
    total: brandTasks.length,
    completed: brandTasks.filter(t => t.status === 'Completed').length,
    blocked: brandTasks.filter(t => t.status === 'Blocked').length,
    hours: brandTasks.reduce((acc, t) => acc + (t.hoursSpent || 0), 0)
  };

  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-6">
        <div className="flex items-center gap-6">
          <button 
            onClick={onBack}
            className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 hover:border-brand-blue transition-all shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </button>
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 bg-brand-blue rounded-3xl flex items-center justify-center text-4xl font-black text-white shadow-lg transform -rotate-2">
              {brand.name[0]}
            </div>
            <div>
              <h2 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight leading-none">{brand.name}</h2>
              <div className="flex flex-wrap gap-2 mt-3">
                {brand.services.map(s => (
                  <span key={s} className="px-3 py-1 bg-brand-cyan/10 text-brand-cyan text-[9px] font-black uppercase tracking-widest rounded-lg border border-brand-cyan/20">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full md:w-auto">
          {[
            { label: 'Completion', val: `${completionRate}%`, color: 'text-emerald-500' },
            { label: 'Logged Hours', val: `${stats.hours}h`, color: 'text-brand-blue' },
            { label: 'Active Deliverables', val: stats.total - stats.completed, color: 'text-brand-cyan' },
            { label: 'Blockers', val: stats.blocked, color: 'text-rose-500' }
          ].map((s, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-white/5 shadow-soft min-w-[120px]">
              <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-1">{s.label}</p>
              <p className={`text-xl font-black ${s.color}`}>{s.val}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        {/* Team Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">Team Personnel</h3>
          <div className="space-y-4">
            {teamMembers.length > 0 ? teamMembers.map(member => (
              <div key={member.id} className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm flex items-center gap-4 group hover:border-brand-blue transition-all cursor-default">
                <img src={member.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name}`} className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 dark:border-slate-800 shadow-inner" />
                <div className="overflow-hidden">
                  <p className="text-sm font-black text-slate-800 dark:text-white truncate">{member.name}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{member.role}</p>
                </div>
              </div>
            )) : (
              <p className="text-xs font-medium text-slate-400 italic p-4">No team assigned within your scope.</p>
            )}
          </div>
        </div>

        {/* Brand Deliverables Main Area */}
        <div className="lg:col-span-3 space-y-8">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">{terminology} Deliverables Queue</h3>
          <div className="space-y-6">
            {brandTasks.length === 0 ? (
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] border-4 border-dashed border-slate-100 dark:border-white/5 py-20 text-center">
                <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No active deliverables assigned to your unit.</p>
              </div>
            ) : (
              brandTasks.map(task => (
                <div key={task.id} className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-white/10 shadow-soft overflow-hidden group hover:shadow-hard transition-all">
                  <div className="p-8 sm:p-10">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
                      <div className="flex-grow">
                        <div className="flex items-center gap-3 mb-4">
                          <span className={`px-3 py-1 text-[9px] font-black uppercase rounded-lg border-2 ${
                            task.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                            task.status === 'Blocked' ? 'bg-rose-50 text-rose-600 border-rose-100' : 
                            'bg-slate-50 text-slate-600 border-slate-100'
                          }`}>
                            {task.status}
                          </span>
                          <span className="text-[9px] font-black text-brand-blue uppercase tracking-widest bg-brand-blue/5 px-2 py-1 rounded-md flex items-center gap-1.5">
                             <span>{task.staffName}</span>
                             <span className="opacity-40">•</span>
                             <span className="opacity-70">{getStaffRole(task.staffName)}</span>
                          </span>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{task.serviceType}</span>
                        </div>
                        <h4 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight mb-4">{task.taskTitle}</h4>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl">{task.taskDescription}</p>
                      </div>
                      <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-4 w-full sm:w-auto">
                        <div className="text-right">
                          <p className="text-3xl font-black text-brand-blue">{task.hoursSpent}h</p>
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Logged Effort</p>
                        </div>
                        <button 
                          onClick={() => onEditTask(task)}
                          className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-slate-400 hover:text-brand-blue hover:bg-white dark:hover:bg-slate-700 transition-all shadow-sm border border-slate-200 dark:border-slate-700"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandDetailView;
