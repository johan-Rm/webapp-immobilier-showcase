<template>
  <div class="flex items-center gap-3">
    <div :class="['relative shrink-0', sizeClass]">
      <AppImage
        v-if="user?.picture"
        :src="user.picture"
        :alt="userName"
        class="h-full w-full rounded-full object-cover"
        v-bind="IMAGE_PRESETS.thumbnailMobile"
      />
      <div
        v-else
        class="flex h-full w-full items-center justify-center rounded-full font-bold text-white"
        :class="textSizeClass"
        style="background-color: #6b7a4a"
      >
        {{ userInitials }}
      </div>
    </div>
    <div class="min-w-0">
      <p class="truncate leading-tight font-semibold text-white" :class="nameSizeClass">
        {{ userName }}
      </p>
      <p class="mt-0.5 truncate" :class="emailSizeClass" style="color: rgba(107, 122, 74, 0.7)">
        {{ user?.email }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
// 1. Imports

// 2. Types et constantes statiques
type WorkspaceUser = {
  id?: string
  name?: string
  email?: string
  picture?: string
} | null

// 3. Props et emits
const props = withDefaults(
  defineProps<{
    user?: WorkspaceUser
    size?: 'sm' | 'md'
  }>(),
  {
    user: null,
    size: 'md',
  },
)

// 8. Computed UI-ready
const sizeClass = computed<string>(() => (props.size === 'sm' ? 'h-8 w-8' : 'h-9 w-9'))
const textSizeClass = computed<string>(() => (props.size === 'sm' ? 'text-xs' : 'text-sm'))
const nameSizeClass = computed<string>(() => (props.size === 'sm' ? 'text-xs' : 'text-sm'))
const emailSizeClass = computed<string>(() =>
  props.size === 'sm' ? 'text-[0.65rem]' : 'text-[0.7rem]',
)

const userName = computed<string>(
  () => props.user?.name ?? props.user?.email?.split('@')[0] ?? 'Utilisateur',
)

const userInitials = computed<string>(() => {
  const source = props.user?.name ?? props.user?.email ?? '?'
  return source
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
})
</script>
