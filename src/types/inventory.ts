export type StockCategory = 
  | 'Vegetables'
  | 'Meat'
  | 'Dairy'
  | 'Beverages'
  | 'Dry Goods'
  | 'Spices'
  | 'Seafood'
  | 'Other'
  | 'Bakery'
  | 'Fruits'
  | 'Nuts'
  | 'Legumes'
  | 'Grains'
  | 'Herbs'
  | 'Mushrooms'
  | 'Oils'
  | 'Other';

export type StockStatus = 'In Stock' | 'Low Stock' | 'Out of Stock';

export type UnitOfMeasure = 'kg' | 'g' | 'l' | 'ml' | 'units' | 'pcs';

// Comprehensive Stock Request System Types
export type StockRequestStatus = 'New' | 'Pending' | 'Approved' | 'Rejected' | 'Completed' | 'Cancelled';

export interface StockRequestFormData {
  id?: string;
  requestNumber: string;
  originId: string;
  destinationId: string;
  date: Date;
  requiredDate?: Date;
  status: StockRequestStatus;
  notes?: string;
  items: StockRequestItemData[];
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface StockRequestItemData {
  id: string;
  stockRequestId?: string;
  inventoryItemId: string;
  inventoryItemName: string;
  quantityRequested: number;
  quantityApproved?: number;
  unit: string;
  priority: 'low' | 'medium' | 'high';
  notes?: string;
  availableStock?: number;
  estimatedCost?: number;
}

// Stock Transfer System Types  
export type TransferStatus = 'New' | 'Rejected' | 'Approved' | 'Delivering' | 'Completed';

export interface StockTransferLog {
  id: string;
  transferNumber: string;
  originId: string;
  destinationId: string;
  status: TransferStatus;
  dateCreated: string;
  dateReceived?: string;
  hasDiscrepancies: boolean;
  createdBy?: string;
  approvedBy?: string;
  items?: StockTransferItemData[];
  notes?: string;
  totalItems?: number;
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface StockTransferItemData {
  id: string;
  ingredientItemId: string;
  ingredientName: string;
  quantity: number;
  unit: UnitOfMeasure;
  receivedQuantity?: number;
  notes?: string;
  discrepancy?: boolean;
  discrepancyReason?: string;
}

// Sortable Data Types for Tables
export interface SortConfig<T> {
  key: keyof T;
  direction: 'asc' | 'desc';
}

export type SortableStockRequestField = keyof StockRequestFormData;
export type SortableTransferLogField = keyof StockTransferLog;
export type SortableInventoryField = keyof StockItem;

// Form Error Types
export interface FormErrors {
  [key: string]: string;
}

export interface StockRequestFormErrors {
  requestNumber?: string;
  originId?: string;
  destinationId?: string;
  date?: string;
  items?: string;
  [key: `item-${number}`]: string;
  [key: `quantity-${number}`]: string;
}

export interface IngredientItem {
  id: string;
  name: string;
  nameLocalized: string;
  sku: string;
  category: StockCategory;
  storageUnit: UnitOfMeasure;
  ingredientUnit: UnitOfMeasure;
  storageIngredientFactor: number;
  barcode: string;
  
  // Default values for new branches
  unitPrice?: number;
  minLevel?: number;
  maxLevel?: number;
  reorderLevel?: number;
  
  // Branch-specific data
  branchData?: {
    [branchId: string]: BranchIngredientData;
  };
}

export interface BranchIngredientData {
  unitPrice: number;
  minLevel: number;
  maxLevel: number;
  reorderLevel: number;
}

export interface StockItem {
  id: string;
  name: string;
  nameLocalized: string;
  sku: string;
  category: StockCategory;
  quantity: number;
  storageUnit: UnitOfMeasure;
  ingredientUnit: UnitOfMeasure;
  reorderLevel: number;
  supplierName: string;
  lastRestockedDate: Date;
  expirationDate?: Date;
  status: StockStatus;
  branchData?: { 
    [branchId: string]: StockItemBranch 
  };
}

export interface StockItemBranch {
  id: string;
  stockItemId: string;
  branchId: string;
  quantity: number;
  reorderLevel: number;
  lastRestockedDate: Date;
  expirationDate?: Date;
  status: StockStatus;
}


export interface StockMovement {
  id: string;
  stockItemId: string;
  type: 'purchase' | 'usage' | 'waste' | 'adjustment';
  quantity: number;
  date: Date;
  notes?: string;
}

export interface StockMetrics {
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  expiringItems: number;
} 

// Define the Recipe type
export interface Recipe {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
  description: string;
  ingredients: RecipeIngredient[];
  steps: PreparationStep[];
  portionSize: string;
  preparationTime: string;
  cookingTime: string;
  servingSuggestions: string;
  costPerPortion: number;
  sellingPrice: number;
  nutrition?: NutritionalInfo;
}

export interface RecipeIngredient {
  id: string;
  ingredientItemId: string;
  name: string;
  amount: number;
  unit: UnitOfMeasure;
  costPerUnit: number;
  totalCost: number;
  inStock: number;
}

export interface PreparationStep {
  id: string;
  stepNumber: number;
  instruction: string;
}

export interface NutritionalInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
}

export interface Supplier {
  id: string;
  name: string;
  category: StockCategory;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  lastOrderDate: Date;
  totalOrders: number;
  active: boolean;
  averageDeliveryTime: number; // in days
  notes?: string;
  logoUrl?: string;
  businessHours?: BusinessHours[];
  performance?: SupplierPerformance;
}

export interface BusinessHours {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  open: string; // format: "HH:MM"
  close: string; // format: "HH:MM"
  isClosed: boolean;
}

export interface SupplierPerformance {
  onTimeDeliveryRate: number; // percentage
  averageLeadTime: number; // in days
  orderAccuracy: number; // percentage
  customerRating: number; // 1-5 scale
}

export interface SupplierOrder {
  id: string;
  orderNumber: string;
  supplierId: string;
  status: 'open' | 'pending' | 'delivered' | 'cancelled';
  orderDate: Date;
  updatedAt: Date;
  totalItems: number;
  totalQuantity: number;
  totalAmount: number;
  notes?: string;
}

export interface SupplierMetrics {
  totalSuppliers: number;
  pendingOrders: number;
  averageDeliveryTime: number;
  totalMonthlyPurchases: number;
  stockShortages: number;
}

export type WasteReason = 'spoiled' | 'overcooked' | 'wrong-order' | 'customer-return' | 'other';

export type WasteSource = 'prep' | 'cooking' | 'storage' | 'service' | 'other';

export interface WasteLog {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  measureUnit: UnitOfMeasure;
  reason: WasteReason;
  source: WasteSource;
  staffName: string;
  timestamp: Date;
  notes?: string;
  branchId?: string;
  cost?: number;
}