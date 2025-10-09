export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          organization_id: string
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          organization_id: string
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          organization_id?: string
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          details: Json | null
          event_type: string
          id: string
          ip_address: unknown | null
          organization_id: string | null
          resource: string | null
          risk_level: string
          session_id: string | null
          success: boolean
          timestamp: string
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          details?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          organization_id?: string | null
          resource?: string | null
          risk_level: string
          session_id?: string | null
          success?: boolean
          timestamp?: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          details?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
          organization_id?: string | null
          resource?: string | null
          risk_level?: string
          session_id?: string | null
          success?: boolean
          timestamp?: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      branch_inventory: {
        Row: {
          branch_id: string
          created_at: string | null
          current_quantity: number | null
          id: string
          inventory_item_id: string
          last_counted_at: string | null
          last_restocked_at: string | null
          max_capacity: number | null
          organization_id: string
          reorder_point: number | null
          reserved_quantity: number | null
          updated_at: string | null
        }
        Insert: {
          branch_id: string
          created_at?: string | null
          current_quantity?: number | null
          id?: string
          inventory_item_id: string
          last_counted_at?: string | null
          last_restocked_at?: string | null
          max_capacity?: number | null
          organization_id: string
          reorder_point?: number | null
          reserved_quantity?: number | null
          updated_at?: string | null
        }
        Update: {
          branch_id?: string
          created_at?: string | null
          current_quantity?: number | null
          id?: string
          inventory_item_id?: string
          last_counted_at?: string | null
          last_restocked_at?: string | null
          max_capacity?: number | null
          organization_id?: string
          reorder_point?: number | null
          reserved_quantity?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "branch_inventory_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branch_inventory_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branch_inventory_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          address: Json
          business_hours: Json | null
          code: string
          created_at: string | null
          email: string | null
          id: string
          name: string
          organization_id: string
          phone: string | null
          region: string | null
          services: Json | null
          settings: Json | null
          status: string | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          address: Json
          business_hours?: Json | null
          code: string
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          organization_id: string
          phone?: string | null
          region?: string | null
          services?: Json | null
          settings?: Json | null
          status?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: Json
          business_hours?: Json | null
          code?: string
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          organization_id?: string
          phone?: string | null
          region?: string | null
          services?: Json | null
          settings?: Json | null
          status?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "branches_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_sales_summary: {
        Row: {
          avg_order_value: number | null
          branch_id: string
          card_payments: number | null
          cash_payments: number | null
          created_at: string | null
          delivery_orders: number | null
          dine_in_orders: number | null
          id: string
          organization_id: string
          summary_date: string
          takeout_orders: number | null
          total_orders: number | null
          total_revenue: number | null
          total_tax: number | null
          total_tips: number | null
        }
        Insert: {
          avg_order_value?: number | null
          branch_id: string
          card_payments?: number | null
          cash_payments?: number | null
          created_at?: string | null
          delivery_orders?: number | null
          dine_in_orders?: number | null
          id?: string
          organization_id: string
          summary_date: string
          takeout_orders?: number | null
          total_orders?: number | null
          total_revenue?: number | null
          total_tax?: number | null
          total_tips?: number | null
        }
        Update: {
          avg_order_value?: number | null
          branch_id?: string
          card_payments?: number | null
          cash_payments?: number | null
          created_at?: string | null
          delivery_orders?: number | null
          dine_in_orders?: number | null
          id?: string
          organization_id?: string
          summary_date?: string
          takeout_orders?: number | null
          total_orders?: number | null
          total_revenue?: number | null
          total_tax?: number | null
          total_tips?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_sales_summary_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_sales_summary_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      index_optimization_audit: {
        Row: {
          audit_date: string | null
          created_at: string | null
          id: number
          index_name: string
          index_size: string | null
          is_redundant: boolean | null
          performance_impact: string | null
          removal_decision: string | null
          scan_count: number | null
          schema_name: string
          table_name: string
          tup_fetch: number | null
          tup_read: number | null
        }
        Insert: {
          audit_date?: string | null
          created_at?: string | null
          id?: number
          index_name: string
          index_size?: string | null
          is_redundant?: boolean | null
          performance_impact?: string | null
          removal_decision?: string | null
          scan_count?: number | null
          schema_name: string
          table_name: string
          tup_fetch?: number | null
          tup_read?: number | null
        }
        Update: {
          audit_date?: string | null
          created_at?: string | null
          id?: number
          index_name?: string
          index_size?: string | null
          is_redundant?: boolean | null
          performance_impact?: string | null
          removal_decision?: string | null
          scan_count?: number | null
          schema_name?: string
          table_name?: string
          tup_fetch?: number | null
          tup_read?: number | null
        }
        Relationships: []
      }
      inventory_categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          organization_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          organization_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          barcode: string | null
          category_id: string | null
          cost_per_unit: number | null
          created_at: string | null
          default_shelf_life_days: number | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          organization_id: string
          recipe_unit_id: string | null
          sku: string | null
          storage_unit_id: string | null
          track_expiration: boolean | null
          unit_conversion_factor: number | null
          updated_at: string | null
        }
        Insert: {
          barcode?: string | null
          category_id?: string | null
          cost_per_unit?: number | null
          created_at?: string | null
          default_shelf_life_days?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          organization_id: string
          recipe_unit_id?: string | null
          sku?: string | null
          storage_unit_id?: string | null
          track_expiration?: boolean | null
          unit_conversion_factor?: number | null
          updated_at?: string | null
        }
        Update: {
          barcode?: string | null
          category_id?: string | null
          cost_per_unit?: number | null
          created_at?: string | null
          default_shelf_life_days?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string
          recipe_unit_id?: string | null
          sku?: string | null
          storage_unit_id?: string | null
          track_expiration?: boolean | null
          unit_conversion_factor?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "inventory_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_recipe_unit_id_fkey"
            columns: ["recipe_unit_id"]
            isOneToOne: false
            referencedRelation: "units_of_measure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_storage_unit_id_fkey"
            columns: ["storage_unit_id"]
            isOneToOne: false
            referencedRelation: "units_of_measure"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          batch_number: string | null
          branch_id: string
          created_at: string | null
          expiration_date: string | null
          id: string
          inventory_item_id: string
          movement_type: string
          notes: string | null
          organization_id: string
          quantity: number
          reference_id: string | null
          reference_type: string | null
          unit_cost: number | null
          user_id: string | null
        }
        Insert: {
          batch_number?: string | null
          branch_id: string
          created_at?: string | null
          expiration_date?: string | null
          id?: string
          inventory_item_id: string
          movement_type: string
          notes?: string | null
          organization_id: string
          quantity: number
          reference_id?: string | null
          reference_type?: string | null
          unit_cost?: number | null
          user_id?: string | null
        }
        Update: {
          batch_number?: string | null
          branch_id?: string
          created_at?: string | null
          expiration_date?: string | null
          id?: string
          inventory_item_id?: string
          movement_type?: string
          notes?: string | null
          organization_id?: string
          quantity?: number
          reference_id?: string | null
          reference_type?: string | null
          unit_cost?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_members: {
        Row: {
          created_at: string | null
          current_points: number | null
          date_of_birth: string | null
          email: string | null
          first_name: string | null
          id: string
          joined_at: string | null
          last_activity: string | null
          last_name: string | null
          lifetime_points: number | null
          member_number: string
          organization_id: string
          phone: string | null
          status: string | null
          tier_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_points?: number | null
          date_of_birth?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          joined_at?: string | null
          last_activity?: string | null
          last_name?: string | null
          lifetime_points?: number | null
          member_number: string
          organization_id: string
          phone?: string | null
          status?: string | null
          tier_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_points?: number | null
          date_of_birth?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          joined_at?: string | null
          last_activity?: string | null
          last_name?: string | null
          lifetime_points?: number | null
          member_number?: string
          organization_id?: string
          phone?: string | null
          status?: string | null
          tier_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_members_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "loyalty_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_rewards: {
        Row: {
          created_at: string | null
          description: string | null
          discount_amount: number | null
          discount_percentage: number | null
          free_item_id: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          max_redemptions: number | null
          name: string
          organization_id: string
          points_required: number | null
          redemption_count: number | null
          reward_type: string | null
          updated_at: string | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          free_item_id?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          max_redemptions?: number | null
          name: string
          organization_id: string
          points_required?: number | null
          redemption_count?: number | null
          reward_type?: string | null
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          free_item_id?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          max_redemptions?: number | null
          name?: string
          organization_id?: string
          points_required?: number | null
          redemption_count?: number | null
          reward_type?: string | null
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_rewards_free_item_id_fkey"
            columns: ["free_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_rewards_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_tiers: {
        Row: {
          benefits: Json | null
          created_at: string | null
          id: string
          min_points: number
          name: string
          organization_id: string
          tier_color: string | null
          updated_at: string | null
        }
        Insert: {
          benefits?: Json | null
          created_at?: string | null
          id?: string
          min_points: number
          name: string
          organization_id: string
          tier_color?: string | null
          updated_at?: string | null
        }
        Update: {
          benefits?: Json | null
          created_at?: string | null
          id?: string
          min_points?: number
          name?: string
          organization_id?: string
          tier_color?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_tiers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_transactions: {
        Row: {
          branch_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          member_id: string
          order_id: string | null
          organization_id: string
          points: number
          transaction_type: string
        }
        Insert: {
          branch_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          member_id: string
          order_id?: string | null
          organization_id: string
          points: number
          transaction_type: string
        }
        Update: {
          branch_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          member_id?: string
          order_id?: string | null
          organization_id?: string
          points?: number
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_transactions_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_transactions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "loyalty_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_transactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          organization_id: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          organization_id: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "menu_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_item_branch_availability: {
        Row: {
          available_days: Json | null
          branch_id: string
          created_at: string | null
          created_by: string | null
          daily_limit: number | null
          end_date: string | null
          end_time: string | null
          id: string
          is_available: boolean | null
          menu_item_id: string
          metadata: Json | null
          notes: string | null
          organization_id: string
          price_override: number | null
          start_date: string | null
          start_time: string | null
          stock_quantity: number | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          available_days?: Json | null
          branch_id: string
          created_at?: string | null
          created_by?: string | null
          daily_limit?: number | null
          end_date?: string | null
          end_time?: string | null
          id?: string
          is_available?: boolean | null
          menu_item_id: string
          metadata?: Json | null
          notes?: string | null
          organization_id: string
          price_override?: number | null
          start_date?: string | null
          start_time?: string | null
          stock_quantity?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          available_days?: Json | null
          branch_id?: string
          created_at?: string | null
          created_by?: string | null
          daily_limit?: number | null
          end_date?: string | null
          end_time?: string | null
          id?: string
          is_available?: boolean | null
          menu_item_id?: string
          metadata?: Json | null
          notes?: string | null
          organization_id?: string
          price_override?: number | null
          start_date?: string | null
          start_time?: string | null
          stock_quantity?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "menu_item_branch_availability_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_item_branch_availability_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_item_branch_availability_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_item_branch_availability_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_item_branch_availability_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_item_branch_overrides: {
        Row: {
          branch_id: string
          created_at: string | null
          id: string
          is_available: boolean | null
          menu_item_id: string
          organization_id: string
          price_override: number | null
          updated_at: string | null
        }
        Insert: {
          branch_id: string
          created_at?: string | null
          id?: string
          is_available?: boolean | null
          menu_item_id: string
          organization_id: string
          price_override?: number | null
          updated_at?: string | null
        }
        Update: {
          branch_id?: string
          created_at?: string | null
          id?: string
          is_available?: boolean | null
          menu_item_id?: string
          organization_id?: string
          price_override?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "menu_item_branch_overrides_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_item_branch_overrides_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_item_branch_overrides_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_item_modifier_groups: {
        Row: {
          available_branches: Json | null
          created_at: string | null
          created_by: string | null
          display_order: number | null
          id: string
          is_required: boolean | null
          max_selections: number | null
          menu_item_id: string
          min_selections: number | null
          modifier_group_id: string
          organization_id: string
        }
        Insert: {
          available_branches?: Json | null
          created_at?: string | null
          created_by?: string | null
          display_order?: number | null
          id?: string
          is_required?: boolean | null
          max_selections?: number | null
          menu_item_id: string
          min_selections?: number | null
          modifier_group_id: string
          organization_id: string
        }
        Update: {
          available_branches?: Json | null
          created_at?: string | null
          created_by?: string | null
          display_order?: number | null
          id?: string
          is_required?: boolean | null
          max_selections?: number | null
          menu_item_id?: string
          min_selections?: number | null
          modifier_group_id?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_item_modifier_groups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_item_modifier_groups_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_item_modifier_groups_modifier_group_id_fkey"
            columns: ["modifier_group_id"]
            isOneToOne: false
            referencedRelation: "menu_modifier_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_item_modifier_groups_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          allergen_info: string[] | null
          base_price: number
          category_id: string | null
          created_at: string | null
          description: string | null
          dietary_labels: string[] | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_seasonal: boolean | null
          name: string
          organization_id: string
          platform_mappings: Json | null
          popularity_score: number | null
          preparation_time: number | null
          seasonal_end_date: string | null
          seasonal_start_date: string | null
          sku: string | null
          updated_at: string | null
        }
        Insert: {
          allergen_info?: string[] | null
          base_price: number
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          dietary_labels?: string[] | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_seasonal?: boolean | null
          name: string
          organization_id: string
          platform_mappings?: Json | null
          popularity_score?: number | null
          preparation_time?: number | null
          seasonal_end_date?: string | null
          seasonal_start_date?: string | null
          sku?: string | null
          updated_at?: string | null
        }
        Update: {
          allergen_info?: string[] | null
          base_price?: number
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          dietary_labels?: string[] | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_seasonal?: boolean | null
          name?: string
          organization_id?: string
          platform_mappings?: Json | null
          popularity_score?: number | null
          preparation_time?: number | null
          seasonal_end_date?: string | null
          seasonal_start_date?: string | null
          sku?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "menu_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_modifier_groups: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          is_required: boolean | null
          max_selections: number | null
          min_selections: number | null
          name: string
          organization_id: string
          selection_type: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          max_selections?: number | null
          min_selections?: number | null
          name: string
          organization_id: string
          selection_type?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          max_selections?: number | null
          min_selections?: number | null
          name?: string
          organization_id?: string
          selection_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "menu_modifier_groups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_modifier_groups_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_modifiers: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          inventory_impact: Json | null
          is_active: boolean | null
          is_default: boolean | null
          metadata: Json | null
          modifier_group_id: string
          name: string
          nutritional_impact: Json | null
          organization_id: string
          price_adjustment: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          inventory_impact?: Json | null
          is_active?: boolean | null
          is_default?: boolean | null
          metadata?: Json | null
          modifier_group_id: string
          name: string
          nutritional_impact?: Json | null
          organization_id: string
          price_adjustment?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          inventory_impact?: Json | null
          is_active?: boolean | null
          is_default?: boolean | null
          metadata?: Json | null
          modifier_group_id?: string
          name?: string
          nutritional_impact?: Json | null
          organization_id?: string
          price_adjustment?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "menu_modifiers_modifier_group_id_fkey"
            columns: ["modifier_group_id"]
            isOneToOne: false
            referencedRelation: "menu_modifier_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_modifiers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          organization_id: string
          title: string
          type: string | null
          user_id: string | null
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          organization_id: string
          title: string
          type?: string | null
          user_id?: string | null
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          organization_id?: string
          title?: string
          type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          item_name: string
          line_total: number
          menu_item_id: string | null
          modifiers: Json | null
          order_id: string
          organization_id: string
          quantity: number
          special_instructions: string | null
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          item_name: string
          line_total: number
          menu_item_id?: string | null
          modifiers?: Json | null
          order_id: string
          organization_id: string
          quantity: number
          special_instructions?: string | null
          unit_price: number
        }
        Update: {
          created_at?: string | null
          id?: string
          item_name?: string
          line_total?: number
          menu_item_id?: string | null
          modifiers?: Json | null
          order_id?: string
          organization_id?: string
          quantity?: number
          special_instructions?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          branch_id: string
          completed_at: string | null
          confirmed_at: string | null
          created_at: string | null
          created_by: string | null
          customer_address: Json | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          delivery_notes: string | null
          delivery_platform: Database["public"]["Enums"]["platform_enum"] | null
          discount_amount: number | null
          id: string
          metadata: Json | null
          order_number: string
          order_type: Database["public"]["Enums"]["order_type"]
          ordered_at: string | null
          organization_id: string
          payment_method: string | null
          payment_reference: string | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          platform_customer_info: Json | null
          platform_integration_id: string | null
          platform_order_id: string | null
          raw_payload: Json | null
          special_instructions: string | null
          status: Database["public"]["Enums"]["order_status"] | null
          subtotal: number
          table_number: string | null
          tax_amount: number | null
          tip_amount: number | null
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          branch_id: string
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_address?: Json | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          delivery_notes?: string | null
          delivery_platform?:
            | Database["public"]["Enums"]["platform_enum"]
            | null
          discount_amount?: number | null
          id?: string
          metadata?: Json | null
          order_number: string
          order_type: Database["public"]["Enums"]["order_type"]
          ordered_at?: string | null
          organization_id: string
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          platform_customer_info?: Json | null
          platform_integration_id?: string | null
          platform_order_id?: string | null
          raw_payload?: Json | null
          special_instructions?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          subtotal: number
          table_number?: string | null
          tax_amount?: number | null
          tip_amount?: number | null
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          branch_id?: string
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_address?: Json | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          delivery_notes?: string | null
          delivery_platform?:
            | Database["public"]["Enums"]["platform_enum"]
            | null
          discount_amount?: number | null
          id?: string
          metadata?: Json | null
          order_number?: string
          order_type?: Database["public"]["Enums"]["order_type"]
          ordered_at?: string | null
          organization_id?: string
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          platform_customer_info?: Json | null
          platform_integration_id?: string | null
          platform_order_id?: string | null
          raw_payload?: Json | null
          special_instructions?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          subtotal?: number
          table_number?: string | null
          tax_amount?: number | null
          tip_amount?: number | null
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_platform_integration_id_fkey"
            columns: ["platform_integration_id"]
            isOneToOne: false
            referencedRelation: "platform_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_settings: {
        Row: {
          created_at: string | null
          id: string
          is_encrypted: boolean | null
          organization_id: string
          setting_key: string
          setting_type: string | null
          setting_value: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_encrypted?: boolean | null
          organization_id: string
          setting_key: string
          setting_type?: string | null
          setting_value?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_encrypted?: boolean | null
          organization_id?: string
          setting_key?: string
          setting_type?: string | null
          setting_value?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          billing_address: Json | null
          billing_email: string | null
          created_at: string | null
          features: Json | null
          id: string
          name: string
          settings: Json | null
          slug: string
          subscription_status: string | null
          subscription_tier: string | null
          updated_at: string | null
        }
        Insert: {
          billing_address?: Json | null
          billing_email?: string | null
          created_at?: string | null
          features?: Json | null
          id?: string
          name: string
          settings?: Json | null
          slug: string
          subscription_status?: string | null
          subscription_tier?: string | null
          updated_at?: string | null
        }
        Update: {
          billing_address?: Json | null
          billing_email?: string | null
          created_at?: string | null
          features?: Json | null
          id?: string
          name?: string
          settings?: Json | null
          slug?: string
          subscription_status?: string | null
          subscription_tier?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      platform_integrations: {
        Row: {
          created_at: string
          credentials: Json
          id: string
          is_active: boolean
          last_sync_at: string | null
          organization_id: string
          platform: Database["public"]["Enums"]["platform_enum"]
          platform_restaurant_id: string
          settings: Json | null
          updated_at: string
          webhook_url: string | null
        }
        Insert: {
          created_at?: string
          credentials: Json
          id?: string
          is_active?: boolean
          last_sync_at?: string | null
          organization_id: string
          platform: Database["public"]["Enums"]["platform_enum"]
          platform_restaurant_id: string
          settings?: Json | null
          updated_at?: string
          webhook_url?: string | null
        }
        Update: {
          created_at?: string
          credentials?: Json
          id?: string
          is_active?: boolean
          last_sync_at?: string | null
          organization_id?: string
          platform?: Database["public"]["Enums"]["platform_enum"]
          platform_restaurant_id?: string
          settings?: Json | null
          updated_at?: string
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_integrations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_order_items: {
        Row: {
          created_at: string | null
          id: string
          inventory_item_id: string | null
          line_total: number
          organization_id: string
          purchase_order_id: string
          quantity_ordered: number
          quantity_received: number | null
          unit_cost: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          inventory_item_id?: string | null
          line_total: number
          organization_id: string
          purchase_order_id: string
          quantity_ordered: number
          quantity_received?: number | null
          unit_cost: number
        }
        Update: {
          created_at?: string | null
          id?: string
          inventory_item_id?: string | null
          line_total?: number
          organization_id?: string
          purchase_order_id?: string
          quantity_ordered?: number
          quantity_received?: number | null
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          branch_id: string
          created_at: string | null
          created_by: string | null
          expected_delivery_date: string | null
          id: string
          notes: string | null
          order_date: string | null
          organization_id: string
          po_number: string
          status: string | null
          supplier_id: string | null
          total_amount: number | null
          updated_at: string | null
        }
        Insert: {
          branch_id: string
          created_at?: string | null
          created_by?: string | null
          expected_delivery_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string | null
          organization_id: string
          po_number: string
          status?: string | null
          supplier_id?: string | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          branch_id?: string
          created_at?: string | null
          created_by?: string | null
          expected_delivery_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string | null
          organization_id?: string
          po_number?: string
          status?: string | null
          supplier_id?: string | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_ingredients: {
        Row: {
          created_at: string | null
          id: string
          inventory_item_id: string
          is_optional: boolean | null
          menu_item_id: string
          organization_id: string
          quantity_needed: number
          unit_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          inventory_item_id: string
          is_optional?: boolean | null
          menu_item_id: string
          organization_id: string
          quantity_needed: number
          unit_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          inventory_item_id?: string
          is_optional?: boolean | null
          menu_item_id?: string
          organization_id?: string
          quantity_needed?: number
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recipe_ingredients_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_ingredients_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_ingredients_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_ingredients_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units_of_measure"
            referencedColumns: ["id"]
          },
        ]
      }
      reward_branch_mappings: {
        Row: {
          branch_id: string
          created_at: string | null
          created_by: string | null
          id: string
          organization_id: string
          reward_id: string
        }
        Insert: {
          branch_id: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          organization_id: string
          reward_id: string
        }
        Update: {
          branch_id?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          organization_id?: string
          reward_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reward_branch_mappings_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reward_branch_mappings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reward_branch_mappings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reward_branch_mappings_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "loyalty_rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      reward_tier_mappings: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          organization_id: string
          reward_id: string
          tier_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          organization_id: string
          reward_id: string
          tier_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          organization_id?: string
          reward_id?: string
          tier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reward_tier_mappings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reward_tier_mappings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reward_tier_mappings_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "loyalty_rewards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reward_tier_mappings_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "loyalty_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          can_create: boolean | null
          can_delete: boolean | null
          can_edit: boolean | null
          can_view: boolean | null
          created_at: string | null
          id: string
          module: string
          role_id: string
          updated_at: string | null
        }
        Insert: {
          can_create?: boolean | null
          can_delete?: boolean | null
          can_edit?: boolean | null
          can_view?: boolean | null
          created_at?: string | null
          id?: string
          module: string
          role_id: string
          updated_at?: string | null
        }
        Update: {
          can_create?: boolean | null
          can_delete?: boolean | null
          can_edit?: boolean | null
          can_view?: boolean | null
          created_at?: string | null
          id?: string
          module?: string
          role_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_system_role: boolean | null
          name: string
          organization_id: string
          permissions: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_system_role?: boolean | null
          name: string
          organization_id: string
          permissions?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_system_role?: boolean | null
          name?: string
          organization_id?: string
          permissions?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_request_items: {
        Row: {
          created_at: string
          id: string
          inventory_item_id: string
          inventory_item_name: string
          notes: string | null
          priority: string
          quantity_approved: number | null
          quantity_delivered: number | null
          quantity_requested: number
          stock_request_id: string
          unit: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          inventory_item_id: string
          inventory_item_name: string
          notes?: string | null
          priority?: string
          quantity_approved?: number | null
          quantity_delivered?: number | null
          quantity_requested: number
          stock_request_id: string
          unit: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          inventory_item_id?: string
          inventory_item_name?: string
          notes?: string | null
          priority?: string
          quantity_approved?: number | null
          quantity_delivered?: number | null
          quantity_requested?: number
          stock_request_id?: string
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_request_items_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_request_items_stock_request_id_fkey"
            columns: ["stock_request_id"]
            isOneToOne: false
            referencedRelation: "stock_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_requests: {
        Row: {
          approved_by: string | null
          approved_date: string | null
          completed_date: string | null
          created_at: string
          destination_branch_id: string
          id: string
          notes: string | null
          organization_id: string
          origin_branch_id: string
          request_date: string
          request_number: string
          requested_by: string | null
          required_date: string | null
          status: string
          total_items: number
          updated_at: string
        }
        Insert: {
          approved_by?: string | null
          approved_date?: string | null
          completed_date?: string | null
          created_at?: string
          destination_branch_id: string
          id?: string
          notes?: string | null
          organization_id: string
          origin_branch_id: string
          request_date?: string
          request_number: string
          requested_by?: string | null
          required_date?: string | null
          status?: string
          total_items?: number
          updated_at?: string
        }
        Update: {
          approved_by?: string | null
          approved_date?: string | null
          completed_date?: string | null
          created_at?: string
          destination_branch_id?: string
          id?: string
          notes?: string | null
          organization_id?: string
          origin_branch_id?: string
          request_date?: string
          request_number?: string
          requested_by?: string | null
          required_date?: string | null
          status?: string
          total_items?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_requests_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_requests_destination_branch_id_fkey"
            columns: ["destination_branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_requests_origin_branch_id_fkey"
            columns: ["origin_branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: Json | null
          contact_name: string | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          organization_id: string
          payment_terms: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: Json | null
          contact_name?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          organization_id: string
          payment_terms?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: Json | null
          contact_name?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string
          payment_terms?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_settings: {
        Row: {
          applies_to_delivery: boolean
          applies_to_dine_in: boolean
          applies_to_takeaway: boolean
          branch_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          organization_id: string
          tax_name: string
          tax_rate: number
          tax_type: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          applies_to_delivery?: boolean
          applies_to_dine_in?: boolean
          applies_to_takeaway?: boolean
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          organization_id: string
          tax_name?: string
          tax_rate: number
          tax_type?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          applies_to_delivery?: boolean
          applies_to_dine_in?: boolean
          applies_to_takeaway?: boolean
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          organization_id?: string
          tax_name?: string
          tax_rate?: number
          tax_type?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tax_settings_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tax_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      units_of_measure: {
        Row: {
          abbreviation: string
          base_unit_conversion: number | null
          created_at: string | null
          id: string
          name: string
          organization_id: string
          unit_type: string
        }
        Insert: {
          abbreviation: string
          base_unit_conversion?: number | null
          created_at?: string | null
          id?: string
          name: string
          organization_id: string
          unit_type: string
        }
        Update: {
          abbreviation?: string
          base_unit_conversion?: number | null
          created_at?: string | null
          id?: string
          name?: string
          organization_id?: string
          unit_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "units_of_measure_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          branch_access: string[] | null
          created_at: string | null
          email: string
          first_name: string | null
          id: string
          last_login: string | null
          last_name: string | null
          organization_id: string
          phone: string | null
          role_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          branch_access?: string[] | null
          created_at?: string | null
          email: string
          first_name?: string | null
          id: string
          last_login?: string | null
          last_name?: string | null
          organization_id: string
          phone?: string | null
          role_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          branch_access?: string[] | null
          created_at?: string | null
          email?: string
          first_name?: string | null
          id?: string
          last_login?: string | null
          last_name?: string | null
          organization_id?: string
          phone?: string | null
          role_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_profiles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      waste_logs: {
        Row: {
          branch_id: string
          category: string | null
          cost_impact: number | null
          id: string
          item_name: string
          logged_at: string | null
          logged_by: string | null
          organization_id: string
          quantity: number
          reason: string | null
          unit: string | null
        }
        Insert: {
          branch_id: string
          category?: string | null
          cost_impact?: number | null
          id?: string
          item_name: string
          logged_at?: string | null
          logged_by?: string | null
          organization_id: string
          quantity: number
          reason?: string | null
          unit?: string | null
        }
        Update: {
          branch_id?: string
          category?: string | null
          cost_impact?: number | null
          id?: string
          item_name?: string
          logged_at?: string | null
          logged_by?: string | null
          organization_id?: string
          quantity?: number
          reason?: string | null
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "waste_logs_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waste_logs_logged_by_fkey"
            columns: ["logged_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waste_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_processing_queue: {
        Row: {
          created_at: string
          error_message: string | null
          headers: Json
          id: string
          last_attempt_at: string | null
          max_retries: number
          next_attempt_at: string
          platform: Database["public"]["Enums"]["platform_enum"]
          processed: boolean
          retry_count: number
          webhook_payload: Json
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          headers: Json
          id?: string
          last_attempt_at?: string | null
          max_retries?: number
          next_attempt_at?: string
          platform: Database["public"]["Enums"]["platform_enum"]
          processed?: boolean
          retry_count?: number
          webhook_payload: Json
        }
        Update: {
          created_at?: string
          error_message?: string | null
          headers?: Json
          id?: string
          last_attempt_at?: string | null
          max_retries?: number
          next_attempt_at?: string
          platform?: Database["public"]["Enums"]["platform_enum"]
          processed?: boolean
          retry_count?: number
          webhook_payload?: Json
        }
        Relationships: []
      }
    }
    Views: {
      menu_items_with_branch_availability: {
        Row: {
          available_days: Json | null
          base_price: number | null
          branch_id: string | null
          branch_name: string | null
          category_id: string | null
          category_name: string | null
          daily_limit: number | null
          effective_price: number | null
          end_date: string | null
          end_time: string | null
          is_active: boolean | null
          is_available_at_branch: boolean | null
          item_name: string | null
          menu_item_id: string | null
          organization_id: string | null
          start_date: string | null
          start_time: string | null
          stock_quantity: number | null
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "menu_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_settings_with_details: {
        Row: {
          applies_to_delivery: boolean | null
          applies_to_dine_in: boolean | null
          applies_to_takeaway: boolean | null
          branch_id: string | null
          branch_name: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string | null
          is_active: boolean | null
          organization_id: string | null
          organization_name: string | null
          scope_display: string | null
          tax_name: string | null
          tax_rate: number | null
          tax_type: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tax_settings_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tax_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      calculate_menu_item_price_with_modifiers: {
        Args: { p_menu_item_id: string; p_selected_modifiers: Json }
        Returns: number
      }
      calculate_order_total: {
        Args: { order_id_param: string }
        Returns: number
      }
      cleanup_processed_webhooks: {
        Args: { days_to_keep?: number }
        Returns: number
      }
      generate_order_number: {
        Args: { org_id: string }
        Returns: string
      }
      generate_po_number: {
        Args: { org_id: string }
        Returns: string
      }
      generate_stock_request_number: {
        Args: { org_id: string }
        Returns: string
      }
      get_active_platform_integrations: {
        Args: { org_id: string }
        Returns: {
          platform: Database["public"]["Enums"]["platform_enum"]
          platform_restaurant_id: string
          settings: Json
        }[]
      }
      get_delivery_analytics: {
        Args: { branch_id?: string; days_back?: number; org_id: string }
        Returns: {
          average_order_value: number
          average_prep_time_minutes: number
          cancelled_orders: number
          completed_orders: number
          platform: string
          total_orders: number
          total_revenue: number
        }[]
      }
      get_effective_tax_rate: {
        Args: { branch_id?: string; org_id: string }
        Returns: number
      }
      get_menu_item_price_at_branch: {
        Args: { p_branch_id: string; p_menu_item_id: string }
        Returns: number
      }
      get_menu_item_with_modifiers: {
        Args: { p_menu_item_id: string }
        Returns: Json
      }
      get_platform_credentials_from_vault: {
        Args: { p_vault_references: Json }
        Returns: Json
      }
      get_top_menu_items: {
        Args: {
          end_date: string
          item_limit?: number
          org_id: string
          start_date: string
        }
        Returns: {
          item_name: string
          menu_item_id: string
          order_count: number
          total_quantity: number
          total_revenue: number
        }[]
      }
      get_user_organization_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      initialize_organization: {
        Args: { org_id: string; org_name: string }
        Returns: undefined
      }
      is_menu_item_available_at_branch: {
        Args: {
          p_branch_id: string
          p_check_date?: string
          p_check_time?: string
          p_menu_item_id: string
        }
        Returns: boolean
      }
      map_order_status_to_platform: {
        Args: {
          internal_status: string
          target_platform: Database["public"]["Enums"]["platform_enum"]
        }
        Returns: string
      }
      migrate_integration_to_vault: {
        Args: { p_integration_id: string; p_organization_id: string }
        Returns: undefined
      }
      refresh_menu_branch_availability_view: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      store_platform_credentials_in_vault: {
        Args: { p_credentials: Json; p_integration_id: string }
        Returns: Json
      }
      update_platform_integration_sync_time: {
        Args: { integration_id: string }
        Returns: undefined
      }
      update_tax_rate_with_audit: {
        Args: {
          new_rate: number
          setting_id: string
          updated_by_user_id: string
        }
        Returns: boolean
      }
      validate_modifier_selection: {
        Args: { p_menu_item_id: string; p_selected_modifiers: Json }
        Returns: boolean
      }
    }
    Enums: {
      delivery_order_status_enum:
        | "pending"
        | "accepted"
        | "rejected"
        | "preparing"
        | "ready_for_pickup"
        | "out_for_delivery"
        | "completed"
        | "cancelled"
      order_status:
        | "new"
        | "confirmed"
        | "preparing"
        | "ready"
        | "completed"
        | "cancelled"
      order_type: "dine_in" | "takeout" | "delivery"
      payment_status: "pending" | "paid" | "refunded" | "partially_refunded"
      platform_enum: "uber_eats" | "deliveroo" | "just_eat"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      delivery_order_status_enum: [
        "pending",
        "accepted",
        "rejected",
        "preparing",
        "ready_for_pickup",
        "out_for_delivery",
        "completed",
        "cancelled",
      ],
      order_status: [
        "new",
        "confirmed",
        "preparing",
        "ready",
        "completed",
        "cancelled",
      ],
      order_type: ["dine_in", "takeout", "delivery"],
      payment_status: ["pending", "paid", "refunded", "partially_refunded"],
      platform_enum: ["uber_eats", "deliveroo", "just_eat"],
    },
  },
} as const
