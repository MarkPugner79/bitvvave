<template>
    <div>
      <!-- Navigation List -->
      <div
        v-if="getPWaPrompt"
      >
        <v-btn
          class="text-center py-2 px-0"
          style="height: auto;"
          text
          tile
          block
          small
          @click="showPWAPrompt"
          no-prefetch
        >
          GET APP
        </v-btn>
      </div>

      <div class="">
        <v-btn
          class="text-center py-2"
          style="height: auto;"
          to="/replays"
          text
          tile
          block
          small
          @click="onClick"
          no-prefetch
        >
          Replays
        </v-btn>
      </div>

      <!--<div class="">
        <v-btn
          class="text-center py-2"
          style="height: auto;"
          to="/store"
          text
          tile
          block
          small
          @click="onClick"
          no-prefetch
        >
          Store
        </v-btn>
      </div>-->
    </div>
</template>

<script>
  import { mapGetters } from 'vuex';
  import { VStore } from '@/store';

  export default {
    name: 'NavigationList',

    serverCacheKey: () => 'NavigationList',

    data() {
      return {
        icon  : '/icon.png',
        icon1 : '/images/icon-1.png',
        icon2 : '/images/icon-2.png',
        items: [
          {
            icon   : 'whatshot',
            size   : 32,
            title  : 'Home',
            to     : '/',
          },
        ],
      };
    },

    methods: {
      onClick () {
        if ( 'vibrate' in navigator ) window.navigator.vibrate( 10 );
      },

      async showPWAPrompt () {
        const prompt = this.getPWaPrompt;

        await prompt.prompt();
        const userAction = await prompt.userChoice;

        //this.$analytics.logEvent( 'show_pwa_prompt' );

        if ( userAction.outcome === 'accepted' ) {
          this.$toast.success('Successfully installed.', { duration: 2000 });
          /*
          this.$ga.event({
            eventCategory : 'pwa-install',
            eventAction   : 'pwa-success',
          });
          */
          //this.$analytics.logEvent( 'pwa_installed' );
        } else if (userAction.outcome === 'dismissed') {
          this.$toast.error('Installation cancelled', { duration: 2000 });
          /*
          this.$ga.event({
            eventCategory : 'pwa-install',
            eventAction   : 'pwa-cancelled',
          });*/
          //this.$analytics.logEvent( 'pwa_install_cancelled' );
        } else {
          this.$toast.error('ERROR: Installation failed', { duration: 2000 });
          /*
          this.$ga.event({
            eventCategory : 'pwa-install',
            eventAction   : 'pwa-failed',
          });
          */
          //this.$analytics.logEvent( 'pwa_install_failed' );
        }
      },
    },

    computed: {
      ...mapGetters({
        getPWaPrompt: VStore.$getters.getPWaPrompt,
      }),
    },

    mounted() {},
  };
</script>
