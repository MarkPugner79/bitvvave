<template>
  <v-row class="justify-center">
    <div class="d-flex align-center">
      <div class="title text-center mx-3 d-flex flex-column">
        <span class="font-weight-light white--text">{{ MOTDText }}</span>
        <div>
          <span class="overline font-weight-black rgb-text">{{ MOTDDISCLAIMER }}</span>
        </div>
      </div>
<!--      <img crossorigin="" height="52" data-emote-tooltip=":trout:" title=":trout:" alt=":trout:" src="https://cdn.bitwave.tv/static/emotes/trout-52.gif?4">-->
    </div>
  </v-row>
</template>

<script>
  export default {
    name: 'MessageOfTheDay',

    serverCacheKey: () => 'MOTD',

    data () {
      return {
        MOTDText: process.env.MOTD.MOTD,
        MOTDDISCLAIMER: process.env.BITWAVE_ENV === 'development'
          ? 'development build'
          : process.env.MOTD.DISCLAIMER,
      }
    },
  };
</script>
