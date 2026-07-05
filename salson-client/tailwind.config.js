/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#10B981',
                'primary-dark': '#059669',
                accent: '#F59E0B',
                background: '#FAFAF9',
                danger: '#EF4444',
            },
        },
    },
    plugins: [],
}