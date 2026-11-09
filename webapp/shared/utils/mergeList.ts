type MergeListOptions<T> = {
  getKey: (item: T) => string
}

export const mergeListByKey = <T>(previous: T[], next: T[], options: MergeListOptions<T>): T[] => {
  const { getKey } = options
  const previousMap = new Map<string, T>()

  for (const item of previous) {
    const key = getKey(item)
    if (key) previousMap.set(key, item)
  }

  return next.map((item) => {
    const key = getKey(item)
    const existing = key ? previousMap.get(key) : undefined
    if (existing && existing !== item) {
      Object.assign(existing as Record<string, unknown>, item as Record<string, unknown>)
      return existing
    }
    return item
  })
}
