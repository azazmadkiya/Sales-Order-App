export type InvoiceType = 'GST' | 'IGST' | 'NON_GST';

export type UserRole = 'admin' | 'viewer' | 'order_creator' | 'dispatch_manager';

export interface UserPermissions {
  canCreateOrder: boolean;
  canEditOrder: boolean;
  canDeleteOrder: boolean;
  canDispatch: boolean;
  canManageUsers: boolean;
  canEditBusinessProfile: boolean;
  canManageParties: boolean;
  canManageProducts: boolean;
  canViewReports: boolean;
  canViewAmounts: boolean; // Controls whether user can see pricing, rates, taxable values, GST amounts, totals, balances
}

export interface AppUser {
  id: string;
  username: string;
  displayName: string;
  email?: string;
  password?: string; // Stored for internal credential authentication
  role: UserRole;
  isActive: boolean;
  phone?: string;
  createdAt: string;
  updatedAt?: string;
  lastLogin?: string;
  hideAmounts?: boolean; // When true: user can view all order details, parties, products, dispatches, but amounts/rates are masked
  customPermissions?: Partial<UserPermissions>;
}

export type OrderStatus = 
  | 'Pending'
  | 'Confirmed'
  | 'Ready to Pack'
  | 'Dispatched'
  | 'In Transit'
  | 'Delivered'
  | 'Cancelled';

export type PaymentStatus = 'Unpaid' | 'Partial' | 'Paid';

export type PartyType = 'Customer' | 'Supplier' | 'Both';

export type UnitType = 
  | 'PCS'
  | 'BOX'
  | 'KG'
  | 'MTR'
  | 'LTR'
  | 'BAG'
  | 'DOZEN'
  | 'SET'
  | 'SQFT'
  | 'PKT';

export interface Party {
  id: string;
  userId?: string;
  partyName: string;
  contactPerson?: string;
  phone: string;
  email?: string;
  gstin?: string;
  pan?: string;
  billingAddress: string;
  shippingAddress?: string;
  state: string;
  city: string;
  pincode?: string;
  partyType: PartyType;
  openingBalance?: number;
  currentBalance?: number;
  creditLimit?: number;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Product {
  id: string;
  userId?: string;
  itemCode: string; // e.g. "PRD13"
  name: string;
  description?: string;
  unit: UnitType;
  secondaryUnit?: string; // e.g. "BAG", "BOX", "DRUM", "CAN", "CTN", "PKT"
  conversionFactor?: number; // e.g. 50.000 (1 BAG = 50 KG)
  defaultRate: number;
  mrp?: number;
  purchaseRate?: number;
  gstRate: number; // e.g. 18 for 18%
  hsnCode?: string;
  stockQty: number;
  minStockLevel?: number;
  photoUrl?: string;
  category?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface OrderItem {
  id: string;
  productId?: string;
  itemCode: string;
  itemName: string;
  unit: UnitType;
  secondaryUnit?: string; // Packaging unit e.g. "BAG", "BOX", "DRUM"
  qty2?: number; // Secondary Qty (e.g. 1.00)
  conversion?: number; // Conversion factor (e.g. 50.000)
  qty: number; // Final billing Qty (e.g. 50.000) = qty2 * conversion
  rate: number;
  discountPercent?: number;
  discountAmount?: number;
  taxableAmount: number;
  gstRate: number; // e.g. 18
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalAmount: number;
  photoUrl?: string;
  hsnCode?: string;
}

export interface DispatchDetails {
  transporterName: string;
  lrDocketNo: string; // Lorry Receipt or Docket No
  vehicleNo?: string;
  ewayBillNo?: string;
  dispatchDate: string; // YYYY-MM-DD
  shippingAddress: string;
  deliveryContactName?: string;
  deliveryPhone?: string;
  driverPhone?: string;
  dispatchNotes?: string;
  trackingUrl?: string;
  estimatedDeliveryDate?: string;
  actualDeliveryDate?: string;
  dispatchedBy?: string;
}

export interface SalesOrder {
  id: string;
  userId?: string;
  orderNo: string;
  orderDate: string; // YYYY-MM-DD
  invoiceType: InvoiceType;
  
  // Party info
  partyId?: string;
  partyName: string;
  partyGstin?: string;
  partyPhone?: string;
  partyAddress?: string;
  partyState?: string;
  partyCity?: string;

  // Items
  items: OrderItem[];
  
  // Summary
  totalItems: number;
  totalQty: number;
  subtotalTaxable: number;
  
  // Freight charges
  freightCharges: number;
  freightGstRate: number; // e.g. 0 or 18%
  freightCgst: number;
  freightSgst: number;
  freightIgst: number;
  freightTotal: number;

  // Taxes
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalTax: number;

  // Round Off & Grand Total
  roundOff: number;
  grandTotal: number;

  // Status & Tracking
  status: OrderStatus;
  dispatchDetails?: DispatchDetails;

  // Reminder & Follow-up tracking (replacing payment options)
  hasReminder?: boolean;
  reminderDate?: string; // YYYY-MM-DD
  reminderTime?: string; // HH:mm
  reminderNotes?: string;
  isReminderCompleted?: boolean;
  priority?: 'Normal' | 'High' | 'Urgent';

  // Legacy/Optional Payment info (optional fallback)
  paymentStatus?: PaymentStatus;
  amountPaid?: number;
  balanceDue?: number;
  paymentMode?: string;
  paymentTerms?: string;
  
  // Remarks
  notes?: string;
  termsAndConditions?: string;

  createdAt: string;
  updatedAt: string;
}

export interface BusinessProfile {
  companyName: string;
  tagline?: string;
  gstin?: string;
  panNo?: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  branchName?: string;
  upiId?: string;
  termsAndConditions?: string;
  signatureText?: string;
  currencySymbol: string;
  // Bill / Order Numbering Series configuration
  invoicePrefix?: string; // e.g. "MOB"
  invoiceStartingNo?: number; // e.g. 0
  autoFinancialYear?: boolean; // true
}
