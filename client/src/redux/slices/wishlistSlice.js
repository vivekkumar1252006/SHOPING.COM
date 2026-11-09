import { createSlice } from '@reduxjs/toolkit';

const storedWishlist = localStorage.getItem('smartcart_wishlist')
    ? JSON.parse(localStorage.getItem('smartcart_wishlist'))
    : [];

const wishlistSlice = createSlice({
    name: 'wishlist',
    initialState: {
        items: storedWishlist,
    },
    reducers: {
        toggleWishlist: (state, action) => {
            const product = action.payload;
            const index = state.items.findIndex((item) => item._id === product._id);
            if (index > -1) {
                state.items.splice(index, 1);
            } else {
                state.items.push(product);
            }
            localStorage.setItem('smartcart_wishlist', JSON.stringify(state.items));
        },
        removeFromWishlist: (state, action) => {
            state.items = state.items.filter((item) => item._id !== action.payload);
            localStorage.setItem('smartcart_wishlist', JSON.stringify(state.items));
        },
        clearWishlist: (state) => {
            state.items = [];
            localStorage.removeItem('smartcart_wishlist');
        },
    },
});

export const { toggleWishlist, removeFromWishlist, clearWishlist } = wishlistSlice.actions;
export default wishlistSlice.reducer;

