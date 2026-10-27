import { strict as assert } from 'node:assert'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { DOC_PAGES, docsUrl } from './docsUrl'

const WEBSITE_DOCS = resolve(dirname(fileURLToPath(import.meta.url)), '../../../website-docs')

// VitePress default slugify for the headings we link to: explicit `{#id}`
// wins, otherwise lowercase with whitespace and punctuation collapsed to `-`.
function headingIds(markdown: string): Set<string> {
  const ids = new Set<string>()
  for (const line of markdown.split('\n')) {
    const m = /^#{1,6}\s+(.*?)\s*$/.exec(line)
    if (!m) continue
    const explicit = /\{#([^}]+)\}$/.exec(m[1])
    if (explicit) {
      ids.add(explicit[1])
      continue
    }
    ids.add(
      m[1]
        .toLowerCase()
        .replace(/[\s~`!@#$%^&*()+=[\]{}|\\;:'",.<>/?]+/g, '-')
        .replace(/^-+|-+$/g, ''),
    )
  }
  return ids
}

test('every linked doc page and anchor exists in website-docs', () => {
  for (const [key, target] of Object.entries(DOC_PAGES)) {
    const [page, anchor] = target.split('#')
    const file = resolve(WEBSITE_DOCS, page ? `${page}.md` : 'index.md')
    assert.ok(existsSync(file), `${key}: ${file} not found`)
    if (anchor) {
      assert.ok(headingIds(readFileSync(file, 'utf8')).has(anchor), `${key}: #${anchor} not found in ${file}`)
    }
  }
})

test('docsUrl keeps every documentation link on this deployment', () => {
  assert.equal(docsUrl('home'), '/docs/')
  assert.equal(docsUrl('models'), '/docs/03-features/06-models')
  for (const page of Object.keys(DOC_PAGES) as (keyof typeof DOC_PAGES)[]) {
    const target = new URL(docsUrl(page), 'http://helmskb.example')
    assert.equal(target.origin, 'http://helmskb.example')
    assert.ok(target.pathname.startsWith('/docs/'))
  }
})
