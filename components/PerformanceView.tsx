import React, { useMemo } from 'react';
import { StaffTask, Brand, User, Organization } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend 
} from 'recharts';

interface PerformanceViewProps {
  tasks: StaffTask[];
  brands: Brand[];
  users: User[];
  timeRange: string;
  workspace: Organization;
}

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const PerformanceView: React.FC<PerformanceViewProps> = ({ tasks, brands, users, timeRange, workspace }) => {
  const terminology = workspace.config?.clientTerminology || 'Brand';
  const terminologyPlural = workspace.config?.clientTerminologyPlural || 'Brands';

  const metrics = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'Completed').length;
    const overdue = tasks.filter(t => t.status !== 'Completed' && new Date(t.dueDate) < new Date()).length;
    const totalHours = tasks.reduce((acc, t) => acc + t.hoursSpent, 0);
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, overdue, totalHours, completionRate };
  }, [tasks]);

  const tasksPerPerson = useMemo(() => {
    const data: Record<string, number> = {};
    tasks.forEach(t => {
      data[t.staffName] = (data[t.staffName] || 0) + 1;
    });
    return Object.entries(data).map(([name, count]) => ({ name, count }));
  }, [tasks]);

  const tasksPerBrand = useMemo(() => {
    const data: Record<string, number> = {};
    tasks.forEach(t => {
      const brandName = brands.find(b => b.id === t.brandId)?.name || 'Internal';
      data[brandName] = (data[brandName] || 0) + 1;
    });
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [tasks, brands]);

  const timeTrends = useMemo(() => {
    // Mocking trend data based on current tasks for visualization
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map(day => ({
      name: day,
      hours: Math.floor(Math.random() * 20) + 5
    }));
  }, [tasks]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {[
          { label: 'Active Tasks', value: metrics.total, color: 'text-brand-blue' },
          { label: 'Overdue', value: metrics.overdue, color: 'text-rose-500' },
          { label: 'Completion Rate', value: `${metrics.completionRate}%`, color: 'text-emerald-500' },
          { label: 'Total Hours', value: `${metrics.totalHours}h`, color: 'text-brand-cyan' },
          { label: 'Avg Time/Task', value: `${(metrics.totalHours / (metrics.total || 1)).toFixed(1)}h`, color: 'text-slate-600' },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-soft">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{stat.label}</p>
            <p className={`text-3xl font-black ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Tasks per Person */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-soft">
          <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest mb-8">Tasks Distribution per Staff</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tasksPerPerson}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="count" fill="#4F46E5" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tasks per Brand */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-soft">
          <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest mb-8">{terminology} Portfolio Allocation</h3>
          <div className="h-[300px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={tasksPerBrand}
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {tasksPerBrand.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Time Trends */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-soft lg:col-span-2">
          <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest mb-8">Operational Velocity (Weekly Trend)</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeTrends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                <Tooltip />
                <Line type="monotone" dataKey="hours" stroke="#10B981" strokeWidth={4} dot={{ r: 6, fill: '#10B981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceView;
