/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#FFF9E8',
                    100: '#FFFDF5',
                    200: '#F8E7B0',
                    300: '#E9BD55',
                    400: '#D69B24',
                    500: '#B9821E',
                    600: '#946A19',
                    700: '#705014',
                    800: '#4D370E',
                    900: '#332509',
                    950: '#1F1706',
                },
                secondary: {
                    50: '#FFFDF5',
                    100: '#EFE5CF',
                    200: '#E2D6BA',
                    300: '#C9B997',
                    400: '#A59673',
                    500: '#777064',
                    600: '#5F594F',
                    700: '#474238',
                    800: '#29251D',
                    900: '#1E1A13',
                    950: '#14110D',
                },
                accent: {
                    pink: '#ec4899',
                    emerald: '#10b981',
                    amber: '#E9BD55',
                    orange: '#D69B24',
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
            },
            boxShadow: {
                'glow': '0 0 25px -5px rgba(233, 189, 85, 0.35)',
                'glow-amber': '0 0 25px -5px rgba(233, 189, 85, 0.35)',
                'glow-orange': '0 0 25px -5px rgba(214, 155, 36, 0.3)',
                'card-hover': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            },
            animation: {
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'float': 'float 3s ease-in-out infinite',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-8px)' },
                }
            }
        },
    },
    plugins: [],
}
