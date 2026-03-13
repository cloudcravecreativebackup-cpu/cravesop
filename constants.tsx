
import { StaffTask, User, Organization, Brand, Service } from './types';

export const ORGS: Organization[] = [
  { 
    id: 'org-cloudcrave', 
    name: 'CloudCrave Solutions', 
    slug: 'cloudcrave', 
    createdAt: '2024-11-20T00:00:00Z',
    tenantId: 'tenant-cc-001',
    config: {
      clientTerminology: 'Brand',
      clientTerminologyPlural: 'Brands'
    }
  }
];

export const DEFAULT_SERVICES: Service[] = [
  {
    id: 's-smm',
    orgId: 'org-cloudcrave',
    name: 'Social Media Management',
    templates: [
      { taskTitle: 'Initial Profile Audit', category: 'Profile Optimisation', type: 'One-time', frequency: 'N/A' },
      { taskTitle: 'Weekly Content Planning', category: 'Content Optimisation', type: 'Recurring', frequency: 'Weekly' },
      { taskTitle: 'Daily Engagement Monitor', category: 'Engagement Optimisation', type: 'Recurring', frequency: 'Daily' }
    ]
  },
  {
    id: 's-cloud',
    orgId: 'org-cloudcrave',
    name: 'Cloud Support',
    templates: [
      { taskTitle: 'Security Patch Audit', category: 'Cloud Infrastructure', type: 'Recurring', frequency: 'Monthly' },
      { taskTitle: 'Resource Optimization Check', category: 'Cloud Infrastructure', type: 'Recurring', frequency: 'Weekly' }
    ]
  },
  {
    id: 's-digital',
    orgId: 'org-cloudcrave',
    name: 'Digital Solutions',
    templates: [
      { taskTitle: 'Frontend Component Audit', category: 'Software Development', type: 'One-time', frequency: 'N/A' },
      { taskTitle: 'Sprint Backlog Review', category: 'Software Development', type: 'Recurring', frequency: 'Weekly' }
    ]
  },
  {
    id: 's-ops',
    orgId: 'org-cloudcrave',
    name: 'General Operations',
    templates: [
      { taskTitle: 'Standard Operating Procedure Review', category: 'Internal Deliverable', type: 'Recurring', frequency: 'Monthly' }
    ]
  },
  {
    id: 's-training',
    orgId: 'org-cloudcrave',
    name: 'Switch2Tech Training',
    templates: [
      { taskTitle: 'Curriculum Review', category: 'Strategic Planning', type: 'Recurring', frequency: 'Monthly' },
      { taskTitle: 'Instructor Onboarding', category: 'Internal Deliverable', type: 'One-time', frequency: 'N/A' },
      { taskTitle: 'Class Schedule Management', category: 'Internal Deliverable', type: 'Recurring', frequency: 'Weekly' }
    ]
  }
];

export const BRANDS: Brand[] = [
  { id: 'b-cc-001', orgId: 'org-cloudcrave', name: 'CloudCrave Internal', services: ['General Operations'] },
  { id: 'b-cc-002', orgId: 'org-cloudcrave', name: 'Switch2Tech', services: ['Switch2Tech Training', 'Digital Solutions'] }
];

export const USERS: User[] = [
  { 
    id: 'u-root', 
    orgId: 'org-cloudcrave', 
    name: 'System Root', 
    email: 'support@cloudcraves.com', 
    password: 'admin', 
    role: 'Admin', 
    registrationStatus: 'approved' 
  }
];

export const MOCK_TASKS: StaffTask[] = [];
