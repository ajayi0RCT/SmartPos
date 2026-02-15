
import React, { useMemo } from 'react';
import { AppState } from '../types';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Package, 
  ArrowUpRight,
  Clock,
  PieChart as PieChartIcon
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

interface Props {
  state: AppState;
}

const Dashboard: React.FC<Props> = ({ state }) => {
  const symbol = state.currency.symbol;
  const threshold = state.config.lowStockThreshold;
  const totalSalesAmount = state.sales.reduce((acc, sale) => acc + sale.total, 0);
  const totalOrders = state.sales.length;
  const totalCustomers = state.customers.length;
  const lowStockCount = state.products.filter(p => p.stock < threshold).length;

  const chartData = [
    { name: 'Mon', sales: 400 },
    { name: 'Tue', sales: 600 },
    { name: 'Wed', sales: 500 },
    { name: 'Thu', sales: 900 },
    { name: 'Fri', sales: 700 },
    { name: 'Sat', sales: 1100 },
    { name: 'Sun', sales: 850 },
  ];

  // Dynamic Sales by Category Calculation
  const categorySalesData = useMemo(() => {
    const categories: Record<string, number> = {};
    
    state.sales.forEach(sale => {
      sale.items.forEach(item => {
        const product = state.products.find(p => p.id === item.productId);
        const cat = product?.category || 'Unknown';
        categories[cat] = (categories[cat] || 0) + item.total;
      });
    });

    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  }, [state.sales, state.products]);

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#10b981', '#f59e0b'];

  const stats = [
    { label: 'Total Revenue', value: `${symbol}${totalSalesAmount.toLocaleString()}`, change: '+12.5%', icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Total Orders', value: totalOrders.toString(), change: '+8.2%', icon: ShoppingCart, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    { label: 'Customers', value: totalCustomers.toString(), change: '+2.4%', icon: Users, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'Low Stock Items', value: lowStockCount.toString(), change: lowStockCount > 0 ? 'Action Needed' : 'Healthy', icon: Package, color: 'text-rose-500', bg: 'bg-rose-500/10' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50 group transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.bg} ${stat.color} p-3 rounded-xl`}>
                <stat.icon size={24} />
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${stat.change.startsWith('+') || stat.change === 'Healthy' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                {stat.change}
              </span>
            </div>
            <div className="space-y-1">
              <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">{stat.label}</h3>
              <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-semibold">Weekly Sales Revenue</h3>
            <div className="flex gap-2">
              <button className="px-3 py-1 text-xs font-medium rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300">Week</button>
              <button className="px-3 py-1 text-xs font-medium rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">Month</button>
            </div>
          </div>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="sales" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50">
          <div className="flex items-center gap-2 mb-8">
            <PieChartIcon size={20} className="text-indigo-500" />
            <h3 className="text-lg font-semibold">Sales Distribution</h3>
          </div>
          <div className="h-[320px]">
            {categorySalesData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categorySalesData}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categorySalesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                    formatter={(value: number) => [`${symbol}${value.toLocaleString()}`, 'Total Revenue']}
                  />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50 space-y-2">
                <PieChartIcon size={48} />
                <p className="text-sm font-medium italic">No sales data to display</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Recent Transactions</h3>
            <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700">View all</button>
          </div>
          <div className="space-y-4">
            {state.sales.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-8 italic">No transactions recorded yet.</p>
            ) : (
              state.sales.slice(0, 5).map((sale) => (
                <div key={sale.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 font-bold">
                      {sale.customerId === '1' ? 'W' : 'C'}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Sale #{sale.id.slice(-4)}</p>
                      <p className="text-xs text-slate-500">{new Date(sale.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm text-emerald-600">+{symbol}{sale.total.toFixed(2)}</p>
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{sale.paymentMethod}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Inventory Alerts</h3>
            <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700">Restock now</button>
          </div>
          <div className="space-y-4">
            {state.products.filter(p => p.stock < threshold).length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-8 italic">All inventory levels are healthy.</p>
            ) : (
              state.products.filter(p => p.stock < threshold).slice(0, 5).map((product) => (
                <div key={product.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                      <Package size={20} className="text-slate-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{product.name}</p>
                      <p className="text-xs text-slate-500">SKU: {product.sku}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm text-rose-500">{product.stock} left</p>
                    <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full mt-1 overflow-hidden">
                      <div className="h-full bg-rose-500" style={{ width: `${(product.stock / threshold) * 100}%` }}></div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
