
export interface Category {
  id: string;
  name: string;
  subcategories: string[];
}

export interface Brand {
  id: string;
  name: string;
}

export interface StockHistoryEntry {
  id: string;
  date: string;
  type: 'initial' | 'quick_adj' | 'manual_adj' | 'scanner_adj' | 'sale' | 'transfer';
  quantity: number;
  newStock: number;
  performer: string;
  note?: string;
}

export interface SettingHistoryEntry {
  id: string;
  date: string;
  section: string;
  action: string;
  performer: string;
  details: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  description?: string;
  price: number;
  cost: number;
  stock: number;
  category: string;
  subcategory?: string;
  brand?: string;
  image?: string;
  isVisible: boolean;
  status: 'active' | 'inactive';
  color?: string;
  size?: string;
  history?: StockHistoryEntry[];
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  creditLimit: number;
  balance: number;
  customFields?: Record<string, string>;
}

export interface SaleItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface PaymentAccount {
  id: string;
  provider: string; // e.g., 'Opay', 'PalmPay', 'Access Bank'
  accountNumber: string;
  accountName: string;
}

export interface Sale {
  id: string;
  customerId: string;
  items: SaleItem[];
  subtotal: number;
  total: number;
  date: string;
  status: 'synced' | 'pending';
  paymentMethod: 'cash' | 'card' | 'credit' | 'bank_transfer';
  paymentDetails?: string; // Store specific bank info if bank_transfer
}

export interface ServiceJob {
  id: string;
  customerName: string;
  customerPhone?: string;
  device: string;
  problem: string;
  technician: string;
  status: 'pending' | 'in-progress' | 'completed' | 'delivered';
  laborCharges: number;
  partsUsed: Array<{ name: string; price: number }>;
  estimatedCost: number;
  createdAt: string;
}

export interface AdminUser {
  name: string;
  role: string;
  avatar: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
}

export interface Warehouse {
  id: string;
  name: string;
  location?: string;
}

export interface StockTransfer {
  id: string;
  productId: string;
  productName: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  quantity: number;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
}

export type View = 'dashboard' | 'pos' | 'create-invoice' | 'inventory' | 'transfers' | 'customers' | 'services' | 'reports' | 'history' | 'settings' | 'ai-assistant';

export interface AppState {
  products: Product[];
  customers: Customer[];
  sales: Sale[];
  services: ServiceJob[];
  categories: Category[];
  brands: Brand[];
  warehouses: Warehouse[];
  stockTransfers: StockTransfer[];
  paymentAccounts: PaymentAccount[];
  isDarkMode: boolean;
  syncStatus: 'online' | 'offline' | 'syncing';
  adminUser: AdminUser;
  businessAccount: {
    name: string;
    address: string;
    phone: string;
  };
  config: {
    storeName: string;
    primaryColor: string;
    lowStockThreshold: number;
    receiptHeader: string;
    receiptFooter: string;
    cloudProvider: 'gdrive' | 'dropbox' | 's3';
    enhancedSecurity: boolean;
  };
  currency: {
    code: string;
    symbol: string;
  };
  notifications: Notification[];
  settingsHistory: SettingHistoryEntry[];
}
