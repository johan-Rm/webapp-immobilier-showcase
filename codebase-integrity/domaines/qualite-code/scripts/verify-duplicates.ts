type Line = { number: number; text: string }
type Window = { path: string; index: number }
export type Duplicate = {
  first: string
  firstLine: number
  second: string
  secondLine: number
  lines: number
}

/** Compare exact normalized text; whitespace is normalized, comments are excluded. */
export function findDuplicates(
  sources: Record<string, string>,
  selected: Set<string>,
): Duplicate[] {
  const lines = new Map<string, Line[]>()
  const windows = new Map<string, Window[]>()
  for (const path of Object.keys(sources).sort()) {
    const values = sources[path]
      .split(/\r?\n/)
      .map((text, i) => ({ number: i + 1, text: text.trim().replace(/\s+/g, ' ') }))
      .filter(
        ({ text }) =>
          text && !text.startsWith('//') && !text.startsWith('*') && !text.startsWith('<!--'),
      )
    lines.set(path, values)
    for (let index = 0; index + 10 <= values.length; index++) {
      const window = values.slice(index, index + 10).map((line) => line.text)
      if (window.join('').length < 200) continue
      const key = JSON.stringify(window)
      const occurrences = windows.get(key) ?? []
      occurrences.push({ path, index })
      windows.set(key, occurrences)
    }
  }
  const matches = new Map<string, { first: string; second: string; a: number; b: number }[]>()
  for (const occurrences of windows.values()) {
    for (let i = 0; i < occurrences.length; i++)
      for (let j = i + 1; j < occurrences.length; j++) {
        const a = occurrences[i],
          b = occurrences[j]
        if (!selected.has(a.path) && !selected.has(b.path)) continue
        if (a.path === b.path && b.index - a.index < 10) continue
        const key = JSON.stringify([a.path, b.path, b.index - a.index])
        const group = matches.get(key) ?? []
        group.push({ first: a.path, second: b.path, a: a.index, b: b.index })
        matches.set(key, group)
      }
  }
  const result: Duplicate[] = []
  for (const group of matches.values()) {
    group.sort((x, y) => x.a - y.a)
    let start = group[0],
      end = start.a
    const emit = () =>
      result.push({
        first: start.first,
        firstLine: lines.get(start.first)![start.a].number,
        second: start.second,
        secondLine: lines.get(start.second)![start.b].number,
        lines: end - start.a + 10,
      })
    for (const item of group.slice(1)) {
      if (item.a <= end + 1) end = Math.max(end, item.a)
      else {
        emit()
        start = item
        end = item.a
      }
    }
    emit()
  }
  return result.sort(
    (a, b) =>
      a.first.localeCompare(b.first) ||
      a.firstLine - b.firstLine ||
      a.second.localeCompare(b.second) ||
      a.secondLine - b.secondLine,
  )
}
