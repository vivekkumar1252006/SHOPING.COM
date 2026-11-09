import { createSlice } from '@reduxjs/toolkit';

const storedCompare = localStorage.getItem('smartcart_compare')
  ? JSON.parse(localStorage.getItem('smartcart_compare'))
  : [];

const compareSlice = createSlice({
  name: 'compare',
  initialState: {
    items: storedCompare,
    maxItems: 4,
  },
  reducers: {
    addToCompare: (state, action) => {
      const product = action.payload;
      const exists = state.items.some((item) => item._id === product._id);
      if (!exists) {
        if (state.items.length >= state.maxItems) {
          state.items.shift();
        }
        state.items.push(product);
        localStorage.setItem('smartcart_compare', JSON.stringify(state.items));
      }
    },
    removeFromCompare: (state, action) => {
      state.items = state.items.filter((item) => item._id !== action.payload);
      localStorage.setItem('smartcart_compare', JSON.stringify(state.items));
    },
    clearCompare: (state) => {
      state.items = [];
      localStorage.removeItem('smartcart_compare');
    },
  },
});

export const { addToCompare, removeFromCompare, clearCompare } = compareSlice.actions;
export default compareSlice.reducer;
