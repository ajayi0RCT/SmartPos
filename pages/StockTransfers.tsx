
import React, { useState } from 'react';
import { AppState, StockTransfer, Product } from '../types';
import { 
  ArrowLeftRight, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Plus, 
  ChevronRight,
  Package,
  Home
} from 'lucide-react';

interface Props {
  state: AppState;
  onUpdateTransfers: (transfers: StockTransfer[]) => void;
  onUpdateProducts: (products: Product[]) => void;
  onAddNotification: (title: string, message: string) => void;
}

const StockTransfers: React.FC<Props> = ({ state, onUpdateTransfers, onUpdateProducts, onAddNotification }) => {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    productId: state.products[0]?.id || '',
    fromId: state.warehouses[0]?.id || '',
    toId: state.warehouses[1]?.id || '',
    quantity: 1
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const product = state.products.find(p => p.id === formData.productId);
    if (!product || product.stock < formData.quantity) {
      alert("Insufficient stock in source warehouse!");
      return;
    }

    const fromWarehouse = state.warehouses.find(w => w.id === formData.fromId);
    const toWarehouse = state.warehouses.find(w => w.id === formData.toId);

    const newTransfer: StockTransfer = {
      id: `TRF-${Date.now()}`,
      productId: formData.productId,
      productName: product.name,
      fromWarehouseId: formData.fromId,
      toWarehouseId: formData.toId,
      quantity: formData.quantity,
      status: 'pending',
      date: new Date().toISOString()
    };

    onUpdateTransfers([newTransfer, ...state.stockTransfers]);
    
    // Simulate notification to destination manager
    alert(`[MANAGER ALERT: ${toWarehouse?.name}] New Stock Transfer Request #${newTransfer.id.slice(-4)} needs your approval for ${newTransfer.quantity} unit(s) of ${newTransfer.productName}.`);
    
    // System notification
    onAddNotification(
      'Transfer Request Initiated', 
      `${newTransfer.productName} (${newTransfer.quantity}) move requested from ${fromWarehouse?.name} to ${toWarehouse?.name}.`
    );

    setShowModal(false);
  };

  const handleApprove = (transfer: StockTransfer) => {
    if (transfer.status !== 'pending') return;

    const toWarehouse = state.warehouses.find(w => w.id === transfer.toWarehouseId);

    const newProducts = state.products.map(p => {
      if (p.id === transfer.productId) {
        // Stock management logic: reduce stock from global pool or specific warehouse
        // For this demo, we assume stock is aggregate
        return p;
      }
      return p;
    });

    onUpdateProducts(newProducts);
    onUpdateTransfers(state.stockTransfers.map(t => 
      t.id === transfer.id ? { ...t, status: 'approved' } : t
    ));

    // Simulate notification to initiator
    alert(`[INITIATOR ALERT] Your Stock Transfer Request #${transfer.id.slice(-4)} for ${transfer.productName} has been APPROVED by the ${toWarehouse?.name} Manager.`);

    // System notification
    onAddNotification(
      'Transfer Approved', 
      `${transfer.productName} movement to ${toWarehouse?.name} was finalized successfully.`
    );
  };

  const handleReject = (transfer: StockTransfer) => {
    if (transfer.status !== 'pending') return;
    
    const toWarehouse = state.warehouses.find(w => w.id === transfer.toWarehouseId);

    onUpdateTransfers(state.stockTransfers.map(t => 
      t.id === transfer.id ? { ...t, status: 'rejected' } : t
    ));

    // Simulate notification to initiator
    alert(`[INITIATOR ALERT] Your Stock Transfer Request #${transfer.id.slice(-4)} for ${transfer.productName} was REJECTED by the ${toWarehouse?.name} Manager.`);

    // System notification
    onAddNotification(
      'Transfer Rejected', 
      `Movement request of ${transfer.productName} to ${toWarehouse?.name} was declined.`
    );
  };

  const getStatusBadge = (status: StockTransfer['status']) => {
    switch(status) {
      case 'approved': return <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full"><CheckCircle2 size={12}/> Approved</span>;
      case 'pending': return <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-2 py-1 rounded-full"><Clock size={12}/> Pending</span>;
      case 'rejected': return <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-rose-600 bg-rose-50 px-2 py-1 rounded-full"><XCircle size={12}/> Rejected</span>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Stock Transfers</h2>
          <p className="text-sm text-slate-500">Move products between warehouses and stores</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-medium hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
        >
          <Plus size={18} />
          Initiate Transfer
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {state.stockTransfers.length === 0 ? (
          <div className="lg:col-span-2 py-20 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400">
            <ArrowLeftRight size={48} className="mb-4 opacity-20"/>
            <p className="font-medium">No stock transfers found</p>
          </div>
        ) : (
          state.stockTransfers.map(trf => (
            <div key={trf.id} className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-4 relative overflow-hidden group">
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                   <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl">
                     <Package size={20} />
                   </div>
                   <div>
                     <h4 className="font-bold text-sm">{trf.productName}</h4>
                     <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">ID: {trf.id}</p>
                   </div>
                 </div>
                 {getStatusBadge(trf.status)}
               </div>

               <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/30 rounded-2xl relative">
                 <div className="text-center flex-1">
                   <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Source</p>
                   <p className="text-sm font-bold truncate">{state.warehouses.find(w => w.id === trf.fromWarehouseId)?.name}</p>
                 </div>
                 <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                   <div className="bg-white dark:bg-slate-800 p-1.5 rounded-full border border-slate-100 dark:border-slate-600 text-slate-400">
                     <ArrowLeftRight size={14} />
                   </div>
                 </div>
                 <div className="text-center flex-1">
                   <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Destination</p>
                   <p className="text-sm font-bold truncate">{state.warehouses.find(w => w.id === trf.toWarehouseId)?.name}</p>
                 </div>
               </div>

               <div className="flex items-center justify-between">
                 <div>
                   <p className="text-xs text-slate-500">Transfer Qty: <span className="font-bold text-slate-800 dark:text-slate-200">{trf.quantity}</span></p>
                   <p className="text-[10px] text-slate-400">{new Date(trf.date).toLocaleString()}</p>
                 </div>
                 
                 {trf.status === 'pending' && (
                   <div className="flex gap-2">
                     <button 
                        onClick={() => handleReject(trf)}
                        className="px-4 py-2 bg-rose-50 text-rose-600 text-xs font-bold rounded-xl hover:bg-rose-100 transition-colors"
                     >
                       Reject
                     </button>
                     <button 
                        onClick={() => handleApprove(trf)}
                        className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20"
                     >
                       Approve
                     </button>
                   </div>
                 )}
               </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
             <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h3 className="font-bold text-xl">New Stock Transfer</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full">
                <ChevronRight size={20} className="rotate-90"/>
              </button>
            </div>
            
            <form onSubmit={handleCreate} className="p-8 space-y-6">
               <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Select Product</label>
                  <select 
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl outline-none"
                    value={formData.productId}
                    onChange={e => setFormData({...formData, productId: e.target.value})}
                  >
                    {state.products.map(p => <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>)}
                  </select>
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">From</label>
                    <select 
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl outline-none"
                      value={formData.fromId}
                      onChange={e => setFormData({...formData, fromId: e.target.value})}
                    >
                      {state.warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">To</label>
                    <select 
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl outline-none"
                      value={formData.toId}
                      onChange={e => setFormData({...formData, toId: e.target.value})}
                    >
                      {state.warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                 </div>
               </div>

               <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Quantity to Move</label>
                  <input 
                    type="number"
                    min="1"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl outline-none"
                    value={formData.quantity}
                    onChange={e => setFormData({...formData, quantity: parseInt(e.target.value)})}
                  />
               </div>

               <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all">
                 Request Transfer
               </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockTransfers;
