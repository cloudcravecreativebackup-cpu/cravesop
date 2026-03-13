
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { StaffTask, ManagementSummary, User, TaskComment, Notification, Organization, Brand, ServiceType, TaskCategory, Frequency, TaskType, TaskStatus, ContentCalendar, CalendarEntry, Service } from './types';
import { MOCK_TASKS, USERS, ORGS, BRANDS, DEFAULT_SERVICES } from './constants';
import { analyzeTasks } from './services/geminiService';
import { supabaseService } from './services/supabaseService';
import { emailService } from './services/emailService';
import Dashboard from './components/Dashboard';
import TaskEntryForm from './components/TaskEntryForm';
import TaskBoard from './components/TaskBoard';
import Auth from './components/Auth';
import AdminUserManagement from './components/AdminUserManagement';
import BrandManagement from './components/BrandManagement';
import BrandDetailView from './components/BrandDetailView';
import Logo from './components/Logo';
import NotificationsPanel from './components/NotificationsPanel';
import NotificationAudit from './components/NotificationAudit';
import MentorshipHub from './components/MentorshipHub';
import PersonnelProtocolView from './components/PersonnelProtocolView';
import ContentCalendarView from './components/ContentCalendarView';

type AppView = 'board' | 'analysis' | 'users' | 'squad' | 'personnel-detail' | 'brands' | 'brand-detail' | 'calendar' | 'notification-audit';

const STORAGE_KEY_ORGS = 'craveops_cloudcraves_orgs_v2';
const STORAGE_KEY_USERS = 'craveops_cloudcraves_users_v2';
const STORAGE_KEY_BRANDS = 'craveops_cloudcraves_brands_v2';
const STORAGE_KEY_USER = 'craveops_cloudcraves_current_v2';
const STORAGE_KEY_TASKS = 'craveops_cloudcraves_tasks_v2';
const STORAGE_KEY_SERVICES = 'craveops_cloudcraves_services_v2';
const STORAGE_KEY_CALENDARS = 'craveops_cloudcraves_calendars_v2';
const STORAGE_KEY_NOTIFS = 'craveops_cloudcraves_notifs_v2';

const WHITELISTED_ADMINS = [
  'support@cloudcraves.com', 
  'support@craveops.com', 
  'adeola.lois@cloudcraves.com', 
  'sheriff.saka@cloudcraves.com',
  'ademuyiwa.ogunnowo@cloudcraves.com'
];

const SERVICE_TEMPLATES: Record<ServiceType, { taskTitle: string, category: TaskCategory, type: TaskType, frequency: Frequency }[]> = {
  'Social Media Management': [
    { taskTitle: 'Initial Profile Audit', category: 'Profile Optimisation', type: 'One-time', frequency: 'N/A' },
    { taskTitle: 'Weekly Content Planning', category: 'Content Optimisation', type: 'Recurring', frequency: 'Weekly' },
    { taskTitle: 'Daily Engagement Monitor', category: 'Engagement Optimisation', type: 'Recurring', frequency: 'Daily' }
  ],
  'Cloud Support': [
    { taskTitle: 'Security Patch Audit', category: 'Cloud Infrastructure', type: 'Recurring', frequency: 'Monthly' },
    { taskTitle: 'Resource Optimization Check', category: 'Cloud Infrastructure', type: 'Recurring', frequency: 'Weekly' }
  ],
  'Digital Solutions': [
    { taskTitle: 'Frontend Component Audit', category: 'Software Development', type: 'One-time', frequency: 'N/A' },
    { taskTitle: 'Sprint Backlog Review', category: 'Software Development', type: 'Recurring', frequency: 'Weekly' }
  ],
  'General Operations': [
    { taskTitle: 'Standard Operating Procedure Review', category: 'Internal Deliverable', type: 'Recurring', frequency: 'Monthly' }
  ],
  'Switch2Tech Training': [
    { taskTitle: 'Curriculum Review', category: 'Strategic Planning', type: 'Recurring', frequency: 'Monthly' },
    { taskTitle: 'Instructor Onboarding', category: 'Internal Deliverable', type: 'One-time', frequency: 'N/A' },
    { taskTitle: 'Class Schedule Management', category: 'Internal Deliverable', type: 'Recurring', frequency: 'Weekly' }
  ]
};

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [showRegSuccess, setShowRegSuccess] = useState(false);
  const [newlyProvisionedTenantId, setNewlyProvisionedTenantId] = useState<string | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);
  const [supabaseError, setSupabaseError] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  
  const [organizations, setOrganizations] = useState<Organization[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_ORGS);
    return saved ? JSON.parse(saved) : ORGS;
  });

  const [brands, setBrands] = useState<Brand[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_BRANDS);
    return saved ? JSON.parse(saved) : BRANDS;
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_USERS);
    return saved ? JSON.parse(saved) : USERS;
  });

  const [calendars, setCalendars] = useState<ContentCalendar[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_CALENDARS);
    return saved ? JSON.parse(saved) : [];
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_USER);
    return saved ? JSON.parse(saved) : null;
  });

  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_NOTIFS);
    return saved ? JSON.parse(saved) : [];
  });

  const [services, setServices] = useState<Service[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_SERVICES);
    return saved ? JSON.parse(saved) : DEFAULT_SERVICES;
  });

  const [isLoggedIn, setIsLoggedIn] = useState(!!currentUser);
  
  const [tasks, setTasks] = useState<StaffTask[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_TASKS);
    return saved ? JSON.parse(saved) : MOCK_TASKS;
  });

  // Initial Data Sync from Supabase
  useEffect(() => {
    const initSupabase = async () => {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder')) {
        setIsInitialLoading(false);
        return;
      }

      try {
        const [dbOrgs, dbUsers, dbBrands, dbTasks, dbServices, dbCalendars, dbNotifs] = await Promise.all([
          supabaseService.getOrganizations(),
          supabaseService.getUsers(),
          supabaseService.getBrands(),
          supabaseService.getTasks(),
          supabaseService.getServices(),
          supabaseService.getCalendars(),
          supabaseService.getNotifications()
        ]);

        if (dbOrgs.length > 0) setOrganizations(dbOrgs);
        if (dbUsers.length > 0) setUsers(dbUsers);
        if (dbBrands.length > 0) setBrands(dbBrands);
        if (dbTasks.length > 0) setTasks(dbTasks);
        if (dbServices.length > 0) setServices(dbServices);
        if (dbCalendars.length > 0) setCalendars(dbCalendars);
        if (dbNotifs.length > 0) setNotifications(dbNotifs);
        
        setIsSupabaseConnected(true);
      } catch (err: any) {
        console.error('Supabase Sync Error:', err);
        setSupabaseError(err.message || 'Connection failed');
      } finally {
        setIsInitialLoading(false);
      }
    };

    initSupabase();

    // Real-time Subscriptions
    const taskSub = supabaseService.subscribeToChanges('tasks', (payload) => {
      if (payload.eventType === 'INSERT') {
        const newTask = {
          ...payload.new,
          orgId: payload.new.org_id,
          brandId: payload.new.brand_id,
          serviceType: payload.new.service_type,
          taskTitle: payload.new.task_title,
          taskDescription: payload.new.task_description,
          dueDate: payload.new.due_date,
          progressUpdate: payload.new.progress_update,
          estimatedHours: payload.new.estimated_hours,
          hoursSpent: payload.new.hours_spent,
          reportingPeriod: payload.new.reporting_period,
          relatedCalendarId: payload.new.related_calendar_id,
          relatedCalendarEntryId: payload.new.related_calendar_entry_id
        };
        setTasks(prev => {
          if (prev.find(t => t.id === newTask.id)) return prev;
          return [newTask, ...prev];
        });
      } else if (payload.eventType === 'UPDATE') {
        const updatedTask = {
          ...payload.new,
          orgId: payload.new.org_id,
          brandId: payload.new.brand_id,
          serviceType: payload.new.service_type,
          taskTitle: payload.new.task_title,
          taskDescription: payload.new.task_description,
          dueDate: payload.new.due_date,
          progressUpdate: payload.new.progress_update,
          estimatedHours: payload.new.estimated_hours,
          hoursSpent: payload.new.hours_spent,
          reportingPeriod: payload.new.reporting_period,
          relatedCalendarId: payload.new.related_calendar_id,
          relatedCalendarEntryId: payload.new.related_calendar_entry_id
        };
        setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
      } else if (payload.eventType === 'DELETE') {
        setTasks(prev => prev.filter(t => t.id !== payload.old.id));
      }
    });

    const userSub = supabaseService.subscribeToChanges('users', (payload) => {
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        const newUser = {
          ...payload.new,
          createdAt: payload.new.created_at,
          orgId: payload.new.org_id,
          registrationStatus: payload.new.registration_status,
          mentorId: payload.new.mentor_id,
          weeklyCapacityHours: payload.new.weekly_capacity_hours
        };
        setUsers(prev => {
          const exists = prev.find(u => u.id === newUser.id);
          if (exists) return prev.map(u => u.id === newUser.id ? newUser : u);
          return [...prev, newUser];
        });
      } else if (payload.eventType === 'DELETE') {
        setUsers(prev => prev.filter(u => u.id !== payload.old.id));
      }
    });

    const notifSub = supabaseService.subscribeToChanges('notifications', (payload) => {
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        const newNotif = {
          ...payload.new,
          orgId: payload.new.org_id,
          userId: payload.new.user_id,
          relatedTaskId: payload.new.related_task_id,
          relatedUserId: payload.new.related_user_id
        };
        setNotifications(prev => {
          const exists = prev.find(n => n.id === newNotif.id);
          if (exists) return prev.map(n => n.id === newNotif.id ? newNotif : n);
          return [newNotif, ...prev];
        });
      } else if (payload.eventType === 'DELETE') {
        setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
      }
    });

    const orgSub = supabaseService.subscribeToChanges('organizations', (payload) => {
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        const newOrg = {
          ...payload.new,
          createdAt: payload.new.created_at,
          tenantId: payload.new.tenant_id
        };
        setOrganizations(prev => {
          const exists = prev.find(o => o.id === newOrg.id);
          if (exists) return prev.map(o => o.id === newOrg.id ? newOrg : o);
          return [...prev, newOrg];
        });
      } else if (payload.eventType === 'DELETE') {
        setOrganizations(prev => prev.filter(o => o.id !== payload.old.id));
      }
    });

    const brandSub = supabaseService.subscribeToChanges('brands', (payload) => {
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        const newBrand = {
          ...payload.new,
          orgId: payload.new.org_id,
          leadId: payload.new.lead_id
        };
        setBrands(prev => {
          const exists = prev.find(b => b.id === newBrand.id);
          if (exists) return prev.map(b => b.id === newBrand.id ? newBrand : b);
          return [...prev, newBrand];
        });
      } else if (payload.eventType === 'DELETE') {
        setBrands(prev => prev.filter(b => b.id !== payload.old.id));
      }
    });

    const serviceSub = supabaseService.subscribeToChanges('services', (payload) => {
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        const newService = {
          ...payload.new,
          orgId: payload.new.org_id
        };
        setServices(prev => {
          const exists = prev.find(s => s.id === newService.id);
          if (exists) return prev.map(s => s.id === newService.id ? newService : s);
          return [...prev, newService];
        });
      } else if (payload.eventType === 'DELETE') {
        setServices(prev => prev.filter(s => s.id !== payload.old.id));
      }
    });

    return () => {
      taskSub.unsubscribe();
      userSub.unsubscribe();
      notifSub.unsubscribe();
      orgSub.unsubscribe();
      brandSub.unsubscribe();
      serviceSub.unsubscribe();
    };
  }, []);

  const [view, setView] = useState<AppView>('board');
  const [selectedPersonnelId, setSelectedPersonnelId] = useState<string | null>(null);
  const [selectedBrandDetailId, setSelectedBrandDetailId] = useState<string | null>(null);
  const [summary, setSummary] = useState<ManagementSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [editingTask, setEditingTask] = useState<StaffTask | null>(null);
  const [isAddingTask, setIsAddingTask] = useState<boolean>(false);
  const [highlightUserId, setHighlightUserId] = useState<string | null>(null);
  const [highlightTaskId, setHighlightTaskId] = useState<string | null>(null);

  const currentOrg = useMemo(() => 
    organizations.find(o => o.id === currentUser?.orgId), 
    [organizations, currentUser?.orgId]
  );

  const tenantUsers = useMemo(() => 
    users.filter(u => u.orgId === currentUser?.orgId),
    [users, currentUser?.orgId]
  );

  const tenantServices = useMemo(() => 
    services.filter(s => s.orgId === currentUser?.orgId),
    [services, currentUser?.orgId]
  );

  const isAdminOrLead = useMemo(() => currentUser?.role === 'Admin' || currentUser?.role === 'Staff Lead', [currentUser]);

  const visibleUsers = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'Admin') return users.filter(u => u.orgId === currentUser.orgId);
    if (currentUser.role === 'Staff Lead') {
      // Staff Leads see themselves and their mentees
      return users.filter(u => 
        u.orgId === currentUser.orgId && 
        (u.id === currentUser.id || u.mentorId === currentUser.id)
      );
    }
    return users.filter(u => u.id === currentUser.id);
  }, [users, currentUser]);

  const visibleBrands = useMemo(() => {
    if (!currentUser) return [];
    const orgBrands = brands.filter(b => b.orgId === currentUser.orgId);
    if (currentUser.role === 'Admin' || currentUser.role === 'Staff Lead') return orgBrands;
    const brandIds = new Set(tasks.filter(t => t.staffName === currentUser.name).map(t => t.brandId));
    return orgBrands.filter(b => brandIds.has(b.id));
  }, [brands, currentUser, tasks]);

  const tenantBrands = visibleBrands;

  const tenantTasks = useMemo(() => 
    tasks.filter(t => t.orgId === currentUser?.orgId),
    [tasks, currentUser?.orgId]
  );

  const visibleTasks = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'Admin') return tenantTasks;
    if (currentUser.role === 'Staff Lead') {
      const myTeamNames = new Set(tenantUsers.filter(u => u.mentorId === currentUser.id || u.id === currentUser.id).map(u => u.name));
      return tenantTasks.filter(t => myTeamNames.has(t.staffName));
    }
    return tenantTasks.filter(t => t.staffName === currentUser.name);
  }, [tenantTasks, currentUser, tenantUsers]);

  const tenantCalendars = useMemo(() => {
    if (!currentUser) return [];
    const orgCals = calendars.filter(c => c.orgId === currentUser.orgId);
    if (currentUser.role === 'Admin') return orgCals;
    const brandIds = new Set(visibleBrands.map(b => b.id));
    return orgCals.filter(c => brandIds.has(c.brandId));
  }, [calendars, currentUser, visibleBrands]);

  const tenantNotifications = useMemo(() => 
    notifications.filter(n => n.orgId === currentUser?.orgId && n.userId === currentUser?.id),
    [notifications, currentUser?.orgId, currentUser?.id]
  );

  useEffect(() => {
    const unwantedEmails = ['kingzy@cloudcraves.com', 'healthymind@cloudcraves.com'];
    const unwantedNames = ['Kingzy', 'Healthy Mind Member'];
    const unwantedIds = ['u-kingzy', 'u-healthymind-member'];
    
    setUsers(prev => prev.filter(u => !unwantedEmails.includes(u.email.toLowerCase()) && !unwantedIds.includes(u.id)));
    setTasks(prev => prev.filter(t => !unwantedNames.includes(t.staffName)));
    setBrands(prev => prev
      .filter(b => b.name !== 'Kingzy' && b.id !== 'b-kingzy')
      .map(b => (unwantedNames.includes(b.leadId || '') || unwantedIds.includes(b.leadId || '')) ? { ...b, leadId: 'u-adeola' } : b)
    );

    if (currentUser && (unwantedEmails.includes(currentUser.email.toLowerCase()) || unwantedIds.includes(currentUser.id))) {
      handleLogout();
    }
  }, [currentUser]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Fix: Move redirection logic to useEffect to avoid side effects during render and "void" as ReactNode error.
  useEffect(() => {
    if (isLoggedIn && currentUser && !isAdminOrLead && view !== 'board' && view !== 'calendar') {
      setView('board');
    }
  }, [isLoggedIn, currentUser, isAdminOrLead, view]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ORGS, JSON.stringify(organizations));
    localStorage.setItem(STORAGE_KEY_BRANDS, JSON.stringify(brands));
    localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
    localStorage.setItem(STORAGE_KEY_SERVICES, JSON.stringify(services));
    localStorage.setItem(STORAGE_KEY_CALENDARS, JSON.stringify(calendars));
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
    localStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(notifications));

    if (isSupabaseConnected) {
      // Background sync to Supabase
      const syncToSupabase = async () => {
        try {
          await Promise.allSettled([
            ...organizations.map(o => supabaseService.saveOrganization(o)),
            ...users.map(u => supabaseService.saveUser(u)),
            ...brands.map(b => supabaseService.saveBrand(b)),
            ...tasks.map(t => supabaseService.saveTask(t)),
            ...services.map(s => supabaseService.saveService(s)),
            ...calendars.map(c => supabaseService.saveCalendar(c)),
            ...notifications.map(n => supabaseService.saveNotification(n))
          ]);
        } catch (err) {
          console.error('Supabase Background Sync Error:', err);
        }
      };
      syncToSupabase();
    }
  }, [organizations, brands, tasks, services, calendars, users, notifications, isSupabaseConnected]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEY_USER);
    }
  }, [currentUser]);

  const createNotification = async (userId: string, type: Notification['type'], message: string, relatedTaskId?: string, relatedUserId?: string) => {
    if (!currentUser) return;
    const newNotif: Notification = {
      id: Math.random().toString(36).substr(2, 9),
      orgId: currentUser.orgId,
      userId,
      type,
      message,
      read: false,
      timestamp: new Date().toISOString(),
      relatedTaskId,
      relatedUserId
    };
    
    try {
      await supabaseService.saveNotification(newNotif);
      
      // Email Integration
      const targetUser = users.find(u => u.id === userId);
      if (targetUser && targetUser.email) {
        await emailService.sendEmail(
          targetUser.email,
          `CraveSOP Notification: ${type.toUpperCase()}`,
          `Hello ${targetUser.name},\n\n${message}\n\nView details in the app: ${window.location.origin}`
        );
      }
    } catch (err) {
      console.error('Failed to save notification:', err);
    }
  };

  const notifyAdmins = (type: Notification['type'], message: string, relatedTaskId?: string, relatedUserId?: string) => {
    tenantUsers.filter(u => u.role === 'Admin' || u.role === 'Staff Lead').forEach(admin => {
      if (admin.id !== currentUser?.id) {
        createNotification(admin.id, type, message, relatedTaskId, relatedUserId);
      }
    });
  };

  const navigateTo = (newView: AppView) => {
    setView(newView);
    setIsAddingTask(false);
    setEditingTask(null);
    setShowProfileModal(false);
    setShowNotifs(false);
    if (newView !== 'personnel-detail') setSelectedPersonnelId(null);
    if (newView !== 'brand-detail') setSelectedBrandDetailId(null);
    if (newView !== 'users') setHighlightUserId(null);
  };

  const handleNotificationClick = (n: Notification) => {
    markNotifRead(n.id);
    setShowNotifs(false);

    if (n.relatedTaskId) {
      setHighlightTaskId(n.relatedTaskId);
      navigateTo('board');
    } else if (n.relatedUserId) {
      if (isAdminOrLead) {
        setHighlightUserId(n.relatedUserId);
        navigateTo('users');
      }
    }
  };

  const handleLogin = (email: string, password?: string) => {
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (user) {
      if (user.password && user.password !== password) {
        return; // Auth component handles the error message
      }
      setCurrentUser(user);
      setIsLoggedIn(true);
    }
  };

  const handleRegister = async (name: string, email: string, password?: string, companyName?: string, tenantId?: string): Promise<{ error?: string; tenantId?: string }> => {
    const emailLower = email.toLowerCase();
    const isWhitelisted = WHITELISTED_ADMINS.includes(emailLower);
    
    let targetOrgId = '';
    let finalTenantId = '';
    const newUserId = Math.random().toString(36).substr(2, 9);
    
    // CASE A: Provisioning a New Workspace
    if (companyName) {
      const newOrg: Organization = {
        id: `org-${Math.random().toString(36).substr(2, 9)}`,
        name: companyName,
        slug: companyName.toLowerCase().replace(/\s+/g, '-'),
        createdAt: new Date().toISOString(),
        tenantId: `tenant-${Math.random().toString(36).substr(2, 6)}`,
        config: {
          clientTerminology: 'Brand',
          clientTerminologyPlural: 'Brands'
        }
      };
      
      try {
        await supabaseService.saveOrganization(newOrg);
        setOrganizations(prev => [...prev, newOrg]);
        targetOrgId = newOrg.id;
        finalTenantId = newOrg.tenantId;

        // Copy template services for the new workspace
        const newServices: Service[] = DEFAULT_SERVICES.map(s => ({
          ...s,
          id: `s-${Math.random().toString(36).substr(2, 9)}`,
          orgId: targetOrgId
        }));
        for (const s of newServices) await supabaseService.saveService(s);
        setServices(prev => [...prev, ...newServices]);

        // SEEDING: Create a default "Internal Operations" brand for the new org
        const defaultBrand: Brand = {
          id: `b-${Math.random().toString(36).substr(2, 9)}`,
          orgId: targetOrgId,
          name: 'Internal Operations',
          services: ['General Operations'],
          leadId: newUserId // Link to the new admin
        };
        await supabaseService.saveBrand(defaultBrand);
        setBrands(prev => [...prev, defaultBrand]);

        // SEEDING: Create initial onboarding tasks
        const onboardingTasks: StaffTask[] = [
          {
            id: `t-${Math.random().toString(36).substr(2, 9)}`,
            orgId: targetOrgId,
            brandId: defaultBrand.id,
            serviceType: 'General Operations',
            staffName: name,
            assignedBy: 'System',
            taskTitle: 'Configure Workspace Settings',
            taskDescription: 'Set up your company profile and invite your first Staff Lead.',
            category: 'Strategic Planning',
            type: 'One-time',
            frequency: 'N/A',
            status: 'Not Started',
            dueDate: new Date(Date.now() + 86400000).toISOString(),
            progressUpdate: '',
            estimatedHours: 1,
            hoursSpent: 0,
            comments: [],
            reportingPeriod: new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
          }
        ];
        for (const t of onboardingTasks) await supabaseService.saveTask(t);
        setTasks(prev => [...prev, ...onboardingTasks]);
      } catch (err) {
        console.error('Failed to provision workspace:', err);
        return { error: "Failed to provision workspace. Please try again." };
      }
    } 
    // CASE B: Joining an Existing Unit
    else {
      if (!tenantId) return { error: "Target Tenant ID is required to join a unit." };
      
      const foundOrg = organizations.find(o => o.tenantId === tenantId);
      if (!foundOrg) {
        return { error: "WORKSPACE NOT FOUND: The provided Tenant ID does not match any active ecosystem." };
      }
      targetOrgId = foundOrg.id;
      finalTenantId = foundOrg.tenantId;
    }

    // UPDATED LOGIC: Workspace creator is always Admin.
    const role = (companyName || isWhitelisted) ? 'Admin' : 'Staff Member';
    const registrationStatus = (role === 'Admin') ? 'approved' : 'pending';
    
    const newUser: User = { 
      id: newUserId, 
      orgId: targetOrgId, 
      name, 
      email, 
      password,
      role, 
      registrationStatus 
    };
    
    try {
      await supabaseService.saveUser(newUser);
      setUsers(prev => [...prev, newUser]);
      
      if (registrationStatus === 'pending') {
        const targetOrgAdmins = users.filter(u => u.orgId === targetOrgId && (u.role === 'Admin' || u.role === 'Staff Lead'));
        for (const admin of targetOrgAdmins) {
          await createNotification(admin.id, 'warning', `New Access Request: ${name} is waiting for authorization in your unit.`, undefined, newUser.id);
        }
        setShowRegSuccess(true);
      } else {
        // If it's a new provision, show them the success screen with the Tenant ID
        if (companyName) {
          setNewlyProvisionedTenantId(finalTenantId);
          setShowRegSuccess(true);
        } else {
          setCurrentUser(newUser);
          setIsLoggedIn(true);
        }
      }
      
      return { tenantId: finalTenantId };
    } catch (err) {
      console.error('Failed to register user:', err);
      return { error: "Registration failed. Please try again." };
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const userToDelete = users.find(u => u.id === userId);
    if (!userToDelete) return;
    
    if (userToDelete.email === 'support@cloudcraves.com') {
      alert("System Root account cannot be deleted.");
      return;
    }

    if (window.confirm(`CRITICAL: Are you sure you want to delete ${userToDelete.name}'s profile? Historical logs and deliverables will be preserved for audit reference.`)) {
      try {
        await supabaseService.deleteUser(userId);
        setUsers(prev => prev
          .filter(u => u.id !== userId)
          .map(u => u.mentorId === userId ? { ...u, mentorId: undefined } : u)
        );
        notifyAdmins('warning', `Profile Decommissioned: ${userToDelete.name} removed from roster.`);
        if (view === 'personnel-detail' && selectedPersonnelId === userId) {
          navigateTo('users');
        }
      } catch (err) {
        console.error('Failed to delete user:', err);
        alert('Failed to delete user. Please try again.');
      }
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setView('board');
    setSelectedPersonnelId(null);
    setShowProfileModal(false);
    localStorage.removeItem(STORAGE_KEY_USER);
  };

  const handleAnalyze = useCallback(async () => {
    setLoading(true);
    setSummary(null);
    try {
      const result = await analyzeTasks(visibleTasks);
      setSummary(result);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [visibleTasks]);

  const handleAddComment = useCallback(async (taskId: string, commentText: string) => {
    if (!currentUser) return;
    const task = tenantTasks.find(t => t.id === taskId);
    if (!task) return;
    const newComment: TaskComment = {
      id: Math.random().toString(36).substr(2, 9),
      authorName: currentUser.name,
      authorRole: currentUser.role,
      text: commentText,
      timestamp: new Date().toISOString()
    };
    
    const updatedTask = { ...task, comments: [...task.comments, newComment] };
    
    try {
      await supabaseService.saveTask(updatedTask);
      setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
      
      const taskOwner = tenantUsers.find(u => u.name === task.staffName);
      if (taskOwner && taskOwner.id !== currentUser.id) {
        await createNotification(taskOwner.id, 'info', `${currentUser.name} logged a comment on your deliverable: "${task.taskTitle}"`, taskId);
      }

      for (const u of tenantUsers) {
        if (commentText.includes(`@${u.name}`) && u.id !== currentUser.id) {
          await createNotification(u.id, 'success', `${currentUser.name} mentioned you in a log for "${task.taskTitle}"`, taskId);
        }
      }

      await notifyAdmins('info', `Log Update: ${currentUser.name} on "${task.taskTitle}"`, taskId);
    } catch (err) {
      console.error('Failed to add comment:', err);
    }
  }, [currentUser, tenantTasks, tenantUsers]);

  const handleTaskSubmit = async (taskData: Partial<StaffTask>) => {
    if (!currentUser) return;
    if (editingTask) {
      const wasCompleted = editingTask.status === 'Completed';
      const isCompleted = taskData.status === 'Completed';
      const isBlocked = taskData.status === 'Blocked';

      const updatedTask = { ...editingTask, ...taskData } as StaffTask;

      try {
        await supabaseService.saveTask(updatedTask);
        
        // Check for re-assignment
        if (taskData.staffName && taskData.staffName !== editingTask.staffName) {
          const newUser = tenantUsers.find(u => u.name === taskData.staffName);
          if (newUser && newUser.id !== currentUser.id) {
            await createNotification(newUser.id, 'success', `Deliverable Re-assigned: "${taskData.taskTitle || editingTask.taskTitle}" is now your responsibility.`, editingTask.id);
          }
        }

        setTasks(prev => prev.map(t => t.id === editingTask.id ? updatedTask : t));
        
        if (!wasCompleted && isCompleted) {
          await notifyAdmins('success', `Deliverable Finalized: ${editingTask.taskTitle} by ${editingTask.staffName}`, editingTask.id);
        }
        if (taskData.status === 'Pending Approval' && editingTask.status !== 'Pending Approval') {
          await notifyAdmins('info', `Deliverable Pending Approval: "${taskData.taskTitle || editingTask.taskTitle}" by ${taskData.staffName || editingTask.staffName}`, editingTask.id);
        }
        if (isBlocked) {
          await notifyAdmins('alert', `Blocker Alert: ${editingTask.taskTitle} is blocked by ${editingTask.staffName}`, editingTask.id);
        }

        setEditingTask(null);
      } catch (err) {
        console.error('Failed to update task:', err);
      }
    } else {
      const newTask: StaffTask = {
        id: Math.random().toString(36).substr(2, 9),
        orgId: currentUser.orgId,
        brandId: taskData.brandId || '',
        serviceType: taskData.serviceType || 'General Operations',
        staffName: taskData.staffName || currentUser.name,
        assignedBy: taskData.assignedBy || currentUser.name,
        taskTitle: taskData.taskTitle || 'Untitled Deliverable',
        taskDescription: taskData.taskDescription || '',
        category: taskData.category || 'Internal Deliverable',
        type: taskData.type || 'One-time',
        frequency: taskData.frequency || 'N/A',
        status: taskData.status || 'Not Started',
        dueDate: taskData.dueDate || '',
        progressUpdate: '',
        estimatedHours: taskData.estimatedHours || 0,
        hoursSpent: taskData.hoursSpent || 0,
        comments: [],
        reportingPeriod: new Date().toLocaleString('default', { month: 'short', year: 'numeric' })
      };
      
      try {
        await supabaseService.saveTask(newTask);
        setTasks([newTask, ...tasks]);
        setIsAddingTask(false);

        const assignedUser = tenantUsers.find(u => u.name === newTask.staffName);
        if (assignedUser && assignedUser.id !== currentUser.id) {
          await createNotification(assignedUser.id, 'success', `New Deliverable Assigned: "${newTask.taskTitle}" by ${currentUser.name}`, newTask.id);
        }

        await notifyAdmins('info', `New deliverable provisioned for ${newTask.staffName}: ${newTask.taskTitle}`, newTask.id);
      } catch (err) {
        console.error('Failed to create task:', err);
      }
    }
  };

  const handleSaveCalendar = async (cal: ContentCalendar) => {
    if (!currentUser) return;
    
    try {
      await supabaseService.saveCalendar(cal);
      
      const existing = calendars.find(c => c.id === cal.id);
      if (existing) {
        setCalendars(prev => prev.map(c => c.id === cal.id ? cal : c));
      } else {
        setCalendars(prev => [...prev, cal]);
      }

      const newTasksFromCal: StaffTask[] = [];
      for (const entry of cal.entries) {
        const existingTask = tasks.find(t => t.relatedCalendarEntryId === entry.id);
        const assignedUser = tenantUsers.find(u => u.id === entry.assignedToId);
        
        if (existingTask) {
          const updatedTask = {
            ...existingTask,
            staffName: assignedUser?.name || existingTask.staffName,
            taskTitle: `Calendar: ${entry.topic}`,
            taskDescription: `Platforms: ${entry.platforms.join(', ')}\nType: ${entry.contentType}\n\nVisual Instructions: ${entry.visualRef}\n\nCaption/CTA: ${entry.caption}`,
            dueDate: entry.date
          };
          await supabaseService.saveTask(updatedTask);
          setTasks(prev => prev.map(t => t.id === existingTask.id ? updatedTask : t));
        } else {
          const newTask: StaffTask = {
            id: `t-${Math.random().toString(36).substr(2, 9)}`,
            orgId: currentUser.orgId,
            brandId: cal.brandId,
            serviceType: 'Social Media Management',
            staffName: assignedUser?.name || currentUser.name,
            assignedBy: currentUser.name,
            taskTitle: `Calendar: ${entry.topic}`,
            taskDescription: `Platforms: ${entry.platforms.join(', ')}\nType: ${entry.contentType}\n\nVisual Instructions: ${entry.visualRef}\n\nCaption/CTA: ${entry.caption}`,
            category: 'Content Optimisation',
            type: 'One-time',
            frequency: 'N/A',
            status: 'Not Started',
            dueDate: entry.date,
            progressUpdate: '',
            estimatedHours: 2,
            hoursSpent: 0,
            comments: [],
            reportingPeriod: new Date(entry.date).toLocaleString('default', { month: 'short', year: 'numeric' }),
            relatedCalendarId: cal.id,
            relatedCalendarEntryId: entry.id
          };
          await supabaseService.saveTask(newTask);
          newTasksFromCal.push(newTask);
          
          if (assignedUser && assignedUser.id !== currentUser.id) {
            await createNotification(assignedUser.id, 'info', `Strategy Update: You have a new content slot assigned for "${entry.topic}"`, newTask.id);
          }
        }
      }

      if (newTasksFromCal.length > 0) {
        setTasks(prev => [...newTasksFromCal, ...prev]);
      }
      await notifyAdmins('success', `Strategy Calendar synchronized: ${cal.name}`);
    } catch (err) {
      console.error('Failed to save calendar:', err);
    }
  };

  const handleCreateBrand = async (brandName: string, selectedServices: ServiceType[]) => {
    if (!currentUser) return;
    const newBrand: Brand = {
      id: `b-${Math.random().toString(36).substr(2, 9)}`,
      orgId: currentUser.orgId,
      name: brandName,
      services: selectedServices,
      leadId: currentUser.role === 'Staff Lead' ? currentUser.id : undefined
    };
    
    try {
      await supabaseService.saveBrand(newBrand);
      setBrands(prev => [...prev, newBrand]);

      const autoTasks: StaffTask[] = [];
      for (const service of selectedServices) {
        const templates = SERVICE_TEMPLATES[service] || [];
        for (const tpl of templates) {
          const newTask: StaffTask = {
            id: `t-${Math.random().toString(36).substr(2, 9)}`,
            orgId: currentUser.orgId,
            brandId: newBrand.id,
            serviceType: service,
            staffName: currentUser.name,
            assignedBy: currentUser.name,
            taskTitle: tpl.taskTitle,
            taskDescription: `Automatic deliverable initialization for ${service}.`,
            category: tpl.category,
            type: tpl.type,
            frequency: tpl.frequency,
            status: 'Not Started',
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            progressUpdate: '',
            estimatedHours: 1,
            hoursSpent: 0,
            comments: [],
            reportingPeriod: new Date().toLocaleString('default', { month: 'short', year: 'numeric' })
          };
          await supabaseService.saveTask(newTask);
          autoTasks.push(newTask);
        }
      }
      setTasks(prev => [...autoTasks, ...prev]);
      await notifyAdmins('success', `New brand pipeline provisioned: ${brandName}`);
    } catch (err) {
      console.error('Failed to create brand:', err);
    }
  };

  const handleUpdateBrand = async (brandId: string, updates: Partial<Brand>) => {
    const oldBrand = brands.find(b => b.id === brandId);
    if (!oldBrand || !currentUser) return;

    const updatedBrand = { ...oldBrand, ...updates };
    
    try {
      await supabaseService.saveBrand(updatedBrand);
      setBrands(prev => prev.map(b => b.id === brandId ? updatedBrand : b));
      
      if (updates.services) {
        const newServices = updates.services.filter(s => !oldBrand.services.includes(s));
        if (newServices.length > 0) {
          const autoTasks: StaffTask[] = [];
          for (const service of newServices) {
            const templates = SERVICE_TEMPLATES[service] || [];
            for (const tpl of templates) {
              const newTask: StaffTask = {
                id: `t-${Math.random().toString(36).substr(2, 9)}`,
                orgId: currentUser.orgId,
                brandId: brandId,
                serviceType: service,
                staffName: currentUser.name,
                assignedBy: currentUser.name,
                taskTitle: tpl.taskTitle,
                taskDescription: `Automatic deliverable initialization for ${service}.`,
                category: tpl.category,
                type: tpl.type,
                frequency: tpl.frequency,
                status: 'Not Started',
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                progressUpdate: '',
                estimatedHours: 1,
                hoursSpent: 0,
                comments: [],
                reportingPeriod: new Date().toLocaleString('default', { month: 'short', year: 'numeric' })
              };
              await supabaseService.saveTask(newTask);
              autoTasks.push(newTask);
            }
          }
          setTasks(prev => [...autoTasks, ...prev]);
        }
      }
      await notifyAdmins('info', `Brand configuration modified: ${brandId}`);
    } catch (err) {
      console.error('Failed to update brand:', err);
    }
  };

  const handleUpdateUser = async (userId: string, updates: Partial<User>) => {
    const userToUpdate = users.find(u => u.id === userId);
    if (!userToUpdate) return;

    const updatedUser = { ...userToUpdate, ...updates };
    
    try {
      await supabaseService.saveUser(updatedUser);
      setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
      if (currentUser?.id === userId) {
        setCurrentUser(updatedUser);
      }
      
      if (updates.registrationStatus === 'approved') {
        await createNotification(userId, 'success', 'Your access request has been approved. Welcome to the workspace!');
      }
    } catch (err) {
      console.error('Failed to update user:', err);
    }
  };

  const handleAdminDrillDown = (userId: string) => {
    setSelectedPersonnelId(userId);
    navigateTo('personnel-detail');
  };

  const handleClaimMentee = async (userId: string, leadId?: string) => {
    if (!currentUser) return;
    const userToUpdate = users.find(u => u.id === userId);
    if (!userToUpdate) return;

    const updatedUser = { ...userToUpdate, mentorId: leadId || currentUser.id };
    
    try {
      await supabaseService.saveUser(updatedUser);
      setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
      await createNotification(userId, 'success', `You have been assigned to ${currentUser.name} for mentorship and oversight.`);
    } catch (err) {
      console.error('Failed to claim mentee:', err);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: TaskStatus, feedback?: string) => {
    if (!currentUser) return;
    
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const updatedTask = { ...task, status: newStatus };
    if (feedback) {
      updatedTask.comments = [
        {
          id: `c-${Math.random().toString(36).substr(2, 9)}`,
          authorName: currentUser.name,
          authorRole: currentUser.role,
          text: `Status updated to ${newStatus}. Feedback: ${feedback}`,
          timestamp: new Date().toISOString()
        },
        ...task.comments
      ];
    } else if (newStatus === 'Completed') {
      updatedTask.comments = [
        {
          id: `c-${Math.random().toString(36).substr(2, 9)}`,
          authorName: currentUser.name,
          authorRole: currentUser.role,
          text: `Deliverable approved and marked as completed.`,
          timestamp: new Date().toISOString()
        },
        ...task.comments
      ];
    } else if (newStatus === 'Pending Approval') {
      updatedTask.comments = [
        {
          id: `c-${Math.random().toString(36).substr(2, 9)}`,
          authorName: currentUser.name,
          authorRole: currentUser.role,
          text: `Deliverable submitted for approval.`,
          timestamp: new Date().toISOString()
        },
        ...task.comments
      ];
    }

    try {
      await supabaseService.saveTask(updatedTask);
      setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
      
      if (newStatus === 'Pending Approval') {
        await notifyAdmins('info', `Deliverable Pending Approval: "${task.taskTitle}" by ${task.staffName}`, taskId);
      } else {
        const owner = tenantUsers.find(u => u.name === task.staffName);
        if (owner && owner.id !== currentUser.id) {
          await createNotification(owner.id, newStatus === 'Completed' ? 'success' : 'warning', `Deliverable "${task.taskTitle}" status updated to ${newStatus}`, taskId);
        }
      }
    } catch (err) {
      console.error('Failed to update task status:', err);
    }
  };

  const markNotifRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleBrandDrillDown = (brandId: string) => {
    setSelectedBrandDetailId(brandId);
    navigateTo('brand-detail');
  };

  const handleResetSystem = async () => {
    if (!window.confirm('CRITICAL: This will delete ALL users, tasks, brands, and organizations from the database. This action cannot be undone. Are you absolutely sure?')) {
      return;
    }

    try {
      await supabaseService.resetAllData();
      // Clear local state
      setUsers([]);
      setTasks([]);
      setBrands([]);
      setOrganizations([]);
      setNotifications([]);
      setCalendars([]);
      setCurrentUser(null);
      setIsLoggedIn(false);
      localStorage.clear();
      window.location.reload();
    } catch (err) {
      console.error('Failed to reset system:', err);
      alert('Failed to reset system. Check console for details.');
    }
  };

  if (isInitialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Establishing Secure Link...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <Auth 
        onLogin={handleLogin} 
        onRegister={handleRegister} 
        users={users} 
        showRegSuccess={showRegSuccess} 
        provisionedTenantId={newlyProvisionedTenantId}
        onBackToLogin={() => { setShowRegSuccess(false); setNewlyProvisionedTenantId(null); }} 
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans transition-colors duration-300">
      <header className="bg-white/95 dark:bg-slate-950/95 backdrop-blur-lg border-b border-slate-200/50 dark:border-white/10 sticky top-0 z-[100] shadow-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-4">
              <Logo className="h-8 sm:h-10" />
              <div className="h-6 w-px bg-slate-200 dark:bg-white/10 hidden sm:block"></div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="hidden sm:block text-[11px] font-black uppercase tracking-[0.2em] text-brand-blue dark:text-brand-cyan">{currentOrg?.name}</span>
                  {isSupabaseConnected && (
                    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                      <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></div>
                      <span className="text-[7px] font-black text-emerald-500 uppercase tracking-tighter">Cloud Active</span>
                    </div>
                  )}
                  {supabaseError && (
                    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-rose-500/10 border border-rose-500/20 rounded-full">
                      <div className="w-1 h-1 bg-rose-500 rounded-full"></div>
                      <span className="text-[7px] font-black text-rose-500 uppercase tracking-tighter">Cloud Error</span>
                    </div>
                  )}
                </div>
                <span className="hidden sm:block text-[8px] font-bold text-slate-400 uppercase tracking-widest">{currentOrg?.tenantId}</span>
              </div>
            </div>
            
            <nav className="hidden lg:flex items-center bg-slate-100 dark:bg-white/5 p-1 rounded-2xl border border-slate-200/50 dark:border-white/10">
              <button onClick={() => navigateTo('board')} className={`px-5 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${view === 'board' ? 'bg-white dark:bg-white/10 text-brand-blue shadow-sm' : 'text-slate-500'}`}>Deliverables Board</button>
              {(isAdminOrLead || currentUser?.role === 'Staff Member' || currentUser?.role === 'Mentee') && (
                <button onClick={() => navigateTo('calendar')} className={`px-5 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${view === 'calendar' ? 'bg-white dark:bg-white/10 text-brand-blue shadow-sm' : 'text-slate-500'}`}>Calendars</button>
              )}
              {isAdminOrLead && (
                <button onClick={() => navigateTo('brands')} className={`px-5 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${view === 'brands' || view === 'brand-detail' ? 'bg-white dark:bg-white/10 text-brand-blue shadow-sm' : 'text-slate-500'}`}>Brands</button>
              )}
              {isAdminOrLead && (
                <button onClick={() => navigateTo('squad')} className={`px-5 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${view === 'squad' ? 'bg-white dark:bg-white/10 text-brand-blue shadow-sm' : 'text-slate-500'}`}>Squad Units</button>
              )}
              {isAdminOrLead && (
                <>
                  <button onClick={() => { navigateTo('analysis'); handleAnalyze(); }} className={`px-5 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${view === 'analysis' ? 'bg-brand-blue text-white shadow-lg' : 'text-slate-500'}`}>Intelligence</button>
                  <button onClick={() => navigateTo('users')} className={`px-5 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${view === 'users' || view === 'personnel-detail' ? 'bg-white dark:bg-white/10 text-brand-blue shadow-sm' : 'text-slate-500'}`}>Moderation</button>
                </>
              )}
            </nav>
            
            <div className="flex items-center gap-4">
              {isAdminOrLead && (
                <button 
                  onClick={() => { setEditingTask(null); setIsAddingTask(true); }}
                  className="bg-brand-blue hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-95"
                >
                  + Generate Deliverable
                </button>
              )}

              <div className="relative">
                <button onClick={() => { setShowNotifs(!showNotifs); setShowProfileModal(false); }} className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-500 relative">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                  {tenantNotifications.filter(n => !n.read).length > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-600 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 animate-bounce">{tenantNotifications.filter(n => !n.read).length}</span>}
                </button>
                {showNotifs && <NotificationsPanel notifications={tenantNotifications} onNotificationClick={handleNotificationClick} onMarkAllRead={() => setNotifications(prev => prev.map(n => ({...n, read: true})))} onClose={() => setShowNotifs(false)} />}
              </div>
              
              <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-500">
                {isDarkMode ? '🌙' : '☀️'}
              </button>

              <div className="relative">
                <div onClick={() => { setShowProfileModal(!showProfileModal); setShowNotifs(false); }} className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 border-2 border-transparent hover:border-brand-blue overflow-hidden cursor-pointer shadow-sm">
                  <img src={currentUser?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.name}`} className="w-full h-full object-cover" />
                </div>
                {showProfileModal && (
                  <div className="absolute right-0 mt-4 w-72 bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden z-[200] animate-in zoom-in-95 duration-200 origin-top-right">
                    <div className="p-8 border-b border-slate-50 dark:border-white/5 text-center">
                      <div className="relative w-20 h-20 mx-auto mb-4 group">
                        <img 
                          src={currentUser?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.name}`} 
                          className="w-full h-full rounded-2xl object-cover border-2 border-slate-100 dark:border-white/10" 
                        />
                        <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                if (file.size > 2 * 1024 * 1024) {
                                  alert("File size must be less than 2MB");
                                  return;
                                }
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  handleUpdateUser(currentUser!.id, { avatar: reader.result as string });
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      </div>
                      <p className="text-sm font-black text-slate-800 dark:text-white truncate">{currentUser?.name}</p>
                      <p className="text-[9px] font-black text-brand-cyan uppercase tracking-widest mt-1">{currentUser?.role}</p>
                    </div>
                    <div className="p-4 space-y-2">
                      {isAdminOrLead && (
                        <button 
                          onClick={() => navigateTo('notification-audit')}
                          className="w-full flex items-center gap-4 px-6 py-4 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400 transition-colors rounded-2xl text-left font-black text-[10px] uppercase tracking-widest"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 002-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                          System Audit Logs
                        </button>
                      )}
                      <button onClick={handleLogout} className="w-full flex items-center gap-4 px-6 py-4 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-600 transition-colors rounded-2xl text-left font-black text-[10px] uppercase tracking-widest">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        Logout Session
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {(isAddingTask || editingTask) ? (
          <TaskEntryForm 
            currentUser={currentUser!} 
            users={visibleUsers} 
            brands={visibleBrands}
            services={tenantServices}
            workspace={currentOrg!}
            initialTask={editingTask} 
            onSubmit={handleTaskSubmit} 
            onCancel={() => { setIsAddingTask(false); setEditingTask(null); }} 
          />
        ) : (
          <>
            {view === 'board' && <TaskBoard tasks={visibleTasks} users={tenantUsers} brands={tenantBrands} workspace={currentOrg!} currentUser={currentUser!} onEditTask={setEditingTask} onAddComment={handleAddComment} onUpdateTaskStatus={handleUpdateTaskStatus} highlightTaskId={highlightTaskId} onHighlightClear={() => setHighlightTaskId(null)} />}
            {view === 'calendar' && <ContentCalendarView currentUser={currentUser!} users={tenantUsers} brands={tenantBrands} calendars={tenantCalendars} onSaveCalendar={handleSaveCalendar} />}
            {view === 'brands' && isAdminOrLead && <BrandManagement brands={tenantBrands} services={tenantServices} workspace={currentOrg!} onCreateBrand={handleCreateBrand} onUpdateBrand={handleUpdateBrand} onBrandClick={handleBrandDrillDown} />}
            {view === 'brand-detail' && selectedBrandDetailId && (
              <BrandDetailView 
                brand={brands.find(b => b.id === selectedBrandDetailId)!}
                tasks={tenantTasks}
                users={tenantUsers}
                workspace={currentOrg!}
                onBack={() => setView('brands')}
                onEditTask={setEditingTask}
                onAddComment={handleAddComment}
                currentUser={currentUser!}
              />
            )}
            {view === 'squad' && isAdminOrLead && <MentorshipHub users={tenantUsers} tasks={tenantTasks} currentUser={currentUser!} onClaimMentee={handleClaimMentee} />}
            {view === 'analysis' && isAdminOrLead && (loading ? <div className="py-20 text-center font-black animate-pulse text-slate-400 uppercase tracking-widest">Synthesizing intelligence logs...</div> : summary && <Dashboard summary={summary} users={tenantUsers} />)}
            {view === 'users' && isAdminOrLead && (
              <AdminUserManagement 
                users={visibleUsers} 
                currentUser={currentUser!} 
                organization={currentOrg!}
                onUpdateUser={handleUpdateUser} 
                onDeleteUser={handleDeleteUser} 
                onDrillDown={handleAdminDrillDown} 
                onResetSystem={handleResetSystem}
                highlightUserId={highlightUserId} 
                onHighlightClear={() => setHighlightUserId(null)} 
              />
            )}
            {view === 'personnel-detail' && selectedPersonnelId && isAdminOrLead && (
              <PersonnelProtocolView 
                userId={selectedPersonnelId} 
                users={tenantUsers} 
                tasks={tenantTasks} 
                onBack={() => setView('users')}
                onAddComment={handleAddComment}
              />
            )}
            {view === 'notification-audit' && isAdminOrLead && (
              <NotificationAudit 
                notifications={notifications.filter(n => n.orgId === currentUser?.orgId)}
                users={users}
                workspace={currentOrg!}
                onClose={() => navigateTo('board')}
              />
            )}
            {(!isAdminOrLead && view !== 'board' && view !== 'calendar') && <div className="py-40 text-center text-slate-400 font-black uppercase tracking-widest">Redirecting to active deliverables...</div>}
          </>
        )}
      </main>
    </div>
  );
};

export default App;
