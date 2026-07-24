/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // 墨 —— 暖调墨色背景（取代原冷调 ink）
        ink: {
          950: "#100B08",
          900: "#15100B",
          850: "#1C1610",
          800: "#241C14",
          750: "#2E2418",
          700: "#3A2D1E",
          600: "#52402C",
          500: "#6E5A42",
          400: "#8C7659",
          300: "#AE9876",
          200: "#D2BE9C",
        },
        // 朱砂 —— 主色调，取代紫色
        cinnabar: {
          50: "#fdf3f1",
          100: "#fbe4df",
          200: "#f6ccc3",
          300: "#eea79a",
          400: "#e07a68",
          500: "#C8453C",
          600: "#B0332C",
          700: "#8E2820",
          800: "#6F1F19",
        },
        // 胭脂 —— 情感色（好感/恋爱）
        rouge: {
          50: "#fdf1ee",
          100: "#fadfd8",
          200: "#f4bdb0",
          300: "#ea9583",
          400: "#dc6f59",
          500: "#C75140",
          600: "#a8402f",
        },
        // 金箔 —— 高级感点缀
        gold: {
          50: "#fbf6e8",
          100: "#f5ead0",
          200: "#ecd29b",
          300: "#dcb363",
          400: "#C9A961",
          500: "#B08F45",
          600: "#8C6F33",
        },
        // 青黛 —— 玉色/冷色辅色
        jade: {
          50: "#eef5f3",
          100: "#d6e8e3",
          200: "#aecdc5",
          300: "#7fafa6",
          400: "#5B8E91",
          500: "#4A7C7E",
          600: "#3a6163",
          700: "#2d4c4e",
        },
        // 宣纸 —— 浅色文本/卷轴面
        paper: {
          50: "#FBF6EC",
          100: "#F4ECD8",
          200: "#EDE3D0",
          300: "#E0D3B6",
          400: "#CBB98F",
        },
      },
      fontFamily: {
        // 展示字 —— 毛笔书法风
        display: ['"Ma Shan Zheng"', '"ZCOOL XiaoWei"', '"Noto Serif SC"', "serif"],
        // 标题 —— 雅致宋体
        title: ['"ZCOOL XiaoWei"', '"Noto Serif SC"', '"Songti SC"', "serif"],
        // 正文 —— 思源宋体
        serif: ['"Noto Serif SC"', '"Songti SC"', "Georgia", "serif"],
        sans: [
          '"Noto Serif SC"',
          '"PingFang SC"',
          '"Microsoft YaHei"',
          "-apple-system",
          "sans-serif",
        ],
        mono: ['"JetBrains Mono"', "Menlo", "monospace"],
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out forwards",
        "slide-up": "slideUp 0.35s ease-out forwards",
        "pulse-slow": "pulse 3s ease-in-out infinite",
        "ink-spread": "inkSpread 1.2s ease-out forwards",
        "float-cloud": "floatCloud 40s linear infinite",
        "seal-stamp": "sealStamp 0.5s cubic-bezier(.2,.8,.2,1) forwards",
        "breathe-soft": "breatheSoft 4s ease-in-out infinite",
        "petal-fall": "petalFall linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        inkSpread: {
          "0%": { opacity: "0", transform: "scale(0.6)", filter: "blur(8px)" },
          "60%": { opacity: "1", filter: "blur(0)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        floatCloud: {
          "0%": { transform: "translateX(-10%)" },
          "100%": { transform: "translateX(110%)" },
        },
        sealStamp: {
          "0%": { opacity: "0", transform: "scale(1.6) rotate(-8deg)" },
          "100%": { opacity: "1", transform: "scale(1) rotate(0)" },
        },
        breatheSoft: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        petalFall: {
          "0%": { transform: "translateY(-10vh) rotate(0deg)", opacity: "0" },
          "10%": { opacity: "0.9" },
          "100%": { transform: "translateY(110vh) rotate(540deg)", opacity: "0" },
        },
      },
      boxShadow: {
        "sm": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        "md": "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        "lg": "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
        "xl": "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
        "cinnabar": "0 8px 32px rgba(200, 69, 60, 0.35)",
        "gold": "0 0 24px rgba(201, 169, 97, 0.3)",
      },
      borderRadius: {
        "md": "0.5rem",
        "lg": "0.75rem",
        "xl": "1rem",
      },
    },
  },
  plugins: [],
};
