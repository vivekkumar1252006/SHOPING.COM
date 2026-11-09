import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Sun, Moon } from 'lucide-react';
import { toggleTheme } from '../../redux/slices/themeSlice';

const ThemeToggle = ({ className = '' }) => {
    const dispatch = useDispatch();
    const darkMode = useSelector((state) => state.theme.darkMode);

    return (
        <button
            onClick={() => dispatch(toggleTheme())}
            aria-label="Toggle Dark Mode"
            className={`p-2 rounded-xl transition-all duration-200 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500/30 ${className}`}
        >
            {darkMode ? (
                <Sun size={20} className="text-amber-400 hover:rotate-45 transition-transform duration-300" />
            ) : (
                <Moon size={20} className="text-primary-600 hover:-rotate-12 transition-transform duration-300" />
            )}
        </button>
    );
};

export default ThemeToggle;

