/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{astro,js,jsx,ts,tsx,vue}'
  ],
  mode: 'jit',
  purge: ['./public/**/*.html', './src/**/*.{astro,js,jsx,ts,tsx,vue}'],
    theme: {
      fontFamily: {
        'sans': ['"Noto Sans Mono"', 'monospace'],
        'sans-serif': ['"Noto Sans Mono"', 'monospace'],
        'mono': ['"Noto Sans Mono"', 'monospace'],
      },
    },
}
