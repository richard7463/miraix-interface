import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'Fira Code', 'Roboto Mono', 'Menlo', 'Monaco', 'Consolas', 'monospace']
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))'
      },
      colors: {
        background: {
          DEFAULT: '#fff',
          dark: '#18181c',
        },
        primary: {
          DEFAULT: '#4C94E5',
          foreground: '#ffffff',
        },
        destructive: {
          DEFAULT: '#ef4444',
          foreground: '#ffffff',
        },
        muted: {
          DEFAULT: '#f1f5f9',
          foreground: '#64748b',
        },
        accent: {
          DEFAULT: '#f1f5f9',
          foreground: '#0f172a',
        },
        popover: {
          DEFAULT: '#ffffff',
          foreground: '#0f172a',
        },
        card: {
          DEFAULT: '#ffffff',
          foreground: '#0f172a',
        },
        border: {
          DEFAULT: '#e2e8f0',
        },
        input: {
          DEFAULT: '#e2e8f0',
        },
        ring: {
          DEFAULT: '#4C94E5',
        },
      },
      lineClamp: {
        2: '2',
        4: '4',
      },
    }
  },
  daisyui: {},
  plugins: [
    require('postcss-import'), 
    require('@tailwindcss/typography'),
    require('@tailwindcss/line-clamp')
  ]
}
export default config
