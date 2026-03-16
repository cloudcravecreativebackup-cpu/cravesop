
import React, { useState } from 'react';
import { Service, TaskCategory, TaskType, Frequency, Organization } from '../types';
import { Plus, Trash2, Edit2, Save, X, Settings2 } from 'lucide-react';

interface ServiceManagementProps {
  services: Service[];
  workspace: Organization;
  onCreateService: (service: Partial<Service>) => void;
  onUpdateService: (serviceId: string, updates: Partial<Service>) => void;
  onDeleteService: (serviceId: string) => void;
}

const ServiceManagement: React.FC<ServiceManagementProps> = ({ 
  services, 
  workspace, 
  onCreateService, 
  onUpdateService, 
  onDeleteService 
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceDesc, setNewServiceDesc] = useState('');
  const [templates, setTemplates] = useState<Service['templates']>([]);

  const handleAddTemplate = () => {
    setTemplates([...templates, { 
      taskTitle: '', 
      category: 'Content Optimisation', 
      type: 'Recurring', 
      frequency: 'Weekly' 
    }]);
  };

  const handleUpdateTemplate = (index: number, updates: Partial<Service['templates'][0]>) => {
    const newTemplates = [...templates];
    newTemplates[index] = { ...newTemplates[index], ...updates };
    setTemplates(newTemplates);
  };

  const handleRemoveTemplate = (index: number) => {
    setTemplates(templates.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim()) return;

    const serviceData = {
      name: newServiceName,
      description: newServiceDesc,
      templates
    };

    if (editingServiceId) {
      onUpdateService(editingServiceId, serviceData);
      setEditingServiceId(null);
    } else {
      onCreateService(serviceData);
      setIsAdding(false);
    }

    setNewServiceName('');
    setNewServiceDesc('');
    setTemplates([]);
  };

  const handleStartEdit = (service: Service) => {
    setEditingServiceId(service.id);
    setNewServiceName(service.name);
    setNewServiceDesc(service.description || '');
    setTemplates(service.templates);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingServiceId(null);
    setNewServiceName('');
    setNewServiceDesc('');
    setTemplates([]);
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight leading-none">Service Modules</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-lg mt-3">Define automated deliverable blueprints for your {workspace.config?.clientTerminologyPlural?.toLowerCase() || 'brands'}.</p>
        </div>
        {!isAdding && !editingServiceId && (
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-[#22c55e] hover:bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-lg transition-all active:scale-95 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Define New Service
          </button>
        )}
      </div>

      {(isAdding || editingServiceId) && (
        <div className="bg-white dark:bg-slate-900 p-10 sm:p-14 rounded-[3.5rem] border border-slate-200 dark:border-white/10 shadow-hard animate-in zoom-in-95 duration-500">
          <form onSubmit={handleSubmit} className="space-y-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-6">
                <div className="space-y-4">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Service Name</label>
                  <input 
                    type="text" 
                    value={newServiceName}
                    onChange={(e) => setNewServiceName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 focus:border-emerald-500 rounded-3xl px-8 py-5 text-lg font-bold outline-none transition-all"
                    placeholder="e.g., Social Media Management"
                    required
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Description</label>
                  <textarea 
                    value={newServiceDesc}
                    onChange={(e) => setNewServiceDesc(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 focus:border-emerald-500 rounded-3xl px-8 py-5 text-lg font-bold outline-none transition-all min-h-[120px]"
                    placeholder="Describe the scope of this service..."
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Automated Deliverable Templates</label>
                  <button 
                    type="button"
                    onClick={handleAddTemplate}
                    className="text-[10px] font-black text-emerald-500 uppercase tracking-widest hover:text-emerald-600 transition-colors"
                  >
                    + Add Template
                  </button>
                </div>
                
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
                  {templates.map((tpl, idx) => (
                    <div key={idx} className="p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 space-y-4 relative group">
                      <button 
                        type="button"
                        onClick={() => handleRemoveTemplate(idx)}
                        className="absolute top-4 right-4 text-slate-400 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      
                      <input 
                        type="text"
                        value={tpl.taskTitle}
                        onChange={(e) => handleUpdateTemplate(idx, { taskTitle: e.target.value })}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold outline-none"
                        placeholder="Deliverable Title"
                        required
                      />
                      
                      <div className="grid grid-cols-2 gap-4">
                        <select 
                          value={tpl.category}
                          onChange={(e) => handleUpdateTemplate(idx, { category: e.target.value as TaskCategory })}
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-widest"
                        >
                          <option value="Content Optimisation">Content</option>
                          <option value="Profile Optimisation">Profile</option>
                          <option value="Engagement Optimisation">Engagement</option>
                          <option value="Insights & Reporting">Reporting</option>
                        </select>
                        <select 
                          value={tpl.frequency}
                          onChange={(e) => handleUpdateTemplate(idx, { frequency: e.target.value as Frequency })}
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-widest"
                        >
                          <option value="Daily">Daily</option>
                          <option value="Weekly">Weekly</option>
                          <option value="Monthly">Monthly</option>
                          <option value="N/A">One-time</option>
                        </select>
                      </div>
                    </div>
                  ))}
                  {templates.length === 0 && (
                    <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
                      <p className="text-slate-400 font-medium">No templates defined for this service.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-8 border-t border-slate-100 dark:border-white/5">
              <button 
                type="button"
                onClick={handleCancel}
                className="px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-10 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-lg transition-all active:scale-95"
              >
                {editingServiceId ? 'Update Service' : 'Create Service'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {services.map(service => (
          <div 
            key={service.id}
            className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-soft hover:shadow-hard transition-all duration-500 group"
          >
            <div className="flex justify-between items-start mb-8">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <Settings2 className="w-7 h-7" />
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleStartEdit(service)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-emerald-500 transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => onDeleteService(service.id)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-rose-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-3">{service.name}</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-8 line-clamp-2">{service.description || 'No description provided.'}</p>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Templates</span>
                <span className="text-sm font-black text-slate-800 dark:text-white">{service.templates.length}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ServiceManagement;
