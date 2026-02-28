
import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  Wrench, 
  Settings, 
  BarChart3, 
  CloudLightning,
  Sun,
  Moon,
  Bell,
  X,
  Camera,
  Check,
  ArrowLeftRight,
  FilePlus,
  History as HistoryIcon,
  BrainCircuit,
  User as UserIcon,
  Briefcase,
  Image as ImageIcon,
  Menu,
  AlertCircle,
  LogIn,
  LogOut,
  Loader2,
  ShieldCheck,
  ChevronLeft,
  Smartphone,
  ShieldAlert,
  Fingerprint,
  Lock,
  FileText,
  ShieldQuestion,
  Database,
  RefreshCw,
  Download,
  Shield
} from 'lucide-react';
import { AppState, View, Product, Customer, Sale, ServiceJob, AdminUser, Notification, StockTransfer, SettingHistoryEntry, PaymentAccount } from './types';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Inventory from './pages/Inventory';
import Customers from './pages/Customers';
import Services from './pages/Services';
import SettingsPage from './pages/Settings';
import Reports from './pages/Reports';
import StockTransfers from './pages/StockTransfers';
import CreateInvoice from './pages/CreateInvoice';
import GlobalHistory from './pages/History';
import AiAssistant from './pages/AiAssistant';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('isLoggedIn') === 'true';
  });
  const [user, setUser] = useState<AppState['user']>(() => {
    const saved = localStorage.getItem('user_data');
    return saved ? JSON.parse(saved) : undefined;
  });
  
  // Security & Auth simulation states
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [showAccountChooser, setShowAccountChooser] = useState(false);
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  const [isEnteringCustomEmail, setIsEnteringCustomEmail] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [selectedUserEmail, setSelectedUserEmail] = useState('');
  const [otpValue, setOtpValue] = useState(['', '', '', '', '', '']);
  
  const notificationRef = useRef<HTMLDivElement>(null);

  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('smartpos_data');
    const defaultState: AppState = {
      products: [],
      categories: [
        { id: '1', name: 'Electronics', subcategories: ['Laptops', 'Phones', 'Tablets'] },
        { id: '2', name: 'Accessories', subcategories: ['Mice', 'Keyboards', 'Cables'] },
      ],
      brands: [
        { id: '1', name: 'Apple' },
        { id: '2', name: 'Logitech' },
        { id: '3', name: 'Samsung' },
      ],
      warehouses: [
        { id: '1', name: 'Main Warehouse' },
        { id: '2', name: 'Downtown Branch' }
      ],
      stockTransfers: [],
      paymentAccounts: [
        { id: '1', provider: 'Opay', accountNumber: '8123456789', accountName: 'RealinkPos Store' },
        { id: '2', provider: 'PalmPay', accountNumber: '9123456789', accountName: 'RealinkPos Store' },
        { id: '3', provider: 'Access Bank', accountNumber: '0123456789', accountName: 'RealinkPos Solutions' }
      ],
      customers: [
        { id: '1', name: 'Walking Customer', email: '-', phone: '-', creditLimit: 0, balance: 0 }
      ],
      sales: [],
      services: [],
      isDarkMode: false,
      syncStatus: 'online',
      adminUser: {
        name: 'Admin User',
        role: 'Store Manager',
        avatar: 'https://picsum.photos/40/40?seed=pos'
      },
      businessAccount: {
        name: 'Realink Management',
        address: 'No 1, Innovation Way, Lagos',
        phone: '+234 800 000 000',
        logo: 'https://picsum.photos/100/100?seed=logo',
        signature: 'https://picsum.photos/150/50?seed=sig'
      },
      config: {
        storeName: 'Realink Management',
        primaryColor: '#4f46e5',
        lowStockThreshold: 10,
        receiptHeader: 'Thank you for shopping!',
        receiptFooter: 'Visit us again!',
        cloudProvider: 'gdrive',
        enhancedSecurity: true,
        nextInvoiceNumber: 1,
        invoiceTheme: 'modern',
        invoiceColor: '#4f46e5',
        invoiceStyle: 'sans'
      },
      currency: { code: 'NGN', symbol: '₦' },
      notifications: [
        { id: '1', title: 'System Online', message: 'Offline sync enabled and ready.', time: new Date().toISOString(), isRead: false }
      ],
      settingsHistory: []
    };

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Deep merge config to ensure new fields like nextInvoiceNumber exist
        return {
          ...defaultState,
          ...parsed,
          config: {
            ...defaultState.config,
            ...(parsed.config || {})
          },
          businessAccount: {
            ...defaultState.businessAccount,
            ...(parsed.businessAccount || {})
          }
        };
      } catch (e) {
        console.error("Failed to parse saved state", e);
        return defaultState;
      }
    }
    return defaultState;
  });

  useEffect(() => {
    const handleOnline = () => setState(prev => ({ ...prev, syncStatus: 'online' }));
    const handleOffline = () => setState(prev => ({ ...prev, syncStatus: 'offline' }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('smartpos_data', JSON.stringify(state));
    localStorage.setItem('isLoggedIn', isLoggedIn.toString());
    if (user) localStorage.setItem('user_data', JSON.stringify(user));
    else localStorage.removeItem('user_data');
    
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [state, isDarkMode, isLoggedIn]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAddNotification = (title: string, message: string) => {
    const newNotif: Notification = {
      id: Date.now().toString(),
      title,
      message,
      time: new Date().toISOString(),
      isRead: false
    };
    setState(prev => ({
      ...prev,
      notifications: [newNotif, ...prev.notifications].slice(0, 50)
    }));
  };

  const markNotificationRead = (id: string) => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => n.id === id ? { ...n, isRead: true } : n)
    }));
  };

  const logAuditAction = (section: string, action: string, details: string) => {
    const historyEntry: SettingHistoryEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      section,
      action,
      performer: state.adminUser.name,
      details
    };
    setState(prev => ({
      ...prev,
      settingsHistory: [historyEntry, ...prev.settingsHistory]
    }));
  };

  const handleUpdateProducts = (products: Product[]) => {
    products.forEach(p => {
      const oldProduct = state.products.find(op => op.id === p.id);
      if (oldProduct && oldProduct.stock !== p.stock) {
        if (p.stock < state.config.lowStockThreshold) {
          handleAddNotification('Low Stock Alert', `${p.name} is running low (${p.stock} units left).`);
        }
      }
    });
    setState(prev => ({ ...prev, products }));
  };

  const handleUpdateCustomers = (customers: Customer[]) => setState(prev => ({ ...prev, customers }));
  const handleAddSale = (sale: Sale) => {
    handleAddNotification('Sale Completed', `Sale #${sale.id.slice(-4)} processed. Total: ${state.currency.symbol}${sale.total.toLocaleString()}`);
    setState(prev => ({ ...prev, sales: [sale, ...prev.sales] }));
  };
  const handleUpdateServices = (services: ServiceJob[]) => setState(prev => ({ ...prev, services }));
  const handleUpdateTransfers = (stockTransfers: StockTransfer[]) => setState(prev => ({ ...prev, stockTransfers }));
  
  const handleUpdateAdmin = (newAdmin: AdminUser) => {
    logAuditAction('System', 'Profile Update', `Admin profile updated for ${newAdmin.name}`);
    setState(prev => ({ ...prev, adminUser: newAdmin }));
    setShowProfileModal(false);
  };

  useEffect(() => {
    // Load Google Identity Services script if not already present
    if (!document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.setAttribute('data-use_fedcm_for_prompt', 'false');
      document.body.appendChild(script);

      script.onload = () => {
        initializeGSI();
      };
    } else {
      // Script already in index.html, just wait for it to be ready
      const checkGSI = setInterval(() => {
        if ((window as any).google) {
          initializeGSI();
          clearInterval(checkGSI);
        }
      }, 100);
      setTimeout(() => clearInterval(checkGSI), 5000); // Timeout after 5s
    }

    function initializeGSI() {
      const clientId = (import.meta as any).env.VITE_GOOGLE_CLIENT_ID;
      if ((window as any).google && clientId && clientId !== 'your_google_client_id_here') {
        (window as any).google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleCredentialResponse,
          use_fedcm_for_prompt: false,
          itp_support: true,
          auto_select: false,
        });

        // Render the official button which is more reliable in iframes
        const buttonDiv = document.getElementById("google-signin-button");
        if (buttonDiv) {
          (window as any).google.accounts.id.renderButton(buttonDiv, {
            theme: "outline",
            size: "large",
            width: "320",
            shape: "pill",
            text: "signin_with",
            logo_alignment: "left"
          });
        }
      } else if (!clientId || clientId === 'your_google_client_id_here') {
        console.warn("Google Client ID is missing or invalid. Google Sign-In will be disabled.");
      }
    }
  }, []);

  const handleGoogleCredentialResponse = async (response: any) => {
    setIsAuthLoading(true);
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: response.credential }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setIsLoggedIn(true);
        
        // If cloud data exists, ask user if they want to restore it
        if (data.cloudData) {
          if (confirm("Cloud data found for your account. Would you like to restore your settings and products from the cloud?")) {
            setState(data.cloudData);
            handleAddNotification('Cloud Sync', 'Data restored from cloud successfully.');
          }
        }

        logAuditAction('Security', 'Google Login', `User ${data.user.email} authenticated via Google JWT`);
        handleAddNotification('Security', `Welcome back, ${data.user.name}!`);
      } else {
        const error = await res.json();
        alert(`Login failed: ${error.error}`);
      }
    } catch (error) {
      console.error('Auth error:', error);
      alert('Network error during authentication');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleCloudSync = async () => {
    if (!user || !user.email) return;
    
    setState(prev => ({ ...prev, syncStatus: 'syncing' }));
    
    try {
      const res = await fetch('/api/sync/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, state }),
      });
      
      if (res.ok) {
        setState(prev => ({ ...prev, syncStatus: 'online' }));
        handleAddNotification('Cloud Sync', 'All data successfully backed up to cloud.');
      } else {
        setState(prev => ({ ...prev, syncStatus: 'offline' }));
        handleAddNotification('Cloud Sync', 'Failed to sync with cloud.');
      }
    } catch (error) {
      console.error('Sync error:', error);
      setState(prev => ({ ...prev, syncStatus: 'offline' }));
    }
  };


  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(undefined);
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('user_data');
    logAuditAction('Security', 'Logout', 'User session terminated.');
  };

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear all business history? This includes sales, services, stock transfers, and audit logs. This action cannot be undone.')) {
      const clearEntry: SettingHistoryEntry = {
        id: `AUDIT-${Date.now()}`,
        date: new Date().toISOString(),
        section: 'System',
        action: 'Clear History',
        details: 'All business history, sales, services, transfers, and audit logs were cleared by the user.',
        performer: user?.name || state.adminUser.name
      };

      const newNotif: Notification = {
        id: Date.now().toString(),
        title: 'System',
        message: 'All business history and audit logs have been cleared.',
        time: new Date().toISOString(),
        isRead: false
      };

      setState(prev => ({ 
        ...prev, 
        sales: [], 
        services: [], 
        stockTransfers: [],
        settingsHistory: [clearEntry],
        notifications: [newNotif]
      }));
    }
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard state={state} user={user} />;
      case 'pos': 
        return <POS 
          state={state} 
          onAddSale={handleAddSale} 
          onUpdateProducts={handleUpdateProducts} 
          onLogAudit={logAuditAction} 
          onUpdateConfig={(cfg, section, details) => {
            setState(prev => ({...prev, config: {...prev.config, ...cfg}}));
            logAuditAction(section, 'Update', details);
          }}
        />;
      case 'create-invoice': 
        return <CreateInvoice 
          state={state} 
          onAddSale={handleAddSale} 
          onUpdateProducts={handleUpdateProducts} 
          onLogAudit={logAuditAction} 
          onUpdateConfig={(cfg) => setState(prev => ({...prev, config: {...prev.config, ...cfg}}))}
          onUpdateAccount={(acc) => setState(prev => ({...prev, businessAccount: {...prev.businessAccount, ...acc}}))}
        />;
      case 'inventory': 
        return <Inventory 
          state={state}
          products={state.products} 
          categories={state.categories} 
          brands={state.brands} 
          onUpdate={handleUpdateProducts} 
          onUpdateCategories={(cats) => setState(p => ({...p, categories: cats}))}
          onUpdateBrands={(brands) => setState(p => ({...p, brands: brands}))}
          symbol={state.currency.symbol}
          onLogAudit={logAuditAction}
          history={state.settingsHistory}
          config={state.config}
        />;
      case 'transfers': 
        return <StockTransfers 
          state={state} 
          onUpdateTransfers={handleUpdateTransfers} 
          onUpdateProducts={handleUpdateProducts} 
          onAddNotification={handleAddNotification} 
        />;
      case 'customers': 
        return <Customers 
          customers={state.customers} 
          onUpdate={handleUpdateCustomers} 
          symbol={state.currency.symbol} 
        />;
      case 'services': 
        return <Services 
          services={state.services} 
          onUpdate={handleUpdateServices} 
          symbol={state.currency.symbol} 
        />;
      case 'reports': return <Reports state={state} />;
      case 'history': return <GlobalHistory state={state} onClear={handleClearHistory} />;
      case 'settings': 
        return <SettingsPage 
          state={state} 
          isDarkMode={isDarkMode} 
          setIsDarkMode={setIsDarkMode} 
          onUpdateCurrency={(code, symbol) => setState(p => ({...p, currency: {code, symbol}}))}
          onUpdateConfig={(cfg, section, details) => {
            setState(prev => ({...prev, config: {...prev.config, ...cfg}}));
            logAuditAction(section, 'Update', details);
          }}
          onUpdateAccount={(acc) => {
            setState(prev => ({...prev, businessAccount: {...prev.businessAccount, ...acc}}));
            logAuditAction('Account', 'Profile Update', 'Business account details updated');
          }}
          onUpdatePaymentAccounts={(accounts) => {
            setState(prev => ({ ...prev, paymentAccounts: accounts }));
            logAuditAction('Account', 'Payment Options Update', 'Accepted payment methods/accounts updated');
          }}
          onRestoreState={(newState) => {
            setState(newState);
            logAuditAction('System', 'Data Restore', 'Application data restored from backup file');
          }}
          onClearHistory={handleClearHistory}
          onViewReports={() => setCurrentView('reports')}
        />;
      case 'ai-assistant': 
        return <AiAssistant 
          state={state} 
          onLogAudit={logAuditAction} 
          onUpdateConfig={(cfg, section, details) => {
            setState(prev => ({...prev, config: {...prev.config, ...cfg}}));
            logAuditAction(section, 'Update', details);
          }}
        />;
      default: return <Dashboard state={state} />;
    }
  };

  if (!isLoggedIn) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-6 ${isDarkMode ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-800'}`}>
        <div className="absolute top-4 right-4 flex items-center gap-2 px-4 py-2 bg-white/50 dark:bg-slate-800/50 backdrop-blur-lg border border-slate-200 dark:border-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500">
           <ShieldCheck size={14} className="text-emerald-500" /> AES-256 Encrypted Hub
        </div>

        <div className="bg-white dark:bg-slate-800 p-10 rounded-[3rem] shadow-2xl border border-slate-100 dark:border-slate-700 w-full max-w-md text-center space-y-8 animate-in zoom-in-95 duration-500 relative overflow-hidden">
          {isAuthLoading && (
            <div className="absolute inset-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
              <p className="font-black text-xs uppercase tracking-widest text-slate-500">Establishing Secure Channel...</p>
            </div>
          )}

          <div className="flex flex-col items-center gap-4">
            <div className="p-5 bg-indigo-600 rounded-3xl shadow-xl shadow-indigo-600/30">
              <CloudLightning className="text-white w-12 h-12" />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-black tracking-tighter">RealinkPos</h1>
              <p className="text-slate-500 font-medium text-sm">Enterprise Offline Retail Hub</p>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-700 group transition-all">
              <label className="relative flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={hasAcceptedTerms}
                  onChange={(e) => setHasAcceptedTerms(e.target.checked)}
                />
                <div className="w-5 h-5 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 rounded peer-checked:bg-indigo-600 peer-checked:border-indigo-600 transition-all flex items-center justify-center">
                  <Check size={14} className="text-white scale-0 peer-checked:scale-100 transition-transform" />
                </div>
              </label>
              <p className="text-[11px] text-left leading-relaxed text-slate-500">
                I agree to the <button onClick={() => setShowTermsModal(true)} className="text-indigo-600 font-bold hover:underline">Terms & Conditions</button> and acknowledge the <button onClick={() => setShowTermsModal(true)} className="text-indigo-600 font-bold hover:underline">Privacy Policy</button>.
              </p>
            </div>

            <div className="space-y-4">
              <div 
                id="google-signin-button" 
                className={`w-full flex justify-center transition-opacity ${!hasAcceptedTerms ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}
              ></div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-slate-700"></div></div>
                <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest text-slate-400 bg-white dark:bg-slate-800 px-4">Secure Gateway</div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl flex flex-col items-center gap-1 border border-slate-100 dark:border-slate-700">
                  <ShieldCheck size={18} className="text-emerald-500" />
                  <span className="text-[9px] font-black uppercase text-slate-400">SOC2 Verified</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl flex flex-col items-center gap-1 border border-slate-100 dark:border-slate-700">
                  <Fingerprint size={18} className="text-indigo-500" />
                  <span className="text-[9px] font-black uppercase text-slate-400">Biometric Ready</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Terms and Conditions Modal */}
        {showTermsModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[80vh] animate-in zoom-in-95">
              <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl">
                      <FileText size={20} />
                   </div>
                   <h3 className="font-bold text-lg">Terms & Privacy Policy</h3>
                </div>
                <button onClick={() => setShowTermsModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full">
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 space-y-6 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                <p className="font-medium text-slate-800 dark:text-slate-200 text-base">Welcome to RealinkPos Hub. By using our services, you agree to the following terms regarding your data security and operational continuity:</p>
                
                <section className="space-y-3">
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Database size={18} className="text-indigo-500" /> 1. Offline Backup System
                  </h4>
                  <p>When there is no internet connection, all transactions including sales, invoices, inventory updates, and customer data are automatically saved locally on the device using secure offline storage. This allows the POS to continue working without interruption.</p>
                </section>
                
                <section className="space-y-3">
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <RefreshCw size={18} className="text-indigo-500" /> 2. Auto Cloud Sync
                  </h4>
                  <p>Once the internet connection is restored, all offline data is automatically synchronized with the cloud database in real time. This ensures that your records are always updated and accessible from anywhere.</p>
                </section>

                <section className="space-y-3">
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Download size={18} className="text-indigo-500" /> 3. Daily Backup Export
                  </h4>
                  <p>Users can download manual backups anytime in formats such as Excel, JSON, or PDF. This provides an additional layer of protection for emergency recovery or record keeping.</p>
                </section>

                <section className="space-y-3">
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Shield size={18} className="text-indigo-500" /> 4. Data Security & Authentication
                  </h4>
                  <p>All data is encrypted and transmitted securely. User authentication ensures that only authorized users can access sensitive business information. You are responsible for maintaining the confidentiality of your credentials.</p>
                </section>

                <section className="space-y-3">
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <LayoutDashboard size={18} className="text-indigo-500" /> 5. Backup Status Indicator
                  </h4>
                  <p>The system provides real-time feedback on your data status:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li><span className="font-bold text-emerald-600">Online</span> – Data successfully synced to cloud</li>
                    <li><span className="font-bold text-amber-600">Offline</span> – Data saved locally on this device</li>
                    <li><span className="font-bold text-indigo-600">Syncing</span> – Currently uploading pending data</li>
                  </ul>
                </section>

                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800 text-[11px] font-medium italic text-indigo-700 dark:text-indigo-300">
                  With RealinkPOS, your business never loses data. Whether online or offline, your transactions remain safe, secure, and fully protected.
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30 flex gap-4">
                <button 
                  onClick={() => {
                    setHasAcceptedTerms(false);
                    setShowTermsModal(false);
                  }}
                  className="flex-1 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-rose-500 hover:bg-rose-50 transition-colors"
                >
                  I Disagree
                </button>
                <button 
                  onClick={() => {
                    setHasAcceptedTerms(true);
                    setShowTermsModal(false);
                  }}
                  className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-colors"
                >
                  I Accept Terms
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Google Account Chooser (Removed unused simulation) */}
      </div>
    );
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'pos', label: 'Retail POS', icon: ShoppingCart },
    { id: 'create-invoice', label: 'Formal Billing', icon: FilePlus },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'ai-assistant', label: 'AI Assistant', icon: BrainCircuit },
    { id: 'transfers', label: 'Transfers', icon: ArrowLeftRight },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'services', label: 'Services', icon: Wrench },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'history', label: 'History', icon: HistoryIcon },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const unreadCount = state.notifications.filter(n => !n.isRead).length;

  return (
    <div className={`min-h-screen flex ${isDarkMode ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-800'}`}>
      {/* Responsive Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 w-64 flex-shrink-0 border-r ${isDarkMode ? 'border-slate-800 bg-slate-800' : 'border-slate-200 bg-white'} z-[70] flex flex-col shadow-xl transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: state.config.primaryColor }}>
              <CloudLightning className="text-white w-5 h-5" />
            </div>
            <h1 className="text-lg font-bold tracking-tight truncate">{state.config.storeName}</h1>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-slate-400">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setCurrentView(item.id as View);
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                currentView === item.id 
                  ? 'text-white shadow-lg shadow-indigo-600/20' 
                  : `hover:bg-slate-100 ${isDarkMode ? 'hover:bg-slate-700 text-slate-400' : 'text-slate-500'}`
              }`}
              style={currentView === item.id ? { backgroundColor: state.config.primaryColor } : {}}
            >
              <item.icon size={18} />
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-700/50">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 rounded-xl transition-all font-bold text-sm"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className={`h-16 flex-shrink-0 flex items-center justify-between px-4 md:px-8 border-b ${isDarkMode ? 'border-slate-800 bg-slate-800' : 'border-slate-200 bg-white'} z-50`}>
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
              <Menu size={20} />
            </button>
            <h2 className="text-base md:text-lg font-bold capitalize truncate">{currentView.replace('-', ' ')}</h2>
            <div 
              className={`hidden sm:flex items-center gap-2 px-3 py-1 rounded-full border transition-all cursor-help group relative ${
                state.syncStatus === 'online' 
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border-emerald-100 dark:border-emerald-800' 
                  : state.syncStatus === 'offline'
                  ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 border-rose-100 dark:border-rose-800'
                  : 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 border-indigo-100 dark:border-indigo-800'
              }`}
            >
               {state.syncStatus === 'online' ? <ShieldCheck size={12} /> : state.syncStatus === 'offline' ? <AlertCircle size={12} /> : <RefreshCw size={12} className="animate-spin" />}
               <span className="text-[10px] font-black uppercase tracking-tighter">
                 {state.syncStatus === 'online' ? 'Online' : state.syncStatus === 'offline' ? 'Offline Hub' : 'Syncing...'}
               </span>
               
               {/* Tooltip */}
               <div className="absolute top-full left-0 mt-2 w-48 p-2 bg-slate-800 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[100] shadow-xl">
                 {state.syncStatus === 'online' 
                   ? 'Connected to cloud. All data is synchronized.' 
                   : state.syncStatus === 'offline'
                   ? 'Working offline. All transactions are saved locally and will sync when connection is restored.'
                   : 'Synchronizing your local data with the cloud...'}
               </div>
            </div>

            {isLoggedIn && (
              <button 
                onClick={handleCloudSync}
                disabled={state.syncStatus === 'syncing'}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all active:scale-95 disabled:opacity-50"
              >
                <CloudLightning size={14} className={state.syncStatus === 'syncing' ? 'animate-pulse' : ''} />
                <span>{state.syncStatus === 'syncing' ? 'Syncing...' : 'Sync Cloud'}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-slate-700 text-yellow-400' : 'hover:bg-slate-100 text-slate-500'}`}
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            
            <div className="relative" ref={notificationRef}>
              <button 
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  if (!showNotifications) {
                    // Mark all as read when opening
                    setState(prev => ({
                      ...prev,
                      notifications: prev.notifications.map(n => ({ ...n, isRead: true }))
                    }));
                  }
                }}
                className={`p-2 rounded-lg relative ${isDarkMode ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[8px] font-black flex items-center justify-center rounded-full border-2 border-white dark:border-slate-800 animate-in zoom-in">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="fixed sm:absolute top-16 right-0 left-0 sm:left-auto sm:w-80 bg-white dark:bg-slate-800 shadow-2xl border-x sm:border border-slate-100 dark:border-slate-700 sm:rounded-3xl overflow-hidden z-[100] animate-in slide-in-from-top-2 duration-200 m-4 sm:m-0">
                  <div className="p-4 border-b dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/20">
                    <h3 className="font-bold text-sm">Notifications</h3>
                    <div className="flex gap-4">
                      <button 
                        onClick={() => {
                          setState(p => ({
                            ...p,
                            notifications: p.notifications.map(n => ({ ...n, isRead: true }))
                          }));
                        }}
                        className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
                      >
                        Mark all read
                      </button>
                      <button 
                        onClick={() => setState(p => ({...p, notifications: []}))}
                        className="text-[10px] font-black text-rose-600 uppercase tracking-widest hover:underline"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <div className="max-h-[60vh] sm:max-h-96 overflow-y-auto">
                    {state.notifications.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 italic text-sm">No new alerts</div>
                    ) : (
                      state.notifications.map(n => (
                        <div 
                          key={n.id} 
                          onClick={() => markNotificationRead(n.id)}
                          className={`p-4 border-b last:border-0 dark:border-slate-700 transition-colors cursor-pointer relative ${n.isRead ? 'opacity-50' : 'bg-indigo-50/20 dark:bg-indigo-900/10'}`}
                        >
                          {!n.isRead && <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-indigo-500"></div>}
                          <p className="font-bold text-xs mb-0.5">{n.title}</p>
                          <p className="text-[11px] text-slate-500 leading-tight mb-1">{n.message}</p>
                          <span className="text-[9px] text-slate-400 font-mono">{new Date(n.time).toLocaleTimeString()}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>
            
            <button 
              onClick={() => setShowProfileModal(true)}
              className="flex items-center gap-3 p-1 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
            >
              <div className="flex items-center gap-3 hidden md:flex">
                <div className="flex flex-col items-end">
                  <span className="text-xs font-black tracking-tight">{user?.name || state.adminUser.name}</span>
                  <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest leading-none">{user ? 'Google User' : state.adminUser.role}</span>
                </div>
              </div>
              <img src={user?.picture || state.adminUser.avatar} className="w-8 h-8 md:w-9 md:h-9 rounded-full border border-indigo-200 shadow-sm" alt="Avatar" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-20 lg:pb-8">
          {renderView()}
        </div>
      </main>

      {/* Admin User Edit Modal */}
      {showProfileModal && (
        <ProfileEditModal 
          user={state.adminUser} 
          onSave={handleUpdateAdmin} 
          onClose={() => setShowProfileModal(false)}
          primaryColor={state.config.primaryColor}
        />
      )}
    </div>
  );
};

interface ProfileModalProps {
  user: AdminUser;
  onSave: (u: AdminUser) => void;
  onClose: () => void;
  primaryColor: string;
}

const ProfileEditModal: React.FC<ProfileModalProps> = ({ user, onSave, onClose, primaryColor }) => {
  const [formData, setFormData] = useState<AdminUser>({...user});

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
             <ShieldAlert className="text-indigo-600" size={20} />
             <h3 className="font-bold text-xl">Admin Profile</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full"><X size={20}/></button>
        </div>
        
        <div className="p-6 md:p-8 space-y-6">
          <div className="flex flex-col items-center">
             <div className="relative">
                <img src={formData.avatar} className="w-20 h-20 rounded-2xl shadow-xl object-cover" />
                <div className="absolute -bottom-2 -right-2 p-1.5 bg-indigo-600 text-white rounded-lg shadow-lg border-2 border-white dark:border-slate-800">
                   <Camera size={14} />
                </div>
             </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Display Name</label>
              <input 
                type="text" 
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border-none rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500/50"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Role</label>
              <input 
                type="text" 
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border-none rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500/50"
                value={formData.role}
                onChange={e => setFormData({...formData, role: e.target.value})}
              />
            </div>
          </div>

          <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800 flex items-start gap-3">
             <Lock size={16} className="text-indigo-600 mt-0.5 shrink-0" />
             <p className="text-[10px] text-indigo-700 dark:text-indigo-300 leading-relaxed font-medium">Changes to your profile are audited and logged in the system security ledger for compliance.</p>
          </div>

          <div className="pt-4 flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-500 rounded-xl font-bold">Cancel</button>
            <button 
              onClick={() => onSave(formData)}
              className="flex-1 py-3 text-white rounded-xl font-bold shadow-lg"
              style={{ backgroundColor: primaryColor }}
            >
              Update Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
