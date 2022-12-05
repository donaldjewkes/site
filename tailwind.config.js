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
          primary: '#F5C089',
          secondary: '#3E8DA7',
          xlblue: '#98ccde',
          lblue: '#87B9CA',
          dblue: '#2B3A40',
          dbeige: '#8C6E4F'

        },
      },
    },
}
