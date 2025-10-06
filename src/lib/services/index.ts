// Export all service modules
export * from './auth.service';
export * from './organization.service';
export * from './menu.service';
export * from './orders.service';
export * from './inventory.service';
export * from './loyalty.service';
export * from './purchasing.service';
export * from './delivery-platform.service';

// Re-export services for convenient access
export { authService } from './auth.service';
export { organizationService } from './organization.service';
export { menuService } from './menu.service';
export { ordersService } from './orders.service';
export { inventoryService } from './inventory.service';
export { loyaltyService } from './loyalty.service';
export { purchasingService } from './purchasing.service';
export { deliveryPlatformService } from './delivery-platform.service';
