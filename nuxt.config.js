// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },

  runtimeConfig: {
    // Private keys are only available on the server

    // Public keys that are exposed to the client
    public: {
      API_URL: process.env.NUXT_NODE_ENV,
      WEB_URL: process.env.NUXT_URL,
      ROME_URL: process.env.NUXT_ROME,
      GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
    },
  },

  app: {
    head: {
      link: [
        {
          rel: "stylesheet",
          href: "/css/styles.css",
        },
        {
          rel: "stylesheet",
          href: "/css/styleguide.css",
        },
        {
          rel: "stylesheet",
          href: "/css/colors.css",
        },
        {
          rel: "stylesheet",
          href: "/css/icons.css",
        },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css?family=Nunito:400,500,600,700,800",
        },
      ],
      script: [
        {
          src: `https://maps.googleapis.com/maps/api/js?key=${process.env.GOOGLE_API_KEY}&libraries=places`,
          defer: true,
          async: true
        },
      ],
    },
  },

  components: [
    {
      path: "~/components/custom",
      pathPrefix: false,
    },
    {
      path: "~/components/animations",
      pathPrefix: false,
    },
    {
      path: "~/components/common",
    },
    {
      path: "~/components/modules",
    },
  ],

  devServer: {
    host: "0.0.0.0",
    port: 3000,
  },

  modules: ["@pinia/nuxt", "nuxt-vue3-google-signin", "@vueuse/nuxt", "@nuxtjs/i18n"],

  googleSignIn: {
    clientId: process.env.GOOGLE_CLIENT_ID,
  },

  i18n: {
    // ...
    locales: [
      {
        code: 'en',
        name: 'English'
      },
      {
        code: 'es',
        name: 'Español'
      },
    ],
    strategy: 'no_prefix',
    detectBrowserLanguage: {
      useCookie: true,
      alwaysRedirect: true
    }
  },

  // router: {
  //   middleware: [], // Elimina cualquier middleware definido aquí
  // },
  plugins: ['~/plugins/translate.js'],

  compatibilityDate: "2025-06-04",
});