
import React, { useState } from 'react';
import { Search, UserPlus, Mail, Phone, MoreHorizontal, DollarSign, X, Check, Edit, Trash2, ShieldAlert } from 'lucide-react';
import { Customer } from '../types';

interface Props {
  customers: Customer[];
  onUpdate: (customers: Customer[]) => void;
  symbol: string;
}

const Customers: React.FC<Props> = ({ customers, onUpdate, symbol }) => {
  const [filter, setFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const initialForm = {
    name: '',
    email: '',
    phone: '',
    creditLimit: 0,
    balance: 0
  };

  const [formData, setFormData] = useState(initialForm);

  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(filter.toLowerCase()) || 
    c.email.toLowerCase().includes(filter.toLowerCase()) ||
    c.phone.includes(filter)
  );

  const handleOpenModal = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        creditLimit: customer.creditLimit,
        balance: customer.balance
      });
    } else {
      setEditingCustomer(null);
      setFormData(initialForm);
    }
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCustomer) {
      onUpdate(customers.map(c => 
        c.id === editingCustomer.id ? { ...c, ...formData } : c
      ));
    } else {
      const newCustomer: Customer = {
        ...formData,
        id: `CUST-${Date.now()}`
      };
      onUpdate([...customers, newCustomer]);
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    // ID '1' is designated for the system-default 'Walking Customer'
    if (id === '1') {
      alert("System Protected: The 'Walking Customer' account cannot be deleted as it is required for Guest/OTC transactions.");
      return;
    }

    if (confirm('Are you sure you want to remove this customer record? This action cannot be undone.')) {
      onUpdate(customers.filter(c => c.id !== id));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Client Directory</h2>
          <p className="text-slate-500 text-sm">Manage your relationships and credit lines</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-medium hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
        >
          <UserPlus size={18} />
          Add Customer
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text" 
          placeholder="Search customers by name, email or phone..." 
          className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/50 outline-none"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.map(customer => {
          const isSystemCustomer = customer.id === '1';
          return (
            <div key={customer.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm group hover:shadow-md transition-all flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl ${isSystemCustomer ? 'bg-indigo-600 text-white' : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600'}`}>
                    {customer.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-lg">{customer.name}</h4>
                      {/* Fix: Wrapped ShieldAlert in a span with title to avoid TypeScript error on icon component */}
                      {isSystemCustomer && <span title="System Account"><ShieldAlert size={16} className="text-indigo-600" /></span>}
                    </div>
                    <p className="text-xs text-slate-500 font-medium truncate max-w-[150px]">
                      ID: {customer.id === '1' ? 'SYSTEM' : customer.id.split('-')[1]}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button 
                    onClick={() => handleOpenModal(customer)}
                    className="p-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-indigo-600 rounded-full transition-colors"
                  >
                    <Edit size={18} />
                  </button>
                  <button 
                    onClick={() => handleDelete(customer.id)}
                    disabled={isSystemCustomer}
                    className={`p-2 rounded-full transition-colors ${isSystemCustomer ? 'text-slate-200 cursor-not-allowed' : 'hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-500'}`}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                  <Mail size={16} className="text-slate-400" />
                  <span className="truncate">{customer.email || 'No email provided'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                  <Phone size={16} className="text-slate-400" />
                  <span>{customer.phone || 'No phone provided'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-700/30 rounded-2xl mt-auto">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Outstanding</p>
                  <p className={`font-bold ${customer.balance > 0 ? 'text-rose-500' : 'text-slate-700 dark:text-slate-300'}`}>
                    {symbol}{customer.balance.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Credit Limit</p>
                  <p className="font-bold text-slate-700 dark:text-slate-300">{symbol}{customer.creditLimit.toLocaleString()}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h3 className="font-bold text-xl">{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Full Name</label>
                <input 
                  required
                  type="text" 
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Email Address</label>
                <input 
                  type="email" 
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Phone Number</label>
                <input 
                  type="tel" 
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Credit Limit ({symbol})</label>
                  <input 
                    type="number" 
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                    value={formData.creditLimit}
                    onChange={e => setFormData({...formData, creditLimit: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Opening Balance ({symbol})</label>
                  <input 
                    type="number" 
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                    value={formData.balance}
                    onChange={e => setFormData({...formData, balance: parseFloat(e.target.value) || 0})}
                  />
                </div>
              </div>

              <div className="pt-4 flex flex-col gap-3">
                <button 
                  type="submit" 
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <Check size={20} />
                  {editingCustomer ? 'Update Customer' : 'Create Customer'}
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="w-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold py-4 rounded-2xl transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
