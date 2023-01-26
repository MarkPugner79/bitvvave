<template>
  <div>
    <div :class="{
      'detach-player': docked,
      'elevation-6': docked,
    }">
      <video 
        id="streamplayer"
        class="video-js vjs-custom-skin vjs-big-play-centered vjs-16-9"
        :class="{ 'vjs-odysee': odysee }"
        controls
        playsinline
        preload="auto"
        :autoplay="autoplay"
        :poster="posterCacheBusted"
        :style="{ width: '100%' }"
      ></video>

      <!-- Bitwave Stream Player Might need to hook fedwave video player for this, the rtc-js should be used instead of vjs-live video-js -->
      <div v-if="webRTC" class="vjs-live vjs-tech vjs-custom-skin vjs-big-play-centered vjs-16-9">
      <video  id="rtcbinder"
        class="vjs-poster vjs-live vjs-tech vjs-custom-skin vjs-big-play-centered vjs-16-9"
        :class="{ 'vjs-odysee': odysee }"
          controls  
          playsinline  
          
          
          :style="{ width: '100%' }"
          hidden :live="live" >
          
          
        </video>
      </div>

        <div v-if="webRTC">
          <v-tooltip bottom>
            <template #activator="{ on }">
              <v-btn
                v-on="on"
                text
                icon
                @click="webrtcStart()"
                exact-active-class="app-title-active"
              >
                <v-icon>video_call</v-icon>
              </v-btn>
            </template>
            <span>Web RTC Play</span>
          </v-tooltip>
        </div>

      <!-- Detached player topbar overlay -->
      <slot name="minioverlay">
        <div
          v-if="docked"
          class="d-flex align-center detach-overlay"
        >
          <!-- Title Slot -->
          <slot name="title">
            <h5 class="white--text body-2 ml-2">Default Title</h5>
          </slot>

          <v-spacer/>

          <!-- option addon slot button -->
          <slot name="addon"></slot>

          <!-- Close Button -->
          <v-btn
            color="white"
            text
            icon
            pa-0
            @click="setDetach( false )"
          >
            <v-icon color="white">close</v-icon>
          </v-btn>
        </div>
      </slot>
    </div>
  </div>
</template>

<script>
  import videojs from 'video.js';
  import '@videojs/http-streaming';
  import 'videojs-contrib-quality-levels';
  import 'videojs-hls-quality-selector';
  import '@/assets/js/VideoPlayer/TriSpinner';

  //import 'videojs-youtube';

  import { mapState, mapMutations, mapActions } from 'vuex';

  import { Player } from '@/store/player';

  // early setup for webrtc stuff
  import * as io from '@/plugins/socketio.js' // should import v4 of socket io

// notice that the exports were removed from this, which were in the original library call
  import * as RTCMultiConnection from '@/plugins/simpleRTC.js'

  let connection = new RTCMultiConnection(); // so this fires the second instance it would seem

  let disable_stream_connect = false;

  window.io = io;
  //connection.io = io;
  // make these more configurable 
  connection.iceServers = [];
  if(process.env.ICESERVER1){
    connection.iceServers.push(process.env.ICESERVER1);
  }
  if(process.env.ICESERVER2){
    connection.iceServers.push(process.env.ICESERVER2);
  }
  if(process.env.ICESERVER3){
    connection.iceServers.push(process.env.ICESERVER3);
  }
  console.log("Ice servers:",connection.iceServers);

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
  

  export default {
    name: 'bitwave-video-player',

    props: {
      live     : { type: Boolean, default: false },
      autoplay : { type: Boolean },
      docked   : { type: Boolean },
      odysee   : { type: Boolean, default: false },
    },

    data() {
      return {
        initialized: false,

        player: null,
        url: null,
        type: null,

        // stat logging
        watchTimer: null,
        watchDuration: 0,
        watchInterval: 60,
        lastVPQ: null,
      };
    },

    methods: {


      // this should be the target of the stream is what I'm thinking...
    webrtcStart () {
      this.playerDispose();
      console.log("During mounted calls - Should do webrtc stuff instead");
          console.log("Setup Webrtc in get stream data HD audio");
          connection.setHighBitrateModeAudio(true); // This should be used with a checkbox to configure if the stream should be high bitrate on the streamer side so it can be configured, automatically via config on the clients side
        // user need to connect server, so that others can reach him.
        connection.connectSocket(function(socket) {
              socket.on('logs', function(log) {
                console.log("Socket logger...");
                  //document.querySelector('h1').innerHTML = log.replace(/</g, '----').replace(/>/g, '___').replace(/----/g, '(<span style="color:red;">').replace(/___/g, '</span>)');
                  //console.log(log);
              });

              //console.log("Socket for ");

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
                      //this.videoPreview = document.getElementById('streamplayer_html5_api');
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
              //this.videoPreview = document.getElementById('streamplayer');
              //this.shitwavevid.hidden = true;
              this.videoPreview.hidden = false;
              //this.videoPreview = document.getElementById('streamplayer_html5_api');
              //this.videoPreview.controls = true;
              console.log("On stream event Preview window thinger:",this.videoPreview);
              this.videoPreview.srcObject = event.stream;
              // now this would be a good spot to hook up and throw the webrtc type info into it
              // and give it another way to setup and setRTC source

              try{
                // WEBRTC VOLUMECONTROL
                // Save volume on change
                this.videoPreview.on( 'volumechange', () => {
                  if ( !this.initialized ) return;
                  const volume = this.videoPreview.volume;
                  const muted  = this.videoPreview.muted;
                  if ( typeof volume === 'undefined' || typeof muted === 'undefined' ) return;
                  try {
                    localStorage.setItem( 'volume', volume );
                    localStorage.setItem( 'muted',  muted );
                  } catch ( error ) {
                    console.warn( `Failed to save 'volume' and 'muted' to localStorage`, error );
                  }
                });

                


              }catch(error){
                console.log("Volume setup...");
              }

              try {
                console.debug( `Volume: ${this.videoPreview.volume}, Muted: ${this.videoPreview.muted}` );
                let muted = JSON.parse( localStorage.getItem( 'muted' ) );
                if ( muted !== null ) this.videoPreview.muted = muted ;
                let volume = localStorage.getItem( 'volume' );
                if ( volume !== null ) this.videoPreview.volume = volume ;
              } catch ( error ) {
                console.warn( `Failed to read 'volume' or 'muted' from localStorage`, error );
              }

              try{
                this.videoPreview.play();

                // hide the bitwave-video-player
                //let shitwavevid = document.getElementById('shitwavevid');
                //shitwavevid.hidden = true;
                //this.videoPreview.hidden = false;
                // find the play button and hide it on the player by class name 'vjs-icon-placeholder' 'vjs-big-play-button' title 'Play Video'
                /*
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
                });*/

                // look at hooking up the volume control stuff

                


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

  // ======================================================================================== END OF WEB RTC SETUP
        // might need to add some more shit to the setup or another init call for source setting...
        // have it pull out of the local storage aka webrtcid
        this.name = this.webRTCid;//"Playlistbot9k";//"NoAgenda";
          // last bit of setup?
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
    },
      playerInitialize () {
        console.log( `URL: ${this.source.url}, TYPE: ${this.source.type}, POSTER: ${this.poster}, AUTOPLAY: ${this.autoplay}, POSTER: ${this.poster}` );
        console.log(`WebRTC status: ${this.webRTC}`);
        // this is where the check would be done for webrtc
        this.initialized = false;
        

        // https://github.com/ant-media/videojs-webrtc-plugin look at building a special plugin for webrtc
          // Create video.js player
          this.player = videojs( 'streamplayer', {
              poster: this.poster,
              sources: [{ src: this.source.url, type: this.source.type }],
              autoplay: this.autoplay,

              // UI Options
              liveui: true,
              fluid: true,
              fill: false,
              // aspectRation: '16:9',
              suppressNotSupportedError: true,

              playbackRates: [ 0.25, 0.5, 0.75, 1, 1.25, 1.5, 2 ],
              plugins: {
                qualityLevels: {},
                bitwaveTriSpinner: {
                  size: 58,
                  spinnerColor: this.odysee ? '#fa6165' : '#13a9fe',
                },
              },
              inactivityTimeout: 2000,
              controlBar: {
                currentTimeDisplay : false,
                timeDivider: false,
                durationDisplay: false,
                remainingTimeDisplay: false,
              },
              userActions: {
                hotkeys: true,
              },
              html5: {
                hls: {
                  overrideNative: !videojs.browser.IS_SAFARI,
                  allowSeeksWithinUnsafeLiveWindow: true,
                  enableLowInitialPlaylist: false,
                  handlePartialData: true,
                  smoothQualityChange: true,
                },
              },
              liveTracker: {
                trackingThreshold: 0,
                liveTolerance: 10,
              },
            }); // end of player setup

            window.$bw = {
              player: this.player,
              getVideoLogs: this.player.log.history,
              hls: null,
              vhs: null,
            };

            // --- Video.js plugin functions

            // Add reloadSourceOnError plugin
            this.player.reloadSourceOnError({ errorInterval: 10 });

            // Load all qualities
            this.qualityLevels = this.player.qualityLevels();
            this.player.hlsQualitySelector({
              displayCurrentQuality: true,
            });

            // Video Player Ready
            this.player.ready( async () => {
              // Restore Volume & mute
              try {
                console.debug( `Volume: ${this.player.volume()}, Muted: ${this.player.muted()}` );
                let muted = JSON.parse( localStorage.getItem( 'muted' ) );
                if ( muted !== null ) this.player.muted( muted );
                let volume = localStorage.getItem( 'volume' );
                if ( volume !== null ) this.player.volume( volume );
              } catch ( error ) {
                console.warn( `Failed to read 'volume' or 'muted' from localStorage`, error );
              }

              const playerTech = this.player.tech({ IWillNotUseThisInPlugins: true });

              playerTech.on( 'retryplaylist', ( event ) => {
                console.log( `retryplaylist:`, event );
                if ( !this.live ) console.log( `livestream is offline.` );
              });

              playerTech.on( 'usage', ( event ) => {
                console.log( `${event.name}:`, event );
              });

              // "Keep Live" Feature
              this.player.liveTracker.on( 'liveedgechange', async () => {
                // Only respond to when we fall behind
                if ( this.player.liveTracker.atLiveEdge() ) {
                  // Set to 1x playback rate once we catch up
                  this.player.playbackRate( 1 );
                  return;
                }

                // This is currently an opt-in feature
                if ( !this.pinToLive ) return;

                // Don't respond to when user has paused the player
                if ( this.player.paused() ) return;

                console.log('We have fallen behind live!');

                setTimeout(() => {
                  // Do not jump ahead if user has paused the player
                  if ( this.player.paused() ) return;

                  console.log( 'Attempting to catch back up to live.' );
                  this.player.liveTracker.seekToLiveEdge();
                }, 5 * 1000 );
              });

              console.log(`Player ready`);
              this.player.tech_.off('mousedown');
              this.player.tech_.on('mousedown', function(e) {
                  e.preventDefault();
                  // you customized callback  
              });
              this.initialized = true;
            });
        
        

        


        // Scroll to adjust volume
        // player.controlBar.volumePanel.volumeControl
        const volumeControlElement = this.player.controlBar.volumePanel.volumeControl.el();

        const handleVolumeScroll = ( event ) => {
          event.preventDefault();
          if ( this.player.muted() ) return;
          const vol = this.player.volume();
          // Scroll 'up'
          if ( event.deltaY < 0 ) this.player.volume( Math.min( 1.0, ( vol + .05 ) ) );
          // Scroll 'down'
          if ( event.deltaY > 0 ) this.player.volume( Math.max( 0.0, ( vol - .05 ) ) );
        };

        // Player is active (mouseover)
        /*this.player.on( 'useractive', () => {
          volumeControlElement.addEventListener( 'wheel', handleVolumeScroll );
        });

        // Player is inactive
        this.player.on( 'userinactive', () => {
          volumeControlElement.removeEventListener( 'wheel', handleVolumeScroll );
        });*/

        // Add event listener by default in case user loads with cursor over stream
        volumeControlElement.addEventListener( 'wheel', handleVolumeScroll, true );



        //---------------------------
        // UX Tweaks & Enhancements
        //---------------------------

        // Prevent volume bar from pushing around the live button
        const controlBar = this.player.controlBar;
        const removeHover = el => el.removeClass( 'vjs-hover' );
        const removeVolumePanelHover = () => removeHover( controlBar.volumePanel );
        // disable default behavior
        controlBar.volumePanel.off( 'mouseout' );
        // reset on control bar mouse out
        controlBar.on( 'mouseleave', removeVolumePanelHover );
        // reset when mouseover spacer
        controlBar.customControlSpacer.on( 'mouseenter', removeVolumePanelHover );

        // remove UI instantly when mouse leaves player
        this.player.on( 'mouseleave', () => this.$nextTick( () => this.player.userActive( false ) ) );
        //--------------------------------------------------------------------


        // Save volume on change
        this.player.on( 'volumechange', () => {
          if ( !this.initialized ) return;
          const volume = this.player.volume();
          const muted  = this.player.muted();
          if ( typeof volume === 'undefined' || typeof muted === 'undefined' ) return;
          try {
            localStorage.setItem( 'volume', volume );
            localStorage.setItem( 'muted',  muted );
          } catch ( error ) {
            console.warn( `Failed to save 'volume' and 'muted' to localStorage`, error );
          }
        });

        // PiP events
        this.player.on( 'enterpictureinpicture', () => {
          this.setPiP( true );
          this.setDetach( false );
        });

        this.player.on( 'leavepictureinpicture', () => {
          this.setPiP( false );
        });

        // Begin playing when new media is loaded
        this.player.on( 'loadeddata', () => {
          if ( !window.$bw.vhs && this.live ) window.$bw.vhs = this.player.tech({ IWillNotUseThisInPlugins: true }).vhs;
        });

        this.player.on( 'ended', async () => {
          this.$emit('ended');
        });

        this.player.on( 'error', error => {
          // Brush player errors under the rug
          if ( !this.live ) console.log( 'streamer offline and got an error' );
          console.warn( `Player error:`, error );
        });

        this.player.on( 'click', () => {});

        if(this.webRTC){
          // should do webrtc hooking instead
          console.log("Should do webrtc stuff instead");
        }else{
          this.player.src( { src: this.url, type: this.type } );    

        }// end else

      },

      trackWatchTime () {
        if ( this.player.paused() || !this.live ) {
          return;;
        }

        this.watchDuration += this.watchInterval;

        this.$emit('stats', { duration: this.watchDuration / 60, interval: this.watchInterval / 60 });

        this.checkDroppedFrames();
      },

      playerDispose (){
        if ( this.player ) this.player.dispose();
      },

      reloadPlayer () {
        // this.player.reset(); this.player.load();
        if ( !this.initialized ) {
          console.log( `reloadPlayer() called but player is not initialized yet!` );
          return;
        }
        console.log( `Reloading player with source: ${this.url} / ${this.type}` );

        // TODO: optimize poster images and uncomment this
        // TODO: Hydrate page with correct poster
        // this.player.poster ( this.poster );

        

        if(this.webRTC){
          // should do webrtc hooking instead
          console.log("Should do webrtc stuff instead");
        }else{
          this.player.src( { src: this.url, type: this.type } );    

        }// end else

      },

      // Logs & reports dropped frames
      checkDroppedFrames () {
        // disable reporting when stream is offline
        if ( !this.live ) return;

        // Ensure we have access to HLS tech & stats
        if ( !$bw || !$bw.vhs || !$bw.vhs.stats ) return;

        if ( !this.lastVPQ ) {
          this.lastVPQ = { ...$bw.vhs.stats.videoPlaybackQuality };
          return;
        }

        const playbackQuality = { ...$bw.vhs.stats.videoPlaybackQuality };

        // Ensure we have enough data to prevent false positives
        if ( !playbackQuality.totalVideoFrames > 600 ) return;

        // Detect how many frames we have dropped since our last check
        const percentDroppedFrames = (
          ( playbackQuality.droppedVideoFrames - this.lastVPQ.droppedVideoFrames )
          / ( playbackQuality.totalVideoFrames - this.lastVPQ.totalVideoFrames )
            * 100 );

        // Log dropped frames at various levels
        if ( percentDroppedFrames >= 5)
          console.warn( `We have dropped more than 20% of frames!\n${percentDroppedFrames.toFixed(1)}% of frames (${playbackQuality.droppedVideoFrames - this.lastVPQ.droppedVideoFrames}) dropped since our last check.` );
        else if ( percentDroppedFrames >= 1 )
          console.log( `We have dropped more than 5% of frames!\n${percentDroppedFrames.toFixed(1)}% of frames (${playbackQuality.droppedVideoFrames - this.lastVPQ.droppedVideoFrames}) dropped since our last check.` );
        else if ( percentDroppedFrames > 0 )
          console.debug( `Good news, we have dropped very few (if any) frames.\nOnly ${percentDroppedFrames.toFixed(1)}% of frames (${playbackQuality.droppedVideoFrames - this.lastVPQ.droppedVideoFrames}) dropped since our last check.` );

        // Log dropped frames for analyzing and finding bottlenecked regions
        const label = (this.$route.params.watch || '').toLowerCase() || 'unknown';
        /*
        this.$ga.event({
          eventCategory : 'playback-errors',
          eventAction   : 'dropped-frames',
          eventLabel    : label,
          eventValue    : percentDroppedFrames,
        });
        */

        if ( percentDroppedFrames && percentDroppedFrames > 0.05 )
          //this.$analytics.logEvent( 'dropped_frames', { value: percentDroppedFrames } );

        // Update for next loop
        this.lastVPQ = { ...$bw.vhs.stats.videoPlaybackQuality };
      },

      belle () {
        console.log("That's a lot of damage...");
        //this.url = 'https://www.youtube.com/watch?v=TL470fJMi7w';
        //this.type = 'video/youtube';
        //this.reloadPlayer();
      },

      ...mapMutations( Player.namespace, {
        setPiP: Player.$mutations.setPiP,
        setDetach: Player.$mutations.setDetach,
      }),

      ...mapActions( Player.namespace, {
        loadPlayerSettings: Player.$actions.loadSettings,
      }),

    },

    computed: {
      ...mapState(Player.namespace, {
        source : Player.$states.source,
        poster : Player.$states.poster,
        pinToLive : Player.$states.keepLive,
        disableBumps : Player.$states.disableBumps,
        detach : Player.$states.detach,
        webRTC : Player.$states.webRTC,
        webRTCid : Player.$states.webRTCid,
      }),

      posterCacheBusted () {
        if ( this.live ) {
          const coeff = 1000 * 60 * 2; // Cache bust poster every 2 minutes
          const timestamp = Math.round( Date.now() / coeff ) * coeff;
          return `${this.poster}?${timestamp}`;
        } else {
          return this.poster;
        }
      },
    },

    watch: {
      pinToLive ( pin ) {
        if ( this.player && this.live && pin ) {
          this.player.liveTracker.trigger( 'liveedgechange' );
        }
      },

      source ( newSource ) {
        /*if ( this.url  !== newSource.url || this.type !== newSource.type ) {
          this.url  = newSource.url;
          this.type = newSource.type;
          this.reloadPlayer();
        }*/

        // Always reload when source is changed
        // Ensures that a stream will restart after brief drop out.
        console.log( `old URL: ${this.url}, NEW: ${newSource.url}` );
        if(this.webRTC){
          // should do webrtc hooking instead
          console.log("Source change WEBRTC Should do webrtc stuff instead");

        }else{
          this.url  = newSource.url;
          this.type = newSource.type;
          this.reloadPlayer();  

        }// end else
        
      },
    },

    async mounted () {

      await this.loadPlayerSettings();
      /*if(Player.$states.webRTC){
        console.log("Player.$states.webRTC Good idea, it works:", Player.$states.webRTC);
      }else{
        console.log("WEBRTC OFF STATES Player.$states.webRTC")
      }*/
      this.playerInitialize();
      if(this.webRTC){
          // should do webrtc hooking instead
          // hook up a button to play instead
          //this.playerDispose();
          console.log("Stream id that we want:",this.webRTCid);
          // FIXME this.name
          //console.log("Stream id that we want:",this.webRTCid);
          
          //this.webrtcStart();
      }else{
        this.watchTimer = setInterval( () => this.trackWatchTime(), 1000 * this.watchInterval );
        //this.playerInitialize();
      }

      

      this.mounted = true;
    },

    

    beforeDestroy () {
      window.removeEventListener( 'orientationchange', this.onOrientationChange );
      if ( this.watchTimer ) clearInterval( this.watchTimer );
      this.playerDispose();
    },

  };
</script>

<style lang='scss'>
/*  @import "~assets/style/stream-player.scss";

  .detach-player {
    position: fixed;
    left: 80px;
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
  }*/
</style>
