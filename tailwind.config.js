/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,astro,js,jsx,ts,tsx,vue,css}",
  ],
  // './src/**/*.{html,astro,js,jsx,ts,tsx,vue,css}'
  mode: 'jit',
    theme: {
      extend: {
        fontFamily: {
          'sans': ['Noto Serif JP', 'serif'],
          'sans-serif': ['"Noto Sans Mono"', 'monospace'],
          'mono': ['"Noto Sans Mono"', 'monospace'],
        },
        colors: {
          dgreen: '#465234'
        },
      },
    },
}
