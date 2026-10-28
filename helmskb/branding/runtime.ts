import profile from './brand.json'
import { brandMessages } from './prose.mjs'

export const brand = profile
export function applyBrandMessages(messages: Record<string, any>) {
  const result = brandMessages(messages, profile)
  const docsLabels: Record<string, string> = {
    'zh-CN': '文档', 'zh-TW': '文件', 'en-US': 'Docs',
    'ja-JP': 'ドキュメント', 'ko-KR': '문서', 'ru-RU': 'Документация',
  }
  for (const [locale, bundle] of Object.entries(result) as [string, any][]) {
    if (bundle.common?.website) bundle.common.website = docsLabels[locale] || 'Docs'
  }
  return result
}
