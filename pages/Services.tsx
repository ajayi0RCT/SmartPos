
import React, { useState } from 'react';
import { 
  Wrench, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Search, 
  ChevronRight, 
  Printer, 
  X, 
  Download, 
  Layout, 
  CreditCard,
  User,
  Smartphone
} from 'lucide-react';
import { ServiceJob } from '../types';

interface Props {
  services: ServiceJob[];
  onUpdate: (services: ServiceJob[]) => void;
  symbol: string;
}

const Services: React.FC<Props> = ({ services, onUpdate, symbol }) => {
  const [filter, setFilter] = useState('');
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<ServiceJob | null>(null);
  const [printFormat, setPrintFormat] = useState<'A4' | 'Thermal'>('A4');

  const getStatusStyle = (status: ServiceJob['status']) => {
    switch (status) {
      case 'pending': return { color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', icon: Clock };
      case 'in-progress': return { color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20', icon: Wrench };
      case 'completed': return { color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', icon: CheckCircle2 };
      case 'delivered': return { color: 'text-slate-600', bg: 'bg-slate-100 dark:bg-slate-700', icon: ChevronRight };
    }
  };

  const filtered = services.filter(s => 
    s.customerName.toLowerCase().includes(filter.toLowerCase()) || 
    s.device.toLowerCase().includes(filter.toLowerCase())
  );

  const handleGenerateInvoice = (job: ServiceJob) => {
    setSelectedJob(job);
    setShowInvoiceModal(true);
  };

  const calculateTotal = (job: ServiceJob) => {
    const partsTotal = (job.partsUsed || []).reduce((acc, part) => acc + part.price, 0);
    return partsTotal + (job.laborCharges || 0);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Repair & Services</h2>
          <p className="text-slate-500 text-sm">Track active service tickets and technician progress</p>
        </div>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-medium hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20">
          <Plus size={18} />
          New Job
        </button>
      </div>

      <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {(['all', 'pending', 'in-progress', 'completed'] as const).map(tab => (
          <button key={tab} className="px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 hover:text-indigo-600 transition-all capitalize">
            {tab.replace('-', ' ')}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {filtered.map(job => {
          const style = getStatusStyle(job.status);
          const StatusIcon = style.icon;
          return (
            <div key={job.id} className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-6 relative group overflow-hidden">
               <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${style.bg.split(' ')[0].replace('bg-', 'bg-')}`}></div>
               
               <div className="flex-1">
                 <div className="flex items-center gap-3 mb-4">
                   <div className={`${style.bg} ${style.color} px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5`}>
                     <StatusIcon size={14} />
                     {job.status}
                   </div>
                   <span className="text-xs text-slate-400 font-medium">#{job.id} • {new Date(job.createdAt).toLocaleDateString()}</span>
                 </div>
                 
                 <h4 className="text-lg font-bold mb-1">{job.device}</h4>
                 <p className="text-slate-500 text-sm mb-4 line-clamp-2">{job.problem}</p>
                 
                 <div className="flex flex-wrap gap-4 mt-auto">
                   <div className="flex items-center gap-2">
                     <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold">
                       {job.customerName.charAt(0)}
                     </div>
                     <span className="text-sm font-medium">{job.customerName}</span>
                   </div>
                   <div className="flex items-center gap-2">
                     <Wrench size={16} className="text-slate-400" />
                     <span className="text-sm font-medium">{job.technician}</span>
                   </div>
                 </div>
               </div>

               <div className="md:w-48 flex flex-col justify-between border-l border-slate-100 dark:border-slate-700 md:pl-6">
                 <div className="text-right md:text-left">
                   <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Estimate</p>
                   <p className="text-xl font-black text-indigo-600">{symbol}{calculateTotal(job).toLocaleString()}</p>
                 </div>
                 
                 <div className="flex flex-col gap-2 mt-4">
                   <button 
                     onClick={() => handleGenerateInvoice(job)}
                     className="w-full py-2 bg-slate-900 dark:bg-slate-700 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                   >
                     <Printer size={14} />
                     Generate Invoice
                   </button>
                   <button className="w-full py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors">
                     Print Label
                   </button>
                 </div>
               </div>
            </div>
          );
        })}
      </div>

      {/* Invoice Printing Modal */}
      {showInvoiceModal && selectedJob && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md overflow-y-auto no-print">
          <div className="bg-white dark:bg-slate-800 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between no-print">
              <div className="flex items-center gap-4">
                <h3 className="font-bold text-xl">Service Invoice Preview</h3>
                <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-xl">
                  <button 
                    onClick={() => setPrintFormat('A4')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${printFormat === 'A4' ? 'bg-white dark:bg-slate-600 text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                  >
                    Standard A4
                  </button>
                  <button 
                    onClick={() => setPrintFormat('Thermal')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${printFormat === 'Thermal' ? 'bg-white dark:bg-slate-600 text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                  >
                    Thermal Receipt
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handlePrint}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20"
                >
                  <Printer size={16} />
                  Print Now
                </button>
                <button 
                  onClick={() => setShowInvoiceModal(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className={`bg-white text-slate-900 p-8 mx-auto ${printFormat === 'Thermal' ? 'w-[320px] print:w-[80mm]' : 'w-full print:w-[210mm] min-h-[500px]'}`} id="printable-invoice">
              {/* Invoice Content */}
              <div className="text-center mb-8 border-b pb-8">
                <h1 className="text-3xl font-black text-indigo-600 mb-1">SMARTPOS SERVICE</h1>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Premium Repair & Maintenance Center</p>
                <p className="text-[10px] text-slate-400 mt-2">123 Tech Avenue, Silicon Valley • +1 (555) 000-111</p>
              </div>

              <div className="flex justify-between mb-8">
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Customer</h4>
                  <p className="font-bold">{selectedJob.customerName}</p>
                  <p className="text-xs text-slate-500">{selectedJob.customerPhone || 'N/A'}</p>
                </div>
                <div className="text-right">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Invoice Info</h4>
                  <p className="font-bold">#{selectedJob.id}</p>
                  <p className="text-xs text-slate-500">{new Date(selectedJob.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="mb-8 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Service Description</h4>
                <div className="flex items-start gap-4">
                   <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                      <Smartphone size={18} />
                   </div>
                   <div>
                      <p className="font-bold text-sm">{selectedJob.device}</p>
                      <p className="text-xs text-slate-500 mt-1">{selectedJob.problem}</p>
                   </div>
                </div>
              </div>

              <table className="w-full text-left mb-8">
                <thead className="border-b text-[10px] font-black text-slate-400 uppercase">
                  <tr>
                    <th className="py-2">Item/Service</th>
                    <th className="py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-sm">
                  {(selectedJob.partsUsed || []).map((part, idx) => (
                    <tr key={idx}>
                      <td className="py-3">
                         <span className="block font-medium">{part.name}</span>
                         <span className="text-[10px] text-slate-400">Spare Part</span>
                      </td>
                      <td className="py-3 text-right font-bold">{symbol}{part.price.toFixed(2)}</td>
                    </tr>
                  ))}
                  <tr>
                    <td className="py-3 font-medium">Labor & Technical Charges</td>
                    <td className="py-3 text-right font-bold">{symbol}{(selectedJob.laborCharges || 0).toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-1">
                   <span className="text-xs font-bold text-slate-500 uppercase">Subtotal</span>
                   <span className="font-bold">{symbol}{calculateTotal(selectedJob).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center mb-1">
                   <span className="text-xs font-bold text-slate-500 uppercase">Tax (0%)</span>
                   <span className="font-bold">{symbol}0.00</span>
                </div>
                <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-900">
                   <span className="text-lg font-black uppercase">Total Due</span>
                   <span className="text-2xl font-black text-indigo-600">{symbol}{calculateTotal(selectedJob).toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-12 text-center text-[10px] text-slate-400">
                <p className="font-bold text-slate-600 mb-1">Thank you for choosing SmartPOS Service!</p>
                <p>Repairs are covered under 30-day warranty. Terms and Conditions apply.</p>
                <div className="mt-4 pt-4 border-t flex justify-center gap-4">
                   <span className="font-bold uppercase">PAYMENT: {symbol}{calculateTotal(selectedJob).toFixed(2)}</span>
                   <span className="font-bold">TECH: {selectedJob.technician}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global CSS for Printing */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-invoice, #printable-invoice * {
            visibility: visible;
          }
          #printable-invoice {
            position: fixed;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Services;
