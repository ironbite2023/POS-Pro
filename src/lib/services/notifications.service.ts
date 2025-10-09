import { supabase } from '@/lib/supabase/client';
import { Database } from '@/lib/supabase/database.types';

type Notification = Database['public']['Tables']['notifications']['Row'];
type NotificationInsert = Database['public']['Tables']['notifications']['Insert'];

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<string, number>;
}

export interface CreateNotificationData {
  title: string;
  message: string;
  type: string;
  userId?: string;
  actionUrl?: string;
}

export const notificationsService = {
  /**
   * Get notifications for a user or organization
   */
  getNotifications: async (
    organizationId: string, 
    userId?: string,
    limit = 50
  ): Promise<Notification[]> => {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (userId) {
      query = query.or(`user_id.eq.${userId},user_id.is.null`);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  /**
   * Get unread notification count
   */
  getUnreadCount: async (organizationId: string, userId?: string): Promise<number> => {
    let query = supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('is_read', false);
    
    if (userId) {
      query = query.or(`user_id.eq.${userId},user_id.is.null`);
    }
    
    const { count, error } = await query;
    if (error) throw error;
    return count || 0;
  },

  /**
   * Create a new notification
   */
  createNotification: async (
    organizationId: string,
    notificationData: CreateNotificationData
  ): Promise<Notification> => {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        organization_id: organizationId,
        user_id: notificationData.userId || null,
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type,
        action_url: notificationData.actionUrl || null,
        is_read: false
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Mark notification as read
   */
  markAsRead: async (notificationId: string): Promise<void> => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) throw error;
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async (organizationId: string, userId?: string): Promise<void> => {
    let query = supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('organization_id', organizationId);
    
    if (userId) {
      query = query.or(`user_id.eq.${userId},user_id.is.null`);
    }

    const { error } = await query;
    if (error) throw error;
  },

  /**
   * Delete notification
   */
  deleteNotification: async (notificationId: string): Promise<void> => {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) throw error;
  },

  /**
   * Get notification statistics
   */
  getStats: async (organizationId: string, userId?: string): Promise<NotificationStats> => {
    let query = supabase
      .from('notifications')
      .select('type, is_read')
      .eq('organization_id', organizationId);
    
    if (userId) {
      query = query.or(`user_id.eq.${userId},user_id.is.null`);
    }

    const { data, error } = await query;
    if (error) throw error;

    const notifications = data || [];
    const total = notifications.length;
    const unread = notifications.filter(n => !n.is_read).length;
    
    const byType: Record<string, number> = {};
    notifications.forEach(notification => {
      const type = notification.type || 'info';
      byType[type] = (byType[type] || 0) + 1;
    });

    return {
      total,
      unread,
      byType
    };
  }
};
