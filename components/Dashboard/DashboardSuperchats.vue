<template>
  <div>
    <v-card
      class="d-flex flex-column"
      style="max-height: 80vh;"
    >
      <!-- Title Bar -->
      <v-sheet
        tile
        color="primary"
        class="d-flex align-center justify-space-between pl-2"
      >
        <h5 class="title">Chat Alerts</h5>
      </v-sheet>

      <div class="pa-3">
        <!-- Alerts Summary -->
        <div class="mt-2 d-flex">

          <!-- Total Alert Count -->
          <v-chip
            class="mr-3"
            color="primary"
            outlined
            small
          >
            <v-icon left small>campaign</v-icon>
            {{ totalCount }} Alerts
          </v-chip>

          <!-- Total Coin Value -->
          <v-chip
            class="mr-2"
            color="purple lighten-2"
            outlined
            small
          >
            <v-icon left small>account_balance</v-icon>
            {{ totalCoins }} Coins
          </v-chip>
        </div>
      </div>

      <v-divider />

        <!-- Display recent Alerts -->
        <v-sheet
          color="black"
          class="px-3"
          style="overflow-y: auto;"
        >
          <div class="my-3 overline grey--text">Most Recent</div>
          <v-alert
            v-for="( alert, index ) in chatAlerts"
            :key="index"
            dense
            outlined
            text
            border="left"
            :color="alert.color"
            class="my-3"
          >
            <div class="d-flex align-center">
              <div><span class="font-weight-bold">{{ alert.username }}</span> spent <span class="font-weight-bold">{{ alert.amount }} coins</span>:</div>
              <v-spacer />
              <div class="overline grey--text">{{ getTimeAgo( alert.timestamp._seconds * 1000 ) }}</div>
            </div>
            <div class="white--text" style="word-break: break-word;">
              {{ alert.message }}
            </div>
          </v-alert>

          <v-alert
            v-if="chatAlerts && chatAlerts.length === 0"
            color="purple"
            dense
            class="my-3"
          >
            No alerts received yet.
          </v-alert>

          <!-- Skeleton loader -->
          <component
            is="v-slide-x-transition"
            hide-on-leave
          >
            <div
              v-if="!chatAlerts"
              class="my-3"
            >
              <v-alert
                dense
                outlined
                text
                border="left"
                color="grey"
                class="my-3"
              >
                <v-skeleton-loader
                  type="paragraph"
                  class="my-1"
                  dark
                ></v-skeleton-loader>
              </v-alert>

              <v-alert
                dense
                outlined
                text
                border="left"
                color="blue"
                class="my-3"
              >
                <v-skeleton-loader
                  type="paragraph"
                  class="my-1"
                  dark
                ></v-skeleton-loader>
              </v-alert>

              <v-alert
                dense
                outlined
                text
                border="left"
                color="red"
                class="my-3"
              >
                <v-skeleton-loader
                  type="paragraph"
                  class="my-1 d-flex"
                  dark
                ></v-skeleton-loader>
              </v-alert>
            </div>
          </component>

        </v-sheet>

      <v-divider />

      <div
        class="pa-3"
      >
        <div class="d-flex">
          <v-spacer />
          <v-btn
            class="mr-3"
            color="primary"
            small
            :loading="loading"
            @click="getSuperchats"
          >
            Reload
          </v-btn>
          <v-btn
            color="primary"
            small
            :loading="loading"
            :disabled="!offset"
            @click="getMoreSuperchats"
          >
            Load More
          </v-btn>
        </div>
      </div>
    </v-card>
  </div>
</template>

<script>
  import { auth } from '@/plugins/firebase';
  import { mapGetters } from 'vuex';
  import { VStore } from '@/store';
  import { timeAgo } from '@/assets/js/time-ago';

  export default {
    name: 'DashboardSuperchats',

    data() {
      return {
        loading: false,

        offset: null,
        totalCount: 0,    // Total count of alerts
        totalCoins: 0,    // Total value of coins
        chatAlerts: null, // Array of alerts and data
      };
    },

    methods: {
      async updateToken () {
        const token = await auth.currentUser.getIdToken( true );
        this.$axios.setToken( token, 'Bearer' );
      },

      async authenticated ( user ) {
        if ( !user ) return;
        setTimeout( async () => await this.getSuperchats(), 2000 );
        /*await this.getSuperchats();*/
      },

      async getSuperchats () {
        if ( !this.username || this.loading ) return;

        this.loading = true;

        await this.updateToken();

        //const endpoint = `https://api.bitwave.tv/v1/coins/${this.username}/alerts`;
        const endpoint = `` + process.env.APISERVER + `v1/coins/${this.username}/alerts`;
        const payload =  {};
        try {
          const { data } = await this.$axios.get( endpoint, payload, );
          if ( data.success  ) {
            this.offset     = data.offset;
            this.totalCount = data.totalCount;
            this.totalCoins = data.totalCoins;
            this.chatAlerts = data.data;
          } else {
            this.chatAlerts = [];
            console.error( `Failed to load any alerts`, data );
          }
        } catch ( error ) {
          console.error( error );
        }

        this.loading = false;
      },

      async getMoreSuperchats () {
        if ( !this.username || this.loading ) return;

        this.loading = true;

        await this.updateToken();

        //const endpoint = `https://api.bitwave.tv/v1/coins/${this.username}/alerts/${this.offset}`;
        const endpoint = `` + process.env.APISERVER + `v1/coins/${this.username}/alerts/${this.offset}`;
        const payload =  {};
        try {
          const { data } = await this.$axios.get( endpoint, payload, );
          if ( data.success  ) {
            this.offset     = data.offset;
            this.totalCount += data.totalCount;
            this.totalCoins += data.totalCoins;
            this.chatAlerts.push( ...data.data );
          } else {
            console.error( `Failed to load any alerts`, data );
          }
        } catch ( error ) {
          console.error( error );
        }

        this.loading = false;
      },

      getTimeAgo( time ) {
        return timeAgo( time );
      },
    },

    computed: {
      ...mapGetters({
        username: VStore.$getters.getUsername,
      }),
    },

    async mounted () {
      this.unsubAuthChanged = auth.onAuthStateChanged( user => this.authenticated( user ) );
    },

    beforeDestroy () {
      if ( this.unsubAuthChanged ) this.unsubAuthChanged();
    },
  };
</script>
