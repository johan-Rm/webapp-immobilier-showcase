export type RichTextMark = { type: 'bold' | 'italic' } | { type: 'link'; attrs: { href: string } }

export type RichTextInline =
  { type: 'text'; text: string; marks?: RichTextMark[] } | { type: 'hardBreak' }

export type RichTextParagraph = { type: 'paragraph'; content: RichTextInline[] }
export type RichTextHeading = {
  type: 'heading'
  attrs: { level: 2 | 3 | 4 | 5 | 6 }
  content: RichTextInline[]
}
export type RichTextList = {
  type: 'bulletList' | 'orderedList'
  content: { type: 'listItem'; content: (RichTextParagraph | RichTextList)[] }[]
}
export type RichTextDocument = {
  type: 'doc'
  content: (RichTextParagraph | RichTextHeading | RichTextList)[]
}
