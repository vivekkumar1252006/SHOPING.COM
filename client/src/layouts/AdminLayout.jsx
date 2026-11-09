import React from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
    LayoutDashboard,
    Package,
    ShoppingBag,
    Users,
    Tag,
    ArrowLeft,
    Sparkles,
    LogOut,
    ShieldCheck,
    Menu,
    X
} from 'lucide-react';
import { logout } from '../redux/slices/authSlice';
import ThemeToggle from '../components/common/ThemeToggle';
import logoImg from '../assets/logo.jpg';

const AdminLayout = () => {
    const { user } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = React.useState(false);

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    const navItems = [
        { name: 'Analytics & KPIs', path: '/admin', icon: LayoutDashboard, end: true },
        { name: 'Products Inventory', path: '/admin/products', icon: Package },
        { name: 'Orders & Status', path: '/admin/orders', icon: ShoppingBag },
        { name: 'Customer Base', path: '/admin/users', icon: Users },
        { name: 'Coupons & Promos', path: '/admin/coupons', icon: Tag },
    ];

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex">
            {/* Mobile Sidebar Backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div>
                    {/* Logo & Close for Mobile */}
                    <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <Link to="/admin" className="flex items-center space-x-2.5">
                            <div className="p-1 px-2.5 rounded-xl bg-white shadow-sm border border-slate-200 flex items-center justify-center">
                                <img src={logoImg} alt="shoping.com" className="h-7 w-auto object-contain" />
                            </div>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-500 text-slate-950">
                                Admin
                            </span>
                        </Link>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Navigation Links */}
                    <nav className="p-4 space-y-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    end={item.end}
                                    onClick={() => setSidebarOpen(false)}
                                    className={({ isActive }) =>
                                        `flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${isActive
                                            ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25'
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-purple-600 dark:hover:text-white'
                                        }`
                                    }
                                >
                                    <Icon className="w-5 h-5" />
                                    <span>{item.name}</span>
                                </NavLink>
                            );
                        })}
                    </nav>
                </div>

                {/* User Card & Logout */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                    <Link
                        to="/"
                        className="flex items-center space-x-2 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline px-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Storefront</span>
                    </Link>

                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                        <div className="overflow-hidden">
                            <h5 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                                {user?.name || 'Administrator'}
                            </h5>
                            <p className="text-[10px] text-slate-400 truncate">{user?.email || 'admin@smartcart.ai'}</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="Logout"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top Navbar */}
                <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        <Link to="/admin" className="lg:hidden flex items-center p-1 px-2.5 rounded-xl bg-white border border-slate-200 shadow-sm">
                            <img src={logoImg} alt="shoping.com" className="h-6 w-auto object-contain" />
                        </Link>
                        <span className="font-bold text-slate-700 dark:text-slate-200 text-sm hidden sm:inline-block">
                            Store Management Console
                        </span>
                    </div>

                    <div className="flex items-center space-x-3">
                        <ThemeToggle />
                        <Link
                            to="/"
                            className="px-3.5 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-xs font-semibold hover:bg-purple-100 transition-colors"
                        >
                            Live Store
                        </Link>
                    </div>
                </header>

                {/* Nested Admin Page */}
                <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;

