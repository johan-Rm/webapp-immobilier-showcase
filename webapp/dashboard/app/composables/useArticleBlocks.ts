export const useArticleBlocks = (editor: ReturnType<typeof useArticleEditor>) => {
  const blocks = computed(() => editor.state.form.translation.content.blocks)
  const add = (type: 'text' | 'image' | 'gallery') => {
    const id = crypto.randomUUID()
    if (type === 'text')
      blocks.value.push({
        id,
        type,
        document: { type: 'doc', content: [{ type: 'paragraph', content: [] }] },
      })
    if (type === 'image') blocks.value.push({ id, type, mediaId: '', alt: '', caption: '' })
    if (type === 'gallery') blocks.value.push({ id, type, items: [] })
  }
  const move = (index: number, delta: number) => {
    const target = index + delta
    if (target < 0 || target >= blocks.value.length) return
    const [block] = blocks.value.splice(index, 1)
    blocks.value.splice(target, 0, block!)
  }
  const remove = (index: number) => {
    blocks.value.splice(index, 1)
  }
  return { blocks, actions: { add, move, remove } }
}
