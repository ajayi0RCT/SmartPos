
import React, { useState } from 'react';
import { AppState } from '../types';
import { History as HistoryIcon, ShoppingBag, Wrench, Search, ArrowUpRight, Calendar } from 'lucide-react';

interface Props {
  state: AppState;
}

const GlobalHistory: React.FC<Props> = ({ state }) => {
  const [filter, setFilter] = useState('');
  const symbol = state.currency.symbol;

  const combinedHistory = [
    ...state.sales.map(s => {
      const itemsList = s.items.map(i => `${i.name} (x${i.quantity})`).join(', ');
      const paymentInfo = s.paymentDetails ? ` via ${s.paymentDetails}` : '';
      return {
        id: s.id,
        type: 'Sale',
        date: s.date,
        performer: 'POS System',
        description: `Sold to ${state.customers.find(c => c.id === s.customerId)?.name || 'Guest'}: ${itemsList}${paymentInfo}`,
        amount: s.total,
        icon: ShoppingBag,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50 dark:bg-emerald-900/20'
      };
    }),
    ...state.services.map(sj => ({
      id: sj.id,
      type: 'Service',
      date: sj.createdAt,
      performer: sj.technician,
      description: `Repair for ${sj.device} (${sj.customerName})`,
      amount: sj.laborCharges + (sj.partsUsed || []).reduce((a, b) => a + b.price, 0),
      icon: Wrench,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50 dark:bg-indigo-900/20'
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filtered = combinedHistory.filter(h => 
    h.description.toLowerCase().includes(filter.toLowerCase()) ||
    h.id.toLowerCase().includes(filter.toLowerCase()) ||
    h.performer.toLowerCase().includes(filter.toLowerCase())
  );

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
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text" 
          placeholder="Search by ID, Customer or Description..." 
          className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-sm"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
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
                      <p>No activity records found matching your search.</p>
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
                          <p className="text-[10px] font-mono text-slate-400 uppercase font-black">{item.type} • {item.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-slate-500 text-sm">
                        <Calendar size={14} />
                        <span>{new Date(item.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-sm font-semibold">{item.performer}</p>
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
