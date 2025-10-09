// Export all service modules
export * from './auth.service';
export * from './organization.service';
export * from './menu.service';
export * from './modifier.service';
export * from './orders.service';
export * from './inventory.service';
export * from './loyalty.service';
export * from './purchasing.service';
export * from './delivery-platform.service';
export * from './staff.service';
export * from './notifications.service';
export * from './suppliers.service';
export * from './waste.service';
export * from './tax.service';

// Re-export services for convenient access
export { authService } from './auth.service';
export { organizationService } from './organization.service';
export { menuService } from './menu.service';
export { modifierService } from './modifier.service';
export { ordersService } from './orders.service';
export { inventoryService } from './inventory.service';
export { loyaltyService } from './loyalty.service';
export { purchasingService } from './purchasing.service';
export { deliveryPlatformService } from './delivery-platform.service';
export { staffService } from './staff.service';
export { notificationsService } from './notifications.service';
export { suppliersService } from './suppliers.service';
export { wasteService } from './waste.service';
export { taxService } from './tax.service';

// Updated type exports with database types
export type { 
  TaxSetting, 
  TaxSettingInsert, 
  TaxSettingUpdate, 
  CreateTaxSettingParams, 
  TaxCalculationContext, 
  TaxBreakdown 
} from './tax.service';

// Modifier service type exports
export type {
  ModifierGroup,
  Modifier,
  ModifierGroupWithModifiers,
  MenuItemWithModifiers,
  SelectedModifier,
  ModifierGroupInput,
  ModifierInput,
  MenuItemModifierGroup
} from './modifier.service';
