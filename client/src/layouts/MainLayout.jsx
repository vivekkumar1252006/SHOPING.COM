import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import CartDrawer from '../components/common/CartDrawer';
import { fetchCart } from '../redux/slices/cartSlice';

const MainLayout = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const isAuthPage = ['/login', '/register', '/forgot-password'].includes(location.pathname);

  useEffect(() => {
    if (isAuthenticated) dispatch(fetchCart());
  }, [dispatch, isAuthenticated]);

  return (
    <div className="store-layout min-h-screen flex flex-col text-slate-900">
      <Navbar />

      <main className={isAuthPage ? "flex-1 w-full" : "store-main"}>
        <Outlet />
      </main>

      <Footer />
      <CartDrawer />
    </div>
  );
};

export default MainLayout;
