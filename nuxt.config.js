// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: false },

  runtimeConfig: {
    jwtSecret: process.env.NUXT_JWT_SECRET || 'rrhh_secret',
    public: {},
  },

  app: {
    head: {
      link: [
        { rel: 'stylesheet', href: '/css/styles.css' },
        { rel: 'stylesheet', href: '/css/styleguide.css' },
        { rel: 'stylesheet', href: '/css/colors.css' },
        { rel: 'stylesheet', href: '/css/icons.css' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css?family=Nunito:400,500,600,700,800' },
      ],
    },
  },

  components: [
    { path: '~/components/custom', pathPrefix: false },
    { path: '~/components/animations', pathPrefix: false },
    { path: '~/components/common' },
    { path: '~/components/modules' },
  ],

  devServer: {
    host: '0.0.0.0',
    port: 3000,
  },

  modules: ['@pinia/nuxt', '@nuxtjs/i18n'],

  i18n: {
    locales: [
      { code: 'en', name: 'English' },
      { code: 'es', name: 'Español' },
    ],
    strategy: 'no_prefix',
    detectBrowserLanguage: {
      useCookie: true,
      alwaysRedirect: true,
    },
  },

  plugins: ['~/plugins/translate.js'],

  compatibilityDate: '2025-06-04',
});
