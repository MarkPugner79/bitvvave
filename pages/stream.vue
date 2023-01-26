<template>
    <div>

      <!-- Chat Header -->
      <div class="mx-5">
        <h1 class="font-weight-light rgb-text">Streamer Dashboard</h1>
      </div>

      <v-container>
        <v-row>

          <v-col>
            <v-responsive height="calc( 100% + 32px )">
              <!--<iframe
                :src="`/embed/${username}`"
                frameborder="none"
                scrolling="no"
                width="100%"
                height="100%"
              ></iframe>-->
              <video 
              frameborder="none"
                scrolling="no"
                width="100%"
                height="100%"
                id="rtcstreamer"
              >
            You should see your video here...
            </video>
              <v-spacer />
          
            </v-responsive>
          </v-col>

          <v-col>
            <div class="d-flex flex-shrink-1"
              :style="{ width: mobile ? '100%' : '450px', 'height': mobile ? '500px' : '555px' }"
              >
            <!--<v-layout justify-center> -->
            <!--<v-flex
                
                xs12
                sm10
                md8
                lg6
            >-->
                <v-card class="mb-4 pa-3">
                
                    <h2>Stream Settings Configuration</h2>

                <v-btn
                    class="mr-3"
                    color="primary"
                    small
                    
                    @click="startStreamOldWebRTCMultiConnection"
                    v-if="this.webRTC"
                >
                    Start Stream
                </v-btn>
                
                <v-btn
                    class="mr-3"
                    color="secondary"
                    small
                    
                    @click="stopStream"
                    v-if="this.webRTC"
                >
                    Stop Stream
                </v-btn>

                <v-spacer />

                <h-spacer />

                <!--
                <v-switch
                        v-model="this.webRTC"
                        label="Use WebRTC stream source"
                        color="primary"
                        hide-details
                        dense
                        inset
                    />
                    -->

                    <v-text-field
                        class="mb-0"
                        color="primary"
                        single-line
                        dense
                        validate-on-blur
                        outlined
                        clearable
                        id="stream-title"
                        :label="`Stream Title`"
                        v-if="this.webRTC"
                    ></v-text-field>
                    <v-text-field
                        class="mb-0"
                        color="primary"
                        single-line
                        dense
                        validate-on-blur
                        outlined
                        clearable
                        id="stream-desc"
                        :label="`Stream Description`"
                        v-if="this.webRTC"
                    ></v-text-field>
                    
                    <v-text-field
                        class="mb-0"
                        color="primary"
                        single-line
                        dense
                        validate-on-blur
                        outlined
                        clearable
                        id="stream-rtmp-alt"
                        :label="`RTMP Backup`"

                        v-if="this.webRTC"
                    ></v-text-field>
                </v-card>
            <!--</v-flex>-->
        <!--</v-layout>-->
    </div>
            <!-- <dashboard-superchats /> -->
          </v-col>

          <!-- Chat -->
          <v-col>
            <div
              v-if="displayChat"
              class="d-flex flex-shrink-1"
              :style="{ width: mobile ? '100%' : '450px', 'height': mobile ? '500px' : '555px' }"
            >
              <chat
                :chat-channel="username"
              />
            </div>
          </v-col>
        </v-row>
      </v-container>

    </div>
</template>

<script>
  import { mapGetters, mapState,mapMutations ,mapActions} from 'vuex';
  import { Chat as ChatStore } from '@/store/chat';
  import { VStore } from '@/store';
  //import { Player } from '@/store/player';

  //import * as utils from '@/plugins/store-utils.js';

  /*
  import {
    connect,
    Room,
    RoomEvent,
    RemoteParticipant,
    RemoteTrackPublication,
    RemoteTrack,
    Participant,
    VideoCaptureOptions,
    VideoCodec,
    VideoPresets,
    VideoQuality,
    } from 'livekit-client';
    */


    // use the chat server to get our stream key
   
    import * as io from '@/plugins/socketio.js'; // should import v4 of socket io

    

   
    /*
    let socketlc = io.connect(process.env.CHATSERVER, { transports: ['websocket'] });

    let liveKitToken = null;
    let usertoken = "";

    socketlc.on('connect', () => {
        function parseToken (token) {
          try{
              var base64Url = token.split('.')[1];
              var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
              var jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                  return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
              }).join(''));
          }catch(ex){
              console.log("failed to parse the token")
              return {user:{name:'failed'}}
          }
          return JSON.parse(jsonPayload);
      };
        //load_chatToken();
        if (localStorage.getItem('troll')) {
            usertoken = localStorage.getItem('troll');
            console.log("Should have decoded a token:", usertoken);
            // should then parse
            let user = parseToken( usertoken );
            console.log("Decoded user:",user.sub.username);
            //this.streamerName = user;
        }
        if (localStorage.getItem('chatToken')) {
            usertoken = localStorage.getItem('chatToken');
            console.log("Should have decoded a token:", usertoken);
            // should then parse
            let user = parseToken( usertoken );
            console.log("Decoded user:",user.sub.username);
            //this.streamerName = user;
        }

        socketlc.emit('new user', {jwt:usertoken});
        //socketlc.emit('get live kit room token', {jwt:usertoken});
        
        //document.getElementById('broadcast-id').disabled = true;
        
        //socketlc.emit('getlivestreams');
        //if(was_live){
        //  console.log("Said that we were streaming and that we can still be connected to.");
          //socketlc.emit('announcestream');
        //}
        
    });

    socketlc.on('room access token',(data) => {
        console.log("Should have got back a live kit token:",data);
        // should then enable the start broadcast livekit button
        liveKitToken = data.token;

    });
    */

     

  

    //const RTCMultiConnection = require('@/plugins/simpleRTC.js'); // so this seems to work after breaking the export system
    import * as RTCMultiConnection from '@/plugins/simpleRTC.js'

    //import jwt_decode from 'jwt-decode';
    let connection = new RTCMultiConnection(); // so this fires the second instance it would seem

    window.io = io;

    connection.iceServers = [];
    connection.iceServers.push(process.env.ICESERVER1);
    connection.iceServers.push(process.env.ICESERVER2);
    connection.iceServers.push(process.env.ICESERVER3);

  // its mandatory in v3
  connection.enableScalableBroadcast = true;

    // each relaying-user should serve only 1 users
    connection.maxRelayLimitPerUser = 1;

    // we don't need to keep room-opened
    // scalable-broadcast.js will handle stuff itself.
    connection.autoCloseEntireSession = true;

    

    connection.highbitratemodeaudio = true; // see if we can force it on and to sound better

    connection.socketURL = process.env.WEBRTCSERVER;



    connection.socketMessageEvent = 'scalable-media-broadcast-demo';

    connection.setHighBitrateModeAudio(true);

    let socketlc = io.connect(process.env.CHATSERVER, { transports: ['websocket'] });

    let do_init = true;
    if(do_init){
        connection.connectSocket(function(socket) {
        socket.on('logs', function(log) {
            document.querySelector('h1').innerHTML = log.replace(/</g, '----').replace(/>/g, '___').replace(/----/g, '(<span style="color:red;">').replace(/___/g, '</span>)');
        });

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
            alert('This broadcast has been stopped.');
        });

        // this event is emitted when a broadcast is absent.
         //This has been ommitted so you don't accidentally start a stream a s a viewer
        socket.on('start-broadcasting', function(typeOfStreams) {
            console.log('start-broadcasting', typeOfStreams);

            // host i.e. sender should always use this!
            connection.sdpConstraints.mandatory = {
                OfferToReceiveVideo: false,
                OfferToReceiveAudio: false
            };
            connection.session = typeOfStreams;

            // "open" method here will capture media-stream
            // we can skip this function always; it is totally optional here.
            // we can use "connection.getUserMediaHandler" instead
            connection.open(connection.userid);
        });
        
    });

    connection.onstream = function(event) {
        if (connection.isInitiator && event.type !== 'local') {
            return;
        }
        this.videoPreview = document.getElementById('rtcstreamer');
        connection.isUpperUserLeft = false;
        this.videoPreview.srcObject = event.stream;
        this.videoPreview.play();

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

    
    


    connection.onstreamended = function() {};

    connection.onleave = function(event) {
        if (event.userid !== this.videoPreview.userid) return;

        connection.getSocket(function(socket) {
            socket.emit('can-not-relay-broadcast');

            connection.isUpperUserLeft = true;

            if (allRecordedBlobs.length) {
                // playing lats recorded blob
                var lastBlob = allRecordedBlobs[allRecordedBlobs.length - 1];
                this.videoPreview.src = URL.createObjectURL(lastBlob);
                this.videoPreview.play();
                allRecordedBlobs = [];
            } else if (connection.currentRecorder) {
                var recorder = connection.currentRecorder;
                connection.currentRecorder = null;
                recorder.stopRecording(function() {
                    if (!connection.isUpperUserLeft) return;

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
    let enableRecordings = false;

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

        console.log('View count:',event.numberOfBroadcastViewers);
        //document.getElementById('broadcast-viewers-counter').innerHTML = 'Number of broadcast viewers: <b>' + event.numberOfBroadcastViewers + '</b>';
        let broadcastDesc = document.getElementById('stream-desc').value;//'This description was updated in the view count update';//document.getElementById('broadcast-desc').value;
        let rtmpstream = document.getElementById('stream-rtmp-alt').value;//'This should be the rtmp stream fall back';// document.getElementById('rtmp').value;
        socketlc.emit('announcestream',{desc:broadcastDesc,viewers:event.numberOfBroadcastViewers,src:rtmpstream});
    };

    // connect and get live stream list
    // livestreams needs to be cleared then have the list updated
    
    let usertoken = "";

    socketlc.on('connect', () => {
        function parseToken (token) {
          try{
              var base64Url = token.split('.')[1];
              var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
              var jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                  return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
              }).join(''));
          }catch(ex){
              console.log("failed to parse the token")
              return {user:{name:'failed'}}
          }
          return JSON.parse(jsonPayload);
      };
        //load_chatToken();
        if (localStorage.getItem('troll')) {
            usertoken = localStorage.getItem('troll');
            console.log("Should have decoded a token:", usertoken);
            // should then parse
            let user = parseToken( usertoken );
            console.log("Decoded user:",user.sub.username);
            //this.streamerName = user;
        }
        if (localStorage.getItem('chatToken')) {
            usertoken = localStorage.getItem('chatToken');
            console.log("Should have decoded a token:", usertoken);
            // should then parse
            let user = parseToken( usertoken );
            console.log("Decoded user:",user.sub.username);
            //this.streamerName = user;
        }

        socketlc.emit('new user', {jwt:usertoken});
        
        //document.getElementById('broadcast-id').disabled = true;
        
        //socketlc.emit('getlivestreams');
        //if(was_live){
        //  console.log("Said that we were streaming and that we can still be connected to.");
          //socketlc.emit('announcestream');
        //}
        
    });

    function doStreamConnect(streamid){
        
        let disable_stream_connect = false;
        disable_stream_connect = false;
        //document.getElementById("livestreams").disabled = true;

        //document.getElementById('open-or-join').disabled = true;
        let broadcastId = streamid;
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
                    alert("Stream is offline!");
                    disable_stream_connect = true;
                }
            });
        });
    }

    } // end up setup check
     // end of connection setup
  export default {
    name: 'dashboard',

    //middleware: 'auth',

    data() {
      return {
        mounted: false,
        videoPreview: null,
        streamerName:null,
        webRTC:null,
      };
    },

    methods: {

        async startStream () {
            /*
            console.log("Should setup the LiveKit Stream");
            // https://github.com/livekit/client-sdk-js
            console.log(`WebRTC state: ${this.webRTC}`);
            // creates a new room with options
            const room = new Room({
            // automatically manage subscribed video quality
            adaptiveStream: true,

            // optimize publishing bandwidth and CPU for published tracks
            dynacast: true,

            // default capture settings
            videoCaptureDefaults: {
                resolution: VideoPresets.h720.resolution,
            },
            });

            // set up event listeners
            room
            .on(RoomEvent.TrackSubscribed, handleTrackSubscribed)
            .on(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed)
            .on(RoomEvent.ActiveSpeakersChanged, handleActiveSpeakerChange)
            .on(RoomEvent.Disconnected, handleDisconnect)
            .on(RoomEvent.LocalTrackUnpublished, handleLocalTrackUnpublished);
            // this token should be pulled from the server
            // as a streamer the user should be able to request a stream token
            let token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2NzQyNDMxOTgsImlzcyI6ImRldmtleSIsIm5hbWUiOiJ1c2VyMSIsIm5iZiI6MTY3NDE1Njc5OCwic3ViIjoidXNlcjEiLCJ2aWRlbyI6eyJyb29tIjoibXktZmlyc3Qtcm9vbSIsInJvb21Kb2luIjp0cnVlfX0.pgNZOzNhdEjORfj0hmGAZhabM2O2tdcmLlgeF8edjO8';
            // connect to room
            // this should be configured via the ENV
            await room.connect('wss://livekit.rnih.org', token);
            console.log('connected to room', room.name);

            // publish local camera and mic tracks
            await room.localParticipant.enableCameraAndMicrophone();

            
            function handleTrackSubscribed(
                track,
                publication ,
                participant,
                ) {
                if (track.kind === Track.Kind.Video || track.kind === Track.Kind.Audio) {
                    // attach it to a new HTMLVideoElement or HTMLAudioElement
                    const element = track.attach();
                    parentElement.appendChild(element);
                }
            }

            function handleTrackUnsubscribed(
                track,
                publication,
                participant,
                ) {
                // remove tracks from all attached elements
                track.detach();
            }

            function handleLocalTrackUnpublished(track, participant) {
                // when local tracks are ended, update UI to remove them from rendering
                track.detach();
            }

            function handleActiveSpeakerChange(speakers) {
                // show UI indicators when participant is speaking
            }

            function handleDisconnect() {
                console.log('disconnected from room');
            }
            */
        },

        stopStream(){
            console.log("This should stop the stream if it's running.");
            console.log(`WebRTC state: ${this.webRTC}`);
        },
        startStreamOldWebRTCMultiConnection(){




            
            var broadcastId = 'MarkPugnerWasNeverHere';//document.getElementById('broadcast-id').value; // this should be our user id
            function parseToken (token) {
                try{
                    var base64Url = token.split('.')[1];
                    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                    var jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                    }).join(''));
                }catch(ex){
                    console.log("failed to parse the token")
                    return {user:{name:'failed'}}
                }
                return JSON.parse(jsonPayload);
            };
            if(localStorage.getItem('chatToken')){
                //broadcastId = this.streamerName;
                let usertoken = localStorage.getItem('chatToken');
                console.log("User Token:",usertoken);
                // should then parse
                //const { user } = jwt_decode( usertoken );
                //console.log("Decoded user:",user);
                let user = parseToken( usertoken );
                console.log("Decoded user:",user.sub.username);
                broadcastId = user.sub.username;
            }
            console.log("Should start stream as:",broadcastId);
            //document.getElementById('broadcast-id').disabled = true;
            if (broadcastId.replace(/^\s+|\s+$/g, '').length <= 0) {
                //alert('Please enter broadcast-id');
                //document.getElementById('broadcast-id').focus();
                return;
            }

            //document.getElementById('open-or-join').disabled = true;

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
                        connection.userid = broadcastId;
                        let broadcastDesc = 'fatchat test description. Hard coded.'; 

                        // use a mix of local storage to save and load the values in the ui
                        if(document.getElementById('stream-desc').value){
                            broadcastDesc = document.getElementById('stream-desc').value;
                        }
                        

                        // set it as the next defaut stream title
                        let rtmpstream = 'https://hls/rtmpendpoint/site/stream.m3u8';
                        rtmpstream = document.getElementById('stream-rtmp-alt').value;
                        localStorage.setItem('rtmp',rtmpstream);
                        localStorage.setItem('broadcast-desc',broadcastDesc);
                        socketlc.emit('announcestream',{desc:broadcastDesc,viewers:0,src:rtmpstream});
                        //console.log("Skipped the socket announce of the stream");
                        //was_live = true;
                    }

                    console.log('check-broadcast-presence', broadcastId, isBroadcastExists);
                    if(broadcastId){
                        socket.emit('join-broadcast', {
                            broadcastId: broadcastId,
                            userid: connection.userid,
                            typeOfStreams: connection.session
                        });
                    }
                });
            }); 
            
        
        
        }
           
    },

    computed: {
      ...mapGetters( {
        username: VStore.$getters.getUsername,
        //getUseWebRTC: VStore.$getters.getWebRTC,
      }),

      // setUseWebRTC: Player.$mutations.setWebRTC,
      /*
      ...mapMutations(Player.namespace, {
        //setPinToLive: Player.$mutations.setKeepLive,
        setUseWebRTC: Player.$mutations.setWebRTC,
        
        //setDisableBumps: Player.$mutations.setDisableBumps,
      }),*/

      ...mapState(ChatStore.namespace, {
        displayChat: ChatStore.$states.displayChat
      }),

      /*
      ...mapState(Player.namespace, {
        
        getUseWebRTC: Player.$states.webRTC,
        
      }),

      ...mapActions( Player.namespace, {
        loadPlayerSettingsStreamer: Player.$actions.loadSettings,
      }),
      */
      
      useWebRTC: {
        
        set ( val ) { this.setUseWebRTC( val ) },
        get () {
            
            let webRTC = true;
            //const webRTC = utils.readFromLocalStorage( 'webRTC' );
            console.log(webRTC);
            /*if ( webRTC ) {
                commit( $mutations.setWebRTC, JSON.parse(webRTC) );
                try {
                    localStorage.removeItem( 'webRTC' );
                } catch ( error ) {
                    console.error( `Failed to remove 'webRTC' from localStorage`, error );
                }
                }*/
             return this.webRTC;
             }
      },

      loadRTC() {
        // read it into this from the local storage because holy crap this is retarded
        console.log("Should enable webrtc based on the local storage state");
      },
      

      mobile () {
        return this.mounted
          ? this.$vuetify.breakpoint.smAndDown
          : !this.$device.isDesktopOrTablet;
      },
    },

    mounted() {
        let settings = localStorage.getItem('player-settings');
            console.log("player settings Settings read:", settings);
            let setting_obj = JSON.parse(settings)
            this.webRTC = setting_obj.webRTC;
            console.log("is webrtc enbaled: ", this.webRTC);

            // LOCALSTORAGE ADD FEATURE
            if (localStorage.getItem('broadcast-desc')) {
                //document.getElementById('stream-desc').value = localStorage.getItem('broadcast-desc');
            }
      this.mounted = true;
      //this.loadPlayerSettingsStreamer();
      //this.loadRTC();
    },
  };
</script>
