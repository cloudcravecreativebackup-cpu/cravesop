
import React from 'react';
import { User, Organization } from './types';
import { 
  LayoutDashboard, 
  ClipboardList, 
  Briefcase, 
  CalendarDays, 
  Brain, 
  Users, 
  Bell, 
  Settings, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  Plus,
  ShieldCheck,
  Layers
} from 'lucide-react';

interface SidebarProps {
  view: string;
  currentUser: User | null;
  currentOrg: Organization | null;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  navigateTo: (view: any) => void;
  handleLogout: () => void;
  onAddDeliverable: () => void;
  unreadNotifications: number;
  onShowNotifications: () => void;
  handleAnalyze: () => void;
  isCollapsed: boolean;
  setIsCollapsed: (val: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  view,
  currentUser,
  currentOrg,
  isDarkMode,
  setIsDarkMode,
  navigateTo,
  handleLogout,
  onAddDeliverable,
  unreadNotifications,
  onShowNotifications,
  handleAnalyze,
  isCollapsed,
  setIsCollapsed
}) => {
  const isAdminOrLead = currentUser?.role === 'Admin' || currentUser?.role === 'Staff Lead';

  const NavItem = ({ 
    id, 
    icon: Icon, 
    label, 
    onClick, 
    isActive,
    badge
  }: { 
    id: string; 
    icon: any; 
    label: string; 
    onClick: () => void; 
    isActive: boolean;
    badge?: number;
  }) => (
    <button
      onClick={onClick}
      title={isCollapsed ? label : undefined}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
        isActive 
          ? 'bg-[#27272a] text-white font-semibold opacity-100' 
          : 'text-white/70 hover:text-white hover:opacity-100'
      }`}
    >
      <div className="flex-shrink-0">
        <Icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-white' : 'text-white/70 group-hover:text-white'}`} />
      </div>
      {!isCollapsed && (
        <span className="text-sm tracking-tight truncate">{label}</span>
      )}
      {badge !== undefined && badge > 0 && (
        <span className={`bg-[#22c55e] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${isCollapsed ? 'absolute -top-1 -right-1 shadow-lg' : ''}`}>
          {badge}
        </span>
      )}
    </button>
  );

  const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <p className={`text-[10px] font-mono font-black uppercase tracking-[0.2em] text-white/40 mb-3 px-3 transition-opacity duration-300 ${isCollapsed ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100'}`}>
      {children}
    </p>
  );

  return (
    <aside 
      className={`h-screen sticky top-0 bg-[#09090b] border-r border-white/10 flex flex-col transition-all duration-300 ease-in-out z-[150] ${isCollapsed ? 'w-20' : 'w-72'}`}
    >
      {/* Header */}
      <div className={`p-6 flex items-center gap-4 mb-4 relative ${isCollapsed ? 'justify-center' : ''}`}>
        <div className="w-10 h-10 bg-[#22c55e] rounded-xl flex items-center justify-center shadow-lg shadow-[#22c55e]/20 flex-shrink-0 overflow-hidden">
          {currentOrg?.config?.logoUrl ? (
            <img 
              src={currentOrg.config.logoUrl} 
              alt={currentOrg.name} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-5 h-5 border-2 border-white rounded-sm rotate-45 flex items-center justify-center">
              <span className="text-white text-[10px] font-black -rotate-45">{currentOrg?.name.charAt(0)}</span>
            </div>
          )}
        </div>
        {!isCollapsed && (
          <div className="animate-in fade-in slide-in-from-left-2 duration-300 min-w-0">
            <h1 className="text-xl font-[900] text-white tracking-[-0.03em] leading-none truncate">
              {currentOrg?.name || 'CraveOps'}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Workspace</p>
              <span className="w-1 h-1 rounded-full bg-white/20"></span>
              <p className="text-[10px] font-mono text-[#22c55e] font-bold">{currentOrg?.tenantId}</p>
            </div>
          </div>
        )}
        
        {/* Collapse Toggle - Only show if setIsCollapsed is functional */}
        {setIsCollapsed !== (() => {}) && (
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-3 top-8 w-6 h-6 bg-[#27272a] border border-white/10 rounded-full hidden lg:flex items-center justify-center text-white/70 hover:text-white shadow-xl z-50 transition-transform hover:scale-110"
          >
            {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
          </button>
        )}
      </div>

      {/* Navigation Groups */}
      <div className="flex-grow px-4 space-y-8 overflow-y-auto no-scrollbar py-4">
        <div className="px-2 mb-6">
          <button 
            onClick={onAddDeliverable}
            className={`w-full bg-[#22c55e] hover:bg-emerald-600 text-white rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 ${isCollapsed ? 'p-3' : 'px-4 py-3'}`}
          >
            <Plus className="w-5 h-5" />
            {!isCollapsed && <span className="text-xs font-black uppercase tracking-widest">New Deliverable</span>}
          </button>
        </div>

        <div>
          <SectionLabel>Operations</SectionLabel>
          <div className="space-y-1">
            {isAdminOrLead && (
              <NavItem 
                id="analysis" 
                icon={LayoutDashboard} 
                label="Dashboard" 
                onClick={() => { navigateTo('analysis'); handleAnalyze(); }} 
                isActive={view === 'analysis'} 
              />
            )}
            <NavItem 
              id="board" 
              icon={ClipboardList} 
              label="Deliverables" 
              onClick={() => navigateTo('board')} 
              isActive={view === 'board'} 
            />
            {isAdminOrLead && (
              <>
                <NavItem 
                  id="brands" 
                  icon={Briefcase} 
                  label={currentOrg?.config?.clientTerminologyPlural || 'Brands'} 
                  onClick={() => navigateTo('brands')} 
                  isActive={view === 'brands' || view === 'brand-detail'} 
                />
                <NavItem 
                  id="services" 
                  icon={Layers} 
                  label="Services" 
                  onClick={() => navigateTo('services')} 
                  isActive={view === 'services'} 
                />
              </>
            )}
            <NavItem 
              id="calendar" 
              icon={CalendarDays} 
              label="Calendar" 
              onClick={() => navigateTo('calendar')} 
              isActive={view === 'calendar'} 
            />
          </div>
        </div>

        {isAdminOrLead && (
          <div>
            <SectionLabel>Insights</SectionLabel>
            <div className="space-y-1">
              <NavItem 
                id="intelligence" 
                icon={Brain} 
                label="Intelligence" 
                onClick={() => { navigateTo('analysis'); handleAnalyze(); }} 
                isActive={false} 
              />
              <NavItem 
                id="squad" 
                icon={Users} 
                label="Mentorship Hub" 
                onClick={() => navigateTo('squad')} 
                isActive={view === 'squad'} 
              />
            </div>
          </div>
        )}

        <div>
          <SectionLabel>System</SectionLabel>
          <div className="space-y-1">
            {isAdminOrLead && (
              <NavItem 
                id="users" 
                icon={ShieldCheck} 
                label="Moderation" 
                onClick={() => navigateTo('users')} 
                isActive={view === 'users' || view === 'personnel-detail'} 
              />
            )}
            <NavItem 
              id="notifications" 
              icon={Bell} 
              label="Notifications" 
              onClick={onShowNotifications} 
              isActive={false} 
              badge={unreadNotifications}
            />
            <NavItem 
              id="profile" 
              icon={Settings} 
              label="Settings" 
              onClick={() => navigateTo('profile')} 
              isActive={view === 'profile'} 
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 mt-auto border-t border-white/5 space-y-3">
        {!isCollapsed ? (
          <div className="bg-[#27272a]/50 p-4 rounded-2xl border border-white/5 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#22c55e] overflow-hidden flex-shrink-0">
                <img 
                  src={currentUser?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.name}`} 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer" 
                />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-white truncate">{currentUser?.name}</span>
                <span className="text-[10px] font-mono text-white/40 uppercase tracking-tighter">{currentUser?.role}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center py-2">
            <div className="w-10 h-10 rounded-xl bg-[#27272a] border border-white/5 flex items-center justify-center overflow-hidden">
              <img 
                src={currentUser?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.name}`} 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer" 
              />
            </div>
          </div>
        )}
        
        <button 
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:text-white hover:bg-rose-500/10 transition-all group ${isCollapsed ? 'justify-center' : ''}`}
        >
          <LogOut className={`w-5 h-5 transition-transform duration-200 group-hover:translate-x-1 ${isCollapsed ? 'group-hover:translate-x-0' : ''}`} />
          {!isCollapsed && (
            <span className="text-sm font-semibold">Sign Out</span>
          )}
        </button>
      </div>
    </aside>
  );
};

