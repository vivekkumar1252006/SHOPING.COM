import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { cartApi } from '../../services/api';

export const fetchCart = createAsyncThunk('cart/fetchCart', async (_, { rejectWithValue }) => {
  try {
    const res = await cartApi.get();
    return res.data.cart?.items || [];
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Could not fetch cart');
  }
});

const storedCart = localStorage.getItem('smartcart_cart')
    ? JSON.parse(localStorage.getItem('smartcart_cart'))
    : { items: [], coupon: null };

const savedBuyNow = localStorage.getItem('smartcart_buynow')
  ? JSON.parse(localStorage.getItem('smartcart_buynow'))
  : null;

const calculateTotals = (items, coupon) => {
    const itemsPrice = items.reduce((acc, item) => {
        const price = item.product?.discountPrice || item.product?.price || item.price || 0;
        return acc + price * item.quantity;
    }, 0);

    const shippingPrice = itemsPrice > 50 || itemsPrice === 0 ? 0 : 10;
    const taxPrice = Number((itemsPrice * 0.05).toFixed(2));

    let discountAmount = 0;
    if (coupon) {
        if (coupon.discountType === 'percentage') {
            discountAmount = (itemsPrice * coupon.discountValue) / 100;
            if (coupon.maxDiscount > 0 && discountAmount > coupon.maxDiscount) {
                discountAmount = coupon.maxDiscount;
            }
        } else {
            discountAmount = coupon.discountValue;
        }
        discountAmount = Math.min(discountAmount, itemsPrice);
    }

    const totalPrice = Number((itemsPrice + shippingPrice + taxPrice - discountAmount).toFixed(2));

    return {
        itemsPrice: Number(itemsPrice.toFixed(2)),
        shippingPrice,
        taxPrice,
        discountAmount: Number(discountAmount.toFixed(2)),
        totalPrice,
    };
};

const initialTotals = calculateTotals(storedCart.items || [], storedCart.coupon || null);

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: storedCart.items || [],
    buyNowItem: savedBuyNow,
    coupon: storedCart.coupon || null,
    isCartOpen: false,
    syncing: false,
    syncError: '',
    ...initialTotals,
  },
  reducers: {
    setBuyNowItem: (state, action) => {
      const { product, quantity = 1 } = action.payload;
      const rawId = product._id || product.id || '';
      const price = Number(product.discountPrice && product.discountPrice > 0 ? product.discountPrice : (product.price || 0));
      const originalPrice = Number(product.originalPrice || product.price || price);
      const images = Array.isArray(product.images) && product.images.length > 0
        ? product.images
        : [product.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'];
      const stock = Number(product.countInStock !== undefined ? product.countInStock : (product.stock !== undefined ? product.stock : 10));

      const normalized = {
        _id: rawId,
        id: rawId,
        title: product.title || product.name || 'Selected Product',
        name: product.name || product.title || 'Selected Product',
        price,
        originalPrice,
        discountPrice: price,
        images,
        image: images[0],
        countInStock: stock,
        stock,
        category: typeof product.category === 'object' ? (product.category?.name || 'General') : (product.category || 'General'),
        brand: product.brand || 'Shoping',
      };

      state.buyNowItem = {
        product: normalized,
        quantity: Math.max(1, Math.min(Number(quantity) || 1, stock || 99)),
      };
      localStorage.setItem('smartcart_buynow', JSON.stringify(state.buyNowItem));
    },
    clearBuyNowItem: (state) => {
      state.buyNowItem = null;
      localStorage.removeItem('smartcart_buynow');
    },
    addToCart: (state, action) => {
      const product = action.payload.product || action.payload;
      const quantity = action.payload.quantity || 1;
      const existingIndex = state.items.findIndex(
        (i) => (i.product?._id || i.product) === (product._id || product)
      );

            if (existingIndex > -1) {
                const newQty = state.items[existingIndex].quantity + quantity;
                const maxStock = product.countInStock || 99;
                state.items[existingIndex].quantity = Math.min(newQty, maxStock);
            } else {
                state.items.push({ product, quantity });
            }

            const totals = calculateTotals(state.items, state.coupon);
            Object.assign(state, totals);

            localStorage.setItem(
                'smartcart_cart',
                JSON.stringify({ items: state.items, coupon: state.coupon })
            );
            state.isCartOpen = true;
        },
        updateQuantity: (state, action) => {
            const { productId, quantity } = action.payload;
            const item = state.items.find(
                (i) => (i.product?._id || i.product) === productId
            );

            if (item && quantity > 0) {
                const maxStock = item.product?.countInStock || 99;
                item.quantity = Math.min(quantity, maxStock);
            }

            const totals = calculateTotals(state.items, state.coupon);
            Object.assign(state, totals);

            localStorage.setItem(
                'smartcart_cart',
                JSON.stringify({ items: state.items, coupon: state.coupon })
            );
        },
        removeFromCart: (state, action) => {
            const productId = action.payload;
            state.items = state.items.filter(
                (i) => (i.product?._id || i.product) !== productId
            );

            const totals = calculateTotals(state.items, state.coupon);
            Object.assign(state, totals);

            localStorage.setItem(
                'smartcart_cart',
                JSON.stringify({ items: state.items, coupon: state.coupon })
            );
        },
        applyCoupon: (state, action) => {
            state.coupon = action.payload;
            const totals = calculateTotals(state.items, state.coupon);
            Object.assign(state, totals);

            localStorage.setItem(
                'smartcart_cart',
                JSON.stringify({ items: state.items, coupon: state.coupon })
            );
        },
        removeCoupon: (state) => {
            state.coupon = null;
            const totals = calculateTotals(state.items, null);
            Object.assign(state, totals);

            localStorage.setItem(
                'smartcart_cart',
                JSON.stringify({ items: state.items, coupon: null })
            );
        },
        clearCart: (state) => {
            state.items = [];
            state.coupon = null;
            const totals = calculateTotals([], null);
            Object.assign(state, totals);

            localStorage.removeItem('smartcart_cart');
        },
        toggleCartDrawer: (state) => {
            state.isCartOpen = !state.isCartOpen;
        },
        setCartOpen: (state, action) => {
            state.isCartOpen = action.payload;
        },
        replaceCart: (state, action) => {
            const { product, quantity = 1 } = action.payload;
            state.items = [{ product, quantity }];
            const totals = calculateTotals(state.items, state.coupon);
            Object.assign(state, totals);
            localStorage.setItem(
                'smartcart_cart',
                JSON.stringify({ items: state.items, coupon: state.coupon })
            );
        },
        setCartSyncError: (state, action) => {
            state.syncError = action.payload;
        },
        clearCartSyncError: (state) => {
            state.syncError = '';
        },
    },
    extraReducers: (builder) => {
        builder.addCase(fetchCart.fulfilled, (state, action) => {
            if (Array.isArray(action.payload) && action.payload.length > 0) {
                state.items = action.payload;
                const totals = calculateTotals(state.items, state.coupon);
                Object.assign(state, totals);
                localStorage.setItem(
                    'smartcart_cart',
                    JSON.stringify({ items: state.items, coupon: state.coupon })
                );
            }
        });
    },
});

export const {
    setBuyNowItem,
    clearBuyNowItem,
    addToCart,
    replaceCart,
    updateQuantity,
    removeFromCart,
    applyCoupon,
    removeCoupon,
    clearCart,
    toggleCartDrawer,
    setCartOpen,
    setCartSyncError,
    clearCartSyncError,
} = cartSlice.actions;

export default cartSlice.reducer;

