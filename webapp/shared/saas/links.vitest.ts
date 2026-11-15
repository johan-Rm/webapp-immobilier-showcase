import { describe, expect, it } from 'vitest'

import { isEditorialLink } from './links'

describe('frontière des liens éditoriaux', () => {
  it.each([
    '#contact',
    '/fr/articles/un-bien?source=menu#photos',
    'articles/un-bien',
    'https://example.test/fr?q=mer#vue',
    'http://example.test',
    'HTTPS://example.test',
    'mailto:contact@example.test',
    'tel:+212123456789',
  ])('autorise une navigation éditoriale : %s', (value) => {
    expect(isEditorialLink(value)).toBe(true)
  })

  it.each([
    '',
    '//example.test/path',
    'https://editor:secret@example.test/path',
    'http://example.test@evil.test',
    'https://',
    'javascript:alert(1)',
    'JaVaScRiPt:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'file:///etc/passwd',
    'blob:https://example.test/id',
    'https://example.test/with space',
    ' https://example.test',
    '/\\example.test',
    '../private',
    'mailto:',
    'tel:',
    ...['\u0000', '\u0009', '\u000a', '\u000d', '\u001f', '\u007f'].map(
      (control) => `https://example.test/${control}path`,
    ),
  ])('refuse une entrée dangereuse ou invalide : %j', (value) => {
    expect(isEditorialLink(value)).toBe(false)
  })
})
