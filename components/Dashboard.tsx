
import React from 'react';
import { ManagementSummary, User } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

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

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 transition-colors pb-24">
      {/* High-Impact Analytics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6 sm:gap-8">
        {[
          { label: 'Total Capacity', val: summary.analytics.totalTasks, color: 'brand-gray', sub: 'Units Active' },
          { label: 'Work Effort', val: `${summary.analytics.totalHoursLogged}h`, color: 'brand-blue', sub: 'Deliverables Log' },
          { label: 'Velocity', val: `${summary.analytics.completionPercentage}%`, color: 'brand-gray', sub: 'Target Match' },
        ].map((item, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-soft border border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-transform hover:scale-[1.02]">
            <h3 className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.25em] mb-4">{item.label}</h3>
            <p className={`text-4xl sm:text-5xl font-black text-${item.color} dark:text-white tracking-tighter leading-none`}>{item.val}</p>
            <div className="mt-6 flex items-center gap-2 text-brand-cyan dark:text-brand-cyan text-[10px] font-black uppercase tracking-widest">
               <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan animate-pulse"></span> {item.sub}
            </div>
          </div>
        ))}
        <div className="bg-rose-600 p-8 rounded-[2rem] shadow-hard shadow-rose-200 dark:shadow-rose-900/20 flex flex-col justify-between text-white transition-transform hover:scale-[1.02]">
          <h3 className="text-[10px] font-black text-rose-200 uppercase tracking-[0.25em] mb-4">Blockers</h3>
          <p className="text-5xl font-black tracking-tighter leading-none">{summary.analytics.blockedCount}</p>
          <div className="mt-6 flex items-center gap-2 text-white/80 text-[10px] font-black uppercase tracking-widest leading-none">Immediate Attention</div>
        </div>
        <div className="bg-amber-500 p-8 rounded-[2rem] shadow-hard shadow-amber-200 dark:shadow-amber-900/20 flex flex-col justify-between text-white transition-transform hover:scale-[1.02]">
          <h3 className="text-[10px] font-black text-amber-100 uppercase tracking-[0.25em] mb-4">At Risk</h3>
          <p className="text-5xl font-black tracking-tighter leading-none">{summary.analytics.overdueCount}</p>
          <div className="mt-6 flex items-center gap-2 text-white/80 text-[10px] font-black uppercase tracking-widest leading-none">Schedule Delay</div>
        </div>
      </div>

      {/* Cadence Audit Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-10 sm:p-14 rounded-[3.5rem] shadow-soft border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-12 items-center">
            <div className="w-full md:w-1/2">
                <h3 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight mb-4">Tactical Effort Cycle</h3>
                <p className="text-slate-500 font-medium text-sm leading-relaxed mb-8">Verification of time investment across workspace cadence. This audit confirms operational deliverable adherence.</p>
                <div className="space-y-4">
                    {cadenceData.map((d, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{d.name} Stream</span>
                            </div>
                            <span className="text-lg font-black text-slate-800 dark:text-white">{d.value}h</span>
                        </div>
                    ))}
                </div>
            </div>
            <div className="w-full md:w-1/2 h-64 md:h-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie 
                            data={cadenceData} 
                            innerRadius={70} 
                            outerRadius={100} 
                            paddingAngle={5} 
                            dataKey="value" 
                            stroke="none"
                        >
                            {cadenceData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip 
                           contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', background: '#1A1A1A', color: '#fff', fontSize: '10px', fontWeight: 900 }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
         </div>
         <div className="bg-brand-blue p-10 sm:p-14 rounded-[3.5rem] shadow-hard text-white relative overflow-hidden flex flex-col justify-center">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
            <h3 className="text-2xl font-black mb-6 tracking-tight relative z-10">AI Cadence Insights</h3>
            <p className="text-white/80 leading-relaxed font-medium text-lg italic relative z-10 drop-shadow-sm leading-relaxed">"{summary.recurringTaskOverview}"</p>
         </div>
      </div>

      {/* AI Synthesis Card */}
      <section className="bg-white dark:bg-slate-900 p-8 sm:p-14 rounded-[3.5rem] shadow-soft border border-slate-200 dark:border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-blue/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        <div className="flex items-center space-x-6 mb-10 relative z-10">
          <div className="w-2.5 h-12 bg-brand-blue dark:bg-brand-cyan rounded-full"></div>
          <h2 className="text-3xl sm:text-4xl font-black text-brand-gray dark:text-white tracking-tight leading-tight">Workspace Intelligence Report</h2>
        </div>
        <p className="text-slate-700 dark:text-slate-300 leading-[1.8] text-xl sm:text-2xl font-medium whitespace-pre-wrap relative z-10 italic drop-shadow-sm">"{summary.executiveSummary}"</p>
      </section>

      {/* Team Resource Allocation Chart */}
      <div className="bg-white dark:bg-slate-900 p-8 sm:p-12 rounded-[3rem] shadow-soft border border-slate-200 dark:border-slate-800">
        <h3 className="text-3xl font-black text-brand-gray dark:text-white mb-12 tracking-tight">Active Personnel Load</h3>
        <div className="h-[450px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" opacity={0.5} />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" width={120} tick={{fontSize: 12, fontWeight: 900, fill: '#64748b'}} />
              <Tooltip 
                cursor={{fill: 'rgba(43, 88, 255, 0.03)'}} 
                contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', fontWeight: 800, background: '#1A1A1A', color: '#fff', padding: '15px' }}
              />
              <Bar dataKey="hours" name="Deliverable Effort" radius={[0, 15, 15, 0]} barSize={35}>
                 {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Focus Breakdown */}
      <section className="space-y-12">
        <h2 className="text-4xl font-black text-brand-gray dark:text-white tracking-tight leading-none">Personnel Performance Analysis</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {summary.staffWorkload.map((staff, idx) => {
            const freq = staff.effortByFrequency;
            return (
              <div key={idx} className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-soft border border-slate-200 dark:border-slate-800 p-8 sm:p-12 transition-all hover:shadow-hard hover:border-brand-blue/30 group">
                <div className="flex justify-between items-start mb-12">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-[2rem] bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-brand-blue dark:text-brand-cyan text-3xl font-black shadow-inner transition-transform group-hover:rotate-3 overflow-hidden">
                       <img src={users.find(u => u.name === staff.staffName)?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${staff.staffName}`} alt="avatar" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-black text-brand-gray dark:text-white tracking-tight leading-none">{staff.staffName}</h3>
                      <p className="text-brand-cyan dark:text-brand-cyan text-[10px] font-black uppercase tracking-[0.25em] mt-4 leading-relaxed max-w-[200px] truncate">
                        Active Stream: {staff.currentlyWorkingOn}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-5xl font-black text-brand-blue dark:text-brand-cyan tracking-tighter leading-none">{staff.totalHours}h</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-3">Tactical Time</p>
                  </div>
                </div>

                <div className="space-y-4 mb-10">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Effort Cadence Distribution</p>
                    <div className="flex h-3 w-full rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                        <div style={{ width: `${(freq.daily / staff.totalHours) * 100}%` }} className="bg-brand-blue h-full" title="Daily"></div>
                        <div style={{ width: `${(freq.weekly / staff.totalHours) * 100}%` }} className="bg-brand-cyan h-full" title="Weekly"></div>
                        <div style={{ width: `${(freq.monthly / staff.totalHours) * 100}%` }} className="bg-indigo-500 h-full" title="Monthly"></div>
                        <div style={{ width: `${(freq.oneTime / staff.totalHours) * 100}%` }} className="bg-slate-400 h-full" title="One-time"></div>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-2">
                        <span className="flex items-center gap-1.5 text-[9px] font-black uppercase text-slate-400"><div className="w-2 h-2 rounded-full bg-brand-blue"></div> Daily ({freq.daily}h)</span>
                        <span className="flex items-center gap-1.5 text-[9px] font-black uppercase text-slate-400"><div className="w-2 h-2 rounded-full bg-brand-cyan"></div> Weekly ({freq.weekly}h)</span>
                        <span className="flex items-center gap-1.5 text-[9px] font-black uppercase text-slate-400"><div className="w-2 h-2 rounded-full bg-indigo-500"></div> Monthly ({freq.monthly}h)</span>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-5 sm:gap-8 mb-10">
                  {[
                    { label: 'One-Time', val: staff.oneTimeTasks.length, color: 'brand-blue' },
                    { label: 'Recurring', val: staff.recurringTasks.length, color: 'brand-cyan' },
                    { label: 'Infrastructure', val: staff.trainingTasks.length, color: 'brand-gray' },
                  ].map((stat, sidx) => (
                    <div key={sidx} className="p-5 sm:p-8 bg-slate-50 dark:bg-slate-800 rounded-[2rem] border border-slate-200 dark:border-slate-700 text-center transition-all group-hover:bg-white dark:group-hover:bg-slate-700/50">
                      <p className="text-[9px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest mb-4 leading-none">{stat.label}</p>
                      <p className="text-3xl sm:text-4xl font-black text-brand-gray dark:text-white tracking-tighter leading-none">{stat.val}</p>
                    </div>
                  ))}
                </div>

                {staff.unresolvedItems.length > 0 && (
                  <div className="pt-10 border-t border-slate-200 dark:border-slate-800">
                    <h4 className="text-[10px] font-black text-rose-600 uppercase tracking-[0.35em] mb-6 leading-none">Operational Friction Points</h4>
                    <ul className="space-y-4">
                      {staff.unresolvedItems.map((item, i) => (
                        <li key={i} className="text-[13px] font-semibold text-slate-700 dark:text-slate-400 bg-rose-500/5 px-5 py-4 rounded-2xl border border-rose-500/10 flex items-start gap-4 transition-all hover:bg-rose-500/10">
                          <span className="text-rose-500 mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-rose-500"></span> 
                          <span className="leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
