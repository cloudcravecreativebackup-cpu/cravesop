
export type ServiceType = string;
export type TaskCategory = 
  | 'Profile Optimisation' 
  | 'Highlight Optimisation' 
  | 'Content Optimisation' 
  | 'Engagement Optimisation' 
  | 'Insights & Reporting' 
  | 'Cloud Infrastructure' 
  | 'Software Development'
  | 'Technical Support'
  | 'Strategic Planning'
  | 'Asset Management'
  | 'Quality Assurance'
  | 'Internal Deliverable';

export type TaskType = 'One-time' | 'Recurring';
export type TaskStatus = 'Not Started' | 'In Progress' | 'Completed' | 'Blocked' | 'Pending Approval' | 'Rejected';
export type Frequency = 'Daily' | 'Weekly' | 'Monthly' | 'N/A';
export type UserRole = 'Admin' | 'Staff Lead' | 'Staff Member' | 'Mentee';
export type RegistrationStatus = 'pending' | 'approved';
export type ContentPlatform = 'Instagram' | 'Facebook' | 'LinkedIn' | 'TikTok';
export type ContentType = 'Static' | 'Carousel' | 'Reel' | 'Short Video';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  tenantId: string;
  config: {
    clientTerminology: string; // e.g., 'Brand', 'Account', 'Project'
    clientTerminologyPlural: string; // e.g., 'Brands', 'Accounts', 'Projects'
    logoUrl?: string;
    primaryColor?: string;
  };
}

export interface Service {
  id: string;
  orgId: string;
  name: string;
  description?: string;
  templates: { 
    taskTitle: string; 
    category: TaskCategory; 
    type: TaskType; 
    frequency: Frequency; 
  }[];
}

export interface Brand {
  id: string;
  orgId: string;
  name: string;
  services: ServiceType[];
  leadId?: string; // Scoping brand to a specific lead's team
}

export interface CalendarEntry {
  id: string;
  date: string;
  platforms: ContentPlatform[];
  contentType: ContentType;
  topic: string;
  caption: string;
  visualRef: string;
  assignedToId: string; // User ID
}

export interface ContentCalendar {
  id: string;
  orgId: string;
  brandId: string;
  name: string; // e.g., "Nov 2024 Strategy"
  entries: CalendarEntry[];
  createdAt: string;
  leadId?: string;
}

export interface User {
  id: string;
  orgId: string;
  name: string;
  email: string;
  role: UserRole;
  registrationStatus: RegistrationStatus;
  mentorId?: string;
  avatar?: string; 
  weeklyCapacityHours?: number;
  password?: string;
}

export interface TaskComment {
  id: string;
  authorName: string;
  authorRole: UserRole;
  text: string;
  timestamp: string;
}

export interface TimeEntry {
  id: string;
  userId: string;
  date: string;
  durationMinutes: number;
}

export interface StaffTask {
  id: string;
  orgId: string;
  brandId: string;
  serviceType: ServiceType;
  staffName: string; 
  assignedBy: string;
  taskTitle: string;
  taskDescription: string;
  category: TaskCategory;
  type: TaskType;
  frequency: Frequency;
  status: TaskStatus;
  dueDate: string;
  progressUpdate: string;
  estimatedHours: number;
  hoursSpent: number;
  comments: TaskComment[];
  timeEntries?: TimeEntry[];
  reportingPeriod: string;
  relatedCalendarId?: string;
  relatedCalendarEntryId?: string;
}

export interface Notification {
  id: string;
  orgId: string;
  userId: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  message: string;
  read: boolean;
  timestamp: string;
  relatedTaskId?: string;
  relatedUserId?: string;
}

export interface ManagementSummary {
  executiveSummary: string;
  staffWorkload: {
    staffName: string;
    oneTimeTasks: string[];
    recurringTasks: string[];
    trainingTasks: string[];
    currentlyWorkingOn: string;
    unresolvedItems: string[];
    totalHours: number;
    effortByFrequency: {
      daily: number;
      weekly: number;
      monthly: number;
      oneTime: number;
    };
  }[];
  recurringTaskOverview: string;
  trainingOverview: string;
  blockersAndRisks: {
    taskTitle: string;
    owner: string;
    reason: string;
  }[];
  analytics: {
    totalTasks: number;
    blockedCount: number;
    overdueCount: number;
    completionPercentage: number;
    totalHoursLogged: number;
    cadenceBreakdown: {
      dailyTotal: number;
      weeklyTotal: number;
      monthlyTotal: number;
      oneTimeTotal: number;
    };
  };
}
