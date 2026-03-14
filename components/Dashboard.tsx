
import React from 'react';
import { ManagementSummary, User } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { motion } from 'motion/react';
import { 
  Activity, 
  AlertCircle, 
  Clock, 
  Zap, 
  TrendingUp, 
  ShieldAlert,
  MessageSquareQuote,
  FileText,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Users
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DashboardProps {
  summary: ManagementSummary;
  users: User[];
}

const Dashboard: React.FC<DashboardProps> = ({ summary, users }) => {
  const chartData = summary.staffWorkload.map(s => ({
    name: s.staffName,
    hours: s.totalHours,
    tasks: s.oneTimeTasks.length + s.recurringTasks.length + s.trainingTasks.length
  }));

  const cadenceData = [
    { name: 'Daily', value: summary.analytics.cadenceBreakdown.dailyTotal, color: '#2B58FF' },
    { name: 'Weekly', value: summary.analytics.cadenceBreakdown.weeklyTotal, color: '#5BC9F5' },
    { name: 'Monthly', value: summary.analytics.cadenceBreakdown.monthlyTotal, color: '#6366F1' },
    { name: 'One-time', value: summary.analytics.cadenceBreakdown.oneTimeTotal, color: '#1A1A1A' },
  ].filter(d => d.value > 0);

  const COLORS = ['#2B58FF', '#5BC9F5', '#1A1A1A', '#6366F1', '#8B5CF6'];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-12 pb-24"
    >
      {/* High-Impact Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
        {[
          { label: 'Total Capacity', val: summary.analytics.totalTasks, icon: Activity, color: 'text-slate-900 dark:text-white', sub: 'Units Active', bg: 'bg-white dark:bg-slate-900' },
          { label: 'Work Effort', val: `${summary.analytics.totalHoursLogged}h`, icon: Clock, color: 'text-brand-blue dark:text-brand-cyan', sub: 'Deliverables Log', bg: 'bg-white dark:bg-slate-900' },
          { label: 'Velocity', val: `${summary.analytics.completionPercentage}%`, icon: TrendingUp, color: 'text-slate-900 dark:text-white', sub: 'Target Match', bg: 'bg-white dark:bg-slate-900' },
          { label: 'Blockers', val: summary.analytics.blockedCount, icon: ShieldAlert, color: 'text-white', sub: 'Immediate Action', bg: 'bg-rose-600 shadow-rose-200 dark:shadow-rose-900/20' },
          { label: 'At Risk', val: summary.analytics.overdueCount, icon: AlertTriangle, color: 'text-white', sub: 'Schedule Delay', bg: 'bg-amber-500 shadow-amber-200 dark:shadow-amber-900/20' },
        ].map((item, idx) => (
          <motion.div 
            key={idx} 
            variants={itemVariants}
            className={cn(
              "p-6 rounded-[2rem] shadow-soft border border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-all hover:scale-[1.02]",
              item.bg
            )}
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className={cn(
                "text-[10px] font-black uppercase tracking-[0.2em]",
                idx >= 3 ? "text-white/70" : "text-slate-500 dark:text-slate-400"
              )}>{item.label}</h3>
              <item.icon className={cn("w-4 h-4", idx >= 3 ? "text-white/70" : "text-slate-400")} />
            </div>
            <p className={cn("text-4xl font-black tracking-tighter leading-none", item.color)}>{item.val}</p>
            <div className={cn(
              "mt-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest",
              idx >= 3 ? "text-white/80" : "text-brand-cyan"
            )}>
               <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", idx >= 3 ? "bg-white" : "bg-brand-cyan")}></span> 
               {item.sub}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tactical Effort Cycle & AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <motion.div 
           variants={itemVariants}
           className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 sm:p-12 rounded-[3rem] shadow-soft border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-12 items-center"
         >
            <div className="w-full md:w-1/2">
                <div className="flex items-center gap-3 mb-4">
                  <Zap className="w-6 h-6 text-brand-blue" />
                  <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Tactical Effort Cycle</h3>
                </div>
                <p className="text-slate-500 dark:text-slate-400 font-medium text-sm leading-relaxed mb-8">Verification of time investment across workspace cadence. This audit confirms operational deliverable adherence.</p>
                <div className="space-y-3">
                    {cadenceData.map((d, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                            <div className="flex items-center gap-3">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }}></div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{d.name} Stream</span>
                            </div>
                            <span className="text-lg font-black text-slate-800 dark:text-white">{d.value}h</span>
                        </div>
                    ))}
                </div>
            </div>
            <div className="w-full md:w-1/2 h-64 md:h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie 
                            data={cadenceData} 
                            innerRadius={70} 
                            outerRadius={100} 
                            paddingAngle={8} 
                            dataKey="value" 
                            stroke="none"
                        >
                            {cadenceData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} className="outline-none" />
                            ))}
                        </Pie>
                        <Tooltip 
                           contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', background: '#1A1A1A', color: '#fff', fontSize: '10px', fontWeight: 900 }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
         </motion.div>
         
         <motion.div 
           variants={itemVariants}
           className="bg-brand-blue p-8 sm:p-12 rounded-[3rem] shadow-hard text-white relative overflow-hidden flex flex-col justify-center group"
         >
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl transition-transform group-hover:scale-110"></div>
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <MessageSquareQuote className="w-6 h-6 text-brand-cyan" />
              <h3 className="text-xl font-black tracking-tight">AI Cadence Insights</h3>
            </div>
            <p className="text-white/90 leading-relaxed font-medium text-lg italic relative z-10 drop-shadow-sm">
              "{summary.recurringTaskOverview}"
            </p>
            <div className="mt-8 pt-6 border-t border-white/10 relative z-10">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-cyan">
                <CheckCircle2 className="w-3 h-3" />
                Optimization Strategy Active
              </div>
            </div>
         </motion.div>
      </div>

      {/* Workspace Intelligence Report */}
      <motion.section 
        variants={itemVariants}
        className="bg-white dark:bg-slate-900 p-8 sm:p-14 rounded-[3.5rem] shadow-soft border border-slate-200 dark:border-slate-800 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-blue/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        <div className="flex items-center space-x-6 mb-10 relative z-10">
          <div className="p-3 bg-brand-blue/10 rounded-2xl">
            <FileText className="w-8 h-8 text-brand-blue" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Workspace Intelligence Report</h2>
        </div>
        <div className="relative z-10">
          <p className="text-slate-700 dark:text-slate-300 leading-[1.8] text-xl sm:text-2xl font-medium whitespace-pre-wrap italic opacity-90">
            "{summary.executiveSummary}"
          </p>
        </div>
      </motion.section>

      {/* Team Resource Allocation Chart */}
      <motion.div 
        variants={itemVariants}
        className="bg-white dark:bg-slate-900 p-8 sm:p-12 rounded-[3rem] shadow-soft border border-slate-200 dark:border-slate-800"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-12">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-brand-blue" />
            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Active Personnel Load</h3>
          </div>
          <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-brand-blue"></div>
              High Effort
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-brand-cyan"></div>
              Standard
            </div>
          </div>
        </div>
        <div className="h-[400px] sm:h-[450px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" opacity={0.5} />
              <XAxis type="number" hide />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={100} 
                tick={{fontSize: 11, fontWeight: 900, fill: '#64748b'}} 
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                cursor={{fill: 'rgba(43, 88, 255, 0.03)'}} 
                contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', fontWeight: 800, background: '#1A1A1A', color: '#fff', padding: '15px' }}
              />
              <Bar dataKey="hours" name="Deliverable Effort" radius={[0, 12, 12, 0]} barSize={32}>
                 {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Personnel Performance Analysis */}
      <section className="space-y-10">
        <div className="flex items-center gap-4">
          <Users className="w-8 h-8 text-brand-blue" />
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Personnel Performance Analysis</h2>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
          {summary.staffWorkload.map((staff, idx) => {
            const freq = staff.effortByFrequency;
            const user = users.find(u => u.name === staff.staffName);
            
            return (
              <motion.div 
                key={idx} 
                variants={itemVariants}
                className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-soft border border-slate-200 dark:border-slate-800 p-8 sm:p-10 transition-all hover:shadow-hard hover:border-brand-blue/30 group"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-10">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-brand-blue dark:text-brand-cyan text-3xl font-black shadow-inner transition-transform group-hover:rotate-2 overflow-hidden">
                       <img 
                        src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${staff.staffName}`} 
                        alt="avatar" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                       />
                    </div>
                    <div>
                      <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none">{staff.staffName}</h3>
                      <div className="flex items-center gap-2 mt-3">
                        <span className="w-2 h-2 rounded-full bg-brand-cyan animate-pulse"></span>
                        <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest truncate max-w-[150px]">
                          {staff.currentlyWorkingOn}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-left sm:text-right w-full sm:w-auto">
                    <p className="text-4xl sm:text-5xl font-black text-brand-blue dark:text-brand-cyan tracking-tighter leading-none">{staff.totalHours}h</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Tactical Time</p>
                  </div>
                </div>

                <div className="space-y-4 mb-10">
                    <div className="flex justify-between items-end mb-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Effort Cadence Distribution</p>
                      <p className="text-[10px] font-black text-brand-blue uppercase tracking-widest">Capacity Audit</p>
                    </div>
                    <div className="flex h-3 w-full rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                        <div style={{ width: `${(freq.daily / Math.max(staff.totalHours, 1)) * 100}%` }} className="bg-brand-blue h-full" title="Daily"></div>
                        <div style={{ width: `${(freq.weekly / Math.max(staff.totalHours, 1)) * 100}%` }} className="bg-brand-cyan h-full" title="Weekly"></div>
                        <div style={{ width: `${(freq.monthly / Math.max(staff.totalHours, 1)) * 100}%` }} className="bg-indigo-500 h-full" title="Monthly"></div>
                        <div style={{ width: `${(freq.oneTime / Math.max(staff.totalHours, 1)) * 100}%` }} className="bg-slate-400 h-full" title="One-time"></div>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-2">
                        <span className="flex items-center gap-1.5 text-[9px] font-black uppercase text-slate-400"><div className="w-2 h-2 rounded-full bg-brand-blue"></div> Daily ({freq.daily}h)</span>
                        <span className="flex items-center gap-1.5 text-[9px] font-black uppercase text-slate-400"><div className="w-2 h-2 rounded-full bg-brand-cyan"></div> Weekly ({freq.weekly}h)</span>
                        <span className="flex items-center gap-1.5 text-[9px] font-black uppercase text-slate-400"><div className="w-2 h-2 rounded-full bg-indigo-500"></div> Monthly ({freq.monthly}h)</span>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4 sm:gap-6 mb-10">
                  {[
                    { label: 'One-Time', val: staff.oneTimeTasks.length, color: 'brand-blue' },
                    { label: 'Recurring', val: staff.recurringTasks.length, color: 'brand-cyan' },
                    { label: 'Training', val: staff.trainingTasks.length, color: 'brand-gray' },
                  ].map((stat, sidx) => (
                    <div key={sidx} className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 text-center transition-all group-hover:bg-white dark:group-hover:bg-slate-800">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">{stat.label}</p>
                      <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{stat.val}</p>
                    </div>
                  ))}
                </div>

                {staff.unresolvedItems.length > 0 && (
                  <div className="pt-8 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 mb-6">
                      <AlertCircle className="w-4 h-4 text-rose-500" />
                      <h4 className="text-[10px] font-black text-rose-600 uppercase tracking-[0.2em]">Operational Friction Points</h4>
                    </div>
                    <ul className="space-y-3">
                      {staff.unresolvedItems.map((item, i) => (
                        <li key={i} className="text-[12px] font-semibold text-slate-700 dark:text-slate-400 bg-rose-500/5 px-4 py-3 rounded-xl border border-rose-500/10 flex items-start gap-3 transition-all hover:bg-rose-500/10">
                          <span className="mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-rose-500"></span> 
                          <span className="leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </section>
    </motion.div>
  );
};

export default Dashboard;
