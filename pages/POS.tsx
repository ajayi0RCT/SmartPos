
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Trash2, 
  Plus, 
  Minus, 
  CreditCard, 
  User, 
  Ticket,
  Printer,
  X,
  ShoppingCart,
  PlusCircle,
  History as HistoryIcon,
  Check,
  Package,
  Tag,
  Briefcase,
  Banknote,
  Download,
  Building2,
  ChevronRight,
  AlertTriangle
} from 'lucide-react';
import { AppState, Product, Sale, SaleItem, PaymentAccount } from '../types';
import { numberToWords } from '../utils/numberToWords';

interface Props {
  state: AppState;
  onAddSale: (sale: Sale) => void;
  onUpdateProducts: (products: Product[]) => void;
  onLogAudit: (section: string, action: string, details: string) => void;
  onUpdateConfig: (newConfig: Partial<AppState['config']>, section: string, details: string) => void;
}

const POS: React.FC<Props> = ({ state, onAddSale, onUpdateProducts, onLogAudit, onUpdateConfig }) => {
  const symbol = state.currency.symbol;
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<SaleItem[]>(() => {
    const saved = localStorage.getItem('pos_draft_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedCustomer, setSelectedCustomer] = useState(() => {
    const saved = localStorage.getItem('pos_draft_customer');
    if (saved) {
      const parsed = JSON.parse(saved);
      return state.customers.find(c => c.id === parsed.id) || state.customers[0];
    }
    return state.customers[0];
  });
  const [showCheckout, setShowCheckout] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showModuleAudit, setShowModuleAudit] = useState(false);
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'bank_transfer'>('cash');
  const [selectedBank, setSelectedBank] = useState<PaymentAccount | null>(null);

  // Auto-save draft
  useEffect(() => {
    localStorage.setItem('pos_draft_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('pos_draft_customer', JSON.stringify(selectedCustomer));
  }, [selectedCustomer]);

  // Quick Add Form State
  const [quickAddForm, setQuickAddForm] = useState({
    name: '',
    price: 0,
    stock: 0,
    category: state.categories[0]?.name || '',
    brand: state.brands[0]?.name || ''
  });

  const filteredProducts = useMemo(() => {
    return state.products.filter(p => 
      p.isVisible && p.status === 'active' && (
        p.name.toLowerCase().includes(search.toLowerCase()) || 
        p.sku.toLowerCase().includes(search.toLowerCase())
      )
    );
  }, [state.products, search]);

  const addToCart = (product: Product) => {
    if (product.stock <= 0) return;
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price }
            : item
        );
      }
      return [...prev, {
        productId: product.id,
        name: product.name,
        quantity: 1,
        price: product.price,
        total: product.price
      }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    const product = state.products.find(p => p.id === productId);
    setCart(prev => prev.map(item => {
      if (item.productId === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        // Check if new quantity exceeds stock
        if (product && newQty > product.stock) {
           alert(`Cannot exceed available stock (${product.stock})`);
           return item;
        }
        return { ...item, quantity: newQty, total: newQty * item.price };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const total = cart.reduce((acc, item) => acc + item.total, 0);

  const handleCheckout = () => {
    const sale: Sale = {
      id: `SALE-${Date.now()}`,
      customerId: selectedCustomer.id,
      items: cart,
      subtotal: total,
      total,
      date: new Date().toISOString(),
      status: 'pending',
      paymentMethod: paymentMethod,
      paymentDetails: paymentMethod === 'bank_transfer' && selectedBank 
        ? `${selectedBank.provider} (${selectedBank.accountNumber})`
        : undefined
    };

    const itemSummary = cart.map(i => `${i.name} (x${i.quantity})`).join(', ');
    onLogAudit('POS', 'Transaction Finalized', `Sale #${sale.id.slice(-6)}: ${itemSummary}. Method: ${paymentMethod}${sale.paymentDetails ? ` - ${sale.paymentDetails}` : ''}. Total: ${symbol}${total.toLocaleString()}`);

    const newProducts = state.products.map(p => {
      const cartItem = cart.find(item => item.productId === p.id);
      if (cartItem) {
        return { ...p, stock: p.stock - cartItem.quantity };
      }
      return p;
    });

    onUpdateProducts(newProducts);
    onAddSale(sale);
    setLastSale(sale);
    setCart([]);
    localStorage.removeItem('pos_draft_cart');
    setShowCheckout(false);
    setShowReceipt(true);
    // Reset state for next sale
    setSelectedBank(null);
    setPaymentMethod('cash');
  };

  const handleQuickAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = `PROD-QUICK-${Date.now()}`;
    const newProduct: Product = {
      id: newId,
      sku: `SKU-${Date.now().toString().slice(-6)}`,
      name: quickAddForm.name,
      price: quickAddForm.price,
      cost: quickAddForm.price * 0.7, 
      stock: quickAddForm.stock,
      category: quickAddForm.category,
      brand: quickAddForm.brand,
      isVisible: true,
      status: 'active',
      history: [{
        id: `HIST-${Date.now()}`,
        date: new Date().toISOString(),
        type: 'initial',
        quantity: quickAddForm.stock,
        newStock: quickAddForm.stock,
        performer: state.adminUser.name,
        note: 'Quick added via POS'
      }]
    };

    onUpdateProducts([newProduct, ...state.products]);
    onLogAudit('POS', 'Quick Add Product', `Created item: ${newProduct.name} directly from POS screen.`);
    
    if (newProduct.stock > 0) {
      addToCart(newProduct);
    }

    setQuickAddForm({
      name: '',
      price: 0,
      stock: 0,
      category: state.categories[0]?.name || '',
      brand: state.brands[0]?.name || ''
    });
    setShowQuickAdd(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const posAudit = state.settingsHistory.filter(h => h.section === 'POS');

  return (
    <div className="flex h-[calc(100vh-120px)] gap-6 animate-in fade-in duration-500">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="mb-6 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Search products by name or SKU..."
              className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.value || (e.target as HTMLInputElement).value)}
            />
          </div>
          <button 
            onClick={() => setShowQuickAdd(true)}
            className="px-6 text-white rounded-2xl flex items-center gap-2 font-bold transition-all shadow-lg active:scale-95"
            style={{ backgroundColor: state.config.primaryColor, boxShadow: `0 10px 15px -3px ${state.config.primaryColor}33` }}
          >
            <PlusCircle size={20} />
            <span className="hidden lg:inline">Quick Add</span>
          </button>
          <button 
            onClick={() => setShowTransactionHistory(true)}
            className="px-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 rounded-2xl flex items-center gap-2 font-bold hover:text-indigo-600 transition-all shadow-sm"
            title="Recent Transactions"
          >
            <HistoryIcon size={20} />
            <span className="hidden lg:inline">History</span>
          </button>
          <button 
            onClick={() => setShowModuleAudit(true)}
            className="px-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 rounded-2xl flex items-center gap-2 font-bold hover:text-indigo-600 transition-all shadow-sm"
            title="POS Sale History"
          >
            <Check size={20} />
            <span className="hidden lg:inline">Activity</span>
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pr-2">
          {filteredProducts.map(product => (
            <button
              key={product.id}
              onClick={() => addToCart(product)}
              disabled={product.stock <= 0}
              className={`p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-all hover:shadow-lg hover:scale-[1.02] text-left group flex flex-col ${product.stock <= 0 ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <div className="relative aspect-square mb-4 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-700 flex items-center justify-center">
                <img src={product.image || `https://picsum.photos/200/200?seed=${product.id}`} alt={product.name} className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                  <span className={`px-2 py-1 rounded-md text-[10px] font-bold shadow-sm backdrop-blur-sm ${product.stock < state.config.lowStockThreshold ? 'bg-rose-500 text-white animate-pulse' : 'bg-white/90 dark:bg-slate-800/90'}`}>
                    STOCK: {product.stock}
                  </span>
                </div>
              </div>
              <h4 className="font-semibold text-sm line-clamp-1 mb-1">{product.name}</h4>
              <p className="text-xs text-slate-500 mb-2">{product.category}</p>
              <div className="mt-auto flex items-center justify-between">
                <span className="font-bold" style={{ color: state.config.primaryColor }}>{symbol}{product.price.toLocaleString()}</span>
                <div className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: state.config.primaryColor }}>
                  <Plus size={16} className="text-white" />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="w-96 flex flex-col bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">Current Order</h3>
            <button onClick={() => setCart([])} className="text-xs font-medium text-rose-500 hover:text-rose-600">Clear Cart</button>
          </div>
          <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
            <User size={20} className="text-slate-400" />
            <select className="bg-transparent text-sm font-semibold flex-1 outline-none" value={selectedCustomer.id} onChange={(e) => {
              const customer = state.customers.find(c => c.id === e.target.value)!;
              setSelectedCustomer(customer);
              onUpdateConfig({ lastSelectedCustomerId: customer.id }, 'POS', `Selected customer ${customer.name} for AI analysis`);
            }}>
              {state.customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3 opacity-60">
              <ShoppingCart size={48} />
              <p className="text-sm font-medium">Your cart is empty</p>
            </div>
          ) : (
            cart.map(item => {
              const product = state.products.find(p => p.id === item.productId);
              const isLowStock = product && product.stock < state.config.lowStockThreshold;
              
              return (
                <div key={item.productId} className="flex gap-4 p-3 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-900/40 transition-all bg-white dark:bg-slate-800/50 group">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-bold text-sm truncate pr-2">{item.name}</h5>
                      <button 
                        onClick={() => removeFromCart(item.productId)} 
                        className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all"
                        title="Remove from cart"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <p className="text-xs font-black" style={{ color: state.config.primaryColor }}>{symbol}{item.total.toLocaleString()}</p>
                        {isLowStock && (
                          <div className="flex items-center gap-1 mt-1 text-amber-600 dark:text-amber-500 animate-pulse">
                            <AlertTriangle size={12} />
                            <span className="text-[10px] font-bold uppercase tracking-tight">Low Stock Alert ({product.stock})</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 rounded-xl px-2.5 py-1.5">
                        <button onClick={() => updateQuantity(item.productId, -1)} className="p-1 hover:bg-white dark:hover:bg-slate-600 rounded-lg shadow-sm transition-all"><Minus size={14} /></button>
                        <span className="text-sm font-black min-w-[24px] text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.productId, 1)} className="p-1 hover:bg-white dark:hover:bg-slate-600 rounded-lg shadow-sm transition-all"><Plus size={14} /></button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        <div className="p-6 bg-slate-50 dark:bg-slate-700/30 border-t border-slate-200 dark:border-slate-700 space-y-3">
          <div className="flex items-center justify-between text-lg font-bold pt-2">
            <span>Total</span>
            <span style={{ color: state.config.primaryColor }}>{symbol}{total.toLocaleString()}</span>
          </div>
          <button 
            disabled={cart.length === 0} 
            onClick={() => setShowCheckout(true)} 
            className="w-full hover:brightness-110 disabled:bg-slate-400 text-white font-bold py-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 mt-4"
            style={{ backgroundColor: state.config.primaryColor }}
          >
            <CreditCard size={20} />
            Checkout Now
          </button>
        </div>
      </div>

      {/* Quick Add Modal */}
      {showQuickAdd && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <PlusCircle className="text-indigo-600" size={24} style={{ color: state.config.primaryColor }} />
                <h3 className="font-bold text-xl">Quick Add Product</h3>
              </div>
              <button onClick={() => setShowQuickAdd(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleQuickAddSubmit} className="p-8 space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Product Name</label>
                <div className="relative">
                  <input 
                    required 
                    type="text"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500/50"
                    placeholder="e.g. Wireless Mouse"
                    value={quickAddForm.name}
                    onChange={e => setQuickAddForm({...quickAddForm, name: e.target.value})}
                  />
                  <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Price ({symbol})</label>
                  <input 
                    required 
                    type="number"
                    step="0.01"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500/50"
                    value={quickAddForm.price}
                    onChange={e => setQuickAddForm({...quickAddForm, price: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Initial Stock</label>
                  <input 
                    required 
                    type="number"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500/50"
                    value={quickAddForm.stock}
                    onChange={e => setQuickAddForm({...quickAddForm, stock: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Category</label>
                  <div className="relative">
                    <select 
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border rounded-xl font-bold text-sm outline-none appearance-none cursor-pointer"
                      value={quickAddForm.category}
                      onChange={e => setQuickAddForm({...quickAddForm, category: e.target.value})}
                    >
                      {state.categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                    </select>
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Manufacturer Brand</label>
                  <div className="relative">
                    <select 
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border rounded-xl font-bold text-sm outline-none appearance-none cursor-pointer"
                      value={quickAddForm.brand}
                      onChange={e => setQuickAddForm({...quickAddForm, brand: e.target.value})}
                    >
                      {state.brands.map(brand => <option key={brand.id} value={brand.name}>{brand.name}</option>)}
                    </select>
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button 
                  type="submit" 
                  className="w-full py-4 text-white font-black rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 hover:brightness-110 active:scale-95"
                  style={{ backgroundColor: state.config.primaryColor }}
                >
                  <Check size={20} />
                  Confirm & Add to Cart
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showModuleAudit && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Check className="text-indigo-600" size={24} style={{ color: state.config.primaryColor }} />
                <h3 className="font-bold text-xl">POS Sales Audit Log</h3>
              </div>
              <button onClick={() => setShowModuleAudit(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {posAudit.length === 0 ? (
                <div className="py-20 text-center text-slate-400 italic">No retail transactions recorded in history.</div>
              ) : (
                posAudit.map((h) => (
                  <div key={h.id} className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-2xl border border-slate-100 dark:border-slate-700 relative overflow-hidden">
                    <div className="w-1 h-full absolute left-0 top-0" style={{ backgroundColor: state.config.primaryColor }}></div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <p className="font-black text-xs uppercase" style={{ color: state.config.primaryColor }}>{h.action}</p>
                        <span className="text-[9px] text-slate-400 font-mono uppercase font-black">{new Date(h.date).toLocaleString()}</span>
                      </div>
                      <p className="text-sm font-medium mb-1">{h.details}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">By: {h.performer}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {showTransactionHistory && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <HistoryIcon className="text-indigo-600" size={24} style={{ color: state.config.primaryColor }} />
                <h3 className="font-bold text-xl">Transaction History</h3>
              </div>
              <button onClick={() => setShowTransactionHistory(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-slate-50 dark:bg-slate-900 z-10">
                  <tr>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Date</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Customer</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Items</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {state.sales.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-20 text-center text-slate-400 italic">No transactions found.</td>
                    </tr>
                  ) : (
                    [...state.sales].reverse().map((sale) => {
                      const customer = state.customers.find(c => c.id === sale.customerId);
                      return (
                        <tr key={sale.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                          <td className="p-4">
                            <p className="text-xs font-bold">{new Date(sale.date).toLocaleDateString()}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{new Date(sale.date).toLocaleTimeString()}</p>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold">
                                {customer?.name.charAt(0)}
                              </div>
                              <span className="text-xs font-bold">{customer?.name || 'Unknown'}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1">
                              {sale.items.map(i => i.name).join(', ')}
                            </p>
                            <p className="text-[10px] font-bold text-slate-400">{sale.items.length} items</p>
                          </td>
                          <td className="p-4 text-right">
                            <span className="text-sm font-black" style={{ color: state.config.primaryColor }}>
                              {symbol}{sale.total.toLocaleString()}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {showCheckout && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 p-8 flex flex-col gap-6">
            <div className="text-center">
              <h3 className="font-bold text-xl mb-1">Finalize Transaction</h3>
              <p className="text-slate-500 text-sm">Customer: {selectedCustomer.name}</p>
              <p className="text-4xl font-black mt-4" style={{ color: state.config.primaryColor }}>{symbol}{total.toLocaleString()}</p>
            </div>

            <div className="space-y-4">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Payment Method</label>
              <div className="grid grid-cols-3 gap-3">
                 <button 
                  onClick={() => { setPaymentMethod('cash'); setSelectedBank(null); }} 
                  className={`py-4 rounded-2xl border-2 font-bold transition-all flex flex-col items-center gap-2 ${paymentMethod === 'cash' ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-100 dark:border-slate-700 text-slate-400 hover:border-slate-200'}`}
                  style={paymentMethod === 'cash' ? { borderColor: state.config.primaryColor, color: state.config.primaryColor, backgroundColor: `${state.config.primaryColor}11` } : {}}
                 >
                   <Banknote size={24} />
                   <span className="text-xs">Cash</span>
                 </button>
                 <button 
                  onClick={() => { setPaymentMethod('card'); setSelectedBank(null); }} 
                  className={`py-4 rounded-2xl border-2 font-bold transition-all flex flex-col items-center gap-2 ${paymentMethod === 'card' ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-100 dark:border-slate-700 text-slate-400 hover:border-slate-200'}`}
                  style={paymentMethod === 'card' ? { borderColor: state.config.primaryColor, color: state.config.primaryColor, backgroundColor: `${state.config.primaryColor}11` } : {}}
                 >
                   <CreditCard size={24} />
                   <span className="text-xs">Card</span>
                 </button>
                 <button 
                  onClick={() => setPaymentMethod('bank_transfer')} 
                  className={`py-4 rounded-2xl border-2 font-bold transition-all flex flex-col items-center gap-2 ${paymentMethod === 'bank_transfer' ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-100 dark:border-slate-700 text-slate-400 hover:border-slate-200'}`}
                  style={paymentMethod === 'bank_transfer' ? { borderColor: state.config.primaryColor, color: state.config.primaryColor, backgroundColor: `${state.config.primaryColor}11` } : {}}
                 >
                   <Building2 size={24} />
                   <span className="text-xs">Transfer</span>
                 </button>
              </div>
            </div>

            {paymentMethod === 'bank_transfer' && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Target Bank Account</label>
                <div className="space-y-2">
                  {state.paymentAccounts.length === 0 ? (
                    <p className="text-xs text-rose-500 font-bold bg-rose-50 p-3 rounded-xl">No bank accounts configured in settings!</p>
                  ) : (
                    state.paymentAccounts.map(bank => (
                      <button 
                        key={bank.id}
                        onClick={() => setSelectedBank(bank)}
                        className={`w-full p-4 rounded-2xl border flex items-center justify-between transition-all ${selectedBank?.id === bank.id ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20' : 'border-slate-100 dark:border-slate-700 hover:border-slate-200'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${selectedBank?.id === bank.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-700'}`}>
                            <Building2 size={16} />
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-bold">{bank.provider}</p>
                            <p className="text-[10px] text-slate-500">{bank.accountNumber} • {bank.accountName}</p>
                          </div>
                        </div>
                        {selectedBank?.id === bank.id && <Check size={18} className="text-indigo-600" />}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
              <button 
                onClick={handleCheckout} 
                disabled={paymentMethod === 'bank_transfer' && !selectedBank}
                className="w-full text-white font-bold py-4 rounded-2xl transition-all shadow-lg hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: state.config.primaryColor }}
              >
                Complete Payment
              </button>
              <button onClick={() => { setShowCheckout(false); setPaymentMethod('cash'); setSelectedBank(null); }} className="w-full bg-slate-100 dark:bg-slate-700 text-slate-500 font-bold py-4 rounded-2xl">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceipt && lastSale && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md overflow-y-auto no-print">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between no-print">
              <h3 className="font-bold">Transaction Successful</h3>
              <button onClick={() => setShowReceipt(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900/50 p-6">
              <div id="printable-pos-receipt" className="bg-white p-6 shadow-sm border border-slate-200 text-slate-800" style={{ width: '80mm', margin: '0 auto', fontFamily: 'monospace' }}>
                <div className="text-center mb-6 border-b-2 border-dashed border-slate-300 pb-4">
                  <h2 className="text-xl font-black uppercase mb-1">{state.config.storeName}</h2>
                  <p className="text-[10px] font-bold text-slate-500">{state.config.receiptHeader}</p>
                </div>

                <div className="text-[10px] space-y-1 mb-4">
                  <div className="flex justify-between">
                    <span>DATE:</span>
                    <span className="font-bold">{new Date(lastSale.date).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ORDER ID:</span>
                    <span className="font-bold">#{lastSale.id.slice(-6)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>CUSTOMER:</span>
                    <span className="font-bold uppercase">{state.customers.find(c => c.id === lastSale.customerId)?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>PAYMENT:</span>
                    <span className="font-bold uppercase">{lastSale.paymentMethod.replace('_', ' ')}</span>
                  </div>
                  {lastSale.paymentDetails && (
                    <div className="flex justify-between">
                      <span>DETAILS:</span>
                      <span className="font-bold uppercase">{lastSale.paymentDetails}</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-b border-dashed border-slate-300 py-2 mb-4">
                  <div className="grid grid-cols-6 text-[10px] font-black uppercase mb-1">
                    <span className="col-span-3">Item</span>
                    <span className="text-center">Qty</span>
                    <span className="text-right col-span-2">Price</span>
                  </div>
                  <div className="space-y-1">
                    {lastSale.items.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-6 text-[10px] font-medium">
                        <span className="col-span-3 truncate">{item.name}</span>
                        <span className="text-center">x{item.quantity}</span>
                        <span className="text-right col-span-2">{symbol}{item.total.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-1 border-b-2 border-dashed border-slate-300 pb-4 mb-4">
                  <div className="flex justify-between text-[11px] font-black">
                    <span>TOTAL:</span>
                    <span className="text-indigo-600">{symbol}{lastSale.total.toLocaleString()}</span>
                  </div>
                  <div className="text-[8px] font-bold text-slate-500 uppercase mt-1">
                    Amount in words: {numberToWords(lastSale.total)} {state.currency.code} Only
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-[10px] font-bold text-slate-500">{state.config.receiptFooter}</p>
                  <div className="mt-4 pt-4 border-t border-dashed border-slate-200">
                    <p className="text-[8px] text-slate-400">THANK YOU FOR YOUR BUSINESS</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-slate-700 flex gap-3 no-print">
              <button 
                onClick={handlePrint}
                className="flex-1 bg-indigo-600 text-white py-3 rounded-2xl font-bold shadow-lg hover:brightness-110 flex items-center justify-center gap-2"
                style={{ backgroundColor: state.config.primaryColor }}
              >
                <Printer size={18} />
                Print Receipt
              </button>
              <button 
                onClick={() => setShowReceipt(false)}
                className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-500 rounded-2xl font-bold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printing Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-pos-receipt, #printable-pos-receipt * {
            visibility: visible;
          }
          #printable-pos-receipt {
            position: fixed;
            left: 50%;
            top: 0;
            transform: translateX(-50%);
            width: 80mm;
            padding: 0;
            margin: 0;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default POS;
