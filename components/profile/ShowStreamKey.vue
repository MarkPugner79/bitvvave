<template>
  <v-card :class="bgColor.split(' ')" class="mb-4 pa-3">
    <div>
      <h2 class="mb-4"><v-icon class="mx-2">verified_user</v-icon> Stream Server & Key</h2>

      <!-- Stream server & key -->
      <div class="mb-4">
        <v-text-field
          :value="streamServer"
          class="mb-3"
          label="Stream URL"
          readonly
          solo
          light
          hide-details
          :loading="loadingData"
        >
          <template slot="append">
            <v-btn
              color="blue"
              depressed
              dark
              @click="copyToClipboard( streamServer )"
            >
              copy
            </v-btn>
          </template>
        </v-text-field>

        <v-text-field
          :value="fullStreamkey"
          ref="streamkeyinput"
          class="mb-3"
          label="Stream Key"
          readonly
          solo
          light
          hide-details
          :messages="streamkeyMessage"
          :loading="loadingData"
          :type="showKey ? 'text' : 'password'"
        >
          <template slot="append">
            <v-btn

              icon
              @click="showStreamKey"
            >
              <v-icon>{{ showKey ? 'visibility' : 'visibility_off' }}</v-icon>
            </v-btn>
          </template>
        </v-text-field>
      </div>

      <div class="d-flex">
        <v-spacer/>
        <v-btn
          :color="color"
          outlined
          :loading="loadingData"
          @click="resetStreamKey"
          class="mr-2"
        >
          Reset Key
        </v-btn>
        <v-btn
          :color="color"
          class="black--text"
          :loading="loadingData"
          depressed
          @click="copyToClipboard( fullStreamkey )"
        >
          Copy Key
        </v-btn>
      </div>
    </div>

    <v-overlay
      absolute
      :opacity=".75"
      :value="errorOverlay"
    >
      <v-alert
        :type="alert.type"
        error
        outlined
      >
        <div class="headline">
          {{ alert.message }}
        </div>
      </v-alert>
    </v-overlay>

  </v-card>
</template>

<script>
  import { auth, db } from '@/plugins/firebase';
  import { mapGetters } from 'vuex';
  import { VStore } from '@/store';

  const endpoint   = 'rtmp://stream.bitwave.tv/live';
  const maskedAddr = 'rtmp://****.bitwave.tv/****';

  export default {
    name: 'ShowStreamKey',

    data () {
      return {
        unsubAuthChanged: null,
        profileListener: null,

        errorOverlay: true,

        loadingData: true,
        showKey: false,

        streamServer: maskedAddr,
        streamkey: '',

        streamkeyMessage: '',

        alert: {
          type: 'error',
          message: 'PLEASE LOGIN',
        },

        color: 'yellow',
        bgColor: 'grey darken-3',
      };
    },

    methods: {
      copyToClipboard ( data ) {
        this.$copyText( data ).then( () => {
          this.$toast.success( 'Copied to clipboard', { icon: 'done', duration: 5000 } );
          this.$refs['streamkeyinput'].focus();
        }, ( error ) => {
          console.log( error );
          this.$toast.error( `Copy Failed: ${error}`, { icon: 'error', duration: 5000 } );
        });
      },

      showStreamKey () {
        this.showKey = !this.showKey;
        if ( this.showKey ) setTimeout( () => this.showKey = false, 10000 );
      },

      async resetStreamKey () {
        /*
        this.$ga.event({
          eventCategory : 'profile',
          eventAction   : 'reset key',
          eventLabel    : this.username.toLowerCase(),
        });
        */

        this.loadingData = true;
        const key        = Math.random().toString( 16 ).substr( 2, 9 );
        const profileRef = db.collection( 'users' ).doc( this.uid );
        await profileRef.update({ streamkey: key });
        this.loadingData = false;
      },

      getStreamKey ( uid ) {
        this.loadingData = true;
        const profileRef = db.collection( 'users' ).doc( uid );
        return profileRef.onSnapshot( doc => this.onDataChanged( doc.data() ) );
      },

      onDataChanged ( data ) {
        this.bgColor = 'grey darken-2';
        this.color = 'yellow';

        if ( data && data.streamkey ) {
          // Successfully got key
          this.streamServer = endpoint;
          this.streamkey    = data.streamkey;
          this.errorOverlay = false;

          // Change colors
          this.color = 'white';
          this.bgColor = 'blue';
        } else {
          this.streamServer = maskedAddr;
          this.streamkey = '';

          // Show warning
          this.errorOverlay  = true;
          this.alert.type    = 'warning';
          this.alert.message = 'NO KEY FOUND';
        }

        this.loadingData = false;
      },

      onLoggedOut () {
        this.streamServer = maskedAddr;
        this.streamkey = '';
        this.profileListener();
        this.profileListener = null;

        this.bgColor = 'grey darken-2';
        this.color = 'yellow';
      },

      async authenticated ( user ) {
        this.streamkey = '';
        this.errorOverlay  = !user;
        this.alert.type    = 'error';
        this.alert.message = 'PLEASE LOGIN';

        this.bgColor = 'grey darken-2';
        this.color = 'yellow';

        // Clear out the old event listener
        if ( this.profileListener ){
          this.profileListener();
          this.profileListener = null;
        }


        // Logged in and are not listening to user profile
        // Start listening on the user profile
        if ( user && !this.profileListener ) {
          // Show warning
          this.errorOverlay  = true;
          this.alert.type    = 'warning';
          this.alert.message = 'NO KEY AVAILABLE';

          this.profileListener = await this.getStreamKey( user.uid );
        }

        // Logged out and are listening to user profile
        // Remove listener since we no long have a valid user.
        if ( !user && this.profileListener ) {
          this.onLoggedOut();
        }
      },
    },

    computed: {
      ...mapGetters({
        uid: VStore.$getters.getUID,
        username : VStore.$getters.getUsername,
      }),

      fullStreamkey () {
        return `${this.username}?key=${this.streamkey}`;
      },
    },

    async created () {
      if ( this.uid ) {
        this.errorOverlay = false;
        // this.profileListener = await this.getStreamKey( this.uid );
      }
    },

    mounted () {
      this.unsubAuthChanged = auth.onAuthStateChanged( user => this.authenticated( user ) );
    },

    beforeDestroy () {
      if ( this.unsubAuthChanged ) this.unsubAuthChanged();
      if ( this.profileListener )  this.profileListener();
    },
  };
</script>
