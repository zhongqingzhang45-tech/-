import process, { cwd, env } from 'node:process'

import { execSync } from 'node:child_process'
import { join, resolve } from 'node:path'

import VueI18n from '@intlify/unplugin-vue-i18n/vite'
import templateCompilerOptions from '@tresjs/core/template-compiler-options'
import Vue from '@vitejs/plugin-vue'
import Unocss from 'unocss/vite'
import Basemove, { createS3Provider } from 'unplugin-basemove/vite'
import Info from 'unplugin-info/vite'
import Yaml from 'unplugin-yaml/vite'
import Mkcert from 'vite-plugin-mkcert'
import VueDevTools from 'vite-plugin-vue-devtools'
import Layouts from 'vite-plugin-vue-layouts'
import VueMacros from 'vue-macros/vite'
import VueRouter from 'vue-router/vite'

import { tryCatch } from '@moeru/std'
import { Download } from '@proj-airi/unplugin-fetch/vite'
import { DownloadLive2DSDK } from '@proj-airi/unplugin-live2d-sdk/vite'
import { LFS, SpaceCard } from 'hfup/vite'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

const stageUIAssetsRoot = resolve(join(import.meta.dirname, '..', '..', 'packages', 'stage-ui', 'src', 'assets'))
const sharedCacheDir = resolve(join(import.meta.dirname, '..', '..', '.cache'))

function hasFlagEnableMkcert(): boolean {
  if (process.argv.includes('--mkcert')) {
    return true
  }
  if (env.STAGE_WEB_ENABLE_MKCERT === 'true') {
    return true
  }

  return false
}

// Life: 当远程构建/沙箱环境无法访问 dist.ayaka.moe / cubism.live2d.com 时，
// 设置 LIFE_SKIP_ASSET_DOWNLOAD=1 可跳过 Live2D/VRM 模型资产与 Cubism SDK 下载，
// 让 dev server 在缺资产状态下也能启动（模型加载会在运行时降级）。
function shouldSkipAssetDownload(): boolean {
  return env.LIFE_SKIP_ASSET_DOWNLOAD === '1' || env.LIFE_SKIP_ASSET_DOWNLOAD === 'true'
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

      // wlipsync uses top-level await
      'wlipsync',
    ],
  },
  resolve: {
    alias: {
      '@proj-airi/server-sdk': resolve(join(import.meta.dirname, '..', '..', 'packages', 'server-sdk', 'src')),
      '@proj-airi/server-sdk-shared': resolve(join(import.meta.dirname, '..', '..', 'packages', 'server-sdk-shared', 'src')),
      '@proj-airi/server-shared': resolve(join(import.meta.dirname, '..', '..', 'packages', 'server-shared', 'src')),
      '@proj-airi/i18n': resolve(join(import.meta.dirname, '..', '..', 'packages', 'i18n', 'src')),
      '@proj-airi/stage-ui': resolve(join(import.meta.dirname, '..', '..', 'packages', 'stage-ui', 'src')),
      '@proj-airi/stage-pages': resolve(join(import.meta.dirname, '..', '..', 'packages', 'stage-pages', 'src')),
      '@proj-airi/stage-shared': resolve(join(import.meta.dirname, '..', '..', 'packages', 'stage-shared', 'src')),
      '@proj-airi/stage-layouts': resolve(join(import.meta.dirname, '..', '..', 'packages', 'stage-layouts', 'src')),
      '@proj-airi/core-agent': resolve(join(import.meta.dirname, '..', '..', 'packages', 'core-agent', 'src')),
      '@proj-airi/better-ws': resolve(join(import.meta.dirname, '..', '..', 'packages', 'better-ws', 'src')),
      '@proj-airi/pipelines-audio': resolve(join(import.meta.dirname, '..', '..', 'packages', 'pipelines-audio', 'src')),
      '@proj-airi/stream-kit': resolve(join(import.meta.dirname, '..', '..', 'packages', 'stream-kit', 'src')),
      '@proj-airi/electron-screen-capture': resolve(join(import.meta.dirname, '..', '..', 'packages', 'electron-screen-capture', 'src')),
      '@proj-airi/font-cjkfonts-allseto': resolve(join(import.meta.dirname, '..', '..', 'packages', 'font-cjkfonts-allseto', 'src')),
      '@proj-airi/font-xiaolai': resolve(join(import.meta.dirname, '..', '..', 'packages', 'font-xiaolai', 'src')),
      '@proj-airi/plugin-protocol': resolve(join(import.meta.dirname, '..', '..', 'packages', 'plugin-protocol', 'src')),
      '@proj-airi/audio': resolve(join(import.meta.dirname, '..', '..', 'packages', 'audio', 'src')),
      '@proj-airi/audio-pipelines-transcribe': resolve(join(import.meta.dirname, '..', '..', 'packages', 'audio-pipelines-transcribe', 'src')),
    },
  },
  server: {
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
      ],
    },
    // Life: 沙箱/容器环境 inotify 配额不足时，设置 LIFE_USE_POLLING_WATCH=1
    // 切换到轮询模式，避免 ENOSPC 错误阻断 dev server。
    watch: env.LIFE_USE_POLLING_WATCH === '1' || env.LIFE_USE_POLLING_WATCH === 'true'
      ? { usePolling: true, interval: 1000 }
      : undefined,
  },
  build: {
    // Life: sourcemap 在 OOM 受限的沙箱/CI 环境会显著放大内存峰值，
    // 通过 LIFE_DISABLE_SOURCEMAP=1 关闭以让 build 在 6GB 内存下完成。
    // Removal condition: 部署环境内存充裕后可恢复为 true。
    sourcemap: env.LIFE_DISABLE_SOURCEMAP !== '1' && env.LIFE_DISABLE_SOURCEMAP !== 'true',
    // Life: rendering chunks 阶段在 6GB 沙箱中峰值过高导致被 OOM killer 终止（exit 129）。
    // 关闭压缩以减少 CPU/内存双峰值，产物体积变大但能完成构建；部署侧用 nginx gzip 弥补。
    // Removal condition: 部署环境内存充裕后可恢复为 'esbuild'。
    minify: env.LIFE_DISABLE_MINIFY === '1' || env.LIFE_DISABLE_MINIFY === 'true' ? false : 'esbuild',
    chunkSizeWarningLimit: 16000,
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
    ...(
      hasFlagEnableMkcert()
        ? [Mkcert((() => {
            // Workaround: plugin's bundled downloader has a feaxios bug, prefer system mkcert
            const command = process.platform === 'win32' ? 'where' : 'which'

            const { data } = tryCatch(() => ({ mkcertPath: execSync(`${command} mkcert`, { stdio: 'pipe' }).toString().trim().split(/\r?\n/)[0] }))
            return data
          })())]
        : []
    ),

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
        resolve(import.meta.dirname, '..', '..', 'packages', 'stage-pages', 'src', 'pages'),
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

    // https://github.com/antfu/vite-plugin-pwa
    // NOTICE:
    // The plugin must stay registered in dev — `src/modules/pwa.ts` imports
    // the `virtual:pwa-register` module the plugin synthesises, and dropping
    // the plugin breaks Vite's import-analysis with a "Failed to resolve
    // import" error.
    // SW generation in dev is already disabled by `devOptions.enabled:
    // false` (the plugin's own default). So new SWs do NOT register from
    // `pnpm dev` alone — but a previously-registered SW (e.g. from an
    // earlier `vite preview` / `vite build`) lives on per-origin in the
    // browser and keeps intercepting fetches even in dev. To recover from
    // that state, unregister via DevTools → Application → Storage → Clear
    // site data.
    ...(env.TARGET_HUGGINGFACE_SPACE
      ? []
      : [VitePWA({
          registerType: 'prompt',
          includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
          manifest: {
            name: 'Life - 二次元 AI 虚拟伴侣',
            short_name: 'Life',
            icons: [
              {
                src: '/web-app-manifest-192x192.png',
                sizes: '192x192',
                type: 'image/png',
              },
              {
                src: '/web-app-manifest-512x512.png',
                sizes: '512x512',
                type: 'image/png',
              },
              {
                purpose: 'maskable',
                sizes: '192x192',
                src: '/maskable_icon_x192.png',
                type: 'image/png',
              },
              {
                purpose: 'maskable',
                sizes: '512x512',
                src: '/maskable_icon_x512.png',
                type: 'image/png',
              },
            ],
          },
          workbox: {
            maximumFileSizeToCacheInBytes: 64 * 1024 * 1024,
            navigateFallbackDenylist: [
              /^\/docs\//,
              /^\/ui\//,
              /^\/remote-assets\//,
              /^\/api\//,
            ],
          },
        })]),

    // https://github.com/intlify/bundle-tools/tree/main/packages/unplugin-vue-i18n
    VueI18n({
      runtimeOnly: true,
      compositionOnly: true,
      fullInstall: true,
    }),

    // https://github.com/webfansplz/vite-plugin-vue-devtools
    VueDevTools(),

    ...buildAssetDownloadPlugins(),

    // HuggingFace Spaces
    LFS({ root: cwd(), extraGlobs: [
      // Scene & Models
      '*.vrm',
      '*.vrma',
      '*.hdr',
      '*.cmo3',
      // Images & Fonts
      '*.png',
      '*.jpg',
      '*.jpeg',
      '*.gif',
      '*.webp',
      '*.bmp',
      '*.ttf',
      '*.avif',
      // Tensorflow / MediaPipe task
      '*.task',
    ] }),
    SpaceCard({
      root: cwd(),
      title: 'Life: 二次元 AI 虚拟伴侣',
      emoji: '🧸',
      colorFrom: 'pink',
      colorTo: 'pink',
      sdk: 'static',
      pinned: false,
      license: 'mit',
      models: [
        'onnx-community/whisper-base',
        'onnx-community/silero-vad',
      ],
      short_description: 'Life - 面向国内用户的沉浸式二次元 AI 虚拟伴侣，支持 Live2D 和 VRM。',
    }),

    // For the following example assets:
    //
    // dist/assets/ort-wasm-simd-threaded.jsep-B0T3yYHD.wasm                21,596.01 kB │ gzip: 5,121.95 kB
    // dist/assets/XiaolaiSC-Regular-SNWuh554.ttf                           22,183.94 kB
    // dist/assets/cjkFonts_allseto_v1.11-ByBdljxl.ttf                      31,337.14 kB
    // dist/assets/duckdb-coi-CSr8FQO4.wasm                                 32,320.49 kB │ gzip: 7,194.65 kB
    // dist/assets/duckdb-eh-BJOC5S4x.wasm                                  32,604.02 kB │ gzip: 7,133.37 kB
    // dist/assets/duckdb-mvp-8HYqhb4i.wasm                                 37,345.64 kB │ gzip: 8,099.69 kB
    //
    // they are too large to be able to put into deployments like Cloudflare Workers or Pages,
    // we need to upload them to external storage and use renderBuiltUrl to rewrite their URLs.
    ...((!env.S3_ENDPOINT || !env.S3_ACCESS_KEY_ID || !env.S3_SECRET_ACCESS_KEY)
      ? []
      : [
          Basemove({
            prefix: env.STAGE_WEB_WARP_DRIVE_PREFIX || 'proj-airi/stage-web/main/',
            include: [/\.wasm$/i, /\.ttf$/i, /\.vrm$/i, /\.zip$/i], // in existing assets, wasm, ttf, vrm files are the largest ones
            manifest: true,
            clean: false,
            contentTypeBy: (filename: string) => {
              if (filename.endsWith('.wasm')) {
                return 'application/wasm'
              }
              if (filename.endsWith('.ttf')) {
                return 'font/ttf'
              }
              if (filename.endsWith('.vrm')) {
                return 'application/octet-stream'
              }
              if (filename.endsWith('.zip')) {
                return 'application/zip'
              }
            },
            provider: createS3Provider({
              endpoint: env.S3_ENDPOINT,
              accessKeyId: env.S3_ACCESS_KEY_ID,
              secretAccessKey: env.S3_SECRET_ACCESS_KEY,
              region: env.S3_REGION,
              publicBaseUrl: env.WARP_DRIVE_PUBLIC_BASE ?? env.S3_ENDPOINT,
            }),
          }),
        ]),
  ],
})
