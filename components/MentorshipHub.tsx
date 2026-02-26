
import React, { useState } from 'react';
import { User, StaffTask } from '../types';

interface MentorshipHubProps {
  users: User[];
  tasks: StaffTask[];
  currentUser: User;
  onClaimMentee: (menteeId: string, leadId?: string) => void;
}

const MentorshipHub: React.FC<MentorshipHubProps> = ({ users, tasks, currentUser, onClaimMentee }) => {
  const [selectedLeadId, setSelectedLeadId] = useState<Record<string, string>>({});

  const recruits = users.filter(u => 
    (u.role === 'Staff Member' || u.role === 'Mentee') && 
    u.registrationStatus === 'approved' &&
    (!u.mentorId || u.mentorId === currentUser.id || currentUser.role === 'Admin')
  );

  const leads = users.filter(u => u.role === 'Staff Lead' && u.registrationStatus === 'approved');
  const getRecruitTaskCount = (name: string) => tasks.filter(t => t.staffName === name).length;

  const isAdmin = currentUser.role === 'Admin';

  const handleRecruit = (recruitId: string) => {
    const leadId = selectedLeadId[recruitId] || (isAdmin ? '' : currentUser.id);
    if (isAdmin && !leadId) {
      alert("Please select a target Staff Lead first.");
      return;
    }
    onClaimMentee(recruitId, leadId);
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight leading-none">Squad Management</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-lg mt-3">Discover and recruit operational personnel to your unit.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {recruits.map(recruit => {
          const mentor = users.find(u => u.id === recruit.mentorId);
          const isMySquad = recruit.mentorId === currentUser.id;
          const taskCount = getRecruitTaskCount(recruit.name);

          return (
            <div 
              key={recruit.id}
              className={`bg-white dark:bg-slate-900 p-10 rounded-[3rem] border transition-all duration-300 relative group overflow-hidden ${
                isMySquad ? 'border-brand-blue/30 shadow-hard ring-4 ring-brand-blue/5' : 'border-slate-200 dark:border-slate-800 shadow-soft'
              }`}
            >
              <div className="flex items-center gap-6 mb-10 relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex-shrink-0 overflow-hidden">
                  <img src={recruit.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${recruit.name}`} alt="avatar" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800 dark:text-white truncate max-w-[150px]">{recruit.name}</h3>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{recruit.role}</p>
                </div>
              </div>

              <div className="space-y-6 relative z-10">
                <div className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Tasks</span>
                  <span className="text-lg font-black text-slate-800 dark:text-white">{taskCount}</span>
                </div>

                <div className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Squad Status</span>
                  {mentor ? (
                    <span className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-lg ${
                      isMySquad ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {isMySquad ? 'Active In Your Squad' : `Lead: ${mentor.name}`}
                    </span>
                  ) : (
                    <span className="text-[9px] font-black uppercase px-3 py-1.5 rounded-lg bg-amber-50 text-amber-600 animate-pulse border border-amber-100">
                      Unassigned Recruit
                    </span>
                  )}
                </div>

                {!recruit.mentorId ? (
                  <div className="space-y-4 pt-4">
                    {isAdmin && (
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-brand-blue dark:text-brand-cyan uppercase tracking-widest">Target Staff Lead</label>
                        <select 
                          value={selectedLeadId[recruit.id] || ''}
                          onChange={(e) => setSelectedLeadId({...selectedLeadId, [recruit.id]: e.target.value})}
                          className="w-full bg-slate-100 dark:bg-slate-800 border-2 border-transparent focus:border-brand-blue rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-widest outline-none"
                        >
                          <option value="">Select Target Lead...</option>
                          {leads.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                        </select>
                      </div>
                    )}
                    <button 
                      onClick={() => handleRecruit(recruit.id)}
                      className="w-full bg-brand-blue hover:bg-blue-700 text-white font-black py-4 rounded-2xl text-[10px] uppercase tracking-[0.2em] shadow-lg transition-all active:scale-95 group-hover:shadow-brand-blue/20"
                    >
                      {isAdmin ? 'Deploy to Selected Lead' : 'Recruit to Squad'}
                    </button>
                  </div>
                ) : (
                  <div className="w-full py-4 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl opacity-60">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {isMySquad ? 'Currently Assigned' : 'Squad Occupied'}
                     </span>
                  </div>
                )}
              </div>

              {isMySquad && (
                <div className="absolute top-6 right-6">
                   <div className="w-3 h-3 bg-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.6)]"></div>
                </div>
              )}
            </div>
          );
        })}
        {recruits.length === 0 && (
          <div className="col-span-full py-40 text-center">
             <p className="text-slate-400 font-black uppercase tracking-[0.4em] text-xs">No personnel available for squad assignment.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MentorshipHub;
