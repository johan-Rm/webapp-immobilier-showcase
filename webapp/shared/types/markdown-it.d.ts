// `markdown-it` n'embarque pas ses types et `@types/markdown-it` ne peut pas
// être installé de façon fiable dans l'image dev (réinstall bun instable en
// WSL2). On déclare ici le sous-ensemble réellement utilisé par l'éditeur
// Tiptap, typé (pas d'`any`).
declare module 'markdown-it' {
  interface MarkdownItOptions {
    html?: boolean
    xhtmlOut?: boolean
    breaks?: boolean
    linkify?: boolean
    typographer?: boolean
  }

  export default class MarkdownIt {
    constructor(options?: MarkdownItOptions)
    render(src: string): string
    renderInline(src: string): string
  }
}
