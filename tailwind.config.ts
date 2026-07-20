import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // 台球巧粉蓝：低饱和、耐看，用于主要交互与品牌区域
        brand: {
          50: '#F2F6F9',
          100: '#E2EAF0',
          200: '#C5D3DE',
          300: '#9DB2C2',
          400: '#7893A8',
          500: '#58758F',
          600: '#49677E',
          700: '#3B5569',
          800: '#2D4354',
          900: '#203440'
        },
        // 带冷调的中性色，与巧粉蓝自然衔接
        ink: {
          900: '#1C252B',
          700: '#3C4850',
          500: '#68737B',
          400: '#929CA3',
          300: '#C3CBD0',
          200: '#DDE2E5',
          100: '#ECEFF1',
          50: '#F7F8F8'
        },
        // 黄铜：只用于金额与关键状态
        accent: {
          50: '#FBF7EC',
          100: '#F4E9C8',
          200: '#E7D197',
          300: '#D4B45E',
          400: '#BC9138',
          500: '#9C7126',
          600: '#7E591D',
          700: '#604317'
        },
        danger: {
          500: '#D9554D',
          600: '#BA4039'
        },
        warn: {
          500: '#C8872E'
        },
        info: {
          500: '#58758F',
          600: '#49677E'
        }
      },
      fontFamily: {
        sans: [
          'HarmonyOS Sans SC',
          'PingFang SC',
          'Microsoft YaHei',
          'system-ui',
          'sans-serif'
        ],
        display: [
          'Arial Narrow',
          'HarmonyOS Sans SC',
          'PingFang SC',
          'Microsoft YaHei',
          'sans-serif'
        ],
        data: ['Bahnschrift', 'DIN Alternate', 'Roboto Condensed', 'Arial Narrow', 'sans-serif']
      },
      fontSize: {
        xs: ['13px', '18px'],
        sm: ['15px', '22px'],
        base: ['16px', '24px'],
        lg: ['18px', '26px'],
        xl: ['20px', '28px'],
        '2xl': ['24px', '31px'],
        '3xl': ['32px', '38px'],
        '4xl': ['40px', '44px']
      },
      borderRadius: {
        sm: '7px',
        DEFAULT: '11px',
        md: '13px',
        lg: '17px',
        xl: '20px',
        '2xl': '24px'
      },
      boxShadow: {
        card: '0 1px 2px rgba(32, 52, 64, 0.04), 0 10px 28px rgba(45, 67, 84, 0.08)',
        soft: '0 6px 18px rgba(32, 52, 64, 0.11)',
        floating: '0 16px 42px rgba(32, 52, 64, 0.22)',
        felt: '0 18px 40px rgba(32, 52, 64, 0.24)',
        ring: '0 0 0 3px rgba(88, 117, 143, 0.20)'
      },
      spacing: {
        'safe-bottom': 'env(safe-area-inset-bottom)'
      }
    }
  },
  plugins: []
} satisfies Config
