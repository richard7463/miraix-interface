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
          DEFAULT: '#F9FAFB', // 页面背景
          dark: '#27272a',
        },
        primary: {
          DEFAULT: '#4C94E5',
          foreground: '#ffffff',
        },
        destructive: {
          DEFAULT: '#EF4444', // 红色，用于 CTA 按钮和删除
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
          DEFAULT: '#27272a',
          foreground: '#e0e0e6',
        },
        card: {
          DEFAULT: '#fffdf9', // 卡片背景
          foreground: '#1F2937', // 主要文本颜色
        },
        border: {
          DEFAULT: '#e8e0d5', // 边框颜色
        },
        input: {
          DEFAULT: '#e2e8f0',
        },
        ring: {
          DEFAULT: '#4C94E5',
        },
        // 自定义颜色，基于 page.tsx 中的常用颜色
        arena: {
          // 头部背景和深色文本
          dark: '#1F2937',
          // 头部文本
          'dark-text': '#d9e1ff',
          // 主要文本颜色
          text: '#171d2d',
          // 次要文本颜色
          'text-secondary': '#6B7280',
          // hero body 文本
          'hero-body': '#bfc8ea',
          // 头部卡片边框
          'header-border': '#e8e0d5',
          // 头部卡片背景
          'header-bg': 'rgba(255,253,249,0.88)',
          // Pill 背景色
          'pill-blue-bg': '#eef5ff',
          'pill-blue-text': '#3B82F6',
          'pill-green-bg': '#eff8f1',
          'pill-green-text': '#22C55E',
          'pill-orange-bg': '#fff3e8',
          'pill-orange-text': '#F97316',
          'pill-red-bg': '#fff0f0',
          'pill-red-text': '#EF4444',
          'pill-gray-bg': '#f0eee8',
          'pill-gray-text': '#6B7280',
          // 排名卡片背景和边框
          'rank-card-bg': '#fdfbf8',
          'rank-card-border': '#efe7dc',
          // 汇总卡片背景和边框
          'summary-card-bg': '#f8f5f0',
          'summary-card-border': '#efe7dc',
          // Watchlist 卡片背景和边框
          'watchlist-card-bg': '#ffffff',
          'watchlist-card-border': '#e8e0d5',
          // Modal 背景和边框
          'modal-bg': '#fffdf9',
          'modal-border': '#e7ded2',
          // Modal 按钮背景
          'modal-button-bg': '#f3efe9',
          // Modal 预览背景
          'modal-preview-bg': '#f8f5f0',
          // Modal 预览文本
          'modal-preview-text': '#5f5963',
          // No agents 边框和背景
          'no-agents-border': '#e5ddd1',
          'no-agents-bg': '#fcfaf7',
          // 分隔线颜色
          'divider': '#e6ddd1',
          'divider-light': '#f0e9df',
          // link hover
          'link-hover-border': '#dcd0c1',
          // locale switch
          'locale-switch-border': '#e5ddd1',
          'locale-switch-bg': '#ffffff',
          'locale-switch-text': '#6f7281',
          // workspace button
          'workspace-text': '#5d5860',
          // eyebrow
          'eyebrow-border': 'white/15',
          'eyebrow-bg': 'white/5',
          // promotion score
          'promotion-score-text': '#2a3145',
          // rank switcher
          'rank-switcher-border': '#ece4d9',
          'rank-switcher-bg': '#f9f6f0',
          // text for simulation data
          'simulation-text': '#8b6f4d',
          'simulation-bg': '#fcf6ef',
          'simulation-border': '#efe3d4',
          // info pill
          'info-pill-bg': 'white/6',
          'info-pill-border': 'white/10',
          'info-pill-text': '#98a5d7',
          'info-pill-body': '#d9e1ff',
          // create agent button
          'create-agent-shadow': '0_12px_30px_rgba(255,138,87,0.25)',
          // manage agents button
          'manage-agent-border': 'white/18',
          'manage-agent-bg': 'white/8',
          // active tab indicator
          'active-tab': '#4156e5',
          // watchlist item color
          'watchlist-item-blue': '#DBEAFE',
          'watchlist-item-red': '#FEE2E2',
          'watchlist-item-green': '#D1FAE5',
          'watchlist-item-text': '#4f5667',
          // delete button
          'delete-button-border': '#f0d8d3',
          'delete-button-bg': '#fff4f1',
          'delete-button-text': '#c45d4d',
          // 圆形头像/图标的背景色 (可以根据实际效果调整，这里只是示例)
          'avatar-bg-1': '#DBEAFE', // 蓝色系
          'avatar-text-1': '#1E40AF',
          'avatar-bg-2': '#FEE2E2', // 红色系
          'avatar-text-2': '#991B1B',
          'avatar-bg-3': '#D1FAE5', // 绿色系
          'avatar-text-3': '#065F46',
          'avatar-bg-4': '#EDE9FE', // 紫色系
          'avatar-text-4': '#5B21B6',
          'avatar-bg-5': '#FFEDD5', // 橙色系
          'avatar-text-5': '#9A3412',

          // PnL/ROI 正负颜色
          'pnl-positive': '#22C55E', // 绿色
          'pnl-negative': '#EF4444', // 红色

          // Stability / Risk Adjusted 的色阶 (示例，可能需要更精细定义)
          'score-high': '#22C55E', // 绿色
          'score-medium': '#F59E0B', // 橙色
          'score-low': '#EF4444', // 红色
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
