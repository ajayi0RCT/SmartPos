
import React, { useState, useRef, useMemo } from 'react';
import { 
  Plus, 
  Search,
  Edit,
  Trash,
  X,
  Camera,
  Package,
  Filter,
  ChevronDown,
  History as HistoryIcon,
  AlertCircle,
  Tag,
  Briefcase,
  LayoutGrid,
  Settings2,
  Box,
  Check,
  ListFilter,
  Layers,
  Zap,
  TrendingUp,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { Product, Category, Brand, StockHistoryEntry, SettingHistoryEntry, AppState, Sale } from '../types';

interface Props {
  products: Product[];
  categories: Category[];
  brands: Brand[];
  onUpdate: (products: Product[]) => void;
  onUpdateCategories: (cats: Category[]) => void;
  onUpdateBrands: (brands: Brand[]) => void;
  symbol: string;
  onLogAudit: (section: string, action: string, details: string) => void;
  history: SettingHistoryEntry[];
  config: AppState['config'];
  // Added state to Props for analytics access
  state: AppState;
}

type StockStatus = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';

const Inventory: React.FC<Props> = ({ products, categories, brands, onUpdate, onUpdateCategories, onUpdateBrands, symbol, onLogAudit, history, config, state }) => {
  const [filter, setFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockStatus, setStockStatus] = useState<StockStatus>('all');
  const [showOnlyLowStock, setShowOnlyLowStock] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newBrandName, setNewBrandName] = useState('');

  const [localStockAdjustments, setLocalStockAdjustments] = useState<Record<string, number>>({});

  // Analytics Calculation
  const inventoryAnalytics = useMemo(() => {
    const productSales: Record<string, number> = {};
    
    // Aggregate units sold from all sales
    state.sales.forEach(sale => {
      sale.items.forEach(item => {
        productSales[item.productId] = (productSales[item.productId] || 0) + item.quantity;
      });
    });

    const analyzed = products.map(p => {
      const totalSold = productSales[p.id] || 0;
      // Turnover = Sold / (Stock + Sold) - Simple ratio for current snapshot
      const turnoverRatio = totalSold / (p.stock + totalSold || 1);
      
      // Suggested Reorder Point: 
      // Rule: (Sold / 10) + buffer if high velocity, else use global threshold
      const suggestedReorder = Math.max(config.lowStockThreshold, Math.ceil(totalSold * 0.2));

      return {
        ...p,
        totalSold,
        turnoverRatio,
        suggestedReorder,
        isFrequentlyOut: totalSold > 5 && p.stock <= 0,
        isHighTurnover: totalSold > 10 || turnoverRatio > 0.5
      };
    });

    return analyzed.sort((a, b) => b.totalSold - a.totalSold);
  }, [products, state.sales, config.lowStockThreshold]);

  const highPriorityItems = inventoryAnalytics.filter(p => p.isFrequentlyOut || (p.stock < p.suggestedReorder && p.totalSold > 0));

  const initialForm = {
    name: '',
    sku: '',
    barcode: '',
    description: '',
    price: 0,
    cost: 0,
    stock: 0,
    category: categories[0]?.name || '',
    subcategory: '',
    brand: brands[0]?.name || '',
    image: '',
    isVisible: true,
    status: 'active' as 'active' | 'inactive',
    color: '',
    size: ''
  };

  const [formData, setFormData] = useState(initialForm);

  const filtered = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(filter.toLowerCase()) || 
                         p.sku.toLowerCase().includes(filter.toLowerCase()) ||
                         (p.barcode && p.barcode.toLowerCase().includes(filter.toLowerCase()));
    
    let matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;

    let matchesStock = true;
    if (showOnlyLowStock) {
      matchesStock = p.stock < config.lowStockThreshold;
    } else {
      if (stockStatus === 'in_stock') matchesStock = p.stock >= config.lowStockThreshold;
      else if (stockStatus === 'low_stock') matchesStock = p.stock > 0 && p.stock < config.lowStockThreshold;
      else if (stockStatus === 'out_of_stock') matchesStock = p.stock <= 0;
    }

    return matchesSearch && matchesStock && matchesCategory;
  });

  const availableSubcategories = useMemo(() => {
    const selectedCat = categories.find(c => c.name === formData.category);
    return selectedCat?.subcategories || [];
  }, [formData.category, categories]);

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        sku: product.sku,
        barcode: product.barcode || '',
        description: product.description || '',
        price: product.price,
        cost: product.cost,
        stock: product.stock,
        category: product.category,
        subcategory: product.subcategory || '',
        brand: product.brand || '',
        image: product.image || '',
        isVisible: product.isVisible,
        status: product.status,
        color: product.color || '',
        size: product.size || ''
      });
    } else {
      setEditingProduct(null);
      setFormData(initialForm);
    }
    setShowModal(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const createHistoryEntry = (type: StockHistoryEntry['type'], quantity: number, newStock: number, note?: string): StockHistoryEntry => ({
    id: `HIST-${Date.now()}`,
    date: new Date().toISOString(),
    type,
    quantity,
    newStock,
    performer: 'Admin User',
    note
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      onUpdate(products.map(p => {
        if (p.id === editingProduct.id) {
          const delta = formData.stock - p.stock;
          const updatedHistory = [...(p.history || [])];
          if (delta !== 0) {
            updatedHistory.push(createHistoryEntry('manual_adj', delta, formData.stock, 'Manual update'));
          }
          return { ...p, ...formData, history: updatedHistory };
        }
        return p;
      }));
    } else {
      const initialStock = formData.stock;
      const newProduct: Product = {
        ...formData,
        id: `PROD-${Date.now()}`,
        image: formData.image || `https://picsum.photos/200/200?seed=${Date.now()}`,
        history: [createHistoryEntry('initial', initialStock, initialStock, 'Product creation')]
      };
      onUpdate([newProduct, ...products]);
    }
    setShowModal(false);
  };

  const handleQuickStockUpdate = (productId: string) => {
    const newVal = localStockAdjustments[productId];
    if (newVal === undefined) return;
    onUpdate(products.map(p => {
      if (p.id === productId) {
        const delta = newVal - p.stock;
        const historyEntry = createHistoryEntry('quick_adj', delta, newVal, 'Quick adjustment');
        return { ...p, stock: newVal, history: [...(p.history || []), historyEntry] };
      }
      return p;
    }));
    const updatedAdjustments = { ...localStockAdjustments };
    delete updatedAdjustments[productId];
    setLocalStockAdjustments(updatedAdjustments);
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in pb-10">
      {/* Configuration Header Area */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl">
            <Settings2 size={24} />
          </div>
          <div>
            <h3 className="font-bold text-lg leading-tight">Entity Management</h3>
            <p className="text-xs text-slate-500">Configure catalog categories and brands</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button 
            onClick={() => setShowAnalytics(!showAnalytics)}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs transition-all border-2 ${showAnalytics ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-700 text-slate-500'}`}
          >
            <TrendingUp size={16} />
            Stock Analytics
          </button>
          <button 
            onClick={() => setShowCategoryModal(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-2xl font-bold text-xs hover:border-indigo-500 transition-all"
          >
            <Tag size={16} className="text-indigo-500" />
            Categories
          </button>
          <button 
            onClick={() => setShowBrandModal(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-2xl font-bold text-xs hover:border-emerald-500 transition-all"
          >
            <Briefcase size={16} className="text-emerald-500" />
            Brands
          </button>
        </div>
      </div>

      {/* Stock Velocity & Turnover Analytics Section */}
      {showAnalytics && (
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 p-6 md:p-8 rounded-[2rem] text-white shadow-2xl animate-in slide-in-from-top-4 duration-500 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
            <Zap size={240} />
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 relative z-10">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 bg-indigo-500 rounded-lg"><Zap size={20} className="text-white" /></div>
                <h3 className="text-2xl font-black tracking-tight">Stock Velocity Analysis</h3>
              </div>
              <p className="text-indigo-200 text-sm font-medium">Identifying high-turnover items and suggesting reorder levels</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center px-6 py-3 bg-white/10 rounded-2xl backdrop-blur-md">
                <p className="text-[10px] font-black uppercase text-indigo-300 mb-1">Critical Restocks</p>
                <p className="text-xl font-black">{highPriorityItems.length}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
            {highPriorityItems.length === 0 ? (
              <div className="col-span-full py-12 text-center bg-white/5 rounded-3xl border border-white/10">
                <Check className="mx-auto mb-2 text-emerald-400" size={32} />
                <p className="font-bold text-indigo-100 uppercase tracking-widest text-xs">All high-turnover items are adequately stocked</p>
              </div>
            ) : (
              highPriorityItems.slice(0, 6).map(item => (
                <div key={item.id} className="bg-white/10 backdrop-blur-md border border-white/10 p-5 rounded-3xl flex flex-col gap-4 group hover:bg-white/15 transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <img src={item.image} className="w-10 h-10 rounded-xl object-cover border border-white/20" alt="" />
                      <div className="min-w-0">
                        <p className="font-bold text-sm truncate">{item.name}</p>
                        <p className="text-[10px] text-indigo-300 font-black uppercase tracking-tighter">{item.category}</p>
                      </div>
                    </div>
                    {item.isFrequentlyOut ? (
                      <span className="flex items-center gap-1 bg-rose-500 text-white text-[9px] font-black px-2 py-1 rounded-lg uppercase animate-pulse">
                        <AlertTriangle size={10} /> Out of Stock
                      </span>
                    ) : (
                      <span className="bg-indigo-500 text-white text-[9px] font-black px-2 py-1 rounded-lg uppercase">
                        High Velocity
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-indigo-200">
                      <span>Recent Sales</span>
                      <span>Stock Level</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-white/10 h-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${item.isFrequentlyOut ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                          style={{ width: `${Math.min(100, (item.stock / item.suggestedReorder) * 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-black">{item.stock} / {item.suggestedReorder}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-black uppercase text-indigo-400">Target Reorder Point</p>
                      <p className="text-sm font-black text-emerald-400">{item.suggestedReorder} Units</p>
                    </div>
                    <button 
                      onClick={() => handleOpenModal(item)}
                      className="p-2 bg-white/10 hover:bg-indigo-600 rounded-xl transition-all"
                    >
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Main Content Actions */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search catalog..." 
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/50 outline-none shadow-sm"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative group">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="pl-10 pr-10 py-2.5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 font-semibold text-xs shadow-sm appearance-none outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all hover:bg-slate-50 cursor-pointer"
              >
                <option value="all">All Categories</option>
                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
              <ListFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500" size={16} />
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            </div>

            <div className="relative group">
              <select
                value={stockStatus}
                onChange={(e) => setStockStatus(e.target.value as StockStatus)}
                className="pl-10 pr-10 py-2.5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 font-semibold text-xs shadow-sm appearance-none outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all hover:bg-slate-50 cursor-pointer"
              >
                <option value="all">All Stock Status</option>
                <option value="in_stock">Healthy Stock</option>
                <option value="low_stock">Low Stock</option>
                <option value="out_of_stock">Empty</option>
              </select>
              <Box className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500" size={16} />
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <p className="hidden xl:block text-[10px] font-black uppercase text-slate-400 tracking-widest whitespace-nowrap">
            Showing {filtered.length} of {products.length} Items
          </p>
          <button onClick={() => handleOpenModal()} className="flex items-center justify-center gap-2 px-6 py-3 text-white rounded-2xl font-bold transition-all shadow-lg active:scale-95" style={{ backgroundColor: config.primaryColor }}>
            <Plus size={18} />
            Add Product
          </button>
        </div>
      </div>

      {/* Table (Hidden on small screens) */}
      <div className="hidden md:block bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 text-[10px] uppercase font-black border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-4">Product Details</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 font-medium text-sm">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-2 opacity-30">
                       <Search size={48} />
                       <p className="font-bold text-sm uppercase tracking-widest">No products match your filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map(product => (
                  <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <img src={product.image} className="w-12 h-12 rounded-xl object-cover border dark:border-slate-600 bg-slate-50" alt="" />
                        <div>
                          <span className="font-bold block">{product.name}</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">{product.sku} • {product.brand}</span>
                          {product.subcategory && <span className="text-[10px] text-indigo-400 font-black uppercase ml-2 flex items-center gap-1 inline-flex"><Layers size={10} /> {product.subcategory}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-[9px] font-black uppercase">{product.category}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                         <input 
                          type="number" 
                          className={`w-16 px-2 py-1 border rounded-lg text-center font-black ${product.stock < config.lowStockThreshold ? 'border-rose-300 text-rose-500 bg-rose-50' : 'border-slate-200 bg-transparent'}`}
                          value={localStockAdjustments[product.id] ?? product.stock}
                          onChange={(e) => setLocalStockAdjustments({...localStockAdjustments, [product.id]: parseInt(e.target.value) || 0})}
                        />
                        {(localStockAdjustments[product.id] !== undefined) && (
                          <button onClick={() => handleQuickStockUpdate(product.id)} className="p-1 bg-indigo-600 text-white rounded-lg shadow-sm"><Check size={14}/></button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-black">{symbol}{product.price.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                         <button onClick={() => handleOpenModal(product)} className="p-2 text-slate-400 hover:text-indigo-600"><Edit size={16} /></button>
                         <button onClick={() => onUpdate(products.filter(p => p.id !== product.id))} className="p-2 text-slate-400 hover:text-rose-500"><Trash size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Entity Modals (Categories/Brands) */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
             <div className="p-6 border-b dark:border-slate-700 flex items-center justify-between">
                <h3 className="font-bold text-xl">Manage Categories</h3>
                <button onClick={() => setShowCategoryModal(false)}><X size={20}/></button>
             </div>
             <div className="p-6 space-y-4">
                <div className="flex gap-2">
                   <input 
                    type="text" 
                    placeholder="New category name"
                    className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-700 rounded-xl outline-none"
                    value={newCategoryName}
                    onChange={e => setNewCategoryName(e.target.value)}
                   />
                   <button 
                    onClick={() => {
                      if (!newCategoryName) return;
                      onUpdateCategories([...categories, { id: Date.now().toString(), name: newCategoryName, subcategories: [] }]);
                      setNewCategoryName('');
                    }}
                    className="p-2 bg-indigo-600 text-white rounded-xl"
                   >
                     <Plus size={20}/>
                   </button>
                </div>
                <div className="max-h-64 overflow-y-auto space-y-2">
                   {categories.map(c => (
                     <div key={c.id} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl flex items-center justify-between">
                        <span className="font-bold text-sm uppercase">{c.name}</span>
                        <button onClick={() => onUpdateCategories(categories.filter(cat => cat.id !== c.id))} className="text-rose-500"><Trash size={14}/></button>
                     </div>
                   ))}
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Add/Edit Product Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h3 className="font-bold text-xl">{editingProduct ? 'Update Inventory' : 'New Catalog Item'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"><X size={20}/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="relative aspect-square rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 group overflow-hidden">
                  {formData.image ? (
                    <>
                      <img src={formData.image} className="w-full h-full object-cover" alt="Preview" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button type="button" onClick={() => setFormData({...formData, image: ''})} className="bg-rose-500 text-white p-2 rounded-xl">
                          <Trash size={16}/>
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-6">
                      <Camera className="mx-auto text-slate-300 mb-2" size={32} />
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Click to upload image</p>
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Product Name</label>
                  <input required className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border-2 border-transparent focus:border-indigo-500 rounded-xl font-bold text-sm outline-none transition-all" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
              </div>
              <div className="space-y-4 flex flex-col">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">SKU</label>
                    <input required className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border rounded-xl font-bold text-xs outline-none" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Quantity</label>
                    <input type="number" required className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border rounded-xl font-black text-sm outline-none" value={formData.stock} onChange={e => setFormData({...formData, stock: parseInt(e.target.value) || 0})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Category</label>
                    <select 
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border rounded-xl font-bold text-xs outline-none appearance-none" 
                      value={formData.category} 
                      onChange={e => {
                        const newCat = e.target.value;
                        setFormData({...formData, category: newCat, subcategory: ''});
                      }}
                    >
                      {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-10 text-slate-400 pointer-events-none" size={14} />
                  </div>
                  <div className="relative">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Subcategory</label>
                    <select 
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border rounded-xl font-bold text-xs outline-none disabled:opacity-50 appearance-none" 
                      value={formData.subcategory} 
                      onChange={e => setFormData({...formData, subcategory: e.target.value})}
                      disabled={availableSubcategories.length === 0}
                    >
                      <option value="">None</option>
                      {availableSubcategories.map((sub, idx) => <option key={idx} value={sub}>{sub}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-10 text-slate-400 pointer-events-none" size={14} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Price ({symbol})</label>
                    <input type="number" step="0.01" required className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border rounded-xl font-black text-sm outline-none" value={formData.price} onChange={e => setFormData({...formData, price: parseFloat(e.target.value) || 0})} />
                  </div>
                  <div className="relative">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Brand</label>
                    <select className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border rounded-xl font-bold text-xs outline-none appearance-none" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})}>
                        {brands.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-10 text-slate-400 pointer-events-none" size={14} />
                  </div>
                </div>
                <div className="pt-6 mt-auto">
                  <button type="submit" className="w-full py-4 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl transition-all hover:brightness-110 active:scale-[0.98]" style={{ backgroundColor: config.primaryColor }}>
                    {editingProduct ? 'Update Product' : 'Register Product'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
