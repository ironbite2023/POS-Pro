import { supabase } from '@/lib/supabase/client';
import { Database } from '@/lib/supabase/database.types';

type WasteLog = Database['public']['Tables']['waste_logs']['Row'];
type WasteLogInsert = Database['public']['Tables']['waste_logs']['Insert'];

export interface WasteStats {
  totalWasteValue: number;
  totalWasteItems: number;
  topWasteReasons: Array<{ reason: string; count: number; value: number }>;
  wasteByCategory: Array<{ category: string; value: number }>;
  monthlyTrend: Array<{ month: string; value: number }>;
}

export interface WasteAnalytics {
  totalCost: number;
  totalQuantity: number;
  averageDailyCost: number;
  topWastedItems: Array<{ item: string; quantity: number; cost: number }>;
  wasteByReason: Array<{ reason: string; percentage: number }>;
}

export const wasteService = {
  /**
   * Get all waste logs for an organization
   */
  getWasteLogs: async (organizationId: string, branchId?: string): Promise<WasteLog[]> => {
    let query = supabase
      .from('waste_logs')
      .select('*')
      .eq('organization_id', organizationId)
      .order('logged_at', { ascending: false });
    
    if (branchId) {
      query = query.eq('branch_id', branchId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  /**
   * Create a new waste log entry
   */
  createWasteLog: async (wasteLog: WasteLogInsert): Promise<WasteLog> => {
    const { data, error } = await supabase
      .from('waste_logs')
      .insert(wasteLog)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update a waste log entry
   */
  updateWasteLog: async (wasteLogId: string, updates: Partial<WasteLog>): Promise<WasteLog> => {
    const { data, error } = await supabase
      .from('waste_logs')
      .update(updates)
      .eq('id', wasteLogId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete a waste log entry
   */
  deleteWasteLog: async (wasteLogId: string): Promise<void> => {
    const { error } = await supabase
      .from('waste_logs')
      .delete()
      .eq('id', wasteLogId);

    if (error) throw error;
  },

  /**
   * Get waste statistics for an organization
   */
  getWasteStats: async (organizationId: string, branchId?: string): Promise<WasteStats> => {
    let query = supabase
      .from('waste_logs')
      .select('*')
      .eq('organization_id', organizationId);
    
    if (branchId) {
      query = query.eq('branch_id', branchId);
    }

    const { data, error } = await query;
    if (error) throw error;

    const wasteLogs = data || [];
    const totalWasteValue = wasteLogs.reduce((sum, log) => sum + (log.cost_impact || 0), 0);
    const totalWasteItems = wasteLogs.length;

    // Group by reason
    const reasonMap = new Map<string, { count: number; value: number }>();
    wasteLogs.forEach(log => {
      const reason = log.reason || 'Unknown';
      const existing = reasonMap.get(reason) || { count: 0, value: 0 };
      reasonMap.set(reason, {
        count: existing.count + 1,
        value: existing.value + (log.cost_impact || 0)
      });
    });

    const topWasteReasons = Array.from(reasonMap.entries())
      .map(([reason, stats]) => ({ reason, ...stats }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // Group by category
    const categoryMap = new Map<string, number>();
    wasteLogs.forEach(log => {
      const category = log.category || 'Uncategorized';
      categoryMap.set(category, (categoryMap.get(category) || 0) + (log.cost_impact || 0));
    });

    const wasteByCategory = Array.from(categoryMap.entries())
      .map(([category, value]) => ({ category, value }))
      .sort((a, b) => b.value - a.value);

    // Monthly trend (last 6 months)
    const monthlyTrend = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      
      const monthWaste = wasteLogs.filter(log => {
        const logDate = new Date(log.logged_at || log.id);
        return logDate >= month && logDate < nextMonth;
      });
      
      monthlyTrend.push({
        month: month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        value: monthWaste.reduce((sum, log) => sum + (log.cost_impact || 0), 0)
      });
    }

    return {
      totalWasteValue,
      totalWasteItems,
      topWasteReasons,
      wasteByCategory,
      monthlyTrend
    };
  },

  /**
   * Get waste analytics with cost analysis
   */
  getWasteAnalytics: async (
    organizationId: string,
    startDate: Date,
    endDate: Date,
    branchId?: string
  ): Promise<WasteAnalytics> => {
    let query = supabase
      .from('waste_logs')
      .select('*')
      .eq('organization_id', organizationId)
      .gte('logged_at', startDate.toISOString())
      .lte('logged_at', endDate.toISOString());
    
    if (branchId) {
      query = query.eq('branch_id', branchId);
    }

    const { data, error } = await query;
    if (error) throw error;

    const wasteLogs = data || [];
    const totalCost = wasteLogs.reduce((sum, log) => sum + (log.cost_impact || 0), 0);
    const totalQuantity = wasteLogs.reduce((sum, log) => sum + (log.quantity || 0), 0);
    
    // Calculate average daily cost
    const daysDiff = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)));
    const averageDailyCost = totalCost / daysDiff;

    // Top wasted items
    const itemMap = new Map<string, { quantity: number; cost: number }>();
    wasteLogs.forEach(log => {
      const item = log.item_name;
      const existing = itemMap.get(item) || { quantity: 0, cost: 0 };
      itemMap.set(item, {
        quantity: existing.quantity + (log.quantity || 0),
        cost: existing.cost + (log.cost_impact || 0)
      });
    });

    const topWastedItems = Array.from(itemMap.entries())
      .map(([item, stats]) => ({ item, ...stats }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 10);

    // Waste by reason
    const reasonCounts = new Map<string, number>();
    wasteLogs.forEach(log => {
      const reason = log.reason || 'Unknown';
      reasonCounts.set(reason, (reasonCounts.get(reason) || 0) + 1);
    });

    const totalReasons = wasteLogs.length;
    const wasteByReason = Array.from(reasonCounts.entries())
      .map(([reason, count]) => ({ 
        reason, 
        percentage: totalReasons > 0 ? (count / totalReasons) * 100 : 0 
      }))
      .sort((a, b) => b.percentage - a.percentage);

    return {
      totalCost,
      totalQuantity,
      averageDailyCost,
      topWastedItems,
      wasteByReason
    };
  }
};
