
import React, { useMemo } from 'react';
import { AppState } from '../types';
import { FileText, Download, Filter, Printer, Calendar, PieChart, Users, Wallet } from 'lucide-react';

interface Props {
  state: AppState;
}

const Reports: React.FC<Props> = ({ state }) => {
  const { sales, currency, customers } = state;
  const symbol = currency.symbol;

  const paymentBreakdown = useMemo(() => {
    const methods: Record<string, { count: number; total: number }> = {
      cash: { count: 0, total: 0 },
      card: { count: 0, total: 0 },
      bank_transfer: { count: 0, total: 0 },
      credit: { count: 0, total: 0 }
    };

    sales.forEach(sale => {
      if (methods[sale.paymentMethod]) {
        methods[sale.paymentMethod].count += 1;
        methods[sale.paymentMethod].total += sale.total;
      }
    });

    return Object.entries(methods).map(([method, data]) => ({
      method,
      ...data
    })).filter(d => d.count > 0);
  }, [sales]);

  const customerRankings = useMemo(() => {
    const rankings: Record<string, { total: number; count: number }> = {};
    
    sales.forEach(sale => {
      const cust = customers.find(c => c.id === sale.customerId);
      const name = cust ? cust.name : 'Unknown Customer';
      
      if (!rankings[name]) rankings[name] = { total: 0, count: 0 };
      rankings[name].total += sale.total;
      rankings[name].count += 1;
    });

    return Object.entries(rankings)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [sales, customers]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight">Financial Reports</h2>
          <p className="text-slate-500 text-sm font-medium">Analyze revenue flow, payment performance, and customer lifetime value.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
           <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-xs hover:bg-slate-50 transition-colors">
            <Calendar size={18} className="text-indigo-500" />
            Select Period
          </button>
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-2xl font-bold text-xs hover:bg-slate-800 transition-all shadow-lg">
            <Download size={18} />
            Export Data
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Today\'s Revenue', value: `${symbol}${sales.filter(s => new Date(s.date).toDateString() === new Date().toDateString()).reduce((acc, s) => acc + s.total, 0).toLocaleString()}`, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
          { label: 'Today\'s Sales', value: sales.filter(s => new Date(s.date).toDateString() === new Date().toDateString()).length.toString(), color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          { label: 'Period Gross', value: `${symbol}${sales.reduce((acc, s) => acc + s.total, 0).toLocaleString()}`, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
          { label: 'Period Orders', value: sales.length.toString(), color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-900/20' },
        ].map((item, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
             <div className="flex items-center justify-between mb-4">
               <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{item.label}</span>
               <div className={`p-2 rounded-xl ${item.bg} ${item.color}`}>
                  <FileText size={16} />
               </div>
             </div>
             <p className="text-2xl font-black">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Payment Method Analysis */}
        <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
          <div className="p-8 border-b border-slate-50 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><Wallet size={20} /></div>
               <div>
                  <h3 className="font-bold text-lg">Payment Performance</h3>
                  <p className="text-xs text-slate-500 font-medium">Revenue split by transaction method</p>
               </div>
            </div>
          </div>
          <div className="p-4 flex-1">
             <table className="w-full">
                <thead>
                   <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <th className="px-4 py-3 text-left">Method</th>
                      <th className="px-4 py-3 text-center">Volume</th>
                      <th className="px-4 py-3 text-right">Revenue</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                   {paymentBreakdown.length === 0 ? (
                     <tr><td colSpan={3} className="py-20 text-center text-slate-400 italic font-medium">No financial records yet</td></tr>
                   ) : (
                     paymentBreakdown.map(item => (
                       <tr key={item.method} className="group hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                          <td className="px-4 py-4">
                             <span className="text-sm font-black uppercase tracking-tight text-slate-700 dark:text-slate-300">
                                {item.method.replace('_', ' ')}
                             </span>
                          </td>
                          <td className="px-4 py-4 text-center">
                             <span className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-lg">
                                {item.count} Txns
                             </span>
                          </td>
                          <td className="px-4 py-4 text-right">
                             <span className="text-sm font-black text-emerald-600">
                                {symbol}{item.total.toLocaleString()}
                             </span>
                          </td>
                       </tr>
                     ))
                   )}
                </tbody>
             </table>
          </div>
        </div>

        {/* Top Customers Analysis */}
        <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
          <div className="p-8 border-b border-slate-50 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><Users size={20} /></div>
               <div>
                  <h3 className="font-bold text-lg">Customer Value Rankings</h3>
                  <p className="text-xs text-slate-500 font-medium">High-value clients by period spend</p>
               </div>
            </div>
          </div>
          <div className="p-4 flex-1">
             <table className="w-full">
                <thead>
                   <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <th className="px-4 py-3 text-left">Client</th>
                      <th className="px-4 py-3 text-center">Purchases</th>
                      <th className="px-4 py-3 text-right">Lifetime Val</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                   {customerRankings.length === 0 ? (
                     <tr><td colSpan={3} className="py-20 text-center text-slate-400 italic font-medium">No sales data recorded</td></tr>
                   ) : (
                     customerRankings.map(item => (
                       <tr key={item.name} className="group hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                          <td className="px-4 py-4">
                             <span className="text-sm font-black text-slate-700 dark:text-slate-300">
                                {item.name}
                             </span>
                          </td>
                          <td className="px-4 py-4 text-center">
                             <span className="text-xs font-bold text-slate-500">
                                {item.count}
                             </span>
                          </td>
                          <td className="px-4 py-4 text-right">
                             <span className="text-sm font-black text-indigo-600">
                                {symbol}{item.total.toLocaleString()}
                             </span>
                          </td>
                       </tr>
                     ))
                   )}
                </tbody>
             </table>
          </div>
        </div>
      </div>

      {/* Transaction Log Section */}
      <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/10">
          <h3 className="font-black text-lg uppercase tracking-tight">Ledger Stream</h3>
          <button className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all shadow-sm">
            <Filter size={18} className="text-slate-400" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 text-[10px] uppercase font-black tracking-widest border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-8 py-5">Tx ID</th>
                <th className="px-8 py-5">Timestamp</th>
                <th className="px-8 py-5">Method</th>
                <th className="px-8 py-5">Settlement</th>
                <th className="px-8 py-5 text-right">Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {sales.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center text-slate-400 italic font-medium">Zero activity detected in current period.</td>
                </tr>
              ) : (
                sales.map(sale => (
                  <tr key={sale.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-8 py-5 font-mono text-[10px] font-black uppercase text-indigo-600">#{sale.id.slice(-6)}</td>
                    <td className="px-8 py-5 text-xs font-medium text-slate-600 dark:text-slate-400">
                       {new Date(sale.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                    <td className="px-8 py-5">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 text-[9px] font-black uppercase tracking-tighter">
                        {sale.paymentMethod.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-sm font-black text-emerald-600">{symbol}{sale.total.toLocaleString()}</td>
                    <td className="px-8 py-5 text-right">
                      <button className="p-2 text-slate-300 hover:text-indigo-600 transition-colors bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                        <Printer size={16} />
                      </button>
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

export default Reports;
