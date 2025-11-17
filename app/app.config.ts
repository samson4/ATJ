export default defineAppConfig({
  ui: {
    colors: {
      primary: 'orange',
      secondary: 'amber',
      error:"red",
      warning:"yellow",
      success:"blue",
      info:"info",
      neutral: 'neutral',
      link: "blue"
    },
     icons: {
      light: 'i-ph-sun',
      dark: 'i-ph-moon'
    },
    card:{
       slots: {
        root: 'rounded-lg overflow-hidden',
        header: 'p-4 sm:px-6',
        body: 'p-4 sm:p-6',
        footer: 'p-4 sm:px-6'
      },
      variants: {
        variant: {
          solid: {
            root: 'bg-inverted text-inverted'
          },
          outline: {
            root: 'dark:bg-ehite dark:text-white ring ring-default'
          },
          soft: {
            root: 'bg-elevated/50 divide-y divide-default'
          },
          subtle: {
            root: 'bg-elevated/50 ring ring-default divide-y divide-default'
          },
        }
      },
      defaultVariants: {
        variant: 'outline'
      }
    }
  },
})
