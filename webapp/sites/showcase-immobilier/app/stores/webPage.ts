import type { WebPageDto } from '@schemas/dtos'
import type { WebPage } from '@schemas/interfaces'

import { mapWebPages } from '@services/mapper/webPage'

type WebPageState = {
  list: WebPageDto[]
}

export const useWebPageStore = defineStore('webPage', {
  state: (): WebPageState => ({
    list: [],
  }),

  getters: {
    getWebPage(): (slug: string) => WebPage | null {
      return (slug: string) => this.getWebPages.find((page) => page.slug === slug) || null
    },

    getWebPages(state: WebPageState): WebPage[] {
      const metadataStore = useMetadataStore()

      return mapWebPages(
        state.list,
        metadataStore.getCategoryCodes,
        metadataStore.getImageObjects,
        metadataStore.getApp?.navigation ?? {},
      )
    },
  },

  actions: {
    setList(pages: WebPageDto[]): void {
      const next = Array.isArray(pages) ? pages : []
      const getKey = (item: WebPageDto) => String(item.slug ?? '')
      this.list = mergeListByKey(this.list, next, { getKey })
    },

    reset(): void {
      this.list = []
    },
  },
})
