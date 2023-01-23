require('dotenv').config();
const pkg = require('./package');

// noinspection PointlessArithmeticExpressionJS
module.exports = {
  components: true,

  /*
  ** Environment variables
  */
  env: {
    version: pkg.version || '0.0.0',
    VERSION: pkg.version || '0.0.0',

    APP_DEBUG: process.env.APP_DEBUG || false,
    BITWAVE_ENV: process.env.BITWAVE_ENV || process.env.NODE_ENV || 'production',

    APISERVER: process.env.APISERVER || 'api.bitwave.tv',
    CHATSERVER: process.env.CHATSERVER || 'chat.bitwave.tv',

    WORKBOX_DEBUG: process.env.WORKBOX_DEBUG,

    SSR_TIMEOUT: parseInt( process.env.SSR_TIMEOUT ) || 10 * 1000,
  },

  /*
  ** Headers of the page
  */
  head: {
    title: pkg.name,
    meta: [
      { charset: 'utf-8' },
      { property: 'viewport',     content: 'width=device-width, initial-scale=1' },
      { property: 'og:site_name', content: '[bitvvave.tv]' },
      { property: 'og:image',     content: '/images/bitwave-banner.jpg', hid: 'og:image' },
      { property: 'description',  content: pkg.description, hid: 'description' },
      // https://cdn.bitwave.tv/static/img/BitWave2.sm.jpg // old image
    ],
    script: [],
    link: [
      {
        rel: 'icon',
        type: 'image/x-icon',
        href: process.env.BRANDING.FAV,
        crossorigin: 'anonymouse',
      },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css?family=IBM+Plex+Sans:500&display=swap',
      },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css?family=Material+Icons',
      },
    ],
  },

  /*
  ** Customize the progress-bar color
  */
  loading: { color: '#13a9fe' },

  /*
  ** Global CSS
  */
  css: [
    '~/assets/style/app.scss',
    'video.js/dist/video-js.css',
    'vuetify/dist/vuetify.css',
  ],


  pwa: {
    workbox: {
      config: { debug: process.env.WORKBOX_DEBUG },

      importScripts: [
        '/bitwave-offline-sw.js',
      ],

      cleanupOutdatedCaches: true,

      /*preCaching: [
        'https://fonts.googleapis.com/css?family=Roboto:100,300,400,500,700,900&display=swap',
        'https://fonts.googleapis.com/css?family=IBM+Plex+Sans:500&display=swap',
        'https://fonts.googleapis.com/css?family=Material+Icons',
      ],*/

      // Runtime caching caches pages as we browse
      runtimeCaching: [
        {
          urlPattern: '/.*',
          handler:    'networkFirst',
          method:     'GET',
          strategyOptions: {
            cacheExpiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 1, // 1 day
              purgeOnQuotaError: true,
            }
          },
        },

        /*{
          urlPattern: 'https://stream.bitwave.tv/stream/.*',
          handler: 'networkOnly',
          strategyOptions: {
            cacheName: 'HLS-cache',
          },
        },*/


        // Cache fonts
        {
          urlPattern: 'https://fonts.googleapis.com',
          handler: 'NetworkFirst',
          method: 'GET',
          strategyOptions: {
            cacheName: 'assets',
            cacheExpiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 1, // ( 1 day ) 1 year
              purgeOnQuotaError: true,
            }
          },
        },
        {
          urlPattern: 'https://fonts.gstatic.com',
          handler: 'StaleWhileRevalidate',
          method: 'GET',
          strategyOptions: {
            cacheName: 'assets',
            /*cacheableResponse: {
              statuses: [ 200 ],
            },*/
            cacheExpiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 1, // ( 1 day ) 1 year
              purgeOnQuotaError: true,
            }
          },
        },


        // Cache basic API responses
        {
          urlPattern: process.env.APISERVER + 'api/(?:channels/list|bump)$',
          handler: 'NetworkFirst',
          method: 'GET',
          strategyOptions: {
            cacheName: 'bitwave-api',
          },
        },

        // Long lived API responses
        {
          urlPattern: process.env.APISERVER + 'api/channels(/?|/([a-zA-Z0-9._-]+)?)$',
          handler: 'NetworkFirst',
          method: 'GET',
          strategyOptions: {
            cacheName: 'bitwave-api',
          },
        },

        // Cache emotes
        {
          urlPattern: process.env.APISERVER + 'emotes/(.*)\\?4$',
          handler: 'CacheFirst',
          method: 'GET',
          strategyOptions: {
            cacheName: 'bitwave-emotes',
            cacheableResponse: {
              statuses: [ 200 ],
            },
            cacheExpiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 30, // 30 Days
              purgeOnQuotaError: true,
            },
          },
        },

        // more workbox cache settings...
      ],

      // Automatically cache for offline usage
      offlineAssets: [
        // Route Locations
        /*
        '/',
        '/login',
        '/profile',
        '/chat',
        '/embed',
        */

        // Assets
        process.env.CDNSERVERURL + 'litechat/hit.wav',
        '/sounds/tweet.mp3',
        '/images/icon-2.png',
        '/static/images/bitwave-banner.jpg',
        process.env.CDNSERVERURL + 'emotes/dead_sus_troll_standing.png',
        'https://fonts.googleapis.com/css?family=Material+Icons',
        //'https://' + process.env.APISERVER + '/static/img/firework-banner.gif',
      ],

      // routingExtensions: [],
    },

    /*
  ** Manifest Module
  */
    manifest: {
      name: process.env.BRANDING.BRACKETS || "[SET BRANDING.BRACKETS]",
      short_name: process.env.BRANDING.BRACKETS || "[SET BRANDING.BRACKETS]",
      description: 'An open platform live streaming service for creators to freely express themselves.',
      categories: [ 'entertainment', 'social' ],
      lang: 'en',
      display: 'standalone',
      background_color: '#000000',
      theme_color: '#13a9fe',
    },

    meta: {
      appleStatusBarStyle: 'black-translucent',
      name: process.env.BRANDING.BRACKETS || "[SET BRANDING.BRACKETS]",
      description: 'An open platform live streaming service for creators to freely express themselves.',
      theme_color: '#13a9fe',
      ogType: 'website',
      ogHost: process.env.BRANDING.URL || "[SET BRANDING.URL]",
      twitterCard: 'summary_large_image',
      twitterSite: '@BitvvaveTV',
      // twitterCreator: '',
    },
  },



  /*
  ** Plugins to load before mounting the App
  */
  plugins: [
    '@/plugins/axiossr',
    '@/plugins/firebase',
    '@/plugins/VueClipboard',
    '@/plugins/utils.js',
    { src: '@/plugins/commandParser.js', mode: 'client' },
    { src: '@/plugins/pwa.client.js', mode: 'client' },
    { src: '@/plugins/sw-hook', mode: 'client' },
    { src: '@/plugins/VueCountdown', mode: 'client' },
    //{ src: '@/plugins/RTCMultiConnection', mode: 'client' },
  ],

  /*
  ** Nuxt.js modules
  */
  modules: [
    // Doc: https://axios.nuxtjs.org/usage
    '@nuxtjs/axios',
    '@nuxtjs/device',
    '@nuxtjs/pwa',
    '@nuxtjs/toast',
    '@nuxtjs/sentry',
    'cookie-universal-nuxt',
    //[ '@nuxtjs/google-analytics', { id: 'UA-133753190-2' } ],
    [ '@nuxtjs/component-cache', { maxAge: 1000 * 60 * 2 } ],
    //[ 'nuxt-stripe-module', { publishableKey: process.env.STRIPE_PUBLISHABLE_KEY } ],
  ],

  /*
  ** Build Modules
  */
  buildModules: [
    '@nuxtjs/vuetify',
    '@nuxtjs/dotenv',
    '@nuxtjs/style-resources',
  ],

  /*
  ** Axios module configuration
  */
  axios: {
    // See https://github.com/nuxt-community/axios-module#options
    // progress: false,
  },

  /*
  ** Vuetify
  */
  vuetify: {
    optionsPath: './vuetify.options.js',
  },

  /*
  ** SASS/SCSS global styling variables & mixins
  */
  styleResources: {
    scss: [
      './assets/vars/*.scss',
    ],
  },

  /*
  ** Sentry
  */
  sentry: {
    dsn: process.env.SENTRY_DSN,
    config: {
      attachCommits: true,
      publishRelease: true,
      sourceMapStyle: 'hidden-source-map',
      release: pkg.version,
    },
  },

  /*
  ** Toast
  */
  toast: {
    position: 'bottom-right',
    keepOnHover: true,
    register: [
      {
        name: 'update',
        message: payload => payload.message,
        options: {
          position: 'top-center',
          icon: 'autorenew',
          theme: 'bitwave',
          className: '',
          type: 'update-toast',
          action: {
            text: 'update',
            class: 'update-toast',
            onClick: ( e, toast ) => {
              console.log( 'Reloading the page to update to latest version of bitwave.' );
              toast.goAway(0);
              window.location.reload();
            }
          },
        },
      },
    ],
  },

  /*
  ** Build configuration
  */
  build: {
    /*
    ** You can extend webpack config here
    */

    devtools: process.env.NODE_ENV === 'development',

    // crossorigin: true,

    // extractCSS: true,

    // parallel: process.env.APP_DEBUG === 'true',

    extend ( config, ctx ) {

    },
  },
};
