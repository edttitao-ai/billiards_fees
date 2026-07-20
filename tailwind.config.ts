import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // 品牌色：薄荷绿（参考设计稿）
        brand: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
          800: '#065F46',
          900: '#064E3B'
        },
        // 中性色
        ink: {
          900: '#0F172A',
          700: '#334155',
          500: '#64748B',
          400: '#94A3B8',
          300: '#CBD5E1',
          200: '#E2E8F0',
          100: '#F1F5F9',
          50: '#F8FAFC'
        },
        // 状态色
        danger: {
          500: '#EF4444',
          600: '#DC2626'
        },
        warn: {
          500: '#F59E0B'
        },
        info: {
          500: '#3B82F6',
          600: '#2563EB'
        }
      },
      fontFamily: {
        sans: [
          'PingFang SC',
          'HarmonyOS Sans',
          'Microsoft YaHei',
          'system-ui',
          'sans-serif'
        ]
      },
      fontSize: {
        xs: ['13px', '18px'],
        sm: ['15px', '22px'],
        base: ['16px', '24px'],
        lg: ['18px', '26px'],
        xl: ['20px', '28px'],
        '2xl': ['24px', '32px'],
        '3xl': ['30px', '38px']
      },
      borderRadius: {
        sm: '6px',
        DEFAULT: '10px',
        md: '12px',
        lg: '16px',
        xl: '20px',
        '2xl': '24px'
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 12px rgba(15, 23, 42, 0.04)',
        soft: '0 2px 8px rgba(15, 23, 42, 0.06)',
        ring: '0 0 0 3px rgba(16, 185, 129, 0.18)'
      },
      spacing: {
        'safe-bottom': 'env(safe-area-inset-bottom)'
      }
    }
  },
  plugins: []
} satisfies Config