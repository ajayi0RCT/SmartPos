
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
  ChevronLeft
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
  
  // Auth simulation states
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [showAccountChooser, setShowAccountChooser] = useState(false);
  const [isEnteringCustomEmail, setIsEnteringCustomEmail] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  
  const notificationRef = useRef<HTMLDivElement>(null);

  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('smartpos_data');
    if (saved) return JSON.parse(saved);
    return {
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
        { id: '1', provider: 'Opay', accountNumber: '8123456789', accountName: 'SmartPOS Store' },
        { id: '2', provider: 'PalmPay', accountNumber: '9123456789', accountName: 'SmartPOS Store' },
        { id: '3', provider: 'Access Bank', accountNumber: '0123456789', accountName: 'SmartPOS Solutions' }
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
        name: 'SmartPOS Business',
        address: 'No 1, Innovation Way, Lagos',
        phone: '+234 800 000 000'
      },
      config: {
        storeName: 'SmartPOS',
        primaryColor: '#4f46e5',
        lowStockThreshold: 10,
        receiptHeader: 'Thank you for shopping!',
        receiptFooter: 'Visit us again!',
        cloudProvider: 'gdrive',
        enhancedSecurity: false
      },
      currency: { code: 'NGN', symbol: '₦' },
      notifications: [
        { id: '1', title: 'System Online', message: 'Offline sync enabled and ready.', time: new Date().toISOString(), isRead: false }
      ],
      settingsHistory: []
    };
  });

  useEffect(() => {
    localStorage.setItem('smartpos_data', JSON.stringify(state));
    localStorage.setItem('isLoggedIn', isLoggedIn.toString());
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

  const handleGoogleLoginInitiate = () => {
    setShowAccountChooser(true);
    setIsEnteringCustomEmail(false);
    setCustomEmail('');
  };

  const handleAccountSelect = (email: string) => {
    setShowAccountChooser(false);
    setIsAuthLoading(true);
    // Simulate API delay for "Secure authentication"
    setTimeout(() => {
      setIsLoggedIn(true);
      setIsAuthLoading(false);
      logAuditAction('Security', 'Login', `Staff session started for ${email} via Google OAuth.`);
      handleAddNotification('Login Successful', `Welcome back, ${email}!`);
    }, 1200);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('isLoggedIn');
    logAuditAction('Security', 'Logout', 'Staff session terminated manually.');
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard state={state} />;
      case 'pos': 
        return <POS 
          state={state} 
          onAddSale={handleAddSale} 
          onUpdateProducts={handleUpdateProducts} 
          onLogAudit={logAuditAction} 
        />;
      case 'create-invoice': 
        return <CreateInvoice 
          state={state} 
          onAddSale={handleAddSale} 
          onUpdateProducts={handleUpdateProducts} 
          onLogAudit={logAuditAction} 
        />;
      case 'inventory': 
        return <Inventory 
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
      case 'history': return <GlobalHistory state={state} />;
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
        />;
      case 'ai-assistant': return <AiAssistant state={state} />;
      default: return <Dashboard state={state} />;
    }
  };

  if (!isLoggedIn) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-6 ${isDarkMode ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-800'}`}>
        <div className="bg-white dark:bg-slate-800 p-10 rounded-[3rem] shadow-2xl border border-slate-100 dark:border-slate-700 w-full max-w-md text-center space-y-8 animate-in zoom-in-95 duration-500 relative overflow-hidden">
          {isAuthLoading && (
            <div className="absolute inset-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
              <p className="font-black text-xs uppercase tracking-widest text-slate-500">Securing Session...</p>
            </div>
          )}

          <div className="flex flex-col items-center gap-4">
            <div className="p-5 bg-indigo-600 rounded-3xl shadow-xl shadow-indigo-600/30">
              <CloudLightning className="text-white w-12 h-12" />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-black tracking-tighter">SmartPOS</h1>
              <p className="text-slate-500 font-medium text-sm">Enterprise Offline Retail Hub</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <button 
              onClick={handleGoogleLoginInitiate}
              disabled={isAuthLoading}
              className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-700 border-2 border-slate-100 dark:border-slate-600 hover:border-indigo-600 dark:hover:border-indigo-500 px-6 py-4 rounded-2xl font-bold transition-all group shadow-sm active:scale-[0.98] disabled:opacity-50"
            >
              <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" alt="Google" className="w-6 h-6" />
              <span>Continue with Google</span>
            </button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-slate-700"></div></div>
              <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest text-slate-400 bg-white dark:bg-slate-800 px-4">Authorized Access Only</div>
            </div>
            <div className="flex items-center justify-center gap-2 text-[10px] text-emerald-500 font-black uppercase tracking-wider">
              <ShieldCheck size={14} /> Google Protection Enabled
            </div>
          </div>
        </div>

        {/* Improved Google Account Chooser Simulation */}
        {showAccountChooser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
              <div className="p-8 text-center border-b dark:border-slate-700 relative">
                {isEnteringCustomEmail && (
                  <button onClick={() => setIsEnteringCustomEmail(false)} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full">
                    <ChevronLeft size={20} />
                  </button>
                )}
                <img src="https://www.gstatic.com/images/branding/googlelogo/1x/googlelogo_color_92x30dp.png" alt="Google" className="h-6 mx-auto mb-4" />
                <h3 className="text-xl font-bold">{isEnteringCustomEmail ? 'Sign in' : 'Choose an account'}</h3>
                <p className="text-sm text-slate-500">to continue to SmartPOS Hub</p>
              </div>

              {!isEnteringCustomEmail ? (
                <div className="p-2">
                  {[
                    { name: 'Store Admin', email: 'admin@smartpos.io', img: 'https://picsum.photos/40/40?seed=admin' },
                    { name: 'Shift Manager', email: 'manager@smartpos.io', img: 'https://picsum.photos/40/40?seed=manager' }
                  ].map((acc, i) => (
                    <button 
                      key={i} 
                      onClick={() => handleAccountSelect(acc.email)}
                      className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left group"
                    >
                      <img src={acc.img} className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-600" />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm">{acc.name}</p>
                        <p className="text-xs text-slate-500 truncate">{acc.email}</p>
                      </div>
                    </button>
                  ))}
                  <button 
                    onClick={() => setIsEnteringCustomEmail(true)}
                    className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left border-t dark:border-slate-700"
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-600 flex items-center justify-center">
                      <UserIcon size={20} className="text-slate-500 dark:text-slate-400" />
                    </div>
                    <span className="font-bold text-sm text-slate-600 dark:text-slate-300">Use another account</span>
                  </button>
                </div>
              ) : (
                <div className="p-8 space-y-6">
                  <div className="space-y-4">
                    <input 
                      type="email" 
                      placeholder="Email or phone" 
                      autoFocus
                      className="w-full px-4 py-4 bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:border-blue-500 font-medium"
                      value={customEmail}
                      onChange={(e) => setCustomEmail(e.target.value)}
                    />
                    <button className="text-blue-600 dark:text-blue-400 font-bold text-sm hover:underline">Forgot email?</button>
                  </div>
                  <div className="flex justify-between items-center pt-4">
                    <button onClick={() => setIsEnteringCustomEmail(false)} className="text-blue-600 dark:text-blue-400 font-bold text-sm">Create account</button>
                    <button 
                      onClick={() => customEmail.includes('@') && handleAccountSelect(customEmail)}
                      disabled={!customEmail.includes('@')}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-8 py-2.5 rounded-lg font-bold transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}

              <div className="p-6 text-[10px] text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-900/50 border-t dark:border-slate-700">
                To continue, Google will share your name, email address, language preference, and profile picture with SmartPOS. Before using this app, you can review SmartPOS’s <span className="underline cursor-pointer">privacy policy</span> and <span className="underline cursor-pointer">terms of service</span>.
              </div>
            </div>
          </div>
        )}
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
                onClick={() => setShowNotifications(!showNotifications)}
                className={`p-2 rounded-lg relative ${isDarkMode ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-slate-800"></span>
                )}
              </button>

              {showNotifications && (
                <div className="fixed sm:absolute top-16 right-0 left-0 sm:left-auto sm:w-80 bg-white dark:bg-slate-800 shadow-2xl border-x sm:border border-slate-100 dark:border-slate-700 sm:rounded-3xl overflow-hidden z-[100] animate-in slide-in-from-top-2 duration-200 m-4 sm:m-0">
                  <div className="p-4 border-b dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/20">
                    <h3 className="font-bold text-sm">Notifications</h3>
                    <button 
                      onClick={() => setState(p => ({...p, notifications: []}))}
                      className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
                    >
                      Clear
                    </button>
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
              <div className="flex flex-col items-end hidden md:flex">
                <span className="text-xs font-black tracking-tight">{state.adminUser.name}</span>
                <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest leading-none">{state.adminUser.role}</span>
              </div>
              <img src={state.adminUser.avatar} className="w-8 h-8 md:w-9 md:h-9 rounded-full border border-indigo-200 shadow-sm" alt="Avatar" />
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
          <h3 className="font-bold text-xl">Admin Profile</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full"><X size={20}/></button>
        </div>
        
        <div className="p-6 md:p-8 space-y-6">
          <div className="flex flex-col items-center">
             <div className="relative">
                <img src={formData.avatar} className="w-20 h-20 rounded-2xl shadow-xl object-cover" />
                <div className="absolute -bottom-2 -right-2 p-1.5 bg-indigo-600 text-white rounded-lg shadow-lg">
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
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Avatar URL</label>
              <input 
                type="text" 
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border-none rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500/50"
                value={formData.avatar}
                onChange={e => setFormData({...formData, avatar: e.target.value})}
              />
            </div>
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
