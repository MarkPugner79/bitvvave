<template>
  <div :style="{
    marginRight: pageMarginRight,
    borderTight: 'solid 1px #212121',
  }">

    <!-- Streamer Top Bar -->
    <stream-top-bar
      :avatar="avatar"
      :name="name"
      :nsfw="nsfw"
      :streamer-id="owner"
    />

    <!-- Video JS -->
    <div class="d-flex justify-space-around">
      <v-responsive
        :aspect-ratio="16/9"
        max-width="calc(150vh - 98px)"
      >
        <v-sheet
          color="grey darken-4"
          class="fill-height"
          v-intersect="{
          handler: onIntersect,
          options: {
            threshold: [ 0, 0.5, 1.0 ],
          },
        }"
        >
          <div
            v-if="showCountdown"
            style="position:absolute;"
          >
            <div
              style="position: relative; top: 1rem; left: 1rem; z-index: 10; opacity: 75%;"
            >
              <countdown
                :timestamp="scheduled"
                :key="scheduled"
              />
            </div>
          </div>

          <!-- Bitwave Stream Player Might need to hook fedwave video player for this-->
          <video  id="rtcbinder"
           class=" vjs-custom-skin vjs-big-play-centered vjs-16-9" 
           controls  
           playsinline  
           
           
           
            hidden :live="live" :docked="smartDetach" >
            
           
          </video>


          <bitwave-video-player
            :live="live"
            :autoplay="live || !disableBumps"
            :docked="smartDetach"
            @ended="onEnded"
            @stats="trackWatchTime"
            id="shitwavevid"
          >
            <template #title>
              <h5 class="white--text body-2 ml-2">{{ name }}</h5>
            </template>

          </bitwave-video-player>

          <div
            v-if="smartDetach"
            style="height: 100%; width: 100%;"
          >
            <div
              id="bw-player-thumbnail"
              :style="`background-image: url('${posterCacheBusted}\');`"
            ></div>
          </div>

        </v-sheet>

        <!-- Video Overlay -->
        <stickers />

      </v-responsive>
    </div>

    <!-- Chat -->
    <div
      v-if="displayChat"
      :key="1"
      class="d-flex"
      :class="{ 'chat-desktop': !mobile || ( mobile && landscape ) }"
      :style="{
        maxHeight: mobile && !landscape ? '390px' : '100%',
        width: mobile && landscape ? '50%' : null
      }"
    >
      <chat
        :chat-channel="name"
      />
    </div>

    <!-- Restore chat FAB -->
    <v-fab-transition>
      <v-btn
        v-show="!displayChat"
        color="primary"
        fixed
        fab
        dark
        bottom
        right
        class="v-btn--example"
        @click="showChat"
      >
        <v-icon color="black">question_answer</v-icon>
      </v-btn>
    </v-fab-transition>

    <v-divider />

    <!-- Banned Alert -->
    <v-alert
      v-if="banned"
      class="ma-4"
      type="error"
      outlined
      dense
    >
      {{ banMessage }}
    </v-alert>

    <!-- Stream Info -->
    <stream-info
      :name="name"
      :live="live"
      :title="title"
      :nsfw="nsfw"
      :description="description"
      :timestamp="timestamp"
    />

  </div>
</template>

<script>
  import { mapState, mapGetters, mapMutations } from 'vuex';

  import { Chat as ChatStore } from '@/store/chat';
  import { VStore } from '@/store';
  import { Player } from '@/store/player';

  import { db } from '@/plugins/firebase.js';

  // So lets disable webrtc
  
  /* Including this breaks the page loading, so all of the webrtc bits have been commented out that would normally be used for watching
  // There is still legacy parts thrown in here as far as videoPreview,connection,useWebRTC that have been added
  // so where I left off on this is debugging getting the value of the player option to use webrtc which you can find webRTC and _watch
  import * as io from '@/plugins/socketio.js' // should import v4 of socket io

  // notice that the exports were removed from this, which were in the original library call
  import * as RTCMultiConnection from '@/plugins/simpleRTC.js'

  let connection = new RTCMultiConnection(); // so this fires the second instance it would seem
  */
  

  import Chat from '@/components/Chat/Chat';
  import StreamTopBar from '@/components/Channel/StreamTopBar';
  import StreamInfo from '@/components/Channel/StreamInfo';
  import BitwaveVideoPlayer from '@/components/BitPlayer/BitwaveVideoPlayer';
  //import RtcVideoPlayer from '@/components/RtcPlayer/RtcVideoPlayer';

  const Stickers = async () => await import ( '@/components/effects/Stickers' );

  
  //console.log("_Watch.vue - Before Export useWebrtc:",this.useWebRTC);

  // BACK TO NORMAL STREAM STUFF THAT ISN'T HANDLING WEBRTC CONNECTIONS

  export default {
    name: 'watch',

    scrollToTop: true,

    head () {
      return {
        title: `${this.name} - ${process.env.BRANDING.BRACKETS}`,
        link: [
          { rel: 'canonical', href: `https://bitvvave.tv/${this.name}` },
        ],
        meta: [
          { property: 'og:title',            hid: 'og:title',       content: `${this.title} - ${process.env.BRANDING.BRACKETS}` },
          { property: 'og:url',              hid: 'og:url',         content: `https://bitvvave.tv/${this.name}` },
          { property: 'og:description',      hid: 'og:description', content: ( this.description || '' ).substring( 0, 200 ) },
          { property: 'og:image',            hid: 'og:image',       content: this.poster },
          { property: 'description',         hid: 'description',    content: ( this.name || '' ).substring( 0, 200 ) },
          { property: 'author',              content: this.name },
          { property: 'profile:username',    content: this.name },
          { property: 'twitter:card',        content: 'summary_large_image' },
          { property: 'twitter:site',        content: '@BitwaveTV' },
          { property: 'twitter:title',       content: ( this.title || '' ).substring( 0,  70 ) },
          { property: 'twitter:description', content: ( this.description  || '' ).substring( 0, 200 ) },
          { property: 'twitter:image',       content: this.poster },
        ],
      }
    },

    components: {
      Stickers,
      StreamTopBar,
      StreamInfo,
      Chat,
      BitwaveVideoPlayer,
      //RtcVideoPlayer,
    },

    data () {
      return {
        mounted: false,
        landscape: false,
        showStreamStats: false,
        streamDataListener: null,
        recentBumps: [],

        videoPreview: null,
        connection:null,
        //useWebRTC:false,

        // Hydrated data defaults
        name: '',
        avatar: null,
        title: '',
        description: '',
        poster: process.env.BRANDING.BANNER,
        live: false,
        nsfw: false,
        owner: null,
        url: null,
        type: null,
        timestamp: null,
        scheduled: null,
        banned: false,

        banMessage: 'This channel has been banned for breaching our Terms of Service.',
      }
    },

    methods: {
      async onEnded () {
        console.log(`Player source ended`);
        this.setSource({ url: await this.getRandomBump(), type: 'video/mp4' });
      },

      trackWatchTime ( stats ) {
        /*
        this.$ga.event({
          eventCategory : 'stream',
          eventAction   : 'watch-time',
          eventLabel    : this.name,
          eventValue    : stats.duration,
        });
        this.$ga.event({
          eventCategory : 'stream',
          eventAction   : 'watch-interval',
          eventLabel    : this.name,
          eventValue    : stats.interval,
        });*/
      },

      async getRandomBump () {
        const { data } = await this.$axios.get( `` + process.env.APISERVER + `api/bump` );
        // limit to checking 15 most recent bumps
        if ( this.recentBumps.length >= 15 ) this.recentBumps = this.recentBumps.splice( -15 );
        // Recurse until we get a fresh bump
        if ( this.recentBumps.includes( data.url ) ){
          console.log( `Recently seen ${data.url}, getting a new bump` );
          return await this.getRandomBump();
        }
        this.recentBumps.push( data.url );
        return data.url;
      },

      getStreamData () {
        const channel = this.$route.params.watch;
        const streamer  = ( this.name || channel ).toLowerCase();
        // this is part of what was overode to get the streaming to work
        console.log("Should try to connect to:",channel);
        
        
        
        /*
        let do_init = false;//this.useWebRTC;
        if(do_init){
          console.log("Setup Webrtc in get stream data HD audio");
          connection.setHighBitrateModeAudio(true); // This should be used with a checkbox to configure if the stream should be high bitrate on the streamer side so it can be configured, automatically via config on the clients side
        // user need to connect server, so that others can reach him.
        connection.connectSocket(function(socket) {
              socket.on('logs', function(log) {
                console.log("Socket logger...");
                  //document.querySelector('h1').innerHTML = log.replace(/</g, '----').replace(/>/g, '___').replace(/----/g, '(<span style="color:red;">').replace(/___/g, '</span>)');
                  console.log(log);
              });

              console.log("Socket for ");

              // this event is emitted when a broadcast is already created.
              socket.on('join-broadcaster', function(hintsToJoinBroadcast) {
                  console.log('join-broadcaster', hintsToJoinBroadcast);

                  connection.session = hintsToJoinBroadcast.typeOfStreams;
                  connection.sdpConstraints.mandatory = {
                      OfferToReceiveVideo: !!connection.session.video,
                      OfferToReceiveAudio: !!connection.session.audio
                  };
                  connection.broadcastId = hintsToJoinBroadcast.broadcastId;
                  connection.join(hintsToJoinBroadcast.userid);
              });

              socket.on('rejoin-broadcast', function(broadcastId) {
                  console.log('rejoin-broadcast', broadcastId);

                  connection.attachStreams = [];
                  socket.emit('check-broadcast-presence', broadcastId, function(isBroadcastExists) {
                      if (!isBroadcastExists) {
                          // the first person (i.e. real-broadcaster) MUST set his user-id
                          connection.userid = broadcastId;
                      }

                      socket.emit('join-broadcast', {
                          broadcastId: broadcastId,
                          userid: connection.userid,
                          typeOfStreams: connection.session
                      });
                  });
              });

              socket.on('broadcast-stopped', function(broadcastId) {
                  // alert('Broadcast has been stopped.');
                  // location.reload();
                  console.error('broadcast-stopped', broadcastId);
                  //alert('This broadcast has been stopped.');
              });

              // this event is emitted when a broadcast is absent.
              
          });
          

          connection.onstreamended = function() {
            console.log("Stream ended...");
            // should be hooked up for bumps
          };

          connection.onleave = function(event) {
              if (event.userid !== this.videoPreview.userid) return;

              connection.getSocket(function(socket) {
                  socket.emit('can-not-relay-broadcast');

                  connection.isUpperUserLeft = true;

                  if (allRecordedBlobs.length) {
                      // playing lats recorded blob
                      var lastBlob = allRecordedBlobs[allRecordedBlobs.length - 1];
                      this.videoPreview = document.getElementById('rtcbinder'); // rtcbinder instead of rtcbinder and not hide the other player since we are going to bind inside of it
                      console.log("OnLeave Preview window thinger:",this.videoPreview);
                      this.videoPreview.src = URL.createObjectURL(lastBlob);
                      this.videoPreview.play();
                      allRecordedBlobs = [];
                  } else if (connection.currentRecorder) {
                      var recorder = connection.currentRecorder;
                      connection.currentRecorder = null;
                      recorder.stopRecording(function() {
                          if (!connection.isUpperUserLeft) return;
                          this.videoPreview = document.getElementById('rtcbinder');
                          console.log("Stop recording Preview window thinger:",this.videoPreview);
                          this.videoPreview.src = URL.createObjectURL(recorder.getBlob());
                          this.videoPreview.play();
                      });
                  }

                  if (connection.currentRecorder) {
                    connection.currentRecorder.stopRecording();
                      connection.currentRecorder = null;
                  }
              });
          };

          

          var allRecordedBlobs = [];
          

          function repeatedlyRecordStream(stream) {
              if (!enableRecordings) {
                  return;
              }

              connection.currentRecorder = RecordRTC(stream, {
                  type: 'video'
              });

              connection.currentRecorder.startRecording();

              setTimeout(function() {
                  if (connection.isUpperUserLeft || !connection.currentRecorder) {
                      return;
                  }

                  connection.currentRecorder.stopRecording(function() {
                      allRecordedBlobs.push(connection.currentRecorder.getBlob());

                      if (connection.isUpperUserLeft) {
                          return;
                      }

                      connection.currentRecorder = null;
                      repeatedlyRecordStream(stream);
                  });
              }, 30 * 1000); // 30-seconds
          };

          connection.onNumberOfBroadcastViewersUpdated = function(event) {
              if (!connection.isInitiator) return;

              //document.getElementById('broadcast-viewers-counter').innerHTML = 'Number of broadcast viewers: <b>' + event.numberOfBroadcastViewers + '</b>';
          };

          connection.onstream = function(event) {
              if (connection.isInitiator && event.type !== 'local') {
                  return;
              }

              connection.isUpperUserLeft = false;
              this.videoPreview = document.getElementById('rtcbinder');
              this.videoPreview = document.getElementById('streamplayer_html5_api');
              this.videoPreview.controls = true;
              console.log("On stream event Preview window thinger:",this.videoPreview);
              this.videoPreview.srcObject = event.stream;
              // now this would be a good spot to hook up and throw the webrtc type info into it
              // and give it another way to setup and setRTC source
              try{
                this.videoPreview.play();
                // hide the bitwave-video-player
                let shitwavevid = document.getElementById('shitwavevid');
                //shitwavevid.hidden = true;
                //this.videoPreview.hidden = false;
                // find the play button and hide it on the player by class name 'vjs-icon-placeholder' 'vjs-big-play-button' title 'Play Video'
                let nodePlayButton = document.getElementsByClassName('vjs-big-play-button');//document.querySelector('[title="Play Video"]');
                console.log("We have:", nodePlayButton.length,nodePlayButton);
                nodePlayButton[0].style.visibility = 'hidden';
                nodePlayButton[0].removeAttribute('onclick');
                let nodeClickOverlayButton = document.getElementsByClassName('vjs-text-track-display');//document.querySelector('[title="Play Video"]');

                nodeClickOverlayButton[0].style.visibility = 'hidden';
                // data.disabled might be able to prevent the click?
                nodeClickOverlayButton[0].removeAttribute('onclick');

                // modal
                let nodeModalButton = document.getElementsByClassName('vjs-modal-dialog-content');//document.querySelector('[title="Play Video"]');
                nodeModalButton.forEach(modal => {
                  modal.style.visibility = 'hidden';
                  //console.log("Modals found:",nodeModalButton);
                  // data.disabled might be able to prevent the click?
                  modal.removeAttribute('onclick');
                  modal.hidden = true;
                });
                

                let nodeErrorButton = document.getElementsByClassName('vjs-error-dialog-description');//document.querySelector('[title="Play Video"]');
                nodeErrorButton.forEach(errbtn => {
                  errbtn.style.visibility = 'hidden';
                //console.log("Errors found:",nodeErrorButton);
                // data.disabled might be able to prevent the click?
                errbtn.removeAttribute('onclick');
                errbtn.hidden = true;
                });


              }catch(error){
                  console.log("There was an error auto playing, you probably need to manually click play");
              }

              this.videoPreview.userid = event.userid;

              if (event.type === 'local') {
                this.videoPreview.muted = true;
              }

              if (connection.isInitiator == false && event.type === 'remote') {
                  // he is merely relaying the media
                  connection.dontCaptureUserMedia = true;
                  connection.attachStreams = [event.stream];
                  connection.sdpConstraints.mandatory = {
                      OfferToReceiveAudio: false,
                      OfferToReceiveVideo: false
                  };

                  connection.getSocket(function(socket) {
                      socket.emit('can-relay-broadcast');

                      if (connection.DetectRTC.browser.name === 'Chrome') {
                        connection.getAllParticipants().forEach(function(p) {
                              if (p + '' != event.userid + '') {

                                  connection.replaceTrack(event.stream, p);
                                 
                              }
                          });
                      }

                      if (connection.DetectRTC.browser.name === 'Firefox') {
                          // Firefox is NOT supporting removeStream method
                          // that's why using alternative hack.
                          // NOTE: Firefox seems unable to replace-tracks of the remote-media-stream
                          // need to ask all deeper nodes to rejoin
                          connection.getAllParticipants().forEach(function(p) {
                              if (p + '' != event.userid + '') {
                                connection.replaceTrack(event.stream, p);
                              }
                          });
                      }

                      // Firefox seems UN_ABLE to record remote MediaStream
                      // WebAudio solution merely records audio
                      // so recording is skipped for Firefox.
                      if (connection.DetectRTC.browser.name === 'Chrome') {
                          repeatedlyRecordStream(event.stream);
                      }
                  });
              }

              // to keep room-id in cache
              localStorage.setItem(connection.socketMessageEvent, connection.sessionid);
          };
        }else{
          console.log("Skipping webrtc section, to setup the stream requested.");
          // setup the stream data
          //this.setPoster( this.poster );
          //this.setSource({ url: this.url, type: this.type }); 
          //this.mounted = true;
          // seems like this should fire and finish setup
        } // end of do connection web rtc init
        */
          
       
        

          console.log("Yeah I hate retarded firebase, will be pruned or replaced with something even worse This would be the ideal place to patch in the WEBRTC");
      },

      async streamDataChanged ( data ) {
        // Ban flag
        const banned = data.banned || false;
        this.banned = banned;

        // Streamer user properties
        this.name   = data.user.name;
        this.avatar = data.user.avatar;
        this.owner  = data.owner;

        // Grab Stream Data
        this.title       = data.title;
        this.description = data.description;

        // Stream properties
        this.nsfw  = data.nsfw;
        const live = data.live;

        // Process timestamp
        this.timestamp = data.timestamp
          ? data.timestamp.toDate()
          : null;

        // Process scheduled date
        this.scheduled = data.scheduled
          ? data.scheduled.toDate()
          : null;

          

        // Stream media
        const url  = data.url;
        const type = data.type || `application/x-mpegURL`; // DASH -> application/dash+xml

        // Cover image
        if ( live ) {
          this.poster = data.thumbnail;
          this.setPoster( data.thumbnail );
        }

        // Detect offline stream
        if ( !this.live && !live ) console.debug( 'User is offline' );

        // Detect user going LIVE
        else if ( !this.live && live ) {
          // immediately set to LIVE state
          this.live = live;

          console.log( 'Livestream starting' );
          if ( this.offlineResetInterval ) clearInterval( this.offlineResetInterval );

              
              // Load and Play stream
              this.setSource({ url, type });
            
        }

        // Detect user going OFFLINE
        else if ( this.live && !live ) {
          // immediately set to OFFLINE state
          this.live = live;

          console.log( 'Livestream ending' );

          // Experimental feature to prevent constant retries when player empties
          // This should reduce erroneous 404's on the ingestion servers

          const CHECK_INTERVAL = 5;
          const MAX_TIME = 90;

          // Try to prevent resetting while watching stale data
          const canReset = () => {
            const atLiveEdge = $bw.player.liveTracker && $bw.player.liveTracker.atLiveEdge();
            const isPaused   = $bw.player.paused();
            return atLiveEdge && !isPaused;
          };

          // Attempt to end stream and reset player
          let TIME = 0;
          const endStream = async () => {
            // Abort if stream goes live
            if ( this.live ) {
              clearInterval( this.offlineResetInterval );
              return;
            }

            // Always increment time
            TIME += CHECK_INTERVAL;

            // Check if satisfy requirements or have exceeded our max time
            if ( !canReset() &&  TIME <= MAX_TIME ) return;

            // Remove our interval
            if ( this.offlineResetInterval ) clearInterval( this.offlineResetInterval );

            // Reset basic player properties
            this.poster = data.cover;

            this.setPoster( data.thumbnail );
            this.setSource({
              url: await this.getRandomBump(),
              type: 'video/mp4',
            });
          };

          // Keep timer ID so we can cancel early if stream recovers
          this.offlineResetInterval = setInterval( async () => await endStream(), CHECK_INTERVAL * 1000 );
        }

        // Detect source change
        else if ( this.source.url !== url  || this.source.type !== type ) {
          
          this.setSource({ url, type });
        }

        this.live = live;
      },

      onIntersect ( entries, observer ) {
        this.setDetach( entries[0].intersectionRatio <= 0.5 );
      },

      onOrientationChange () {
        const orientation = (screen.orientation || {}).type;
        if ( orientation ) {
          this.landscape = orientation.startsWith( 'landscape' );
        } else {
          this.landscape = false;
        }
      },

      showChat () {
        this.setDisplayChat( true );
        ////this.$analytics.logEvent( 'show_chat' );
      },

      ...mapMutations(Player.namespace, {
        setSource: Player.$mutations.setSource,
        setPoster: Player.$mutations.setPoster,
        setDetach: Player.$mutations.setDetach,
        setWebRTC: Player.$mutations.setWebRTC,
      }),

      ...mapMutations(ChatStore.namespace,{
        setDisplayChat: ChatStore.$mutations.setDisplayChat,
      }),
    },

    async asyncData ( { $axios, params, error } ) {
      const channel = params.watch;
      console.log("Should fetch channel data for:",channel);
      // Timeout to prevent SSR from locking up
      const timeout = process.server ? process.env.SSR_TIMEOUT : 0;

      const getChannelHydration = async () => {
        let channelData = null;

        // Attempt to load via API server
        try {
          const { data } = await $axios.getSSR( ``+ process.env.APISERVER +`api/channel/${channel}`, { timeout } );
          // Simple response validation
          if ( data && data.hasOwnProperty( 'name' ) ) {
            channelData = data;
          }
        }

        // API server failed
        catch ( error ) {
          console.error( error.message );

          // API failed with 404, but server did not fail with 5xx
          if ( error.response && error.response.status === 404 ) {
            console.error( `API server reponded with 404` );
            return {
              success: false,
              error: { statusCode: 404, message: `Could not find channel '${channel}'.` },
            };
          }
        }

        // API server failed unexpectedly 5xx - Attempt to load from database
        if ( !channelData ) {
          // API server failed, query database directly
          try {
            console.log( `API server failed! Attempting to bypass.` );

            const streamer  = channel.toLowerCase();

            /*const streamDoc = await db
              .collection( 'streams' )
              .doc( streamer )
              .get();

            // Channel does not exist in database (404)
            if ( !streamDoc.exists ) {
              console.error( `Database query did not find streamer!`, channel );
              return {
                success: false,
                error: { statusCode: 404, message: `Could not find channel '${channel}'.` },
              };
            }

            const data = streamDoc.data();*/

            const data = channelData[0];

            // Re-map channel data
            channelData = {
              name: data.name,
              avatar: data.avatar,
              to: `/${data.name}`,
              title: data.title,
              description: data.desc,
              poster: data.avatar,
              thumbnail: data.avatar,
              live: data.live,
              nsfw: data.nsfw,
              url: data.url,
              owner: data.owner,
              scheduled: data.scheduled,
              banned: data.banned || false,
            };

            console.log( `Bypass should be successfull...` );

          }

          // API & Database query failure
          catch ( error ) {
            console.error( `Database query failed!` );
            console.error( error.message );
            return {
              success: false,
              error: { statusCode: 500, message: `Bitwave API cache failed & Bitwave Database API failed!<br>${error.message}` },
            };
          }
        }

        try {
          const data = channelData;

          // Ban flag
          const banned = data.banned || false;

          // Streamer user properties
          const name   = data.name;
          const avatar = data.avatar;
          const owner  = data.owner;

          // Stream data
          const title       = data.title;
          const description = data.desc;

          // Stream properties
          const nsfw = data.nsfw;
          const live = data.live;

          // Stream media
          let type = data.type || `application/x-mpegURL`; // DASH -> application/dash+xml
          let url  = data.url;

          // Process timestamp
          const timestamp = data.timestamp
            ? new Date( data.timestamp )
            : null;

          // Process scheduled date
          const scheduled = data.scheduled
            ? new Date( data.scheduled )
            : null;

          // Process cover image
          const poster = live
            ? data.thumbnail
            : data.poster;


          // Fallback to bump if offline
          if ( live === false ) {
            try {
              const { data } = await $axios.getSSR( '' + process.env.APISERVER + 'api/bump', { timeout } );
              url = data.url;
              type = 'video/mp4';
            } catch ( error ) {
              console.error( error.message );
              url  = 'https://cdn.bitwave.tv/static/bumps/2a3un.mp4';
              type = 'video/mp4';
            }
          }

          return {
            success: true,
            data: {
              name,
              avatar,
              title,
              description,
              poster,
              live,
              nsfw,
              owner,
              url,
              type,
              timestamp,
              scheduled,
              banned,
            }
          }
        }

        // Unknown error, unlikely to occur
        catch ( error ) {
          console.error( `Unknown API Error: ${error.message}` );
          return {
            success: false,
            error: { statusCode: 500, message: `Unknown API Error!\n${error.message}` },
          };
        }

        // This should be unreachable
        return {
          success: false,
          error: { statusCode: 500, message: `This should never occur.` },
        };
      };

      // Get Channel data for page
      const channelData = await getChannelHydration();
      if ( channelData.success === false ) {
        console.error( `Channel Data API failed.`, channelData.error );
        if ( channelData && !channelData.success ) {
          error( { ...channelData.error } );
          return;
        }
      }

      // Intercept for banned
      if ( channelData.banned ) {
        console.log( `Channel is banned` );
        error( { statusCode: 401, message: banMessage } );
        return;
      }

      return {
        ...channelData.data,
      };
    },

    computed: {
      ...mapGetters({
        username : VStore.$getters.getUsername,
        user     : VStore.$getters.getUser,
      }),

      ...mapState(Player.namespace, {
        source : Player.$states.source,
        inPiP: Player.$states.inPiP,
        pinToLive : Player.$states.keepLive,
        disableBumps : Player.$states.disableBumps,
        detach : Player.$states.detach,
        webRTC   : Player.$states.webRTC,
      }),

      ...mapState(ChatStore.namespace, {
        displayChat: ChatStore.$states.displayChat
      }),

      posterCacheBusted () {
        if ( this.live ) {
          const coeff = 1000 * 60; // Cache bust poster every minute
          const timestamp = Math.round( Date.now() / coeff ) * coeff;
          return `${this.poster}?${timestamp}`;
        } else {
          return this.poster;
        }
      },

      /*webRTC:{
        set(val){
          this.setWebRTC(val);
        },
        get () { return this.webRTC; }
      },*/

      mobile () {
        return this.mounted
          ? this.$vuetify.breakpoint.smAndDown
          : !this.$device.isDesktopOrTablet;
      },

      smartDetach () {
        return this.detach
          && !this.mobile
          && !this.inPiP;
      },

      pageMarginRight () {
        if ( !this.displayChat ) return '0';
        return this.mobile
          ? this.landscape
            ? '50%'
            : '0'
          : '450px';
      },

      showCountdown () {
        if ( this.live ) return false;
        if ( !this.scheduled ) return false;
        if ( !this.timestamp ) return false;

        // Do not show countdown if last streamed timestamp is after scheduled
        if ( this.timestamp > this.scheduled ) return false;

        return true;
      },
    },

    validate ( { params } ) {
      // Verify username is valid
      const user = params.watch;
      const validator = /^[a-zA-Z0-9._-]+$/;
      return validator.test( user );
    },

    async created () {
          
       // START OF RTC SETUP
       //console.log("_Watch.vue - Created useWebrtc:",this.webRTC);
       /*
      let useRTC = false;//this.useWebRTC;
      let disable_stream_connect = false;
      if(useRTC){
        console.log("RTC PLAYER Should try to connect to:",this.name);
              //this.videoPreview = document.getElementById('streamplayer');
              console.log("Name to try and connect to:",this.name);
              let broadcastId = this.name;
              connection.extra.broadcastId = broadcastId;

              connection.session = {
                  audio: true,
                  video: true,
                  oneway: true
              };

              connection.getSocket(function(socket) {
                  socket.emit('check-broadcast-presence', broadcastId, function(isBroadcastExists) {
                      if (!isBroadcastExists) {
                          // the first person (i.e. real-broadcaster) MUST set his user-id
                          //connection.userid = broadcastId;
                      }

                      console.log('check-broadcast-presence', broadcastId, isBroadcastExists);
                      if (isBroadcastExists) {
                          socket.emit('join-broadcast', {
                              broadcastId: broadcastId,
                              userid: connection.userid,
                              typeOfStreams: connection.session
                          });
                      }else{
                          //alert("Stream is offline!");
                          console.log("Stream is now offline!");
                          disable_stream_connect = true;
                      }
                  });
              });
        }else{
          console.log("video-js PLAYER Should try to connect to:",this.name);
          this.setPoster( this.poster );
          this.setSource({ url: this.url, type: this.type }); 
        }
        */
        this.setPoster( this.poster );
        this.setSource({ url: this.url, type: this.type }); 
     
    },

    beforeMount(){
      //console.log("Before mount, should try and load but it's probably too soon to do setup, might need to move all the defs ")
      // https://developer.mozilla.org/en-US/docs/Web/API/Document/getElementsByTagName
      //const vid_bind_cadidates = document.getElementsByTagName('bitwave-video-player'); // bind to the window could be the video element, bitwave-video-player
      //const num = vid_bind_cadidates.length;
      //console.log("Candidates to bind:", vid_bind_cadidates, ' count of cadidates:',num);
      //this.videoPreview = document.getElementById('rtcbinder');
      //console.log("Preview window thinger:",this.videoPreview);
      //console.log("Post video preview, maybe set it in the storage?");
      //console.log("_Watch.vue - Before Mount useWebrtc:",this.useWebRTC);
      /*
      let useWebRTc = false;
      if(useWebRTc){
        console.log("pre-mount should setup webrtc");

        window.io = io;
        //connection.io = io;
        // make these more configurable 
        connection.iceServers = [];
        connection.iceServers.push(process.env.ICESERVER1);
        connection.iceServers.push(process.env.ICESERVER2);
        connection.iceServers.push(process.env.ICESERVER3);

        console.log("After RTCM config");
          
        // its mandatory in v3
        connection.enableScalableBroadcast = true;

        // each relaying-user should serve only 1 users
        connection.maxRelayLimitPerUser = 1;
        let enableRecordings = false;
        // we don't need to keep room-opened
        // scalable-broadcast.js will handle stuff itself.
        connection.autoCloseEntireSession = true;

        connection.highbitratemodeaudio = true; // see if we can force it on and to sound better

        connection.socketURL = process.env.WEBRTCSERVER;



        connection.socketMessageEvent = 'scalable-media-broadcast-demo';
      }
      */


    },

    async mounted () {
      // this.setSource({ url: this.url, type: this.type });
      this.getStreamData(); // Get stream data

      const orientation = (screen.orientation || {}).type;
      if ( orientation ) {
        this.landscape = orientation.startsWith( 'landscape' );
      } else {
        this.landscape = false;
      }
      window.addEventListener( 'orientationchange', this.onOrientationChange );

      this.mounted = true;
    },

    beforeDestroy () {
      // remove the stream and clean it up/leave
      window.removeEventListener( 'orientationchange', this.onOrientationChange );
      if ( this.streamDataListener ) this.streamDataListener();
      if ( this.offlineResetInterval ) clearInterval( this.offlineResetInterval );
    },
  }
</script>

<style lang='scss'>
  @import "~assets/style/stream-player.scss";

  .detach-player {
    position: fixed;
    right: 0;
    top: 48px;
    margin: 1rem;
    width: 20rem;
    height: 11.25rem;
    z-index: 10;
    overflow: hidden;

    &:hover .detach-overlay {
      transform: translateY( 0 );
    }
  }

  .detach-overlay {
    width: 100%;
    position: absolute;
    top: 0;
    transform: translateY( -100% );
    transition: .1s;
    background-color: rgba(0,0,0,.75);
  }

  #bw-player-thumbnail {
    position: relative;
    filter: grayscale(80%);
    background-size: cover;
    height: 100%;
    width: 100%;

    &::after {
      content: ' ';
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      left:0;
      width: 100%;
      height: 100%;
      background-image: radial-gradient( transparent 50%, black );
    }
  }
</style>
