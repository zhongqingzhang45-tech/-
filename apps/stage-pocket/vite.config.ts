/// <reference types="./vite.config-env.d.ts" />

import type { PluginOption } from 'vite'

import process from 'node:process'

import { createRequire } from 'node:module'
import { execSync } from 'node:child_process'
import { join, resolve } from 'node:path'

import VueI18n from '@intlify/unplugin-vue-i18n/vite'
import templateCompilerOptions from '@tresjs/core/template-compiler-options'
import Vue from '@vitejs/plugin-vue'
import Unocss from 'unocss/vite'
import Info from 'unplugin-info/vite'
import Yaml from 'unplugin-yaml/vite'
import mkcert from 'vite-plugin-mkcert'
import VueDevTools from 'vite-plugin-vue-devtools'
import Layouts from 'vite-plugin-vue-layouts'
import VueMacros from 'vue-macros/vite'
import VueRouter from 'vue-router/vite'

import { tryCatch } from '@moeru/std'
import { Download } from '@proj-airi/unplugin-fetch/vite'
import { DownloadLive2DSDK } from '@proj-airi/unplugin-live2d-sdk/vite'
import { defineConfig } from 'vite'

// import { isEnvTruthy } from '@proj-airi/stage-shared'
function isEnvTruthy(value: string | undefined | null): boolean {
  if (value == null)
    return false

  return /^(?:1|true|t|yes|y|on)$/i.test(value.trim())
}

const stageUIAssetsRoot = resolve(join(import.meta.dirname, '..', '..', 'packages', 'stage-ui', 'src', 'assets'))
const sharedCacheDir = resolve(join(import.meta.dirname, '..', '..', '.cache'))

// NOTICE:
// unplugin-vue-i18n 的 runtimeOnly:true 会把 `import { useI18n } from "vue-i18n"`
// 重写为 `from "vue-i18n/dist/vue-i18n.runtime.esm-bundler.js"`。
// rolldown/vite 8 对 exports 字段的 `"./dist/*": "./dist/*"` 通配符映射支持不完整，
// 需要通过 createRequire 拿到绝对路径再注入 alias，否则 stage-pages 里的页面会报
// UNLOADABLE_DEPENDENCY。
// 源码: node_modules/vue-i18n/package.json 的 exports 字段。
// 移除条件: 升级到支持 exports 通配符的 rolldown 版本后可删除。
const requireFromPocket = createRequire(import.meta.url)
const vueI18nRuntimeEsmBundlerPath = requireFromPocket.resolve('vue-i18n/dist/vue-i18n.runtime.esm-bundler.js')

// Life: 当远程构建/沙箱环境无法访问 dist.ayaka.moe / cubism.live2d.com 时，
// 设置 LIFE_SKIP_ASSET_DOWNLOAD=1 可跳过 Live2D/VRM 模型资产与 Cubism SDK 下载，
// 让 dev server 在缺资产状态下也能启动（模型加载会在运行时降级）。
function shouldSkipAssetDownload(): boolean {
  return process.env.LIFE_SKIP_ASSET_DOWNLOAD === '1' || process.env.LIFE_SKIP_ASSET_DOWNLOAD === 'true'
}

function buildAssetDownloadPlugins() {
  if (shouldSkipAssetDownload()) {
    console.warn('[Life] LIFE_SKIP_ASSET_DOWNLOAD=1, 跳过 Live2D/VRM 模型资产与 Cubism SDK 下载。')
    return []
  }
  return [
    DownloadLive2DSDK(),
    Download('https://dist.ayaka.moe/live2d-models/hiyori_free_zh.zip', 'hiyori_free_zh.zip', 'live2d/models', { parentDir: stageUIAssetsRoot, cacheDir: sharedCacheDir }),
    Download('https://dist.ayaka.moe/live2d-models/hiyori_pro_zh.zip', 'hiyori_pro_zh.zip', 'live2d/models', { parentDir: stageUIAssetsRoot, cacheDir: sharedCacheDir }),
    Download('https://dist.ayaka.moe/vrm-models/VRoid-Hub/AvatarSample-A/AvatarSample_A.vrm', 'AvatarSample_A.vrm', 'vrm/models/AvatarSample-A', { parentDir: stageUIAssetsRoot, cacheDir: sharedCacheDir }),
    Download('https://dist.ayaka.moe/vrm-models/VRoid-Hub/AvatarSample-B/AvatarSample_B.vrm', 'AvatarSample_B.vrm', 'vrm/models/AvatarSample-B', { parentDir: stageUIAssetsRoot, cacheDir: sharedCacheDir }),
  ]
}

export default defineConfig({
  optimizeDeps: {
    exclude: [
      // Internal Packages
      '@proj-airi/stage-ui/*',
      '@proj-airi/drizzle-duckdb-wasm',
      '@proj-airi/drizzle-duckdb-wasm/*',

      // Static Assets: Models, Images, etc.
      'public/assets/*',

      // Live2D SDK
      '@framework/live2dcubismframework',
      '@framework/math/cubismmatrix44',
      '@framework/type/csmvector',
      '@framework/math/cubismviewmatrix',
      '@framework/cubismdefaultparameterid',
      '@framework/cubismmodelsettingjson',
      '@framework/effect/cubismbreath',
      '@framework/effect/cubismeyeblink',
      '@framework/model/cubismusermodel',
      '@framework/motion/acubismmotion',
      '@framework/motion/cubismmotionqueuemanager',
      '@framework/type/csmmap',
      '@framework/utils/cubismdebug',
      '@framework/model/cubismmoc',
    ],
  },
  resolve: {
    alias: {
      '@proj-airi/server-sdk': resolve(join(import.meta.dirname, '..', '..', 'packages', 'server-sdk', 'src')),
      '@proj-airi/i18n': resolve(join(import.meta.dirname, '..', '..', 'packages', 'i18n', 'src')),
      '@proj-airi/stage-ui': resolve(join(import.meta.dirname, '..', '..', 'packages', 'stage-ui', 'src')),
      '@proj-airi/stage-layouts': resolve(join(import.meta.dirname, '..', '..', 'packages', 'stage-layouts', 'src')),
      '@proj-airi/stage-pages': resolve(join(import.meta.dirname, '..', '..', 'packages', 'stage-pages', 'src')),
      '@proj-airi/stage-shared': resolve(join(import.meta.dirname, '..', '..', 'packages', 'stage-shared', 'src')),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5273,
    fs: {
      // To mute errors like:
      //   The request id ".../node_modules/@fontsource/sniglet/files/sniglet-latin-400-normal.woff" is outside of Vite serving allow list.
      //
      // See: https://vite.dev/config/server-options#server-fs-strict
      strict: false,
    },
    warmup: {
      clientFiles: [
        `${resolve(join(import.meta.dirname, '..', '..', 'packages', 'stage-ui', 'src'))}/*.vue`,
        `${resolve(join(import.meta.dirname, '..', '..', 'packages', 'stage-pages', 'src'))}/*.vue`,
        `${resolve(join(import.meta.dirname, '..', '..', 'packages', 'stage-layouts', 'src'))}/*.vue`,
      ],
    },
  },
  build: {
    sourcemap: true,
  },
  worker: {
    format: 'es',
    rollupOptions: {
      output: {
        inlineDynamicImports: false,
      },
    },
  },

  plugins: [
    ...isEnvTruthy(process.env.VITE_SKIP_MKCERT ?? '')
      ? []
      : [mkcert((() => {
          // Workaround: plugin's bundled downloader has a feaxios bug, prefer system mkcert
          const command = process.platform === 'win32' ? 'where' : 'which'

          const { data } = tryCatch(() => ({ mkcertPath: execSync(`${command} mkcert`, { stdio: 'pipe' }).toString().trim().split(/\r?\n/)[0] }))
          return data
        })())],

    Info(),

    Yaml(),

    VueMacros({
      plugins: {
        vue: Vue({
          include: [/\.vue$/, /\.md$/],
          ...templateCompilerOptions,
        }),
        vueJsx: false,
      },
      betterDefine: false,
    }),

    VueRouter({
      extensions: ['.vue', '.md'],
      dts: resolve(import.meta.dirname, 'src/typed-router.d.ts'),
      importMode: 'async',
      routesFolder: [
        resolve(import.meta.dirname, 'src', 'pages'),
        {
          src: resolve(import.meta.dirname, '..', '..', 'packages', 'stage-pages', 'src', 'pages'),
          exclude: base => [
            ...base,
            '**/settings/connection/index.vue',
          ],
        },
      ],
      exclude: ['**/components/**'],
    }),

    // https://github.com/JohnCampionJr/vite-plugin-vue-layouts
    Layouts({
      layoutsDirs: [
        resolve(import.meta.dirname, 'src', 'layouts'),
        resolve(import.meta.dirname, '..', '..', 'packages', 'stage-layouts', 'src', 'layouts'),
      ],
    }),

    // https://github.com/antfu/unocss
    // see uno.config.ts for config
    Unocss(),

    // https://github.com/intlify/bundle-tools/tree/main/packages/unplugin-vue-i18n
    VueI18n({
      runtimeOnly: true,
      compositionOnly: true,
      fullInstall: true,
    }),

    // NOTICE:
    // unplugin-vue-i18n 的 runtimeOnly:true 会把 `import { useI18n } from "vue-i18n"`
    // 重写为 `from "vue-i18n/dist/vue-i18n.runtime.esm-bundler.js"`（见 lib/index.mjs
    // 的 getVueI18nAliasPath）。rolldown/vite 8 对 vue-i18n package.json exports 字段
    // 的 `"./dist/*": "./dist/*"` 通配符映射支持不完整，resolveId 时报 No such file or
    // directory。这里在 resolveId 钩子里用 Node 的 createRequire 拿到绝对路径返回，
    // 绕过 rolldown 的 exports 解析。
    // 移除条件: 升级到支持 exports 通配符的 rolldown 版本后可删除此插件。
    {
      name: 'life-fix-vue-i18n-runtime-resolve',
      enforce: 'pre',
      resolveId(source) {
        if (source === 'vue-i18n/dist/vue-i18n.runtime.esm-bundler.js') {
          return vueI18nRuntimeEsmBundlerPath
        }
      },
    },

    // https://github.com/webfansplz/vite-plugin-vue-devtools
    VueDevTools(),

    ...buildAssetDownloadPlugins(),

    ...isEnvTruthy(process.env.VITE_CAP_SYNC_IOS_AFTER_BUILD ?? '')
      ? [{
          name: 'proj-airi:capacitor-sync',
          closeBundle: {
            sequential: true,
            handler() {
              if (this.meta.watchMode) {
                execSync('cap sync ios', { stdio: 'inherit' })
              }
            },
          },
        } as PluginOption]
      : [],

    {
      name: 'proj-airi:defines',
      config(ctx) {
        const define: Record<string, any> = {
          'import.meta.env.RUNTIME_ENVIRONMENT': '\'capacitor\'',
        }
        if (ctx.mode === 'development') {
          define['import.meta.env.URL_MODE'] = '\'server\''
        }
        if (ctx.mode === 'production') {
          define['import.meta.env.URL_MODE'] = '\'file\''
        }

        return { define }
      },
    },
  ],
})
