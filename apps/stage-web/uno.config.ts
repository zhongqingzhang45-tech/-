import { mergeConfigs, presetWebFonts } from 'unocss'

import { presetWebFontsFonts, sharedUnoConfig } from '../../uno.config'

// NOTICE:
// 在沙箱/CI 等无外网环境下，fontsource 会因为无法访问 api.fontsource.org
// 而阻塞 CSS 生成，导致页面无法渲染。通过环境变量 LIFE_FONT_PROVIDER='none'
// 切换到本地字体（@fontsource-variable/* 已经安装），避免网络依赖。
// 默认值 'fontsource' 用于生产构建与正常开发环境。
// 移除条件：当沙箱环境可访问 api.fontsource.org 时可移除此分支。
const fontProvider = process.env.LIFE_FONT_PROVIDER === 'none' ? 'none' as const : 'fontsource' as const

export default mergeConfigs([
  sharedUnoConfig(),
  {
    presets: [
      presetWebFonts({
        fonts: {
          ...presetWebFontsFonts(fontProvider),
        },
        timeouts: {
          warning: 5000,
          failure: 10000,
        },
      }),
    ],
    rules: [
      ['transition-colors-none', {
        'transition-property': 'color, background-color, border-color, text-color',
        'transition-duration': '0s',
      }],
    ],
  },
])
