import { createSlice } from '@reduxjs/toolkit';

const initialDark =
    localStorage.getItem('smartcart_dark') === 'true' ||
    (!('smartcart_dark' in localStorage) &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);

if (initialDark) {
    document.documentElement.classList.add('dark');
} else {
    document.documentElement.classList.remove('dark');
}

const themeSlice = createSlice({
    name: 'theme',
    initialState: {
        darkMode: initialDark,
    },
    reducers: {
        toggleTheme: (state) => {
            state.darkMode = !state.darkMode;
            localStorage.setItem('smartcart_dark', state.darkMode);
            if (state.darkMode) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        },
        setTheme: (state, action) => {
            state.darkMode = action.payload;
            localStorage.setItem('smartcart_dark', state.darkMode);
            if (state.darkMode) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        },
    },
});

export const { toggleTheme, setTheme } = themeSlice.actions;
export default themeSlice.reducer;

