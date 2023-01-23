// Created by xander on 1/22/2020

import * as utils from '@/plugins/store-utils.js';
const saveToLocalStorage = values => utils.saveToLocalStorage( 'player-settings', values );

const $states = {
  // Player properties
  source: 'VIDEO_SRC',
  poster: 'VIDEO_POSTER',

  inPiP: 'IS_IN_PIP',

  // Player options
  keepLive: 'KEEP_LIVE',
  webRTC: 'WEBRTC',
  disableBumps: 'DISABLE_BUMPS',
  webRTCid: 'WEBRTC_ID',

  // Player state
  detach: 'DETACH',
};

const $getters = {

};

const $mutations = {
  setSource: 'SET_VIDEO_SRC',
  setPoster: 'SET_VIDEO_POSTER',

  setPiP: 'SET_PIP',

  setKeepLive: 'SET_KEEP_LIVE',
  setWebRTC: 'SET_WEBRTC',
  setWebRTCid: 'SET_WEBRTC_ID',
  
  setDisableBumps: 'SET_DISABLE_BUMPS',

  setDetach: 'SET_DETACH',
};

const $actions = {
  loadSettings: 'LOAD_SETTINGS',
};


// Create Store
export const state = () => ({
  [$states.source]: { url: '', type: '' },
  [$states.poster]: '',

  [$states.inPiP]: false,

  [$states.webRTC]: false,
  [$states.webRTCid]: '',
  [$states.keepLive]: false,
  [$states.disableBumps]: true,
  [$states.detach]: false,
});

// Getters
export const getters = {
  /*[$getters.state] ( state ) {
    return [$states.state];
  },*/
};

// Mutations
export const mutations = {
  [$mutations.setSource] ( state, data ) {
    state[$states.source] = data;
  },

  [$mutations.setPoster] ( state, data ) {
    state[$states.poster] = data;
  },

  [$mutations.setPiP] ( state, data ) {
    state[$states.inPiP] = data;
  },

  [$mutations.setKeepLive] ( state, data ) {
    state[$states.keepLive] = data;
    saveToLocalStorage( { keepLive: data } );
  },
  [$mutations.setWebRTCid] (state,data){
    state[$states.webRTCid] = data;
    saveToLocalStorage({webRTCid: data});
  },
  [$mutations.setWebRTC] ( state, data ) {
    state[$states.webRTC] = data;
    saveToLocalStorage( { webRTC: data } );
  },

  [$mutations.setDisableBumps] ( state, data ) {
    state[$states.disableBumps] = data;
    saveToLocalStorage( { disableBumps: data } );
  },

  [$mutations.setDetach] ( state, data ) {
    state[$states.detach] = data;
  },
};

// Actions
export const actions = {
  async [$actions.loadSettings] ({ dispatch, commit }) {
    // TODO(diingus): It is not obvious to me why keepLive is read separately, as it's
    //                never written to directly (only through saveToLocalStorage() which
    //                saves it wrapped in a single object), and git grep is inconclusive
    const keeplive = utils.readFromLocalStorage( 'keepLive' );
    if ( keeplive ) {
      commit( $mutations.setKeepLive, JSON.parse(keeplive) );
      try {
        localStorage.removeItem( 'keepLive' );
      } catch ( error ) {
        console.error( `Failed to remove 'keepLive' from localStorage`, error );
      }
    }

    const webRTC = utils.readFromLocalStorage( 'webRTC' );
    if ( webRTC ) {
      commit( $mutations.setWebRTC, JSON.parse(webRTC) );
      try {
        localStorage.removeItem( 'webRTC' );
      } catch ( error ) {
        console.error( `Failed to remove 'webRTC' from localStorage`, error );
      }
    }

    const webRTCid = utils.readFromLocalStorage( 'webRTCid' );
    if ( webRTC ) {
      commit( $mutations.setWebRTCid, JSON.parse(webRTCid) );
      try {
        localStorage.removeItem( 'webRTCid' );
      } catch ( error ) {
        console.error( `Failed to remove 'webRTCid' from localStorage`, error );
      }
    }

    utils.loadFromLocalStorage( 'player-settings', commit,
      new Map(
        [
          ['keepLive', $mutations.setKeepLive],
          ['webRTC', $mutations.setWebRTC],
          ['webRTCid', $mutations.setWebRTCid],
          ['disableBumps', $mutations.setDisableBumps],
      ])
    );
  }
};

// Export Store Structure
export const Player = {
  namespace : 'player',
  $states,
  $getters,
  $mutations,
  $actions,
};
