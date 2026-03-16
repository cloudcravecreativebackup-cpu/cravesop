
import React, { useState, useMemo, useRef } from 'react';
import { StaffTask, TaskStatus, User, Frequency, Brand, ServiceType, TaskComment, Organization } from '../types';
import PerformanceView from './PerformanceView';
import AlertsPanel from './AlertsPanel';

interface TaskBoardProps {
  tasks: StaffTask[];
  users: User[];
  brands: Brand[];
  workspace: Organization;
  currentUser: User;
  onEditTask: (task: StaffTask) => void;
  onAddComment: (taskId: string, commentText: string) => void;
  onUpdateTaskStatus: (taskId: string, status: TaskStatus, feedback?: string) => void;
  highlightTaskId?: string | null;
  onHighlightClear?: () => void;
}

type BoardView = 'deliverables' | 'people' | 'brands' | 'performance' | 'reports';
type BoardLayout = 'list' | 'kanban';
type TimeRange = 'Today' | 'This Week' | 'This Month' | 'This Year' | 'All Time';

const TaskBoard: React.FC<TaskBoardProps> = ({ 
  tasks, users, brands, workspace, currentUser, onEditTask, onAddComment, onUpdateTaskStatus,
  highlightTaskId, onHighlightClear
}) => {
  const terminology = workspace.config?.clientTerminology || 'Brand';
  const terminologyPlural = workspace.config?.clientTerminologyPlural || 'Brands';
  
  const [view, setView] = useState<BoardView>('deliverables');
  const [layout, setLayout] = useState<BoardLayout>('list');
  const [selectedBrandId, setSelectedBrandId] = useState<string | 'All'>('All');
  const [selectedService, setSelectedService] = useState<ServiceType | 'All'>('All');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'All'>('All');
  const [ownerFilter, setOwnerFilter] = useState<string | 'All'>('All');
  const [timeRange, setTimeRange] = useState<TimeRange>('All Time');
  const [reportType, setReportType] = useState<'Per Person' | 'Per Brand' | 'Per Service'>('Per Person');
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  
  // Comment flow states
  const [isInputActive, setIsInputActive] = useState<boolean>(false);
  const [commentText, setCommentText] = useState<string>('');
  const [replyToName, setReplyToName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const highlightedTaskRef = useRef<HTMLTableRowElement>(null);

  React.useEffect(() => {
    if (highlightTaskId) {
      setExpandedTaskId(highlightTaskId);
      setTimeout(() => {
        highlightedTaskRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (onHighlightClear) onHighlightClear();
      }, 500);
    }
  }, [highlightTaskId, onHighlightClear]);

  const getTimeForRange = (task: StaffTask, range: TimeRange): number => {
    if (!task.timeEntries) return 0;
    const now = new Date();
    const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    
    const filteredEntries = task.timeEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      if (range === 'Today') {
        return startOf(entryDate).getTime() === startOf(now).getTime();
      }
      if (range === 'This Week') {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        return startOf(entryDate) >= startOf(startOfWeek);
      }
      if (range === 'This Month') {
        return entryDate.getMonth() === now.getMonth() && entryDate.getFullYear() === now.getFullYear();
      }
      if (range === 'This Year') {
        return entryDate.getFullYear() === now.getFullYear();
      }
      return true;
    });

    return filteredEntries.reduce((acc, curr) => acc + curr.durationMinutes, 0);
  };

  const filteredTasks = useMemo(() => {
    let result = tasks;
    if (currentUser.role === 'Staff Member' || currentUser.role === 'Mentee') {
      result = result.filter(t => t.staffName === currentUser.name);
    }

    if (selectedBrandId !== 'All') result = result.filter(t => t.brandId === selectedBrandId);
    if (selectedService !== 'All') result = result.filter(t => t.serviceType === selectedService);
    if (statusFilter !== 'All') result = result.filter(t => t.status === statusFilter);
    if (ownerFilter !== 'All') result = result.filter(t => t.staffName === ownerFilter);
    
    return result;
  }, [tasks, selectedBrandId, selectedService, statusFilter, ownerFilter, currentUser]);

  const groupedByOwner = useMemo(() => {
    const groups: Record<string, StaffTask[]> = {};
    filteredTasks.forEach(task => {
      if (!groups[task.staffName]) groups[task.staffName] = [];
      groups[task.staffName].push(task);
    });
    return groups;
  }, [filteredTasks]);

  const groupedByBrand = useMemo(() => {
    const groups: Record<string, StaffTask[]> = {};
    filteredTasks.forEach(task => {
      const brandName = brands.find(b => b.id === task.brandId)?.name || 'Internal';
      if (!groups[brandName]) groups[brandName] = [];
      groups[brandName].push(task);
    });
    return groups;
  }, [filteredTasks, brands]);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Admin': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Staff Lead': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Staff Member': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Mentee': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'In Progress': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'Blocked': return 'bg-rose-50 text-rose-600 border-rose-100 animate-pulse';
      case 'Pending Approval': return 'bg-blue-50 text-blue-600 border-blue-100 animate-pulse';
      case 'Rejected': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const handleStartComment = (taskId: string, replyTo?: string) => {
    setIsInputActive(true);
    if (replyTo) {
      setReplyToName(replyTo);
      setCommentText(`@${replyTo} `);
    } else {
      setReplyToName(null);
      setCommentText('');
    }
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handlePostComment = (taskId: string) => {
    if (commentText.trim()) {
      onAddComment(taskId, commentText);
      setCommentText('');
      setIsInputActive(false);
      setReplyToName(null);
    }
  };

  const handleCancelComment = () => {
    setCommentText('');
    setIsInputActive(false);
    setReplyToName(null);
  };

  const exportToCSV = () => {
    const headers = ['Task Title', 'Owner', 'Brand', 'Service', 'Status', 'Due Date', 'Hours Spent'];
    const rows = filteredTasks.map(t => [
      t.taskTitle,
      t.staffName,
      brands.find(b => b.id === t.brandId)?.name || 'Internal',
      t.serviceType,
      t.status,
      t.dueDate,
      t.hoursSpent
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `craveops_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700 print:space-y-0">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; color: black !important; }
          .print-only { display: block !important; }
          .card { border: 1px solid #eee !important; box-shadow: none !important; break-inside: avoid; }
          @page { margin: 2cm; }
        }
        .print-only { display: none; }
      `}</style>

      <div className="flex flex-col gap-8 no-print">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h2 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight leading-none">Deliverables Queue</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-lg mt-3">Tactical monitoring of {terminologyPlural.toLowerCase()} and service deliverables.</p>
          </div>
          
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl overflow-x-auto no-scrollbar max-w-full">
            {(['deliverables', 'people', 'brands', 'performance', 'reports'] as BoardView[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  view === v 
                    ? 'bg-white dark:bg-slate-700 text-brand-blue dark:text-brand-cyan shadow-sm' 
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                }`}
              >
                {v === 'brands' ? terminologyPlural : v}
              </button>
            ))}
          </div>

          {view === 'deliverables' && (
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl overflow-x-auto no-scrollbar">
              {(['list', 'kanban'] as BoardLayout[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLayout(l)}
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    layout === l 
                      ? 'bg-white dark:bg-slate-700 text-brand-blue dark:text-brand-cyan shadow-sm' 
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                  }`}
                >
                  {l === 'list' ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" /></svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" /></svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-3 p-6 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-soft">
          <div className="flex flex-col gap-1.5">
            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2">{terminology}</label>
            <select 
              value={selectedBrandId}
              onChange={e => setSelectedBrandId(e.target.value)}
              className="px-4 py-2.5 rounded-xl text-[10px] font-black uppercase bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 outline-none"
            >
              <option value="All">All {terminologyPlural}</option>
              {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2">Service</label>
            <select 
              value={selectedService}
              onChange={e => setSelectedService(e.target.value as any)}
              className="px-4 py-2.5 rounded-xl text-[10px] font-black uppercase bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 outline-none"
            >
              <option value="All">All Services</option>
              <option value="Social Media Management">Social Media</option>
              <option value="Cloud Support">Cloud Support</option>
              <option value="Digital Solutions">Digital Solutions</option>
              <option value="Switch2Tech Training">Switch2Tech Training</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2">Status</label>
            <select 
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="px-4 py-2.5 rounded-xl text-[10px] font-black uppercase bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 outline-none"
            >
              <option value="All">All Status</option>
              <option value="In Progress">In Progress</option>
              <option value="Blocked">Blocked</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2">Owner</label>
            <select 
              value={ownerFilter}
              onChange={e => setOwnerFilter(e.target.value)}
              className="px-4 py-2.5 rounded-xl text-[10px] font-black uppercase bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 outline-none"
            >
              <option value="All">All Owners</option>
              {users.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2">Time Range</label>
            <select 
              value={timeRange}
              onChange={e => setTimeRange(e.target.value as TimeRange)}
              className="px-4 py-2.5 rounded-xl text-[10px] font-black uppercase bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 outline-none"
            >
              <option value="All Time">All Time</option>
              <option value="Today">Today</option>
              <option value="This Week">This Week</option>
              <option value="This Month">This Month</option>
              <option value="This Year">This Year</option>
            </select>
          </div>

          {view === 'reports' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2">Report Type</label>
              <select 
                value={reportType}
                onChange={e => setReportType(e.target.value as any)}
                className="px-4 py-2.5 rounded-xl text-[10px] font-black uppercase bg-brand-blue/5 text-brand-blue border border-brand-blue/10 outline-none"
              >
                <option value="Per Person">Per Person</option>
                <option value="Per Brand">Per {terminology}</option>
                <option value="Per Service">Per Service</option>
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-8">
        <div className="flex-grow space-y-12">
          {view === 'deliverables' && (
            <>
              {/* Mobile Card View */}
              <div className="lg:hidden space-y-6">
                {filteredTasks.length === 0 ? (
                  <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-12 text-center border border-slate-200 dark:border-white/5 shadow-soft">
                    <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No deliverables found matching your filters.</p>
                  </div>
                ) : (
                  filteredTasks.map(task => {
                    const brand = brands.find(b => b.id === task.brandId);
                    const user = users.find(u => u.name === task.staffName);
                    const isExpanded = expandedTaskId === task.id;
                    const timeSpent = getTimeForRange(task, timeRange);
                    
                    return (
                      <div 
                        key={task.id} 
                        onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                        className={`bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-soft overflow-hidden transition-all ${isExpanded ? 'ring-2 ring-brand-blue' : ''}`}
                      >
                        <div className="p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                              <img src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${task.staffName}`} className="w-10 h-10 rounded-xl border border-slate-100 dark:border-slate-800" referrerPolicy="no-referrer" />
                              <div>
                                <p className="text-xs font-black text-slate-800 dark:text-white leading-none">{task.staffName}</p>
                                <span className={`inline-block text-[7px] font-black uppercase px-2 py-0.5 rounded border mt-1 ${getRoleColor(user?.role || 'Member')}`}>
                                  {user?.role || 'Member'}
                                </span>
                              </div>
                            </div>
                            <span className={`text-[8px] font-black uppercase px-3 py-1.5 rounded-lg border-2 ${getStatusColor(task.status)}`}>
                              {task.status}
                            </span>
                          </div>
                          
                          <h4 className="text-sm font-black text-slate-800 dark:text-white mb-2">{task.taskTitle}</h4>
                          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-50 dark:border-white/5">
                            <p className="text-[9px] font-black text-brand-blue dark:text-brand-cyan uppercase tracking-widest">{brand?.name || 'Internal'}</p>
                            <span className="text-[10px] font-black text-slate-500">{Math.floor(timeSpent / 60)}h {timeSpent % 60}m</span>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="px-6 pb-6 pt-2 bg-slate-50/50 dark:bg-white/5 animate-in slide-in-from-top-2">
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium mb-6">{task.taskDescription}</p>
                            <div className="flex gap-4">
                              <button onClick={(e) => { e.stopPropagation(); onEditTask(task); }} className="flex-grow py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">Edit Task</button>
                              <button onClick={(e) => { e.stopPropagation(); handleStartComment(task.id); }} className="flex-grow py-3 bg-brand-blue text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Comment</button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Desktop View */}
              <div className="hidden lg:block">
                {layout === 'list' ? (
                  <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-soft overflow-hidden overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[1100px]">
                      <thead>
                        <tr className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-white/5">
                          <th className="px-8 py-6 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.3em]">Owner</th>
                          <th className="px-8 py-6 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.3em]">Client {terminology}</th>
                          <th className="px-8 py-6 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.3em]">Deliverable</th>
                          <th className="px-8 py-6 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.3em]">Service Stream</th>
                          <th className="px-8 py-6 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.3em]">Time Spent</th>
                          <th className="px-8 py-6 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.3em]">Status</th>
                          <th className="px-8 py-6 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.3em] text-right">Moderation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                        {filteredTasks.map(task => {
                          const brand = brands.find(b => b.id === task.brandId);
                          const user = users.find(u => u.name === task.staffName);
                          const isExpanded = expandedTaskId === task.id;
                          const timeSpent = getTimeForRange(task, timeRange);
                          
                          return (
                            <React.Fragment key={task.id}>
                              <tr 
                                ref={highlightTaskId === task.id ? highlightedTaskRef : null}
                                onClick={() => {
                                  setExpandedTaskId(isExpanded ? null : task.id);
                                  setIsInputActive(false);
                                }}
                                className={`group hover:bg-slate-50/50 dark:hover:bg-white/5 transition-all cursor-pointer ${isExpanded ? 'bg-slate-50/30 dark:bg-white/5' : ''} ${highlightTaskId === task.id ? 'ring-2 ring-brand-blue ring-inset' : ''}`}
                              >
                                <td className="px-8 py-6">
                                  <div className="flex items-center gap-4">
                                    <img src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${task.staffName}`} className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm object-cover" referrerPolicy="no-referrer" />
                                    <div>
                                      <p className="text-xs font-black text-slate-800 dark:text-white leading-none">{task.staffName}</p>
                                      <span className={`inline-block text-[7px] font-black uppercase px-2 py-0.5 rounded border mt-1.5 ${getRoleColor(user?.role || 'Member')}`}>
                                        {user?.role || 'Member'}
                                      </span>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-8 py-6">
                                  <p className="text-[10px] font-black text-brand-blue dark:text-brand-cyan uppercase tracking-widest">{brand?.name || 'Internal'}</p>
                                </td>
                                <td className="px-8 py-6 font-black text-slate-800 dark:text-white text-sm">{task.taskTitle}</td>
                                <td className="px-8 py-6">
                                   <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{task.serviceType}</span>
                                </td>
                                <td className="px-8 py-6">
                                   <span className="text-xs font-black text-slate-700 dark:text-slate-300">{Math.floor(timeSpent / 60)}h {timeSpent % 60}m</span>
                                </td>
                                <td className="px-8 py-6">
                                  <span className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-lg border-2 ${getStatusColor(task.status)}`}>
                                    {task.status}
                                  </span>
                                </td>
                                <td className="px-8 py-6 text-right">
                                   <div className="flex justify-end gap-2">
                                    <button onClick={(e) => { e.stopPropagation(); onEditTask(task); }} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-brand-blue transition-colors">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                    </button>
                                    <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-400">
                                      <svg className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                                    </div>
                                   </div>
                                </td>
                              </tr>
                              {isExpanded && (
                                <tr className="bg-slate-50/50 dark:bg-slate-800/20 animate-in slide-in-from-top-2 duration-300">
                                  <td colSpan={7} className="px-12 py-10">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                      <div>
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                          <span className="w-1.5 h-1.5 rounded-full bg-brand-blue"></span>
                                          Deliverable Details
                                        </h4>
                                        <p className="text-base text-slate-700 dark:text-slate-300 leading-relaxed font-medium bg-white dark:bg-slate-900/50 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">{task.taskDescription}</p>
                                        
                                        <div className="mt-8 flex gap-6">
                                          <div className="flex flex-col">
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Estimated</span>
                                            <span className="text-xl font-black text-slate-800 dark:text-white">{task.estimatedHours}h</span>
                                          </div>
                                          <div className="flex flex-col">
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Spent</span>
                                            <span className="text-xl font-black text-brand-blue dark:text-brand-cyan">{task.hoursSpent}h</span>
                                          </div>
                                          <div className="flex flex-col">
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Due Date</span>
                                            <span className="text-xl font-black text-slate-800 dark:text-white">{new Date(task.dueDate).toLocaleDateString()}</span>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="space-y-6 flex flex-col">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-between">
                                          <span className="flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan"></span>
                                            Inference Logs
                                          </span>
                                          {!isInputActive && (
                                            <button 
                                              onClick={() => handleStartComment(task.id)}
                                              className="text-[9px] font-black text-brand-blue dark:text-brand-cyan uppercase tracking-widest bg-brand-blue/5 dark:bg-brand-cyan/10 px-3 py-1.5 rounded-lg hover:bg-brand-blue hover:text-white transition-all"
                                            >
                                              + Add Log
                                            </button>
                                          )}
                                        </h4>
                                        
                                        <div className="flex-grow space-y-4 max-h-[400px] overflow-y-auto pr-3 scrollbar-hide custom-scrollbar">
                                          {task.comments.length === 0 ? (
                                            <div className="py-12 text-center bg-white/50 dark:bg-slate-900/30 rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-800">
                                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No operational logs recorded.</p>
                                            </div>
                                          ) : (
                                            task.comments.map(c => (
                                              <div key={c.id} className="p-6 rounded-2xl border border-slate-100 dark:border-white/5 bg-white dark:bg-slate-900 shadow-sm relative group/comment">
                                                <div className="flex justify-between items-center mb-3">
                                                  <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-[8px] font-black text-slate-500 overflow-hidden">
                                                      <img src={users.find(u => u.name === c.authorName)?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.authorName}`} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                                    </div>
                                                    <div>
                                                      <span className="text-[10px] font-black text-slate-800 dark:text-white uppercase tracking-tighter">{c.authorName}</span>
                                                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-2">{c.authorRole}</span>
                                                    </div>
                                                  </div>
                                                  <span className="text-[8px] font-bold text-slate-400/50 uppercase tracking-widest">{new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                                <p className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{c.text}</p>
                                                
                                                <button 
                                                  onClick={() => handleStartComment(task.id, c.authorName)}
                                                  className="mt-3 opacity-0 group-hover/comment:opacity-100 text-[8px] font-black text-brand-blue uppercase tracking-widest transition-all hover:underline"
                                                >
                                                  Reply
                                                </button>
                                              </div>
                                            ))
                                          )}
                                        </div>

                                        {isInputActive && (
                                          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border-2 border-brand-blue/20 shadow-hard animate-in fade-in slide-in-from-bottom-2 duration-300">
                                            <div className="flex items-center gap-2 mb-3">
                                              <span className="w-1.5 h-1.5 rounded-full bg-brand-blue animate-pulse"></span>
                                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                {replyToName ? `Replying to ${replyToName}` : 'New Operational Entry'}
                                              </span>
                                            </div>
                                            <input 
                                              ref={inputRef}
                                              className="w-full text-xs font-bold px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none border border-transparent focus:border-brand-blue/30 mb-4 transition-all"
                                              placeholder="Log progress or reply to unit..."
                                              value={commentText}
                                              onChange={e => setCommentText(e.target.value)}
                                              onKeyDown={e => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                  e.preventDefault();
                                                  handlePostComment(task.id);
                                                }
                                                if (e.key === 'Escape') {
                                                  handleCancelComment();
                                                }
                                              }}
                                            />
                                            <div className="flex justify-end gap-3">
                                              <button 
                                                onClick={handleCancelComment}
                                                className="px-5 py-2.5 text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600"
                                              >
                                                Cancel
                                              </button>
                                              <button 
                                                onClick={() => handlePostComment(task.id)}
                                                className="px-6 py-2.5 bg-brand-blue text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-brand-blue/20 active:scale-95 transition-all"
                                              >
                                                Commit Log
                                              </button>
                                            </div>
                                          </div>
                                        )}

                                        {!isInputActive && task.comments.length > 0 && (
                                          <button 
                                            onClick={() => handleStartComment(task.id)}
                                            className="w-full py-4 border-2 border-dashed border-slate-100 dark:border-white/5 rounded-2xl text-[9px] font-black text-slate-400 uppercase tracking-widest hover:border-brand-blue/20 hover:text-brand-blue transition-all"
                                          >
                                            + Add Another Log
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 h-full min-h-[600px]">
                    {(['Not Started', 'In Progress', 'Blocked', 'Completed'] as TaskStatus[]).map(status => {
                      const statusTasks = filteredTasks.filter(t => t.status === status);
                      return (
                        <div key={status} className="flex flex-col gap-6">
                          <div className="flex items-center justify-between px-4">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${getStatusColor(status).split(' ')[0].replace('bg-', 'bg-')}`}></span>
                              {status}
                            </h3>
                            <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-black px-2 py-0.5 rounded-lg">{statusTasks.length}</span>
                          </div>
                          <div className="flex-grow space-y-4 p-2 bg-slate-50/50 dark:bg-slate-800/20 rounded-[2rem] border border-slate-100 dark:border-white/5 min-h-[200px]">
                            {statusTasks.map(task => {
                              const brand = brands.find(b => b.id === task.brandId);
                              const user = users.find(u => u.name === task.staffName);
                              return (
                                <div 
                                  key={task.id}
                                  onClick={() => { setExpandedTaskId(task.id); setView('deliverables'); setLayout('list'); }}
                                  className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                                >
                                  <div className="flex justify-between items-start mb-4">
                                    <p className="text-[8px] font-black text-brand-blue dark:text-brand-cyan uppercase tracking-widest">{brand?.name || 'Internal'}</p>
                                    <img src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${task.staffName}`} className="w-6 h-6 rounded-lg border border-slate-100 dark:border-slate-800" referrerPolicy="no-referrer" />
                                  </div>
                                  <h4 className="text-xs font-black text-slate-800 dark:text-white mb-4 line-clamp-2">{task.taskTitle}</h4>
                                  <div className="flex items-center justify-between">
                                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">{task.serviceType}</span>
                                    <span className="text-[8px] font-black text-slate-500">{task.hoursSpent}h</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

      {(view === 'people' || view === 'brands') && (
        <div className="space-y-12">
          {Object.entries((view === 'people' ? groupedByOwner : groupedByBrand) as Record<string, StaffTask[]>).map(([groupName, groupTasks]) => {
            const totalTime = groupTasks.reduce((acc, t) => acc + getTimeForRange(t, timeRange), 0);
            const user = view === 'people' ? users.find(u => u.name === groupName) : null;
            
            // Workload calculation for people view
            const capacity = user?.weeklyCapacityHours || 40;
            const activeTasks = groupTasks.filter(t => t.status !== 'Completed');
            const estimatedTotal = activeTasks.reduce((acc, t) => acc + t.estimatedHours, 0);
            const workloadPercentage = (estimatedTotal / capacity) * 100;
            
            const getWorkloadColor = (pct: number) => {
              if (pct < 60) return 'bg-emerald-500';
              if (pct < 85) return 'bg-amber-500';
              return 'bg-rose-500';
            };

            return (
              <div key={groupName} className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-soft overflow-hidden">
                <div className="px-10 py-8 border-b border-slate-100 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-50/30 dark:bg-slate-800/20">
                  <div className="flex items-center gap-6">
                    {view === 'people' && (
                      <img src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${groupName}`} className="w-16 h-16 rounded-[1.5rem] border-2 border-white dark:border-slate-800 shadow-md object-cover" referrerPolicy="no-referrer" />
                    )}
                    <div>
                      <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">{groupName}</h3>
                      <div className="flex items-center gap-3 mt-2">
                        {user && (
                          <span className={`text-[8px] font-black uppercase px-2.5 py-1 rounded-lg border ${getRoleColor(user.role)}`}>
                            {user.role}
                          </span>
                        )}
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{groupTasks.length} Deliverables</span>
                      </div>
                    </div>
                  </div>

                  {view === 'people' && user && (
                    <div className="flex-grow max-w-xs px-8">
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Workload</span>
                        <span className={`text-[10px] font-black uppercase ${workloadPercentage > 85 ? 'text-rose-500' : 'text-slate-500'}`}>
                          {workloadPercentage.toFixed(0)}% Capacity
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 ${getWorkloadColor(workloadPercentage)}`} 
                          style={{ width: `${Math.min(workloadPercentage, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Time ({timeRange})</span>
                    <span className="text-3xl font-black text-brand-blue dark:text-brand-cyan">{Math.floor(totalTime / 60)}h {totalTime % 60}m</span>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 dark:bg-slate-800/10 border-b border-slate-100 dark:border-white/5">
                        <th className="px-10 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Deliverable</th>
                        <th className="px-10 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">{view === 'people' ? terminology : 'Owner'}</th>
                        <th className="px-10 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Service</th>
                        <th className="px-10 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                        <th className="px-10 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                      {groupTasks.map(t => (
                        <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-all">
                          <td className="px-10 py-5 font-bold text-slate-800 dark:text-slate-200 text-sm">{t.taskTitle}</td>
                          <td className="px-10 py-5 text-xs font-black text-brand-blue dark:text-brand-cyan uppercase tracking-widest">
                            {view === 'people' ? (brands.find(b => b.id === t.brandId)?.name || 'Internal') : t.staffName}
                          </td>
                          <td className="px-10 py-5 text-[10px] font-bold text-slate-400 uppercase">{t.serviceType}</td>
                          <td className="px-10 py-5">
                            <span className={`text-[8px] font-black uppercase px-2 py-1 rounded border ${getStatusColor(t.status)}`}>
                              {t.status}
                            </span>
                          </td>
                          <td className="px-10 py-5 text-right font-black text-slate-700 dark:text-slate-300 text-xs">
                            {Math.floor(getTimeForRange(t, timeRange) / 60)}h {getTimeForRange(t, timeRange) % 60}m
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

          {view === 'performance' && (
            <PerformanceView 
              tasks={filteredTasks} 
              brands={brands} 
              users={users} 
              timeRange={timeRange} 
              workspace={workspace}
            />
          )}

          {view === 'reports' && (
            <div className="space-y-8">
              <div className="flex justify-between items-center no-print">
                <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Operational Report Generator</h3>
                <div className="flex gap-4">
                  <button 
                    onClick={exportToCSV}
                    className="px-8 py-4 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl text-xs font-black uppercase tracking-widest border border-slate-200 dark:border-white/5 shadow-sm hover:bg-slate-50 transition-all flex items-center gap-3"
                  >
                    Export CSV
                  </button>
                  <button 
                    onClick={() => window.print()}
                    className="px-8 py-4 bg-brand-blue text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-brand-blue/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                    Print Report
                  </button>
                </div>
              </div>

          <div className="bg-white dark:bg-slate-900 p-12 rounded-[3rem] border border-slate-200 dark:border-white/5 shadow-soft print:border-none print:shadow-none print:p-0">
            {/* Report Header */}
            <div className="flex flex-col md:flex-row justify-between items-start border-b-4 border-brand-blue pb-10 mb-12">
              <div>
                <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase mb-2">Operational Intelligence</h1>
                <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-xs">CraveOps Multi-Tenant Protocol</p>
              </div>
              <div className="mt-6 md:mt-0 text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Report Context</p>
                <p className="text-xl font-black text-slate-800 dark:text-white">{reportType} Analysis</p>
                <p className="text-[10px] font-bold text-slate-500 mt-2">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })} | {timeRange}</p>
              </div>
            </div>

            {/* Report Content */}
            <div className="space-y-12">
              {Object.entries(
                (reportType === 'Per Person' ? groupedByOwner : 
                reportType === 'Per Brand' ? groupedByBrand : 
                filteredTasks.reduce((acc, t) => {
                  if (!acc[t.serviceType]) acc[t.serviceType] = [];
                  acc[t.serviceType].push(t);
                  return acc;
                }, {} as Record<string, StaffTask[]>)) as Record<string, StaffTask[]>
              ).map(([groupName, groupTasks]) => {
                const totalTime = groupTasks.reduce((acc, t) => acc + getTimeForRange(t, timeRange), 0);
                return (
                  <div key={groupName} className="break-inside-avoid">
                    <div className="flex justify-between items-end mb-6 border-b border-slate-100 dark:border-white/5 pb-4">
                      <h4 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">{groupName}</h4>
                      <div className="text-right">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Aggregate Time</span>
                        <span className="text-lg font-black text-brand-blue">{Math.floor(totalTime / 60)}h {totalTime % 60}m</span>
                      </div>
                    </div>
                    
                    <table className="w-full text-left border-collapse mb-8">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/50 border-b-2 border-slate-200 dark:border-white/10">
                          <th className="px-4 py-3 text-[8px] font-black text-slate-500 uppercase tracking-widest">Task</th>
                          <th className="px-4 py-3 text-[8px] font-black text-slate-500 uppercase tracking-widest">Owner</th>
                          <th className="px-4 py-3 text-[8px] font-black text-slate-500 uppercase tracking-widest">{terminology}</th>
                          <th className="px-4 py-3 text-[8px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                          <th className="px-4 py-3 text-[8px] font-black text-slate-500 uppercase tracking-widest text-right">Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                        {groupTasks.map(t => (
                          <tr key={t.id}>
                            <td className="px-4 py-4 text-xs font-bold text-slate-800 dark:text-slate-200">{t.taskTitle}</td>
                            <td className="px-4 py-4 text-[10px] font-black text-slate-500 uppercase">{t.staffName}</td>
                            <td className="px-4 py-4 text-[10px] font-black text-brand-blue uppercase">{brands.find(b => b.id === t.brandId)?.name || 'Internal'}</td>
                            <td className="px-4 py-4">
                              <span className="text-[8px] font-black uppercase">{t.status}</span>
                            </td>
                            <td className="px-4 py-4 text-right text-xs font-black text-slate-700 dark:text-slate-300">
                              {Math.floor(getTimeForRange(t, timeRange) / 60)}h {getTimeForRange(t, timeRange) % 60}m
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>

            {/* Report Footer */}
            <div className="mt-20 pt-10 border-t border-slate-100 dark:border-white/5 flex justify-between items-center">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Generated via CraveOps Intelligence Engine</p>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Confidential Operational Data</p>
            </div>
          </div>
        </div>
      )}
        </div>

        {/* Alerts Panel - Only visible in non-report views */}
        {view !== 'reports' && (
          <div className="hidden xl:block no-print">
            <AlertsPanel tasks={tasks} users={users} onEditTask={onEditTask} />
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskBoard;
