import type { SaasContent, SaasPublicArticle } from '#shared/types/saas/article'
import type { VNode } from 'vue'

import { h } from 'vue'

import { isEditorialLink } from '#shared/saas/links'

const inline = (
  items: Extract<
    SaasContent['blocks'][number],
    { type: 'text' }
  >['document']['content'][number]['content'],
): (VNode | string)[] =>
  items.flatMap((item) => {
    if (item.type === 'hardBreak') return [h('br')]
    if (item.type !== 'text') return []
    let value: VNode | string = item.text
    for (const mark of item.marks ?? []) {
      if (mark.type === 'bold') value = h('strong', null, [value])
      if (mark.type === 'italic') value = h('em', null, [value])
      if (mark.type === 'link' && isEditorialLink(mark.attrs.href))
        value = h('a', { href: mark.attrs.href, rel: 'noopener noreferrer' }, [value])
    }
    return [value]
  })
const rich = (
  nodes: Extract<SaasContent['blocks'][number], { type: 'text' }>['document']['content'],
): VNode[] =>
  nodes.map((node) => {
    if (node.type === 'paragraph') return h('p', null, inline(node.content))
    if (node.type === 'heading') return h('h' + node.attrs.level, null, inline(node.content))
    return h(
      node.type === 'orderedList' ? 'ol' : 'ul',
      null,
      node.content.map((item) => h('li', null, rich(item.content))),
    )
  })
export const renderArticle = (
  article: Omit<SaasPublicArticle, 'snapshotId' | 'publishedAt'>,
  media: Readonly<Record<string, string>>,
) => {
  const image = (item: { mediaId: string; alt: string; caption?: string }) => {
    const src = media[item.mediaId]
    if (!src) return null
    return h('figure', null, [
      h('img', { loading: 'lazy', decoding: 'async', src, alt: item.alt }),
      item.caption ? h('figcaption', null, item.caption) : null,
    ])
  }
  return h('article', { class: 'article-content' }, [
    h('header', null, [
      h('h1', null, article.headline),
      h('p', { class: 'article-summary' }, article.summary),
      article.categories.length
        ? h(
            'ul',
            { class: 'article-categories' },
            article.categories.map((c) => h('li', null, c.label)),
          )
        : null,
    ]),
    article.primaryImage ? image(article.primaryImage) : null,
    ...article.content.blocks.flatMap((block) =>
      block.type === 'text'
        ? rich(block.document.content)
        : block.type === 'image'
          ? [image(block)]
          : [h('div', { class: 'article-gallery' }, block.items.map(image))],
    ),
  ])
}
export const articleStyles = `.article-content{max-width:72ch;margin:auto;line-height:1.7;overflow-wrap:anywhere}.article-content h1{font-size:clamp(2rem,5vw,3.4rem);line-height:1.15}.article-content h2,.article-content h3{line-height:1.3}.article-content figure{margin:2rem 0}.article-content img{display:block;width:100%;height:auto;border-radius:.5rem}.article-content figcaption{font-size:.9rem;color:#475569}.article-summary{font-size:1.2rem}.article-categories{display:flex;flex-wrap:wrap;gap:1.5rem;padding-left:1rem}.article-gallery{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,16rem),1fr));gap:1rem}.article-gallery figure{margin:1rem 0}`
