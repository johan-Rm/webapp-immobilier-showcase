export default defineAppConfig({
  ui: {
    colors: { primary: 'olive', neutral: 'stone' },
    button: {
      compoundVariants: [
        {
          color: 'primary',
          variant: 'solid',
          class:
            'bg-primary text-inverted hover:bg-olive-700 active:bg-olive-800 dark:hover:bg-olive-200 dark:active:bg-olive-100',
        },
      ],
    },
  },
})
