
import React, { useState, useMemo } from 'react';
import { AppState } from '../types';
import { History as HistoryIcon, ShoppingBag, Wrench, Search, ArrowUpRight, Calendar, Filter, Trash2 } from 'lucide-react';

interface Props {
  state: AppState;
  onClear: () => void;
}

const GlobalHistory: React.FC<Props> = ({ state, onClear }) => {
  const [filter, setFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const symbol = state.currency.symbol;

  const combinedHistory = useMemo(() => {
    const saleHistory = state.sales.map(s => {
      const itemsList = s.items.map(i => `${i.name} (x${i.quantity})`).join(', ');
      const paymentInfo = s.paymentDetails ? ` via ${s.paymentDetails}` : '';
      const methodLabel = s.paymentMethod.replace('_', ' ').toUpperCase();
      
      return {
        id: s.id,
        type: 'Sale',
        date: s.date,
        performer: 'POS System',
        description: `Sold to ${state.customers.find(c => c.id === s.customerId)?.name || 'Guest'}: ${itemsList}${paymentInfo}. Paid via ${methodLabel}.`,
        amount: s.total,
        paymentMethod: s.paymentMethod,
        icon: ShoppingBag,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50 dark:bg-emerald-900/20'
      };
    });

    const serviceHistory = state.services.map(sj => ({
      id: sj.id,
      type: 'Service',
      date: sj.createdAt,
      performer: sj.technician,
      description: `Repair for ${sj.device} (${sj.customerName})`,
      amount: sj.laborCharges + (sj.partsUsed || []).reduce((a, b) => a + b.price, 0),
      paymentMethod: 'other', // Services don't explicitly track method in types currently
      icon: Wrench,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50 dark:bg-indigo-900/20'
    }));

    const auditHistory = state.settingsHistory.map(h => ({
      id: h.id,
      type: 'Audit',
      date: h.date,
      performer: h.performer,
      description: `${h.section}: ${h.action} - ${h.details}`,
      amount: 0,
      paymentMethod: 'none',
      icon: HistoryIcon,
      color: 'text-slate-600',
      bg: 'bg-slate-50 dark:bg-slate-900/20'
    }));

    return [...saleHistory, ...serviceHistory, ...auditHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [state.sales, state.services, state.settingsHistory, state.customers]);

  const filtered = combinedHistory.filter(h => {
    const matchesSearch = h.description.toLowerCase().includes(filter.toLowerCase()) ||
                         h.id.toLowerCase().includes(filter.toLowerCase()) ||
                         h.performer.toLowerCase().includes(filter.toLowerCase());
    
    const matchesPayment = paymentFilter === 'all' || (h.type === 'Sale' && h.paymentMethod === paymentFilter);
    
    return matchesSearch && matchesPayment;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-slate-800 text-white rounded-2xl shadow-lg">
            <HistoryIcon size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold">System History</h2>
            <p className="text-slate-500 text-sm">Review a chronological ledger of all business activities</p>
          </div>
        </div>
        <button 
          onClick={onClear}
          className="px-6 py-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-all border border-rose-100 dark:border-rose-800 flex items-center gap-2"
        >
          <Trash2 size={16} />
          Clear All
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by ID, Customer or Description..." 
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-sm font-medium"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <Filter size={16} />
          </div>
          <select 
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="pl-10 pr-10 py-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-sm font-bold text-xs uppercase tracking-widest cursor-pointer appearance-none min-w-[180px]"
          >
            <option value="all">All Methods</option>
            <option value="cash">Cash Only</option>
            <option value="card">Card Only</option>
            <option value="bank_transfer">Bank Transfers</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-700/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700">
              <tr>
                <th className="px-8 py-5">Activity Details</th>
                <th className="px-8 py-5">Date & Time</th>
                <th className="px-8 py-5">Authorized By</th>
                <th className="px-8 py-5 text-right">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center text-slate-400 italic">
                    <div className="flex flex-col items-center gap-3">
                      <HistoryIcon size={40} className="opacity-10" />
                      <p className="font-bold text-sm uppercase tracking-widest opacity-50">No activity records found matching your filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl ${item.bg} ${item.color}`}>
                          <item.icon size={20} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm truncate max-w-md" title={item.description}>{item.description}</p>
                          <p className="text-[10px] font-mono text-slate-400 uppercase font-black">
                            {item.type} • {item.id} 
                            {item.type === 'Sale' && (
                              <span className="ml-2 px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-slate-500 font-bold">
                                {item.paymentMethod.replace('_', ' ')}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-slate-500 text-sm">
                        <Calendar size={14} />
                        <span className="font-medium">{new Date(item.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-sm font-bold uppercase tracking-tight">{item.performer}</p>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <p className={`font-black text-lg ${item.color}`}>{symbol}{item.amount.toLocaleString()}</p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default GlobalHistory;
