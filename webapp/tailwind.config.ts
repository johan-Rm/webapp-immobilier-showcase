import type { Config } from 'tailwindcss'

import defaultTheme from 'tailwindcss/defaultTheme'

const color = (name: string) => `rgb(var(--color-${name}) / <alpha-value>)`
const scale = (name: string) => ({
  50: color(`${name}-50`),
  100: color(`${name}-100`),
  200: color(`${name}-200`),
  300: color(`${name}-300`),
  400: color(`${name}-400`),
  500: color(`${name}-500`),
  600: color(`${name}-600`),
  700: color(`${name}-700`),
  800: color(`${name}-800`),
  900: color(`${name}-900`),
  950: color(`${name}-950`),
})
const scaleWithDefault = (name: string, defaultVar = name) => ({
  DEFAULT: color(defaultVar),
  ...scale(name),
})

const config: Config = {
  darkMode: 'class',
  content: [
    './app/components/**/*.{vue,js,ts}',
    './app/layouts/**/*.{vue,js,ts}',
    './app/pages/**/*.{vue,js,ts}',
    './app/app.vue',
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ['var(--font-heading)', ...defaultTheme.fontFamily.sans],
        body: ['var(--font-body)', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        primary: scaleWithDefault('primary'),
        'primary-foreground': color('primary-foreground'),
        secondary: scaleWithDefault('secondary'),
        'secondary-foreground': color('secondary-foreground'),
        background: scaleWithDefault('background', 'bg'),
        foreground: scaleWithDefault('foreground'),
        surface: scaleWithDefault('surface'),
        heading: scaleWithDefault('heading'),
        border: color('border'),
        ring: color('ring'),
        overlay: scaleWithDefault('overlay'),
      },
      ringColor: {
        DEFAULT: color('ring'),
      },
      borderColor: {
        DEFAULT: color('border'),
      },
      backgroundColor: {
        skin: {
          surface: color('surface'),
          base: color('bg'),
        },
      },
      textColor: {
        skin: {
          base: color('foreground'),
        },
      },
    },
  },
  plugins: [],
}

export default config
