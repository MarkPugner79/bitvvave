<template functional>
  <!-- Footer -->
  <v-sheet
    class="pa-2 d-flex justify-space-between align-center flex-wrap"
    color="accentwave"
    tile
  >
    <div class="overline">
      Powered by Bitvvave Media
      <span class="grey--text">{{ props.version }}</span>
    </div>
    <div class="d-flex overline">
      <a href="https://dispatch.sucks.cocks/" target="_blank">Donate</a>
      <v-divider vertical class="mx-2" color="white"/>
      <a href="https://twitter.com/BitVVaveTV" target="_blank">Twitter</a>
      <v-divider vertical class="mx-2" color="white"/>
      <a href="https://github.com/bitwave-tv/bitwave" target="_blank">Github</a>
      <v-divider vertical class="mx-2" color="white"/>
      <a href="https://bitvvave.tv/tos" target="_blank">ToS</a>
    </div>
  </v-sheet>
</template>

<script>
  export default {
    name: 'SimpleFooter',
    serverCacheKey: () => 'SimpleFooter',

    props: {
      version: { type: String, },
    },

  };
</script>
