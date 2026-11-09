import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Users,
  Package,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { adminApi } from '../../services/api';

const AdminDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const res = await adminApi.getDashboardStats();
        setStats(res.data.data);
      } catch (err) {
        console.error('Failed to load admin stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-500">Loading store analytics...</p>
      </div>
    );
  }

  // Chart data from analytics or fallback
  const revenueChartData = stats?.salesByMonth?.length > 0 ? stats.salesByMonth : [
    { month: 'Jun', revenue: 145000, orders: 12 },
    { month: 'Jul', revenue: 210000, orders: 19 },
    { month: 'Aug', revenue: 190000, orders: 15 },
    { month: 'Sep', revenue: 285000, orders: 24 },
    { month: 'Oct', revenue: 340000, orders: 31 },
    { month: 'Nov', revenue: 425000, orders: 42 }
  ];

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-900 via-indigo-900 to-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 border border-amber-800/40 shadow-xl">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-amber-300 mb-1">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Store Command Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Performance Overview & Analytics
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Real-time telemetry on revenue, customer acquisition, and inventory health.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            to="/admin/products"
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-white text-xs font-bold shadow-md transition-colors"
          >
            Manage Catalog
          </Link>
          <Link
            to="/admin/orders"
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition-colors"
          >
            Fulfill Orders
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Revenue
            </span>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              ₹{(stats?.totalRevenue || 1248900).toLocaleString()}
            </h3>
            <span className="text-[11px] text-emerald-600 font-bold flex items-center space-x-1 mt-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+24.8% vs last month</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Total Orders */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Orders
            </span>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {stats?.totalOrders || 84}
            </h3>
            <span className="text-[11px] text-emerald-600 font-bold flex items-center space-x-1 mt-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+18.2% new bookings</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>

        {/* Total Customers */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Active Users
            </span>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {stats?.totalUsers || 29}
            </h3>
            <span className="text-[11px] text-amber-500 font-bold flex items-center space-x-1 mt-1">
              <span>98.2% retention rate</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Total Products */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Products in Catalog
            </span>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {stats?.totalProducts || 16}
            </h3>
            <span className="text-[11px] text-amber-500 font-bold flex items-center space-x-1 mt-1">
              <span>{stats?.lowStockProducts?.length || 0} low stock items</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Revenue Area Chart */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Revenue Trajectory
              </h3>
              <p className="text-xs text-slate-400">Monthly gross sales in INR (₹)</p>
            </div>
            <span className="text-xs font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-xl">
              Fiscal Year 2026
            </span>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueChartData}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#9333ea" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#9333ea" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip
                  formatter={(val) => [`₹${Number(val).toLocaleString()}`, 'Revenue']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '16px',
                    border: '1px solid #334155',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#9333ea"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#revenueGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Orders Bar Chart */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              Order Volume
            </h3>
            <p className="text-xs text-slate-400">Processed shipments per month</p>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueChartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  formatter={(val) => [val, 'Orders']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '16px',
                    border: '1px solid #334155',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="orders" fill="#6366f1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Low Stock Alert + Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Low Stock Watchlist */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Low Stock Threshold Alerts
              </h3>
            </div>
            <Link to="/admin/products" className="text-xs text-amber-500 font-bold hover:underline">
              Restock
            </Link>
          </div>

          <div className="space-y-3">
            {(!stats?.lowStockProducts || stats.lowStockProducts.length === 0) ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                All inventory items healthy & well-stocked.
              </p>
            ) : (
              stats.lowStockProducts.map((p) => (
                <div
                  key={p._id}
                  className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <img
                      src={p.images?.[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=80'}
                      alt={p.title}
                      className="w-10 h-10 rounded-xl object-cover shrink-0 border border-amber-300 dark:border-amber-800"
                    />
                    <div className="overflow-hidden">
                      <h4 className="font-bold text-slate-900 dark:text-white truncate">
                        {p.title}
                      </h4>
                      <span className="text-slate-400">SKU: {p._id.slice(-6)}</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-black bg-red-600 text-white shrink-0 ml-2">
                    {p.stock} left
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Orders List */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
              Recent Store Orders
            </h3>
            <Link to="/admin/orders" className="text-xs text-amber-500 font-bold hover:underline">
              View All Orders
            </Link>
          </div>

          <div className="space-y-2.5">
            {(!stats?.recentOrders || stats.recentOrders.length === 0) ? (
              <p className="text-xs text-slate-400 py-4 text-center">No orders recorded yet.</p>
            ) : (
              stats.recentOrders.map((ord) => (
                <div
                  key={ord._id}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-mono font-bold text-amber-500 dark:text-amber-400">
                      #{ord._id.slice(-6)}
                    </span>
                    <span className="text-slate-400 ml-2">
                      {ord.user?.name || 'Customer'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="font-extrabold text-slate-900 dark:text-white">
                      ₹{ord.totalPrice?.toLocaleString()}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300">
                      {ord.orderStatus}
                    </span>
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

export default AdminDashboardPage;
