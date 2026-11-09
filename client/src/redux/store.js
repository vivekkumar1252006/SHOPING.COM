import { configureStore, createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import cartReducer, {
    addToCart,
    clearCart,
    removeFromCart,
    replaceCart,
    setCartSyncError,
    clearCartSyncError,
    updateQuantity,
} from './slices/cartSlice';
import wishlistReducer from './slices/wishlistSlice';
import compareReducer from './slices/compareSlice';
import themeReducer from './slices/themeSlice';
import { cartApi } from '../services/api';

const cartSyncMiddleware = createListenerMiddleware();

cartSyncMiddleware.startListening({
    matcher: isAnyOf(addToCart, replaceCart, updateQuantity, removeFromCart, clearCart),
    effect: async (action, listenerApi) => {
        if (!listenerApi.getState().auth.isAuthenticated) return;

        try {
            if (addToCart.match(action)) {
                const product = action.payload.product || action.payload;
                await cartApi.add(product._id, action.payload.quantity || 1);
            } else if (replaceCart.match(action)) {
                await cartApi.clear();
                await cartApi.add(action.payload.product._id, action.payload.quantity || 1);
            } else if (updateQuantity.match(action)) {
                await cartApi.update(action.payload.productId, action.payload.quantity);
            } else if (removeFromCart.match(action)) {
                await cartApi.remove(action.payload);
            } else if (clearCart.match(action)) {
                await cartApi.clear();
            }
            listenerApi.dispatch(clearCartSyncError());
        } catch (error) {
            console.error('Cart could not be synchronized with the server', error);
            listenerApi.dispatch(
                setCartSyncError(error.response?.data?.message || 'Your cart could not be saved to your account.')
            );
        }
    },
});

export const store = configureStore({
    reducer: {
        auth: authReducer,
        cart: cartReducer,
        wishlist: wishlistReducer,
        compare: compareReducer,
        theme: themeReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().prepend(cartSyncMiddleware.middleware),
    devTools: import.meta.env.DEV,
});
