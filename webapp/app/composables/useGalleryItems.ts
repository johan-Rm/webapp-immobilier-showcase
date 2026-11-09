import type { MediaObject } from '@schemas/interfaces'
import type { ComputedRef } from 'vue'

export type { GalleryItem }

function extractImageSrc(image: MediaObject | MediaObject[] | string | undefined): string {
  if (typeof image === 'string') return image.trim()
  if (Array.isArray(image)) return image[0]?.url?.trim() ?? ''
  return image?.url?.trim() ?? ''
}

export const useGalleryItems = (
  hasPart: ComputedRef<CreativeWork[] | undefined>,
): { galleryItems: ComputedRef<GalleryItem[]> } => {
  const metadataStore = useMetadataStore()

  const galleryItems = computed<GalleryItem[]>(() =>
    (hasPart.value ?? [])
      .map((part, index) => {
        const src = extractImageSrc(part.image as MediaObject | MediaObject[] | string | undefined)
        if (!src) return null

        const imageMeta = metadataStore.imageObjects.find((item) => item.url === src)
        const title = imageMeta?.caption || `Visuel ${index + 1}`

        return {
          id: `img-${index + 1}`,
          title,
          alternateName: title,
          src,
          sourceIndex: index,
        }
      })
      .filter((item): item is GalleryItem => item !== null),
  )

  return { galleryItems }
}
