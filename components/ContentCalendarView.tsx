
import React, { useState } from 'react';
import { User, Brand, ContentCalendar, CalendarEntry, ContentPlatform, ContentType } from '../types';
import { GoogleGenAI } from "@google/genai";

interface ContentCalendarViewProps {
  currentUser: User;
  users: User[];
  brands: Brand[];
  calendars: ContentCalendar[];
  onSaveCalendar: (cal: ContentCalendar) => void;
}

const ContentCalendarView: React.FC<ContentCalendarViewProps> = ({ currentUser, users, brands, calendars, onSaveCalendar }) => {
  const [selectedBrandId, setSelectedBrandId] = useState<string>(brands[0]?.id || '');
  const [isEditing, setIsEditing] = useState(false);
  const [currentCal, setCurrentCal] = useState<ContentCalendar | null>(null);
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  const activeCalendars = calendars.filter(c => c.brandId === selectedBrandId);
  const isAdminOrLead = currentUser.role === 'Admin' || currentUser.role === 'Staff Lead';

  const handleCreateNew = () => {
    const newCal: ContentCalendar = {
      id: `cal-${Math.random().toString(36).substr(2, 9)}`,
      orgId: currentUser.orgId,
      brandId: selectedBrandId,
      name: `Strategy - ${new Date().toLocaleString('default', { month: 'short' })} ${new Date().getFullYear()}`,
      entries: [],
      createdAt: new Date().toISOString()
    };
    setCurrentCal(newCal);
    setIsEditing(true);
  };

  const handleEdit = (cal: ContentCalendar) => {
    setCurrentCal(JSON.parse(JSON.stringify(cal))); // Deep copy
    setIsEditing(true);
  };

  const handleAddEntry = () => {
    if (!currentCal) return;
    const newEntry: CalendarEntry = {
      id: `ent-${Math.random().toString(36).substr(2, 9)}`,
      date: new Date().toISOString().split('T')[0],
      platforms: ['Instagram'],
      contentType: 'Static',
      topic: '',
      caption: '',
      visualRef: '',
      assignedToId: currentUser.id
    };
    setCurrentCal({ ...currentCal, entries: [...currentCal.entries, newEntry] });
  };

  const updateEntry = (entryId: string, updates: Partial<CalendarEntry>) => {
    if (!currentCal || !isAdminOrLead) return;
    setCurrentCal({
      ...currentCal,
      entries: currentCal.entries.map(e => e.id === entryId ? { ...e, ...updates } : e)
    });
  };

  const removeEntry = (entryId: string) => {
    if (!currentCal || !isAdminOrLead) return;
    setCurrentCal({
      ...currentCal,
      entries: currentCal.entries.filter(e => e.id !== entryId)
    });
  };

  const generateAiSuggestions = async (entryIndex: number) => {
    if (!currentCal || isAiGenerating || !isAdminOrLead) return;
    setIsAiGenerating(true);
    const entry = currentCal.entries[entryIndex];
    const brand = brands.find(b => b.id === currentCal.brandId);
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Suggest a professional content idea for a ${entry.platforms.join('/')} ${entry.contentType} post for the brand "${brand?.name}". 
    Topic: ${entry.topic || 'Any relevant topic'}
    Return JSON only with: { "topic": "...", "caption": "...", "visualInstructions": "..." }`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      const data = JSON.parse(response.text || '{}');
      updateEntry(entry.id, {
        topic: data.topic || entry.topic,
        caption: data.caption || entry.caption,
        visualRef: data.visualInstructions || entry.visualRef
      });
    } catch (err) {
      console.error("AI Generation Failed", err);
    } finally {
      setIsAiGenerating(false);
    }
  };

  if (isEditing && currentCal) {
    return (
      <div className="space-y-10 animate-in fade-in duration-500 pb-20">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-6">
            <button onClick={() => setIsEditing(false)} className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/5">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </button>
            <input 
              readOnly={!isAdminOrLead}
              value={currentCal.name}
              onChange={e => setCurrentCal({ ...currentCal, name: e.target.value })}
              className={`text-3xl font-black bg-transparent text-slate-800 dark:text-white outline-none border-b-2 border-transparent ${isAdminOrLead ? 'focus:border-brand-blue' : ''}`}
            />
          </div>
          {isAdminOrLead && (
            <button 
              onClick={() => { onSaveCalendar(currentCal); setIsEditing(false); }}
              className="bg-brand-blue text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest"
            >
              Finalize Strategy
            </button>
          )}
        </div>

        <div className="space-y-6">
          {currentCal.entries.map((entry, idx) => (
            <div key={entry.id} className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-white/10 p-8 shadow-hard relative group">
              {isAdminOrLead && (
                <button 
                  onClick={() => removeEntry(entry.id)}
                  className="absolute top-8 right-8 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
              
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Schedule Date</label>
                  <input 
                    type="date"
                    readOnly={!isAdminOrLead}
                    value={entry.date}
                    onChange={e => updateEntry(entry.id, { date: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 text-xs font-bold outline-none"
                  />
                  <div className="pt-4 space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Platforms</label>
                    <div className="flex flex-wrap gap-2">
                      {['Instagram', 'Facebook', 'LinkedIn', 'TikTok'].map(p => (
                        <button 
                          key={p}
                          disabled={!isAdminOrLead}
                          onClick={() => {
                            const newP = entry.platforms.includes(p as any) 
                              ? entry.platforms.filter(x => x !== p) 
                              : [...entry.platforms, p as any];
                            updateEntry(entry.id, { platforms: newP });
                          }}
                          className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${
                            entry.platforms.includes(p as any) ? 'bg-brand-blue text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                          }`}
                        >
                          {p[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Content Topic & Caption</label>
                      {isAdminOrLead && (
                        <button 
                          onClick={() => generateAiSuggestions(idx)}
                          disabled={isAiGenerating}
                          className="text-[9px] font-black text-brand-cyan hover:text-brand-blue uppercase tracking-widest flex items-center gap-2"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                          {isAiGenerating ? 'Generating...' : 'AI Ideas'}
                        </button>
                      )}
                    </div>
                    <input 
                      placeholder="Topic (e.g., Brand Launch)"
                      readOnly={!isAdminOrLead}
                      value={entry.topic}
                      onChange={e => updateEntry(entry.id, { topic: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 text-sm font-black outline-none border border-transparent focus:border-brand-blue/30"
                    />
                    <textarea 
                      placeholder="Caption / CTA details..."
                      readOnly={!isAdminOrLead}
                      value={entry.caption}
                      onChange={e => updateEntry(entry.id, { caption: e.target.value })}
                      className="w-full h-24 bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 text-xs font-medium outline-none resize-none border border-transparent focus:border-brand-blue/30"
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Visual Direction</label>
                    <textarea 
                      placeholder="Visual reference or instruction..."
                      readOnly={!isAdminOrLead}
                      value={entry.visualRef}
                      onChange={e => updateEntry(entry.id, { visualRef: e.target.value })}
                      className="w-full h-24 bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 text-xs font-medium outline-none resize-none"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assign Executor</label>
                    <select 
                      disabled={!isAdminOrLead}
                      value={entry.assignedToId}
                      onChange={e => updateEntry(entry.id, { assignedToId: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 text-[10px] font-black uppercase outline-none"
                    >
                      {users.filter(u => u.registrationStatus === 'approved').map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {isAdminOrLead && (
            <button 
              onClick={handleAddEntry}
              className="w-full py-8 border-4 border-dashed border-slate-100 dark:border-white/5 rounded-[2.5rem] text-slate-400 hover:text-brand-blue hover:border-brand-blue/20 transition-all font-black text-xs uppercase tracking-widest"
            >
              + Add Content Slot
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight leading-none">Content Strategies</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-lg mt-3">Visualizing cross-platform deployments and content cycles.</p>
        </div>
        <div className="flex gap-4">
          <select 
            value={selectedBrandId}
            onChange={e => setSelectedBrandId(e.target.value)}
            className="px-6 py-4 rounded-2xl text-[10px] font-black uppercase bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 outline-none shadow-soft"
          >
            {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          {isAdminOrLead && (
            <button 
              onClick={handleCreateNew}
              className="bg-brand-blue text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg"
            >
              + New Calendar
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {activeCalendars.length === 0 ? (
          <div className="col-span-full py-40 text-center border-4 border-dashed border-slate-100 dark:border-white/5 rounded-[3rem]">
            <p className="text-slate-400 font-black uppercase tracking-[0.4em] text-xs">No active calendars for this brand.</p>
          </div>
        ) : (
          activeCalendars.map(cal => (
            <div key={cal.id} className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-200 dark:border-white/10 shadow-soft hover:shadow-hard transition-all group relative overflow-hidden">
               <div className="flex justify-between items-start mb-8">
                  <div className="w-14 h-14 bg-brand-blue/10 rounded-2xl flex items-center justify-center">
                    <svg className="w-7 h-7 text-brand-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{cal.entries.length} Slots</span>
               </div>
               <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">{cal.name}</h3>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-10">Created {new Date(cal.createdAt).toLocaleDateString()}</p>
               
               <div className="flex -space-x-3 mb-10">
                 {cal.entries.slice(0, 4).map((e, i) => (
                   <div key={i} className="w-10 h-10 rounded-full border-4 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-400">
                     {e.platforms[0][0]}
                   </div>
                 ))}
                 {cal.entries.length > 4 && (
                   <div className="w-10 h-10 rounded-full border-4 border-white dark:border-slate-900 bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-black text-slate-500">
                     +{cal.entries.length - 4}
                   </div>
                 )}
               </div>

               <button 
                 onClick={() => handleEdit(cal)}
                 className="w-full py-4 bg-slate-50 dark:bg-slate-800 hover:bg-brand-blue hover:text-white transition-all rounded-2xl font-black text-[10px] uppercase tracking-widest"
               >
                 {isAdminOrLead ? 'Manage Strategy' : 'View Strategy'}
               </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ContentCalendarView;
