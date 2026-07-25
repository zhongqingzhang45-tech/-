import messages from '@proj-airi/i18n/locales'

import { resolveSupportedLocale } from '@proj-airi/i18n'
import { createI18n } from 'vue-i18n'

function getLocale() {
  let language = localStorage.getItem('settings/language')

  if (!language) {
    // Life 国内版默认使用简体中文
    language = navigator.language || 'zh-Hans'
  }

  return resolveSupportedLocale(language, Object.keys(messages!))
}

export const i18n = createI18n({
  legacy: false,
  locale: getLocale(),
  // Life 国内版默认回退语言为简体中文
  fallbackLocale: 'zh-Hans',
  messages,
})
