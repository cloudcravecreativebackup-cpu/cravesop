import { supabase } from '../lib/supabase';
import { Organization, User, Brand, StaffTask, Service, ContentCalendar, Notification } from '../types';

export const supabaseService = {
  // Organizations
  async getOrganizations(): Promise<Organization[]> {
    const { data, error } = await supabase.from('organizations').select('*');
    if (error) throw error;
    return data || [];
  },
  async saveOrganization(org: Organization) {
    const { error } = await supabase.from('organizations').upsert({
      id: org.id,
      name: org.name,
      slug: org.slug,
      created_at: org.createdAt,
      tenant_id: org.tenantId,
      config: org.config
    });
    if (error) throw error;
  },

  // Users
  async getUsers(): Promise<User[]> {
    const { data, error } = await supabase.from('users').select('*');
    if (error) throw error;
    return (data || []).map(u => ({
      ...u,
      createdAt: u.created_at,
      orgId: u.org_id,
      registrationStatus: u.registration_status,
      mentorId: u.mentor_id,
      weeklyCapacityHours: u.weekly_capacity_hours
    }));
  },
  async saveUser(user: User) {
    const { error } = await supabase.from('users').upsert({
      id: user.id,
      org_id: user.orgId,
      name: user.name,
      email: user.email,
      role: user.role,
      registration_status: user.registrationStatus,
      mentor_id: user.mentorId,
      avatar: user.avatar,
      weekly_capacity_hours: user.weeklyCapacityHours,
      password: user.password
    });
    if (error) throw error;
  },
  async deleteUser(userId: string) {
    const { error } = await supabase.from('users').delete().eq('id', userId);
    if (error) throw error;
  },

  // Brands
  async getBrands(): Promise<Brand[]> {
    const { data, error } = await supabase.from('brands').select('*');
    if (error) throw error;
    return (data || []).map(b => ({
      ...b,
      orgId: b.org_id,
      leadId: b.lead_id
    }));
  },
  async saveBrand(brand: Brand) {
    const { error } = await supabase.from('brands').upsert({
      id: brand.id,
      org_id: brand.orgId,
      name: brand.name,
      services: brand.services,
      lead_id: brand.leadId
    });
    if (error) throw error;
  },

  // Tasks
  async getTasks(): Promise<StaffTask[]> {
    const { data, error } = await supabase.from('tasks').select('*');
    if (error) throw error;
    return (data || []).map(t => ({
      ...t,
      orgId: t.org_id,
      brandId: t.brand_id,
      serviceType: t.service_type,
      taskTitle: t.task_title,
      taskDescription: t.task_description,
      dueDate: t.due_date,
      progressUpdate: t.progress_update,
      estimatedHours: t.estimated_hours,
      hoursSpent: t.hours_spent,
      reportingPeriod: t.reporting_period,
      relatedCalendarId: t.related_calendar_id,
      relatedCalendarEntryId: t.related_calendar_entry_id
    }));
  },
  async saveTask(task: StaffTask) {
    const { error } = await supabase.from('tasks').upsert({
      id: task.id,
      org_id: task.orgId,
      brand_id: task.brandId,
      service_type: task.serviceType,
      staff_name: task.staffName,
      assigned_by: task.assignedBy,
      task_title: task.taskTitle,
      task_description: task.taskDescription,
      category: task.category,
      type: task.type,
      frequency: task.frequency,
      status: task.status,
      due_date: task.dueDate,
      progress_update: task.progressUpdate,
      estimated_hours: task.estimatedHours,
      hours_spent: task.hoursSpent,
      comments: task.comments,
      time_entries: task.timeEntries,
      reporting_period: task.reportingPeriod,
      related_calendar_id: task.relatedCalendarId,
      related_calendar_entry_id: task.relatedCalendarEntryId
    });
    if (error) throw error;
  },

  // Services
  async getServices(): Promise<Service[]> {
    const { data, error } = await supabase.from('services').select('*');
    if (error) throw error;
    return (data || []).map(s => ({
      ...s,
      orgId: s.org_id
    }));
  },
  async saveService(service: Service) {
    const { error } = await supabase.from('services').upsert({
      id: service.id,
      org_id: service.orgId,
      name: service.name,
      description: service.description,
      templates: service.templates
    });
    if (error) throw error;
  },
  async deleteService(id: string) {
    const { error } = await supabase.from('services').delete().eq('id', id);
    if (error) throw error;
  },

  // Calendars
  async getCalendars(): Promise<ContentCalendar[]> {
    const { data, error } = await supabase.from('content_calendars').select('*');
    if (error) throw error;
    return (data || []).map(c => ({
      ...c,
      orgId: c.org_id,
      brandId: c.brand_id,
      createdAt: c.created_at,
      leadId: c.lead_id
    }));
  },
  async saveCalendar(calendar: ContentCalendar) {
    const { error } = await supabase.from('content_calendars').upsert({
      id: calendar.id,
      org_id: calendar.orgId,
      brand_id: calendar.brandId,
      name: calendar.name,
      entries: calendar.entries,
      created_at: calendar.createdAt,
      lead_id: calendar.leadId
    });
    if (error) throw error;
  },

  // Notifications
  async getNotifications(): Promise<Notification[]> {
    const { data, error } = await supabase.from('notifications').select('*');
    if (error) throw error;
    return (data || []).map(n => ({
      ...n,
      orgId: n.org_id,
      userId: n.user_id,
      relatedTaskId: n.related_task_id,
      relatedUserId: n.related_user_id
    }));
  },
  async saveNotification(notif: Notification) {
    const { error } = await supabase.from('notifications').upsert({
      id: notif.id,
      org_id: notif.orgId,
      user_id: notif.userId,
      type: notif.type,
      message: notif.message,
      read: notif.read,
      timestamp: notif.timestamp,
      related_task_id: notif.relatedTaskId,
      related_user_id: notif.relatedUserId
    });
    if (error) throw error;
  },

  // Real-time Subscriptions
  subscribeToChanges(table: string, callback: (payload: any) => void) {
    return supabase
      .channel(`public:${table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, callback)
      .subscribe();
  },

  async resetAllData() {
    // Delete in order to respect potential foreign keys (though Supabase RLS/FKs might vary)
    const tables = ['notifications', 'tasks', 'content_calendars', 'brands', 'services', 'users', 'organizations'];
    for (const table of tables) {
      const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
      if (error) console.error(`Error clearing ${table}:`, error);
    }
  }
};
