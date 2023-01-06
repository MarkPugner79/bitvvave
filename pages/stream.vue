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
            <v-btn
            class="mr-3"
            color="primary"
            small
            
            @click="startStream"
          >
            Start Stream
          </v-btn>
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
  import { mapGetters, mapState } from 'vuex';
  import { Chat as ChatStore } from '@/store/chat';
  import { VStore } from '@/store';

  import * as io from '@/plugins/socketio.js' // should import v4 of socket io

    //const RTCMultiConnection = require('@/plugins/simpleRTC.js'); // so this seems to work after breaking the export system
    import * as RTCMultiConnection from '@/plugins/simpleRTC.js'

    import jwt_decode from 'jwt-decode';
    let connection = new RTCMultiConnection(); // so this fires the second instance it would seem

    window.io = io;

    connection.iceServers = [];
  connection.iceServers.push({
      urls: 'stun:stun.l.google.com:19302'
  });
  connection.iceServers.push({
      urls: 'turns:muazkhan.com:5349',
      credential: 'muazkh',
      username: 'hkzaum'
  });
  connection.iceServers.push({
        urls: 'turns:fw.rnih.org:3478',
        credential: 'lkjf42398yt34ut39wt8j4934jt98tj4',
        username: 'ksdjfo4y893th3948thj3498'
  });

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

    let socketlc = io.connect('https://fw.rnih.org/', { transports: ['websocket'] });

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
                            var peer = connection.peers[p].peer;
                            peer.getLocalStreams().forEach(function(localStream) {
                                peer.removeStream(localStream);
                            });
                            event.stream.getTracks().forEach(function(track) {
                                peer.addTrack(track, event.stream);
                            });
                            connection.dontAttachStream = true;
                            connection.renegotiate(p);
                            connection.dontAttachStream = false;
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
        let broadcastDesc = 'This description was updated in the view count update';//document.getElementById('broadcast-desc').value;
        let rtmpstream = 'This should be the rtmp stream fall back';// document.getElementById('rtmp').value;
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
        /*var broadcastId = document.getElementById('broadcast-id').value;
        if (broadcastId.replace(/^\s+|\s+$/g, '').length <= 0) {
            alert('Please enter broadcast-id');
            document.getElementById('broadcast-id').focus();
            return;
        }*/

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

  export default {
    name: 'dashboard',

    middleware: 'auth',

    data() {
      return {
        mounted: false,
        videoPreview: null,
        streamerName:null,
      };
    },

    methods: {
        startStream(){

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
                        let broadcastDesc = 'fatchat test description. Hard coded.'; //document.getElementById('broadcast-desc').value;
                        // LOCALSTORAGE ADD FEATURE
                        //if (localStorage.getItem('broadcast-desc')) {
                        //    document.getElementById('broadcast-desc').value = localStorage.getItem('broadcast-desc');
                        //}

                        // set it as the next defaut stream title
                        let rtmpstream = 'https://hls.robotstreamer.com/tv/4126.m3u8';
                        //rtmpstream = document.getElementById('rtmp').value;
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
      }),

      ...mapState(ChatStore.namespace, {
        displayChat: ChatStore.$states.displayChat
      }),

      mobile () {
        return this.mounted
          ? this.$vuetify.breakpoint.smAndDown
          : !this.$device.isDesktopOrTablet;
      },
    },

    mounted() {
      this.mounted = true;
    },
  };
</script>
