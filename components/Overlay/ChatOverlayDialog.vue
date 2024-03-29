<template>
  <div>
    <v-card color="grey darken-4">
      <v-sheet color="primary" class="d-flex justify-space-between align-center pa-3">
        <div class="title black--text">
          <v-icon color="black" class="mr-1">{{ !!this.data ? 'edit' : 'add_to_queue' }}</v-icon>
          {{ !!this.data ? 'Edit' : 'Create New' }} OBS Chat Overlay
        </div>
        <v-btn
          color="black"
          text
          icon
          pa-0
          @click="cancel"
        >
          <v-icon color="black">close</v-icon>
        </v-btn>
      </v-sheet>

      <!-- Overlay Settings -->
      <v-card-text>

        <!-- Title -->
        <v-text-field
          v-model="overlay.title"
          class="mb-2"
          label="Name"
          color="primary"
          clearable
          outlined
          dense
          counter="240"
          validate-on-blur
          :loading="saveLoading"
          :disabled="saveLoading"
          prepend-icon="event_note"
          @change="enableSave = true"
        />

        <!-- Channel -->
        <v-autocomplete
          v-model="streamers.selection"
          label="Choose channel..."
          no-data-text="No channels found"
          prepend-icon="search"
          hide-details
          single-line
          :items="streamers.names"
          :search-input.sync="streamers.filter"
          clearable
          open-on-clear
          return-object
          outlined
          dense
          @change="enableSave = true"
        >
          <template v-slot:item="data">
            <v-list-item-avatar>
              <img
                :src="`${data.item.avatar}?_bw`"
                :alt="data.item.name"
              >
            </v-list-item-avatar>
            <v-list-item-title>
              {{ data.item.text }}
            </v-list-item-title>
          </template>
        </v-autocomplete>

        <!-- Toggles -->
        <div class="d-flex justify-space-around">
          <div class="d-flex flex-wrap flex-column">

            <!-- Global / Local -->
            <v-switch
              v-model="overlay.global"
              class="flex-grow-1"
              :label="`${overlay.global ? 'Global' : 'Local'} Chat`"
              color="primary"
              hide-details
              :loading="saveLoading"
              :disabled="saveLoading"
              @change="enableSave = true"
            />

            <!-- Show Timestamps -->
            <v-switch
              v-model="overlay.showTimestamps"
              class="flex-grow-1"
              label="Show Timestamps"
              color="primary"
              hide-details
              :loading="saveLoading"
              :disabled="saveLoading"
              @change="enableSave = true"
            />
          </div>

          <div class="d-flex flex-wrap flex-column">
            <!-- Show Avatars -->
            <v-switch
              v-model="overlay.showAvatars"
              class="flex-grow-1"
              label="Show Avatars"
              color="primary"
              hide-details
              :loading="saveLoading"
              :disabled="saveLoading"
              @change="enableSave = true"
            />

            <!-- High Density -->
            <v-switch
              v-if="false"
              v-model="overlay.highDensity"
              class="flex-grow-1"
              label="High Density"
              color="primary"
              hide-details
              :loading="saveLoading"
              :disabled="saveLoading"
              @change="enableSave = true"
            />
          </div>
        </div>

        <!-- History Size -->
        <div class="mt-3">
          <div class="subtitle-1">Show {{ overlay.history }} messages.</div>
          <v-slider
            v-model="overlay.history"
            prepend-icon="remove"
            max="100"
            min="1"
            step="1"
            :thumb-label="false"
            hide-details
          >
            <template #prepend>
              <v-icon
                color="primary"
                @click="overlay.history -= 5"
              >remove</v-icon>
            </template>
            <template #append>
              <v-icon
                color="primary"
                @click="overlay.history += 5"
              >add</v-icon>
            </template>
          </v-slider>
        </div>

        <div class="mt-3">

          <!--<div class="d-flex justify-space-between">-->

            <div class="subtitle-1">Background Color:</div>
            <v-color-picker
              v-model="overlay.colors.background"
              hide-canvas
              mode="hexa"
              :dot-size="30"
              width="100%"
              light
            />

          <!--</div>-->

        </div>
      </v-card-text>

      <v-card-actions class="justify-end">
        <v-btn
          class="mr-2"
          color="red"
          :disabled="saveLoading"
          @click="cancel"
        >
          cancel
        </v-btn>
        <v-btn
          color="success"
          :loading="saveLoading"
          @click="save"
        >
          {{ !!data ? 'Save' : 'Create' }}
        </v-btn>
      </v-card-actions>
    </v-card>

    <!-- Exit Confirmation Dialog -->
    <v-dialog
      v-model="showExitConfirm"
      width="320"
    >
      <v-card>
        <v-sheet
          color="primary"
          class="pa-2 d-flex justify-space-between align-center"
        >
          <h4 class="black--text body-1">
            You have unsaved changes!
          </h4>
          <v-icon light>warning</v-icon>
        </v-sheet>

        <v-card-title class="subtitle-1">
          Are you sure you want to exit?
        </v-card-title>
        <v-card-actions class="justify-end">
          <v-btn
            class="mr-2"
            color="primary"
            outlined
            @click="showExitConfirm = false"
          >
            No
          </v-btn>
          <v-btn
            color="primary"
            light
            @click="forceQuit"
          >
            Yes
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
  import { db } from '@/plugins/firebase.js';
  import { mapGetters } from 'vuex';
  import { VStore } from '@/store';

  const DEFAULT_OVERLAY = {
    id: null,
    channel: '',
    global: false,
    history: 25,
    showChannel: true,
    showTimestamps: true,
    showTrolls: true,
    showAvatars: true,
    highDensity: false,
    title: '',
    type: 'chat',
    colors: {
      background: '#80808080',
    },
  };

  export default {
    name: 'ChatOverlayDialog',

    model: {
      prop: 'value',
      event: 'change'
    },

    props: {
      data:  { type: Object, required: false },
    },

    data () {
      return {
        enableSave: false,
        saveLoading: false,
        showExitConfirm: false,

        overlay: { ...DEFAULT_OVERLAY },

        streamers: {
          names: [],
          filter: '',
          selection: null,
        },
      };
    },

    methods: {
      async save () {
        if ( this.data )
          await this.updateOverlay();
        else
          await this.createOverlay();
      },

      async createOverlay () {
        this.saveLoading = true;

        const date = new Date ( Date.now() );
        const channel = this.streamers.selection ? this.streamers.selection.text.toLowerCase() : this.user._username;
        const title = this.overlay.title ? this.overlay.title : `${channel}'s Overlay`;

        const data = {
          _username: this.user._username,
          channel: channel,
          created: date,
          edited: date,
          global: this.overlay.global,
          history: this.overlay.history,
          owner: this.user.uid,
          showChannel: true,
          showTimestamps: this.overlay.showTimestamps,
          showTrolls: true,
          showAvatars: this.overlay.showAvatars,
          title: title,
          type: 'chat',
        };

        const overlayRefs = db.collection( 'overlays' );
        await overlayRefs.add( data );

        this.saveLoading = false;

        this.forceQuit();
      },

      async updateOverlay () {
        this.saveLoading = true;

        const date = new Date ( Date.now() );
        const channel = this.streamers.selection ? this.streamers.selection.text.toLowerCase() : this.user._username;
        const title = this.overlay.title;

        const data = {
          channel: channel,
          edited: date,
          global: this.overlay.global,
          history: this.overlay.history,
          showChannel: true,
          showTimestamps: this.overlay.showTimestamps,
          showTrolls: true,
          showAvatars: this.overlay.showAvatars,
          title: title,
          colors: this.overlay.colors,
        };

        const overlayRef = db.collection( 'overlays' ).doc( this.overlay.id );
        await overlayRef.update( data );

        this.saveLoading = false;
        this.forceQuit();
      },

      reset () {
        this.overlay = {
          ...DEFAULT_OVERLAY,
          ...this.data
        };
        this.streamers.filter = '';
        this.streamers.selection = null;
      },

      cancel () {
        if ( this.enableSave )
          this.showExitConfirm = true;
        else
          this.forceQuit();
      },

      forceQuit () {
        this.reset();
        this.$emit( 'change', false );
      },

      async getStreamers () {
        let { data } = await this.$axios.get( '' + process.env.APISERVER + 'api/channels/list' );
        // https://api.bitwave.tv/api/channels/list should return users.name,avatar
        this.streamers.names = data.users.map( streamer => ({
          text   : streamer.name,
          value  : streamer.name,
          avatar : streamer.avatar,
        }));

        this.streamers.filtered = this.streamers.names;

        const name = ( this.overlay.channel ? this.overlay.channel : this.user.username ).toLowerCase();
        this.streamers.selection = this.streamers.names.find( s => s.text.toLowerCase() === name );
        this.streamers.filter    = this.streamers.selection.text;
      },
    },

    computed: {
      ...mapGetters ({
        user: VStore.$getters.getUser,
      }),
    },

    async created () {
      this.overlay = {
        ...DEFAULT_OVERLAY,
        ...this.data
      };
      await this.getStreamers();
    },

    watch: {
      data ( value ) {
        this.overlay = {
          ...DEFAULT_OVERLAY,
          ...value
        };
        const name = ( value.channel ? value.channel : this.user.username ).toLowerCase();
        this.streamers.selection = this.streamers.names.find( s => s.text.toLowerCase() === name );
        this.streamers.filter    = this.streamers.selection.text;
      },
    }

  };
</script>
