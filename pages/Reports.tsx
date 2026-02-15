
import React from 'react';
import { AppState } from '../types';
import { FileText, Download, Filter, Printer, Calendar } from 'lucide-react';

interface Props {
  state: AppState;
}

const Reports: React.FC<Props> = ({ state }) => {
  const { sales, currency } = state;
  const symbol = currency.symbol;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Reports & Analysis</h2>
        <div className="flex items-center gap-2">
           <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors">
            <Calendar size={18} />
            Date Range
          </button>
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-medium hover:bg-indigo-700 transition-all">
            <Download size={18} />
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          { label: 'Daily Sales', value: `${symbol}${sales.filter(s => new Date(s.date).toDateString() === new Date().toDateString()).reduce((acc, s) => acc + s.total, 0).toLocaleString()}`, icon: FileText, color: 'text-indigo-600' },
          { label: 'Weekly Revenue', value: `${symbol}${sales.reduce((acc, s) => acc + s.total, 0).toLocaleString()}`, icon: FileText, color: 'text-emerald-600' },
        ].map((item, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
             <div className="flex items-center justify-between mb-2">
               <span className="text-sm font-medium text-slate-500">{item.label}</span>
               <item.icon className={item.color} size={20} />
             </div>
             <p className="text-2xl font-black">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <h3 className="font-bold">Detailed Transactions</h3>
          <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
            <Filter size={18} className="text-slate-400" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 text-xs uppercase font-bold tracking-widest border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-4">Transaction ID</th>
                <th className="px-6 py-4">Date & Time</th>
                <th className="px-6 py-4">Method</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {sales.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">No sales recorded in the selected period.</td>
                </tr>
              ) : (
                sales.map(sale => (
                  <tr key={sale.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-bold">{sale.id}</td>
                    <td className="px-6 py-4 text-sm">{new Date(sale.date).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded-md bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 text-[10px] font-black uppercase tracking-widest">
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-emerald-600">{symbol}{sale.total.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                        <Printer size={18} />
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
