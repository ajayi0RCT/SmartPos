
import React, { useState, useEffect } from 'react';
import { AppState, Sale, Product, SaleItem } from '../types';
import { Plus, Trash2, Printer, Save, User, Package, FileText, CheckCircle, History as HistoryIcon, X, Download, Settings, AlertCircle } from 'lucide-react';
import { numberToWords } from '../utils/numberToWords';

interface Props {
  state: AppState;
  onAddSale: (sale: Sale) => void;
  onUpdateProducts: (products: Product[]) => void;
  onLogAudit: (section: string, action: string, details: string) => void;
  onUpdateConfig: (cfg: Partial<AppState['config']>) => void;
  onUpdateAccount: (acc: Partial<AppState['businessAccount']>) => void;
}

const CreateInvoice: React.FC<Props> = ({ state, onAddSale, onUpdateProducts, onLogAudit, onUpdateConfig, onUpdateAccount }) => {
  const symbol = state.currency.symbol;
  const [selectedCustomerId, setSelectedCustomerId] = useState(() => {
    return localStorage.getItem('invoice_draft_customer_id') || state.customers[0]?.id || '';
  });
  const [invoiceItems, setInvoiceItems] = useState<SaleItem[]>(() => {
    const saved = localStorage.getItem('invoice_draft_items');
    return saved ? JSON.parse(saved) : [];
  });
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>(() => {
    return (localStorage.getItem('invoice_draft_payment_method') as any) || 'cash';
  });
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [showReceiptPreview, setShowReceiptPreview] = useState(false);
  const [lastCreatedSale, setLastCreatedSale] = useState<Sale | null>(null);
  const [stockError, setStockError] = useState<string | null>(null);

  // Editable Header State
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [headerForm, setHeaderForm] = useState({
    name: state.businessAccount.name,
    address: state.businessAccount.address,
    logo: state.businessAccount.logo || '',
    signature: state.businessAccount.signature || ''
  });

  // Auto-save draft
  useEffect(() => {
    localStorage.setItem('invoice_draft_items', JSON.stringify(invoiceItems));
  }, [invoiceItems]);

  useEffect(() => {
    localStorage.setItem('invoice_draft_customer_id', selectedCustomerId);
  }, [selectedCustomerId]);

  useEffect(() => {
    localStorage.setItem('invoice_draft_payment_method', paymentMethod);
  }, [paymentMethod]);

  const addItem = (productId: string) => {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;
    setInvoiceItems(prev => {
      const existing = prev.find(item => item.productId === productId);
      if (existing) return prev;
      return [...prev, {
        productId: product.id,
        name: product.name,
        quantity: 1,
        price: product.price,
        total: product.price
      }];
    });
  };

  const updateQuantity = (productId: string, qty: number) => {
    setInvoiceItems(prev => prev.map(item => {
      if (item.productId === productId) {
        const safeQty = Math.max(1, qty);
        return { ...item, quantity: safeQty, total: safeQty * item.price };
      }
      return item;
    }));
  };

  const removeItem = (productId: string) => {
    setInvoiceItems(prev => prev.filter(item => item.productId !== productId));
  };

  const total = invoiceItems.reduce((acc, item) => acc + item.total, 0);

  const numberToWords = (num: number) => {
    return `${num.toLocaleString()} ${state.currency.code} ONLY`.toUpperCase();
  };

  const handleFinalize = () => {
    if (invoiceItems.length === 0) return;

    // Stock Validation
    for (const item of invoiceItems) {
      const product = state.products.find(p => p.id === item.productId);
      if (product && item.quantity > product.stock) {
        setStockError(`Insufficient stock for ${item.name}. Available: ${product.stock}`);
        return;
      }
    }
    setStockError(null);

    const nextNum = state.config.nextInvoiceNumber || 1;
    const invNumber = nextNum.toString().padStart(4, '0');
    const sale: Sale = {
      id: `INV-${invNumber}`,
      customerId: selectedCustomerId,
      items: invoiceItems,
      subtotal: total,
      total,
      date: new Date().toISOString(),
      status: 'pending',
      paymentMethod: paymentMethod as any
    };

    onAddSale(sale);
    const newProducts = state.products.map(p => {
      const item = invoiceItems.find(i => i.productId === p.id);
      if (item) return { ...p, stock: p.stock - item.quantity };
      return p;
    });
    onUpdateProducts(newProducts);
    onUpdateConfig({ nextInvoiceNumber: state.config.nextInvoiceNumber + 1 });
    onLogAudit('Billing', 'Formal Bill Created', `Invoice #${sale.id}`);

    setLastCreatedSale(sale);
    setShowPrintPreview(true);
    setInvoiceItems([]);
    localStorage.removeItem('invoice_draft_items');
  };

  const handlePrint = () => {
    window.print();
  };

  const selectedCustomer = state.customers.find(c => c.id === selectedCustomerId);

  return (
    <div className="max-w-6xl mx-auto pb-12 animate-in fade-in">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg">
            <FileText size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold uppercase tracking-tight">Formal Billing</h2>
            <p className="text-slate-500 text-sm">Designated Professional Grid Invoices</p>
          </div>
        </div>
        <button 
          onClick={() => setIsEditingHeader(true)}
          className="px-6 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-slate-50 transition-all"
        >
          <Settings size={14} /> Edit Bill Header
        </button>
      </div>

      {stockError && (
        <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 rounded-2xl flex items-center gap-3 text-rose-600 animate-in slide-in-from-top-2">
          <AlertCircle size={20} />
          <p className="text-sm font-bold">{stockError}</p>
          <button onClick={() => setStockError(null)} className="ml-auto p-1 hover:bg-rose-100 dark:hover:bg-rose-800 rounded-full"><X size={16}/></button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
              <h3 className="font-bold text-lg">Bill Content</h3>
              <select className="w-full sm:w-64 px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 rounded-xl font-bold text-sm" onChange={(e) => addItem(e.target.value)} value="">
                <option value="" disabled>+ Add product to grid</option>
                {state.products.map(p => <option key={p.id} value={p.id}>{p.name} - {symbol}{p.price}</option>)}
              </select>
            </div>

            <div className="overflow-x-auto border border-slate-100 dark:border-slate-700 rounded-2xl">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-900/50 text-[10px] font-black uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-4">Description</th>
                    <th className="px-4 py-4 text-center w-20">Qty</th>
                    <th className="px-4 py-4 text-right w-28">Rate</th>
                    <th className="px-4 py-4 text-right w-32">Total</th>
                    <th className="px-4 py-4 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700 font-medium">
                  {invoiceItems.length === 0 ? (
                    <tr><td colSpan={5} className="py-20 text-center text-slate-400 italic">No items in bill grid.</td></tr>
                  ) : (
                    invoiceItems.map(item => (
                      <tr key={item.productId} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                        <td className="px-4 py-3 font-bold">{item.name}</td>
                        <td className="px-4 py-3">
                          <input type="number" min="1" className="w-full bg-transparent text-center font-black" value={item.quantity} onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value) || 1)} />
                        </td>
                        <td className="px-4 py-3 text-right">{item.price.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right font-black text-indigo-600">{item.total.toLocaleString()}</td>
                        <td className="px-4 py-3 text-center">
                          <button onClick={() => removeItem(item.productId)} className="text-rose-500"><X size={16}/></button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-700 shadow-sm h-fit">
          <h3 className="font-bold text-lg mb-6">Details</h3>
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Select Customer</label>
              <select className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 rounded-xl font-bold text-sm" value={selectedCustomerId} onChange={(e) => {
                setSelectedCustomerId(e.target.value);
                const customer = state.customers.find(c => c.id === e.target.value);
                if (customer) {
                  onUpdateConfig({ lastSelectedCustomerId: customer.id }, 'Billing', `Selected customer ${customer.name} for AI analysis`);
                }
              }}>
                {state.customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="pt-6 border-t border-slate-100 dark:border-slate-700">
              <div className="flex items-center justify-between mb-6">
                 <span className="text-slate-500 font-bold text-xs uppercase">Total</span>
                 <span className="text-3xl font-black text-indigo-600">{symbol}{total.toLocaleString()}</span>
              </div>
              <div className="grid grid-cols-1 gap-3">
                <button disabled={invoiceItems.length === 0} onClick={handleFinalize} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black shadow-xl disabled:opacity-50 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2">
                   <Save size={20} /> Finalize Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* High-Fidelity REALINK Style Print Preview */}
      {showPrintPreview && lastCreatedSale && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 md:p-4 bg-slate-900/90 backdrop-blur-md overflow-y-auto no-print">
          <div className="bg-white dark:bg-slate-800 w-full max-w-5xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col h-full md:h-auto md:max-h-[95vh]">
            <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between no-print shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-600 text-white rounded-xl"><Printer size={20} /></div>
                <h3 className="font-bold text-lg md:text-xl uppercase tracking-tighter">Formal Bill Preview</h3>
              </div>
              <div className="flex items-center gap-2 md:gap-3">
                <button onClick={() => window.print()} className="bg-indigo-600 text-white px-4 md:px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
                  <Printer size={16} /> <span className="hidden md:inline">Print Bill</span>
                </button>
                <button onClick={() => setShowPrintPreview(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full"><X size={24} /></button>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-b dark:border-slate-700 flex justify-center gap-4 no-print">
              <button 
                onClick={() => { setShowPrintPreview(false); setShowReceiptPreview(true); }}
                className="text-xs font-black uppercase tracking-widest text-indigo-600 hover:underline"
              >
                Switch to 80mm Receipt Format
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-100 dark:bg-slate-900 p-4 md:p-8">
               <div id="printable-formal-invoice" 
                    className={`bg-white text-slate-900 p-6 md:p-12 shadow-2xl mx-auto ${state.config.invoiceTheme === 'compact' ? 'max-w-[148mm]' : ''}`} 
                    style={{ 
                      width: state.config.invoiceTheme === 'compact' ? '148mm' : '210mm', 
                      minHeight: state.config.invoiceTheme === 'compact' ? '210mm' : '297mm', 
                      fontFamily: state.config.invoiceStyle === 'serif' ? 'serif' : state.config.invoiceStyle === 'mono' ? 'monospace' : 'sans-serif' 
                    }}>
                 {/* Branding Header */}
                 <div className={`flex justify-between items-start mb-8 border-b-2 pb-4`} style={{ borderColor: state.config.invoiceColor }}>
                    <div className="flex gap-4 items-start">
                      {state.businessAccount.logo && (
                        <img src={state.businessAccount.logo} alt="Logo" className="w-16 h-16 object-contain" />
                      )}
                      <div>
                        <h1 className="text-3xl font-black mb-1" style={{ fontSize: '32px', color: state.config.invoiceColor }}>{state.businessAccount.name.toUpperCase()}</h1>
                        <p className="text-sm font-bold opacity-80">{state.businessAccount.address.toUpperCase()}</p>
                        <p className="text-xs font-bold opacity-70">TEL: {state.businessAccount.phone}</p>
                      </div>
                    </div>
                    <div className="text-right">
                       <p className="font-bold text-lg mb-1">{new Date(lastCreatedSale.date).toLocaleDateString()}</p>
                       <div className="text-white px-6 py-1.5 font-black uppercase tracking-widest text-lg" style={{ backgroundColor: state.config.invoiceColor }}>OUTSTANDING BILL</div>
                       <p className="text-xs font-bold mt-2">NO: {lastCreatedSale.id}</p>
                    </div>
                 </div>

                 {/* Customer Info */}
                 <div className="mb-6">
                    <div className="border-2 p-3 w-1/2 inline-block" style={{ borderColor: state.config.invoiceColor }}>
                       <p className="text-[10px] font-black uppercase mb-1">BILL TO:</p>
                       <p className="text-base font-bold uppercase">{selectedCustomer?.name}</p>
                       <p className="text-xs">{selectedCustomer?.email}</p>
                       <p className="text-xs">{selectedCustomer?.phone}</p>
                    </div>
                 </div>

                 {/* High-Fidelity Grid Table */}
                 <div className="border-2 mb-4" style={{ borderColor: state.config.invoiceColor }}>
                    <div className="grid grid-cols-10 text-white font-black text-[11px] border-b-2" style={{ backgroundColor: state.config.invoiceColor, borderColor: state.config.invoiceColor }}>
                       <div className="col-span-1 p-2 border-r-2 text-center uppercase" style={{ borderColor: state.config.invoiceColor }}>Date</div>
                       <div className="col-span-5 p-2 border-r-2 text-center uppercase" style={{ borderColor: state.config.invoiceColor }}>Description</div>
                       <div className="col-span-1 p-2 border-r-2 text-center uppercase" style={{ borderColor: state.config.invoiceColor }}>Qty</div>
                       <div className="col-span-1 p-2 border-r-2 text-center uppercase" style={{ borderColor: state.config.invoiceColor }}>Rate</div>
                       <div className="col-span-2 p-2 text-center uppercase">Total</div>
                    </div>
                    
                    {/* Invoice Rows */}
                    {lastCreatedSale.items.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-10 border-b-2 text-xs font-bold min-h-[32px]" style={{ borderColor: state.config.invoiceColor }}>
                        <div className="col-span-1 p-2 border-r-2 text-center" style={{ borderColor: state.config.invoiceColor }}>{new Date(lastCreatedSale.date).toLocaleDateString([], { month: 'numeric', day: 'numeric'})}</div>
                        <div className="col-span-5 p-2 border-r-2 uppercase truncate" style={{ borderColor: state.config.invoiceColor }}>{item.name}</div>
                        <div className="col-span-1 p-2 border-r-2 text-center" style={{ borderColor: state.config.invoiceColor }}>{item.quantity}</div>
                        <div className="col-span-1 p-2 border-r-2 text-right" style={{ borderColor: state.config.invoiceColor }}>{item.price.toLocaleString()}</div>
                        <div className="col-span-2 p-2 text-right">{item.total.toLocaleString()}</div>
                      </div>
                    ))}
                    
                    {/* Empty Grid Placeholder Rows for aesthetic consistency */}
                    {Array.from({ length: Math.max(0, state.config.invoiceTheme === 'compact' ? 8 : 18 - lastCreatedSale.items.length) }).map((_, i) => (
                      <div key={i} className="grid grid-cols-10 border-b-2 h-8" style={{ borderColor: state.config.invoiceColor }}>
                        <div className="col-span-1 border-r-2" style={{ borderColor: state.config.invoiceColor }}></div>
                        <div className="col-span-5 border-r-2" style={{ borderColor: state.config.invoiceColor }}></div>
                        <div className="col-span-1 border-r-2" style={{ borderColor: state.config.invoiceColor }}></div>
                        <div className="col-span-1 border-r-2" style={{ borderColor: state.config.invoiceColor }}></div>
                        <div className="col-span-2"></div>
                      </div>
                    ))}

                    {/* Total Row */}
                    <div className="grid grid-cols-10 font-black text-sm">
                       <div className="col-span-8 p-2 border-r-2 text-right uppercase" style={{ borderColor: state.config.invoiceColor, color: state.config.invoiceColor }}>Total</div>
                       <div className="col-span-2 p-2 text-right" style={{ color: state.config.invoiceColor }}>{symbol}{lastCreatedSale.total.toLocaleString()}</div>
                    </div>
                 </div>

                 {/* Amount in Words Area */}
                 <div className="bg-yellow-300 border-2 p-2 mb-16" style={{ borderColor: state.config.invoiceColor }}>
                    <p className="text-[10px] font-black"><span className="text-red-600">AMOUNT IN WORD:</span> {numberToWords(lastCreatedSale.total).toUpperCase()} {state.currency.code} ONLY</p>
                 </div>

                 {/* Signature Area */}
                 <div className="mt-12 flex justify-start">
                    <div className="text-left">
                       <p className="text-[10px] font-bold uppercase mb-4">FOR: {state.businessAccount.name.toUpperCase()}</p>
                       {state.businessAccount.signature ? (
                         <img src={state.businessAccount.signature} alt="Signature" className="h-12 mb-2 object-contain" />
                       ) : (
                         <div className="w-64 border-b-2 border-slate-900 mb-2"></div>
                       )}
                       <p className="text-sm font-black uppercase">{state.adminUser.name.toUpperCase()}</p>
                    </div>
                 </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* 80mm Receipt Modal */}
      {showReceiptPreview && lastCreatedSale && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md overflow-y-auto no-print">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between no-print">
              <h3 className="font-bold">Receipt Preview</h3>
              <button onClick={() => setShowReceiptPreview(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900/50 p-6">
              <div id="printable-invoice-receipt" className="bg-white p-6 shadow-sm border border-slate-200 text-slate-800" style={{ width: '80mm', margin: '0 auto', fontFamily: 'monospace' }}>
                <div className="text-center mb-6 border-b-2 border-dashed border-slate-300 pb-4">
                  <h2 className="text-xl font-black uppercase mb-1">{state.config.storeName}</h2>
                  <p className="text-[10px] font-bold text-slate-500">{state.config.receiptHeader}</p>
                </div>

                <div className="text-[10px] space-y-1 mb-4">
                  <div className="flex justify-between">
                    <span>DATE:</span>
                    <span className="font-bold">{new Date(lastCreatedSale.date).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>INVOICE ID:</span>
                    <span className="font-bold">#{lastCreatedSale.id.slice(-6)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>CUSTOMER:</span>
                    <span className="font-bold uppercase">{state.customers.find(c => c.id === lastCreatedSale.customerId)?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>PAYMENT:</span>
                    <span className="font-bold uppercase">{lastCreatedSale.paymentMethod}</span>
                  </div>
                </div>

                <div className="border-t border-b border-dashed border-slate-300 py-2 mb-4">
                  <div className="grid grid-cols-6 text-[10px] font-black uppercase mb-1">
                    <span className="col-span-3">Item</span>
                    <span className="text-center">Qty</span>
                    <span className="text-right col-span-2">Price</span>
                  </div>
                  <div className="space-y-1">
                    {lastCreatedSale.items.map((item, idx) => (
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
                    <span className="text-indigo-600">{symbol}{lastCreatedSale.total.toLocaleString()}</span>
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
                onClick={() => { setShowReceiptPreview(false); setShowPrintPreview(true); }}
                className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-500 rounded-2xl font-bold"
              >
                Back to Bill
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Edit Modal */}
      {isEditingHeader && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h3 className="font-bold text-xl">Edit Bill Header</h3>
              <button onClick={() => setIsEditingHeader(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full"><X size={20}/></button>
            </div>
            <div className="p-8 space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Business Name</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border rounded-xl font-bold text-sm outline-none"
                  value={headerForm.name}
                  onChange={e => setHeaderForm({...headerForm, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Address</label>
                <textarea 
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border rounded-xl font-bold text-sm outline-none h-20 resize-none"
                  value={headerForm.address}
                  onChange={e => setHeaderForm({...headerForm, address: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Logo URL</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border rounded-xl font-bold text-sm outline-none"
                  placeholder="https://..."
                  value={headerForm.logo}
                  onChange={e => setHeaderForm({...headerForm, logo: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Signature URL</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border rounded-xl font-bold text-sm outline-none"
                  placeholder="https://..."
                  value={headerForm.signature}
                  onChange={e => setHeaderForm({...headerForm, signature: e.target.value})}
                />
              </div>
              <button 
                onClick={() => {
                  onUpdateAccount(headerForm);
                  setIsEditingHeader(false);
                  onLogAudit('Billing', 'Header Updated', 'Bill header details modified');
                }}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg hover:bg-indigo-700 transition-all"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-formal-invoice, #printable-formal-invoice *, #printable-invoice-receipt, #printable-invoice-receipt * {
            visibility: visible;
          }
          #printable-formal-invoice {
            position: fixed;
            left: 0;
            top: 0;
            width: 210mm;
            height: 297mm;
            margin: 0;
            padding: 10mm;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
          }
          #printable-invoice-receipt {
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

export default CreateInvoice;
