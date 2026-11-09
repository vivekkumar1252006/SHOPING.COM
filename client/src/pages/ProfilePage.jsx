import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
    User,
    ShoppingBag,
    MapPin,
    Lock,
    LogOut,
    Truck,
    CheckCircle,
    Clock,
    ShieldCheck,
    ChevronRight,
    Plus
} from 'lucide-react';
import { updateProfile, logout } from '../redux/slices/authSlice';
import { orderApi, authApi } from '../services/api';
import logoImg from '../assets/logo.jpg';

const ProfilePage = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [searchParams] = useSearchParams();
    const { user } = useSelector((state) => state.auth);

    const initialTab = searchParams.get('tab') || 'profile';
    const [activeTab, setActiveTab] = useState(initialTab);

    // Profile Form
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [password, setPassword] = useState('');
    const [profileMsg, setProfileMsg] = useState('');

    // Orders
    const [orders, setOrders] = useState([]);
    const [ordersLoading, setOrdersLoading] = useState(false);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        if (activeTab === 'orders') {
            const fetchMyOrders = async () => {
                setOrdersLoading(true);
                try {
                    const res = await orderApi.getMyOrders();
                    setOrders(res.data.data || []);
                } catch (err) {
                    console.error('Failed to fetch orders', err);
                } finally {
                    setOrdersLoading(false);
                }
            };
            fetchMyOrders();
        }
    }, [user, activeTab, navigate]);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setProfileMsg('');
        try {
            const res = await authApi.updateProfile({ name, email, password: password || undefined });
            dispatch(updateProfile(res.data.data));
            setProfileMsg('Profile updated successfully!');
            setPassword('');
        } catch (err) {
            setProfileMsg(err.response?.data?.message || 'Failed to update profile');
        }
    };

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    return (
        <div className="max-w-6xl mx-auto py-6 space-y-8">
            {/* Profile Header */}
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6 border border-purple-800/40">
                <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-2xl font-black text-purple-300 shadow-inner">
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                        <div className="flex items-center space-x-2">
                            <h1 className="text-2xl font-black">{user?.name}</h1>
                            {user?.role === 'admin' && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-400 text-slate-950">
                                    ADMIN
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-purple-200 mt-0.5">{user?.email}</p>
                    </div>
                </div>

                <div className="flex items-center space-x-3">
                    <Link
                        to="/"
                        className="hidden sm:inline-flex items-center p-1 px-3 rounded-2xl bg-white shadow-sm border border-amber-200 hover:scale-[1.02] transition-transform"
                        title="Back to shoping.com"
                    >
                        <img src={logoImg} alt="shoping.com" className="h-7 w-auto object-contain" />
                    </Link>
                    {user?.role === 'admin' && (
                        <Link
                            to="/admin"
                            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-colors"
                        >
                            Admin Dashboard
                        </Link>
                    )}
                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 bg-white/10 hover:bg-rose-500 text-white font-bold text-xs rounded-xl border border-white/20 transition-colors flex items-center space-x-1.5"
                    >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Logout</span>
                    </button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                <button
                    onClick={() => setActiveTab('profile')}
                    className={`px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center space-x-2 transition-all ${activeTab === 'profile'
                        ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                >
                    <User className="w-4 h-4" />
                    <span>Personal Details</span>
                </button>
                <button
                    onClick={() => setActiveTab('orders')}
                    className={`px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center space-x-2 transition-all ${activeTab === 'orders'
                        ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Order History</span>
                </button>
            </div>

            {/* Tab 1: Profile Form */}
            {activeTab === 'profile' && (
                <div className="max-w-xl bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
                        Edit Account Information
                    </h3>

                    {profileMsg && (
                        <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 text-xs text-purple-700 dark:text-purple-300">
                            {profileMsg}
                        </div>
                    )}

                    <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
                        <div>
                            <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                                Full Name
                            </label>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                            />
                        </div>

                        <div>
                            <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                                Email Address
                            </label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                            />
                        </div>

                        <div>
                            <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                                Change Password (leave blank to keep current)
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                            />
                        </div>

                        <button
                            type="submit"
                            className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-md transition-colors cursor-pointer"
                        >
                            Save Profile Changes
                        </button>
                    </form>
                </div>
            )}

            {/* Tab 2: Order History */}
            {activeTab === 'orders' && (
                <div className="space-y-4">
                    {ordersLoading ? (
                        <div className="py-12 text-center text-slate-400 text-xs">
                            Loading orders...
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
                            <ShoppingBag className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                                No orders placed yet
                            </h3>
                            <p className="text-xs text-slate-400 mt-1 mb-4">
                                Explore our catalog to start building your smart workspace.
                            </p>
                            <Link
                                to="/products"
                                className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-purple-700"
                            >
                                Browse Products
                            </Link>
                        </div>
                    ) : (
                        orders.map((ord) => (
                            <div
                                key={ord._id}
                                className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
                                    <div>
                                        <span className="text-xs text-slate-400">
                                            Placed on {new Date(ord.createdAt).toLocaleDateString()}
                                        </span>
                                        <h4 className="font-mono font-bold text-sm text-purple-600 dark:text-purple-400">
                                            Order #{ord._id}
                                        </h4>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                                            {ord.orderStatus}
                                        </span>
                                        <Link
                                            to={`/track-order?trackingId=${ord.trackingNumber || ord._id}`}
                                            className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center space-x-1"
                                        >
                                            <Truck className="w-3.5 h-3.5" />
                                            <span>Track Order</span>
                                        </Link>
                                    </div>
                                </div>

                                {/* Items */}
                                <div className="space-y-2">
                                    {ord.orderItems?.map((item, i) => (
                                        <div key={i} className="flex items-center justify-between text-xs">
                                            <div className="flex items-center space-x-3">
                                                <img
                                                    src={item.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=80'}
                                                    alt={item.name}
                                                    className="w-10 h-10 rounded-lg object-cover border border-slate-200"
                                                />
                                                <div>
                                                    <span className="font-semibold text-slate-900 dark:text-white">
                                                        {item.name}
                                                    </span>
                                                    <span className="text-slate-400 block">Qty: {item.quantity}</span>
                                                </div>
                                            </div>
                                            <span className="font-bold text-slate-900 dark:text-white">
                                                ₹{(item.price * item.quantity).toLocaleString()}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                                    <span className="text-slate-400">
                                        Payment Method: <span className="font-bold text-slate-700 dark:text-slate-200">{ord.paymentMethod}</span>
                                    </span>
                                    <span className="font-black text-sm text-slate-900 dark:text-white">
                                        Total: ₹{ord.totalPrice?.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default ProfilePage;

