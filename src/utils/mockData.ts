import { BusinessProfile, Party, Product, SalesOrder } from '../types';

export const initialBusinessProfile: BusinessProfile = {
  companyName: 'WESTERN CHEM ZONE / NIRMAALADEVI CARE',
  tagline: 'Industrial Chemicals & Wholesale Distribution Supply',
  gstin: '24AABCV1234F1Z8',
  panNo: 'AABCV1234F',
  phone: '+91 98250 12345',
  email: 'orders@westernchemzone.com',
  address: 'Plot No. 42, GIDC Industrial Estate, Phase II, Ring Road',
  city: 'Ahmedabad',
  state: 'Gujarat',
  pincode: '380015',
  bankName: 'State Bank of India',
  accountNumber: '382901928471',
  ifscCode: 'SBIN0001824',
  branchName: 'GIDC Industrial Branch',
  upiId: 'westernchem@sbi',
  termsAndConditions: '1. Goods once sold will not be taken back.\n2. Interest @ 18% p.a. will be charged if payment is not cleared within 30 days.\n3. Subject to jurisdiction only.',
  signatureText: 'For WESTERN CHEM ZONE / NIRMAALADEVI CARE\nAuthorised Signatory',
  currencySymbol: '₹',
  invoicePrefix: 'MOB',
  invoiceStartingNo: 0,
  autoFinancialYear: true,
};

export const initialParties: Party[] = [];

export const initialProducts: Product[] = [];

export const initialOrders: SalesOrder[] = [];
