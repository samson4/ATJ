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
        // white background in light mode, elevated background in dark mode
        root: 'rounded-lg overflow-y-auto shadow-sm bg-white dark:bg-dark-elevated',
        header: 'p-4 sm:px-6 bg-white dark:bg-dark-elevated',
        body: 'p-4 sm:p-6 bg-white dark:bg-dark-elevated',
        footer: 'p-4 sm:px-6 bg-white dark:bg-dark-elevated'
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
    },
        dashboardPanel: {
      slots: {
        root: 'relative border-none flex flex-col min-w-0 min-h-svh lg:not-last:border-e lg:not-last:border-default shrink-0',
        body: 'flex flex-col gap-4 sm:gap-6 flex-1 overflow-y-auto p-4 sm:p-6',
        handle: ''
      },
      variants: {
        size: {
          true: {
            root: 'w-full lg:w-(--width)'
          },
          false: {
            root: 'flex-1'
          }
        }
      }
    }
  },
})
