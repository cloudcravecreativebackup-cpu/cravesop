
import React, { useState, useMemo } from 'react';
import { Brand, ServiceType, Service, Organization } from '../types';

interface BrandManagementProps {
  brands: Brand[];
  services: Service[];
  workspace: Organization;
  onCreateBrand: (name: string, services: ServiceType[]) => void;
  onUpdateBrand: (brandId: string, updates: Partial<Brand>) => void;
  onBrandClick: (brandId: string) => void;
}

const BrandManagement: React.FC<BrandManagementProps> = ({ brands, services, workspace, onCreateBrand, onUpdateBrand, onBrandClick }) => {
  const terminology = workspace.config?.clientTerminology || 'Brand';
  const terminologyPlural = workspace.config?.clientTerminologyPlural || 'Brands';
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingBrandId, setEditingBrandId] = useState<string | null>(null);
  const [newBrandName, setNewBrandName] = useState('');
  const [selectedServices, setSelectedServices] = useState<ServiceType[]>([]);
  const [customService, setCustomService] = useState('');

  // Use the services provided for this workspace
  const existingServicesList = useMemo(() => {
    const serviceNames = new Set(services.map(s => s.name));
    brands.forEach(b => b.services.forEach(s => serviceNames.add(s)));
    selectedServices.forEach(s => serviceNames.add(s));
    return Array.from(serviceNames).sort();
  }, [services, brands, selectedServices]);

  const handleToggleService = (service: ServiceType) => {
    setSelectedServices(prev => 
      prev.includes(service) ? prev.filter(s => s !== service) : [...prev, service]
    );
  };

  const handleAddCustomService = (e: React.KeyboardEvent | React.MouseEvent) => {
    if (customService.trim()) {
      if (!selectedServices.includes(customService.trim())) {
        setSelectedServices(prev => [...prev, customService.trim()]);
      }
      setCustomService('');
    }
  };

  const handleStartEdit = (e: React.MouseEvent, brand: Brand) => {
    e.stopPropagation();
    setEditingBrandId(brand.id);
    setNewBrandName(brand.name);
    setSelectedServices(brand.services);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newBrandName.trim() && selectedServices.length > 0) {
      if (editingBrandId) {
        onUpdateBrand(editingBrandId, { name: newBrandName, services: selectedServices });
        setEditingBrandId(null);
      } else {
        onCreateBrand(newBrandName.trim(), selectedServices);
        setIsAdding(false);
      }
      setNewBrandName('');
      setSelectedServices([]);
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingBrandId(null);
    setNewBrandName('');
    setSelectedServices([]);
    setCustomService('');
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight leading-none">{terminology} Management</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-lg mt-3">Configure client environments and automated service modules.</p>
        </div>
        {!isAdding && !editingBrandId && (
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-brand-blue hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-lg transition-all active:scale-95"
          >
            + Provision {terminology}
          </button>
        )}
      </div>

      {(isAdding || editingBrandId) && (
        <div className="bg-white dark:bg-slate-900 p-10 sm:p-14 rounded-[3.5rem] border border-slate-200 dark:border-white/10 shadow-hard animate-in zoom-in-95 duration-500">
          <form onSubmit={handleSubmit} className="space-y-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-4">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Legal {terminology} Name</label>
                <input 
                  type="text" 
                  autoFocus
                  required
                  value={newBrandName}
                  onChange={e => setNewBrandName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-3xl px-8 py-5 text-xl font-black text-slate-800 dark:text-white focus:border-brand-blue outline-none transition-all placeholder-slate-400"
                  placeholder={`Ex: EstateGo Solutions`}
                />
              </div>
              <div className="space-y-6">
                <div className="flex flex-col gap-4">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Select Service Streams</label>
                  <div className="flex flex-wrap gap-3">
                    {existingServicesList.map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => handleToggleService(s)}
                        className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${
                          selectedServices.includes(s) 
                            ? 'bg-brand-blue text-white border-brand-blue shadow-lg' 
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-100 dark:border-slate-800 hover:border-slate-300'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                  <label className="text-[11px] font-black text-brand-blue dark:text-brand-cyan uppercase tracking-widest ml-1">Add Custom Service</label>
                  <div className="flex gap-3">
                    <input 
                      type="text"
                      value={customService}
                      onChange={e => setCustomService(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddCustomService(e))}
                      className="flex-grow bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-brand-blue"
                      placeholder="Type a new service stream name..."
                    />
                    <button 
                      type="button"
                      onClick={handleAddCustomService}
                      className="px-6 py-4 bg-slate-100 dark:bg-slate-700 text-brand-blue dark:text-brand-cyan rounded-2xl text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-600 hover:bg-brand-blue hover:text-white transition-all"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 pt-6">
              <button 
                type="button" 
                onClick={handleCancel} 
                className="bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 text-slate-400 px-10 py-5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="flex-grow bg-brand-blue hover:bg-blue-700 text-white font-black py-5 rounded-2xl shadow-xl text-xs uppercase tracking-widest transition-all active:scale-[0.98]"
              >
                {editingBrandId ? 'Commit Update' : 'Provision Infrastructure & Generate Deliverables'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {brands.map(brand => (
          <div 
            key={brand.id} 
            onClick={() => onBrandClick(brand.id)}
            className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-200 dark:border-white/10 shadow-soft hover:shadow-hard transition-all group overflow-hidden cursor-pointer"
          >
            <div className="flex justify-between items-start mb-10">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center text-3xl font-black text-brand-blue dark:text-brand-cyan shadow-inner">
                {brand.name[0]}
              </div>
              <button 
                onClick={(e) => handleStartEdit(e, brand)}
                className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-brand-blue transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              </button>
            </div>
            
            <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight mb-4 group-hover:text-brand-blue transition-colors">{brand.name}</h3>
            
            <div className="space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Services</p>
              <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto custom-scrollbar">
                {brand.services.map(s => (
                  <span key={s} className="px-3 py-1.5 bg-brand-cyan/5 text-brand-cyan border border-brand-cyan/20 rounded-lg text-[9px] font-black uppercase tracking-tighter">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
               <div className="flex -space-x-3">
                 {[1,2,3].map(i => (
                   <div key={i} className="w-8 h-8 rounded-full border-4 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 overflow-hidden shadow-sm">
                     <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${brand.name}${i}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                   </div>
                 ))}
               </div>
               <span className="text-[10px] font-black text-brand-blue dark:text-brand-cyan uppercase tracking-widest">Active Stream</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BrandManagement;
