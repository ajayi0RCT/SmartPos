
import React, { useState } from 'react';
import { AppState, Sale, Product, SaleItem } from '../types';
import { Plus, Trash2, Printer, Save, User, Package, FileText, CheckCircle, History as HistoryIcon, X, Download } from 'lucide-react';

interface Props {
  state: AppState;
  onAddSale: (sale: Sale) => void;
  onUpdateProducts: (products: Product[]) => void;
  onLogAudit: (section: string, action: string, details: string) => void;
}

const CreateInvoice: React.FC<Props> = ({ state, onAddSale, onUpdateProducts, onLogAudit }) => {
  const symbol = state.currency.symbol;
  const [selectedCustomerId, setSelectedCustomerId] = useState(state.customers[0]?.id || '');
  const [invoiceItems, setInvoiceItems] = useState<SaleItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [lastCreatedSale, setLastCreatedSale] = useState<Sale | null>(null);

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
    const sale: Sale = {
      id: `INV-${Date.now()}`,
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
    onLogAudit('Billing', 'Formal Bill Created', `Invoice #${sale.id.slice(-4)}`);

    setLastCreatedSale(sale);
    setShowPrintPreview(true);
    setInvoiceItems([]);
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
      </div>

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
              <select className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 rounded-xl font-bold text-sm" value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)}>
                {state.customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="pt-6 border-t border-slate-100 dark:border-slate-700">
              <div className="flex items-center justify-between mb-6">
                 <span className="text-slate-500 font-bold text-xs uppercase">Total</span>
                 <span className="text-3xl font-black text-indigo-600">{symbol}{total.toLocaleString()}</span>
              </div>
              <button disabled={invoiceItems.length === 0} onClick={handleFinalize} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black shadow-xl disabled:opacity-50 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2">
                 <Save size={20} /> Finalize Invoice
              </button>
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

            <div className="flex-1 overflow-y-auto bg-slate-100 dark:bg-slate-900 p-4 md:p-8">
               <div id="printable-formal-invoice" className="bg-white text-slate-900 p-6 md:p-12 shadow-2xl mx-auto" style={{ width: '210mm', minHeight: '297mm', fontFamily: 'serif' }}>
                 {/* Branding Header */}
                 <div className="flex justify-between items-start mb-8 border-b-2 border-blue-800 pb-4">
                    <div>
                      <h1 className="text-3xl font-black text-blue-800 mb-1" style={{ fontSize: '32px' }}>REALINK COMPUTER TECHNOLOGY</h1>
                      <p className="text-sm font-bold text-blue-700">47, LAWANI STREET, ABULE-OJA, YABA</p>
                    </div>
                    <div className="text-right">
                       <p className="font-bold text-lg mb-1">{new Date(lastCreatedSale.date).toLocaleDateString()}</p>
                       <div className="bg-blue-600 text-white px-6 py-1.5 font-black uppercase tracking-widest text-lg">OUTSTANDING BILL</div>
                    </div>
                 </div>

                 {/* Customer Info */}
                 <div className="mb-6">
                    <div className="border-2 border-slate-900 p-3 w-1/2 inline-block">
                       <p className="text-[10px] font-black uppercase mb-1">BILL TO:</p>
                       <p className="text-base font-bold uppercase">{selectedCustomer?.name}</p>
                       <p className="text-xs">{selectedCustomer?.email}</p>
                       <p className="text-xs">{selectedCustomer?.phone}</p>
                    </div>
                 </div>

                 {/* High-Fidelity Grid Table */}
                 <div className="border-2 border-slate-900 mb-4">
                    <div className="grid grid-cols-10 bg-blue-800 text-white font-black text-[11px] border-b-2 border-slate-900">
                       <div className="col-span-1 p-2 border-r-2 border-slate-900 text-center uppercase">Date</div>
                       <div className="col-span-5 p-2 border-r-2 border-slate-900 text-center uppercase">Description</div>
                       <div className="col-span-1 p-2 border-r-2 border-slate-900 text-center uppercase">Qty</div>
                       <div className="col-span-1 p-2 border-r-2 border-slate-900 text-center uppercase">Rate</div>
                       <div className="col-span-2 p-2 text-center uppercase">Total</div>
                    </div>
                    
                    {/* Invoice Rows */}
                    {lastCreatedSale.items.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-10 border-b-2 border-slate-900 text-xs font-bold min-h-[32px]">
                        <div className="col-span-1 p-2 border-r-2 border-slate-900 text-center">{new Date(lastCreatedSale.date).toLocaleDateString([], { month: 'numeric', day: 'numeric'})}</div>
                        <div className="col-span-5 p-2 border-r-2 border-slate-900 uppercase truncate">{item.name}</div>
                        <div className="col-span-1 p-2 border-r-2 border-slate-900 text-center">{item.quantity}</div>
                        <div className="col-span-1 p-2 border-r-2 border-slate-900 text-right">{item.price.toLocaleString()}</div>
                        <div className="col-span-2 p-2 text-right">{item.total.toLocaleString()}</div>
                      </div>
                    ))}
                    
                    {/* Empty Grid Placeholder Rows for aesthetic consistency */}
                    {Array.from({ length: Math.max(0, 18 - lastCreatedSale.items.length) }).map((_, i) => (
                      <div key={i} className="grid grid-cols-10 border-b-2 border-slate-900 h-8">
                        <div className="col-span-1 border-r-2 border-slate-900"></div>
                        <div className="col-span-5 border-r-2 border-slate-900"></div>
                        <div className="col-span-1 border-r-2 border-slate-900"></div>
                        <div className="col-span-1 border-r-2 border-slate-900"></div>
                        <div className="col-span-2"></div>
                      </div>
                    ))}

                    {/* Total Row */}
                    <div className="grid grid-cols-10 font-black text-sm">
                       <div className="col-span-8 p-2 border-r-2 border-slate-900 text-right text-red-600 uppercase">Total</div>
                       <div className="col-span-2 p-2 text-right text-red-600">{symbol}{lastCreatedSale.total.toLocaleString()}</div>
                    </div>
                 </div>

                 {/* Amount in Words Area */}
                 <div className="bg-yellow-300 border-2 border-slate-900 p-2 mb-16">
                    <p className="text-[10px] font-black"><span className="text-red-600">AMOUNT IN WORD:</span> {numberToWords(lastCreatedSale.total)}</p>
                 </div>

                 {/* Signature Area */}
                 <div className="mt-12 flex justify-start">
                    <div className="text-left">
                       <p className="text-[10px] font-bold uppercase mb-4">FOR: REALINK COMPUTER</p>
                       <div className="w-64 border-b-2 border-slate-900 mb-2"></div>
                       <p className="text-sm font-black uppercase">MRS. AJAYI D.F.</p>
                    </div>
                 </div>
               </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-formal-invoice, #printable-formal-invoice * {
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
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default CreateInvoice;
