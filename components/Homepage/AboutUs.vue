<template>
  <v-card  color="accentwave">
    <v-card-title class="headline pb-2">
      <div>
        <div class="d-flex align-center">
          <!--<v-img
            class="d-block mx-3"
            contain
            max-height="2rem"
            max-width="2rem"
            src="https://cdn.bitwave.tv/static/emotes/cool_blobby.gif?_bw"
            alt="Cool blobby with sunglasses"
            crossorigin
          />-->
          <h6 class="headline" style="width:100%">Welcome to {{ BRANDING_BRACKETS }}</h6>
        </div>
        <div class="subheading font-weight-light grey--text" style="word-break: break-word;">
          Same old look, even worse flavor!<br>
          An open platform live streaming service for creators to freely express themselves.
        </div>
      </div>
    </v-card-title>

    <v-card-text>
      <div class="mb-2">
        <div class="mb-2 d-flex align-center">
          <v-btn
            small
            outlined
            color="accent"
            href="https://dispatch.sucks.cocks/"
            target="_blank"
            class="my-1 mr-2"
          >Donate</v-btn>
          Please consider donating to help us cover operating costs, and support freedom of expression.
        </div>
        <div>
          BTC: {{ BTC }} <br>
          ETH: {{ ETH }} <br>
          XMR: {{ XMR }}
        </div>
      </div>

      <div class="mb-1">A straight forward streaming service built entirely on open source software.</div>
      <p>If you're interested in streaming here, head over to <nuxt-link to="/stream">{{ BRANDING_SITENAME }}/stream</nuxt-link> to get setup!</p>

      <div class="d-flex align-center">
        <v-btn
          small
          text
          color="light-blue"
          href="https://discord.gg/4WwJsKx"
          target="_blank"
          title="chat"
          class="my-1 mr-1"
        >Discord</v-btn>
        If you have questions or feedback, join the discord chat.
      </div>

      <div class="mb-2 d-flex align-center">
        <v-btn
          small
          text
          color="light-blue"
          href="https://twitter.com/BitVVaveTV"
          target="_blank"
          title="chat"
          class="my-1 mr-1"
        >Twitter</v-btn>
        Message or tag us on Twitter for direct assistance.
      </div>

      <div class="d-flex align-center">
        <v-btn
          small
          text
          color="light-blue"
          href="https://github.com/bitwave-tv/bitwave"
          target="_blank"
          class="my-1 mr-1"
        >Github</v-btn>
        For more information on Bitwave's source code.
      </div>

      <div class="d-flex align-center" v-if="false">
        <v-btn
          small
          text
          color="light-blue"
          href="https://riot.im/app/#/group/+ops:ethanralph.com?hs_url=https://ethanralph.com"
          target="_blank"
          title="chat"
        >Riot</v-btn>
        If you have questions, join the riot chat.
      </div>

      <div class="d-flex align-center">
        <v-btn
          small
          text
          color="light-blue"
          href="https://github.com/bitwave-tv/bitwave/issues"
          target="_blank"
          title="contribute"
          class="my-1 mr-1"
        >issue</v-btn>
        Found a bug? Report it on Github.
      </div>

      <div class="mt-2 d-flex align-center">
        <v-btn
          small
          text
          color="red"
          to="/report"
          class="my-1 mr-1"
        >report</v-btn>
        Report content
      </div>

      <div class="mb-2 d-flex align-center">
        <v-btn
          small
          text
          color="red"
          to="/tos"
          class="my-1 mr-1"
        >ToS</v-btn>
        Our terms of service.
      </div>

      <div class="mb-2 d-flex align-center">
        <v-btn
          small
          text
          color="red"
          to="/privacy"
          class="my-1 mr-1"
        >Privacy Policy</v-btn>
        Our Privacy Policy.
      </div>

      <div class="mb-1">
        Thank you for helping
        <v-chip color="red" outlined small class="mx-1">ALPHA</v-chip>
        test {{ BRANDING_BRACKETS }} and I look forward to bringing more exciting features in the future.
      </div>

      <!-- Warrant canary
      <warrant-canary class="mb-0" />
      -->

      <div class="text-xs-right">
        <em><small>&mdash; {{ BRANDING_OOPERATOR }}</small></em>
      </div>
    </v-card-text>

    <v-divider class="mb-2" />

    <v-card-actions class="pt-0">
      <div class="align-self-end overline grey--text">{{ copyrightText }}</div>
      <v-spacer/>
      <v-btn
        small
        color="primary"
        text
        nuxt
        to="/login"
      >Login</v-btn>
      <v-btn
        class="black--text"
        small
        color="primary"
        nuxt
        to="/login"
      >Register</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
  export default {
    name: 'AboutUs',
    serverCacheKey: () => 'AboutUs',
    data() {
      return {
        copyrightText: `Bitvvave Media ©  ${new Date().getFullYear()}`,
        BTC: process.env.GRIFT.BTC,
        ETH: process.env.GRIFT.ETH,
        XMR: process.env.GRIFT.XMR,
        BRANDING_BRACKETS: process.env.BRANDING.BRACKETS,
        BRANDING_SITENAME: process.env.BRANDING.SITENAME,
        BRANDING_OOPERATOR: process.env.BRANDING.OOPERATOR,
      };
    },

  };
</script>
