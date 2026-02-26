
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { StaffTask, ManagementSummary, User, TaskComment, Notification, Organization, Brand, ServiceType, TaskCategory, Frequency, TaskType, TaskStatus, ContentCalendar, CalendarEntry, Service } from './types';
import { MOCK_TASKS, USERS, ORGS, BRANDS, DEFAULT_SERVICES } from './constants';
import { analyzeTasks } from './services/geminiService';
import Dashboard from './components/Dashboard';
import TaskEntryForm from './components/TaskEntryForm';
import TaskBoard from './components/TaskBoard';
import Auth from './components/Auth';
import AdminUserManagement from './components/AdminUserManagement';
import BrandManagement from './components/BrandManagement';
import BrandDetailView from './components/BrandDetailView';
import Logo from './components/Logo';
import NotificationsPanel from './components/NotificationsPanel';
import MentorshipHub from './components/MentorshipHub';
import PersonnelProtocolView from './components/PersonnelProtocolView';
import ContentCalendarView from './components/ContentCalendarView';

type AppView = 'board' | 'analysis' | 'users' | 'squad' | 'personnel-detail' | 'brands' | 'brand-detail' | 'calendar';

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

  const [view, setView] = useState<AppView>('board');
  const [selectedPersonnelId, setSelectedPersonnelId] = useState<string | null>(null);
  const [selectedBrandDetailId, setSelectedBrandDetailId] = useState<string | null>(null);
  const [summary, setSummary] = useState<ManagementSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [editingTask, setEditingTask] = useState<StaffTask | null>(null);
  const [isAddingTask, setIsAddingTask] = useState<boolean>(false);

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
    if (currentUser.role === 'Admin') return orgBrands;
    if (currentUser.role === 'Staff Lead') return orgBrands.filter(b => b.leadId === currentUser.id);
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
  }, [organizations, brands, tasks, services, calendars, users, notifications]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEY_USER);
    }
  }, [currentUser]);

  const createNotification = (userId: string, type: Notification['type'], message: string, relatedTaskId?: string, relatedUserId?: string) => {
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
    setNotifications(prev => [newNotif, ...prev]);
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

  const handleRegister = (name: string, email: string, password?: string, companyName?: string, tenantId?: string): { error?: string; tenantId?: string } => {
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
      setOrganizations(prev => [...prev, newOrg]);
      targetOrgId = newOrg.id;
      finalTenantId = newOrg.tenantId;

      // Copy template services for the new workspace
      const newServices: Service[] = DEFAULT_SERVICES.map(s => ({
        ...s,
        id: `s-${Math.random().toString(36).substr(2, 9)}`,
        orgId: targetOrgId
      }));
      setServices(prev => [...prev, ...newServices]);

      // SEEDING: Create a default "Internal Operations" brand for the new org
      const defaultBrand: Brand = {
        id: `b-${Math.random().toString(36).substr(2, 9)}`,
        orgId: targetOrgId,
        name: 'Internal Operations',
        services: ['General Operations'],
        leadId: newUserId // Link to the new admin
      };
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
      setTasks(prev => [...prev, ...onboardingTasks]);
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
    
    setUsers(prev => [...prev, newUser]);
    
    if (registrationStatus === 'pending') {
      const targetOrgAdmins = users.filter(u => u.orgId === targetOrgId && (u.role === 'Admin' || u.role === 'Staff Lead'));
      targetOrgAdmins.forEach(admin => {
        const newNotif: Notification = {
          id: Math.random().toString(36).substr(2, 9),
          orgId: targetOrgId,
          userId: admin.id,
          type: 'warning',
          message: `New Access Request: ${name} is waiting for authorization in your unit.`,
          read: false,
          timestamp: new Date().toISOString(),
          relatedUserId: newUser.id
        };
        setNotifications(prev => [newNotif, ...prev]);
      });
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
  };

  const handleDeleteUser = (userId: string) => {
    const userToDelete = users.find(u => u.id === userId);
    if (!userToDelete) return;
    
    if (userToDelete.email === 'support@cloudcraves.com') {
      alert("System Root account cannot be deleted.");
      return;
    }

    if (window.confirm(`CRITICAL: Are you sure you want to delete ${userToDelete.name}'s profile? Historical logs and deliverables will be preserved for audit reference.`)) {
      setUsers(prev => prev
        .filter(u => u.id !== userId)
        .map(u => u.mentorId === userId ? { ...u, mentorId: undefined } : u)
      );
      notifyAdmins('warning', `Profile Decommissioned: ${userToDelete.name} removed from roster.`);
      if (view === 'personnel-detail' && selectedPersonnelId === userId) {
        navigateTo('users');
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

  const handleAddComment = useCallback((taskId: string, commentText: string) => {
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
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, comments: [...t.comments, newComment] } : t));
    
    const taskOwner = tenantUsers.find(u => u.name === task.staffName);
    if (taskOwner && taskOwner.id !== currentUser.id) {
      createNotification(taskOwner.id, 'info', `${currentUser.name} logged a comment on your deliverable: "${task.taskTitle}"`, taskId);
    }

    tenantUsers.forEach(u => {
      if (commentText.includes(`@${u.name}`) && u.id !== currentUser.id) {
        createNotification(u.id, 'success', `${currentUser.name} mentioned you in a log for "${task.taskTitle}"`, taskId);
      }
    });

    notifyAdmins('info', `Log Update: ${currentUser.name} on "${task.taskTitle}"`, taskId);
  }, [currentUser, tenantTasks, tenantUsers]);

  const handleTaskSubmit = (taskData: Partial<StaffTask>) => {
    if (!currentUser) return;
    if (editingTask) {
      const wasCompleted = editingTask.status === 'Completed';
      const isCompleted = taskData.status === 'Completed';
      const isBlocked = taskData.status === 'Blocked';

      setTasks(prev => prev.map(t => t.id === editingTask.id ? { ...t, ...taskData } as StaffTask : t));
      
      if (!wasCompleted && isCompleted) {
        notifyAdmins('success', `Deliverable Finalized: ${editingTask.taskTitle} by ${editingTask.staffName}`, editingTask.id);
      }
      if (taskData.status === 'Pending Approval' && editingTask.status !== 'Pending Approval') {
        notifyAdmins('info', `Deliverable Pending Approval: "${taskData.taskTitle || editingTask.taskTitle}" by ${taskData.staffName || editingTask.staffName}`, editingTask.id);
      }
      if (isBlocked) {
        notifyAdmins('alert', `Blocker Alert: ${editingTask.taskTitle} is blocked by ${editingTask.staffName}`, editingTask.id);
      }

      setEditingTask(null);
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
        reportingPeriod: 'Nov 2024'
      };
      setTasks([newTask, ...tasks]);
      setIsAddingTask(false);

      const assignedUser = tenantUsers.find(u => u.name === newTask.staffName);
      if (assignedUser && assignedUser.id !== currentUser.id) {
        createNotification(assignedUser.id, 'success', `New Deliverable Assigned: "${newTask.taskTitle}" by ${currentUser.name}`, newTask.id);
      }

      notifyAdmins('info', `New deliverable provisioned for ${newTask.staffName}: ${newTask.taskTitle}`, newTask.id);
    }
  };

  const handleSaveCalendar = (cal: ContentCalendar) => {
    if (!currentUser) return;
    const existing = calendars.find(c => c.id === cal.id);
    if (existing) {
      setCalendars(prev => prev.map(c => c.id === cal.id ? cal : c));
    } else {
      setCalendars(prev => [...prev, cal]);
    }

    const newTasksFromCal: StaffTask[] = [];
    cal.entries.forEach(entry => {
      const existingTask = tasks.find(t => t.relatedCalendarEntryId === entry.id);
      const assignedUser = tenantUsers.find(u => u.id === entry.assignedToId);
      
      if (existingTask) {
        setTasks(prev => prev.map(t => t.id === existingTask.id ? {
          ...t,
          staffName: assignedUser?.name || t.staffName,
          taskTitle: `Calendar: ${entry.topic}`,
          taskDescription: `Platforms: ${entry.platforms.join(', ')}\nType: ${entry.contentType}\n\nVisual Instructions: ${entry.visualRef}\n\nCaption/CTA: ${entry.caption}`,
          dueDate: entry.date
        } : t));
      } else {
        const newTask = {
          id: `t-${Math.random().toString(36).substr(2, 9)}`,
          orgId: currentUser.orgId,
          brandId: cal.brandId,
          serviceType: 'Social Media Management' as ServiceType,
          staffName: assignedUser?.name || currentUser.name,
          assignedBy: currentUser.name,
          taskTitle: `Calendar: ${entry.topic}`,
          taskDescription: `Platforms: ${entry.platforms.join(', ')}\nType: ${entry.contentType}\n\nVisual Instructions: ${entry.visualRef}\n\nCaption/CTA: ${entry.caption}`,
          category: 'Content Optimisation' as TaskCategory,
          type: 'One-time' as TaskType,
          frequency: 'N/A' as Frequency,
          status: 'Not Started' as TaskStatus,
          dueDate: entry.date,
          progressUpdate: '',
          estimatedHours: 2, 
          hoursSpent: 0,
          comments: [],
          reportingPeriod: 'Nov 2024',
          relatedCalendarId: cal.id,
          relatedCalendarEntryId: entry.id
        };
        newTasksFromCal.push(newTask);
        
        if (assignedUser && assignedUser.id !== currentUser.id) {
          createNotification(assignedUser.id, 'info', `Strategy Update: You have a new content slot assigned for "${entry.topic}"`, newTask.id);
        }
      }
    });

    if (newTasksFromCal.length > 0) {
      setTasks(prev => [...newTasksFromCal, ...prev]);
    }
    notifyAdmins('success', `Strategy Calendar synchronized: ${cal.name}`);
  };

  const handleCreateBrand = (brandName: string, selectedServices: ServiceType[]) => {
    if (!currentUser) return;
    const newBrand: Brand = {
      id: `b-${Math.random().toString(36).substr(2, 9)}`,
      orgId: currentUser.orgId,
      name: brandName,
      services: selectedServices,
      leadId: currentUser.role === 'Staff Lead' ? currentUser.id : undefined
    };
    setBrands(prev => [...prev, newBrand]);

    const autoTasks: StaffTask[] = [];
    selectedServices.forEach(service => {
      const templates = SERVICE_TEMPLATES[service] || [];
      templates.forEach(tpl => {
        autoTasks.push({
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
          reportingPeriod: 'Nov 2024'
        });
      });
    });
    setTasks(prev => [...autoTasks, ...prev]);
    notifyAdmins('success', `New brand pipeline provisioned: ${brandName}`);
  };

  const handleUpdateBrand = (brandId: string, updates: Partial<Brand>) => {
    const oldBrand = brands.find(b => b.id === brandId);
    setBrands(prev => prev.map(b => b.id === brandId ? { ...b, ...updates } : b));
    
    // If services were updated, check for new ones to provision tasks
    if (updates.services && oldBrand && currentUser) {
      const newServices = updates.services.filter(s => !oldBrand.services.includes(s));
      if (newServices.length > 0) {
        const autoTasks: StaffTask[] = [];
        newServices.forEach(service => {
          const templates = SERVICE_TEMPLATES[service] || [];
          templates.forEach(tpl => {
            autoTasks.push({
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
              reportingPeriod: 'Nov 2024'
            });
          });
        });
        if (autoTasks.length > 0) {
          setTasks(prev => [...autoTasks, ...prev]);
        }
      }
    }
    
    notifyAdmins('info', `Brand configuration modified: ${brandId}`);
  };

  const handleUpdateUser = (userId: string, updates: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));
    if (currentUser?.id === userId) {
      setCurrentUser(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const handleUpdateTaskStatus = (taskId: string, newStatus: TaskStatus, feedback?: string) => {
    if (!currentUser) return;
    
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const updatedTask = { ...t, status: newStatus };
        if (feedback) {
          updatedTask.comments = [
            {
              id: `c-${Math.random().toString(36).substr(2, 9)}`,
              authorName: currentUser.name,
              authorRole: currentUser.role,
              text: `Status updated to ${newStatus}. Feedback: ${feedback}`,
              timestamp: new Date().toISOString()
            },
            ...t.comments
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
            ...t.comments
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
            ...t.comments
          ];
        }
        return updatedTask;
      }
      return t;
    }));

    const task = tasks.find(t => t.id === taskId);
    if (task) {
      if (newStatus === 'Pending Approval') {
        notifyAdmins('info', `Deliverable Pending Approval: "${task.taskTitle}" by ${task.staffName}`, taskId);
      } else {
        const owner = tenantUsers.find(u => u.name === task.staffName);
        if (owner && owner.id !== currentUser.id) {
          createNotification(owner.id, newStatus === 'Completed' ? 'success' : 'warning', `Deliverable "${task.taskTitle}" status updated to ${newStatus}`, taskId);
        }
      }
    }
  };

  const markNotifRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleAdminDrillDown = (userId: string) => {
    setSelectedPersonnelId(userId);
    navigateTo('personnel-detail');
  };

  const handleBrandDrillDown = (brandId: string) => {
    setSelectedBrandDetailId(brandId);
    navigateTo('brand-detail');
  };

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
                <span className="hidden sm:block text-[11px] font-black uppercase tracking-[0.2em] text-brand-blue dark:text-brand-cyan">{currentOrg?.name}</span>
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
                {showNotifs && <NotificationsPanel notifications={tenantNotifications} onNotificationClick={(n) => { markNotifRead(n.id); setShowNotifs(false); }} onMarkAllRead={() => setNotifications(prev => prev.map(n => ({...n, read: true})))} onClose={() => setShowNotifs(false)} />}
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
                    <div className="p-4">
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
            users={tenantUsers} 
            brands={tenantBrands}
            services={tenantServices}
            workspace={currentOrg!}
            initialTask={editingTask} 
            onSubmit={handleTaskSubmit} 
            onCancel={() => { setIsAddingTask(false); setEditingTask(null); }} 
          />
        ) : (
          <>
            {view === 'board' && <TaskBoard tasks={visibleTasks} users={tenantUsers} brands={tenantBrands} workspace={currentOrg!} currentUser={currentUser!} onEditTask={setEditingTask} onAddComment={handleAddComment} onUpdateTaskStatus={handleUpdateTaskStatus} />}
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
            {view === 'squad' && isAdminOrLead && <MentorshipHub users={tenantUsers} tasks={tenantTasks} currentUser={currentUser!} onClaimMentee={(id, leadId) => setUsers(prev => prev.map(u => u.id === id ? { ...u, mentorId: leadId || currentUser.id } : u))} />}
            {view === 'analysis' && isAdminOrLead && (loading ? <div className="py-20 text-center font-black animate-pulse text-slate-400 uppercase tracking-widest">Synthesizing intelligence logs...</div> : summary && <Dashboard summary={summary} users={tenantUsers} />)}
            {view === 'users' && isAdminOrLead && <AdminUserManagement users={visibleUsers} currentUser={currentUser!} onUpdateUser={(id, updates) => setUsers(prev => prev.map(u => u.id === id ? {...u, ...updates} : u))} onDeleteUser={handleDeleteUser} onDrillDown={handleAdminDrillDown} />}
            {view === 'personnel-detail' && selectedPersonnelId && isAdminOrLead && (
              <PersonnelProtocolView 
                userId={selectedPersonnelId} 
                users={tenantUsers} 
                tasks={tenantTasks} 
                onBack={() => setView('users')}
                onAddComment={handleAddComment}
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
