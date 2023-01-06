<template>
  <v-card>

    <!-- Header Bar -->
    <v-sheet
      tile
      color="primary"
      class="d-flex align-center pa-2 black--text"
    >
      <v-icon class="mr-3" color="black">person</v-icon>
      <h2 class="title">
        {{ signUp ? 'Create Account' : 'Login' }}
      </h2>
    </v-sheet>

    <!-- Body Content -->
    <v-card-text class="px-4 py-0">
      <v-form
        ref="loginForm"
        v-model="valid"
        onSubmit="return false"
      >

        <!-- DONT BE STUPID - DONT DOX YOURSELF -->
        <!-- general purpose warning to idiots -->
        <div class="mt-4">
          <v-alert
            v-if="signUp"
            color="primary"
            outlined
            dense
            class="caption"
          >
            If you wish to stay anonymous - or not doxxed<br>
            Consider using a new username<br>
            <span class="overline">only you can protect your online privacy!</span>
          </v-alert>
        </div>

        <!-- Username Field -->
        <v-text-field
          v-if="signUp"
          id="username"
          key="username"
          ref="username"
          v-model="user.username"
          label="Username"
          autocomplete="off"
          required
          solo
          light
          :loading="loading"
          :disabled="loading"
          tabindex="1"
          autofocus
          @change="checkUsername"
          :error-messages="usernameError"
          :success-messages="usernameSuccess"
        />

        <!-- Email Field -->
        <v-text-field
          id="email"
          key="email"
          v-model="user.email"
          :rules="rules.email"
          label="E-mail"
          autocomplete="email"
          required
          validate-on-blur
          solo
          light
          :disabled="loading"
          tabindex="2"
          :autofocus="!signUp"
        />

        <!-- Password Field -->
        <v-text-field
          id="password"
          key="password"
          v-model="user.password"
          :append-icon="showPassword ? 'visibility' : 'visibility_off'"
          :rules="[ rules.required, rules.min ]"
          :type="showPassword ? 'text' : 'password'"
          name="input-10-1"
          label="Password"
          hint="At least 8 characters"
          autocomplete="password"
          validate-on-blur
          solo
          light
          :disabled="loading"
          @click:append="showPassword = !showPassword"
          tabindex="3"
          :persistent-hint="signUp"
        />

        <!-- 18+ Confirmation / cover your ass legally -->
        <v-checkbox
          v-if="signUp"
          label="I confirm that I am 18 years of age or older."
          color="primary"
          class="pt-0 mt-0 mb-2"
          :rules="[ rules.adultCheck ]"
          validate-on-blur
          :disabled="loading"
          tabindex="4"
          dense
          hide-details
        />

        <!-- HCAPTCHA 
        <div
          v-if="signUp"
          class="d-flex mb-2"
          style="min-height: 75px;"
        >
          <v-hcaptcha
            tabindex="5"
            :key="attempts"
            @verify="onCaptchaVerify"
            @expired=""
            @error="onCaptchaError"
          />
        </div> -->

        <!-- Login Button -->
        <v-btn
          v-if="!signUp"
          block
          color="primary"
          class="black--text"
          :loading="loading"
          type="submit"
          @click="signIn(user.email, user.password)"
          tabindex="6"
        >Login</v-btn>

        <!-- Stay Logged In Checkbox -->
        <div class="d-flex">
          <v-checkbox
            v-if="!signUp"
            id="remember-me"
            v-model="shouldStayLoggedIn"
            label="Stay logged in?"
            hide-details
            color="primary"
            class="pt-0 mb-3"
            :disabled="loading"
          />
        </div>


        <!-- Reister Button -->
        <v-btn
          v-if="signUp"
          block
          color="primary"
          class="black--text"
          :loading="loading"
          type="submit"
          @click="createHcaptchaUser"
          tabindex="6 "
        >Register</v-btn>

        <!-- Some Cover Your Ass Legal Text -->
        <div v-if="signUp" class="my-2 overline grey--text"><i>by clicking register you agree to our <a href="/tos">tos</a></i></div>


        <!-- General Success / Error Alert -->
        <v-alert
          v-model="alert"
          class="mt-4 mb-4"
          dismissible
          :type="alertType"
          transition="expand-transition"
          dense
        >{{ alertMessage }}</v-alert>

      </v-form>
    </v-card-text>
    <v-divider/>

    <!-- Bottom Actions Buttons -->
    <v-card-actions
      class="flex-wrap-reverse justify-space-around"
    >
      <v-btn
        text
        color="accent"
        @click="resetPassword(user.email)"
      >Forgot Password?</v-btn>
      
      <v-btn
        color="red"
        text
        class="mr-2"
        @click="$emit( 'close' )"
      >CANCEL</v-btn>
      <v-btn
        color="primary"
        text
        @click="switchForm"
      >{{ signUp ? 'Login' : 'Sign Up' }}</v-btn>
      
    </v-card-actions>

    <v-card-actions>
      <v-btn
        text
        color="yellow"
        @click="showTokens"
      >Token Help</v-btn>
    </v-card-actions>

    <v-card-actions
    class="flex-wrap-reverse justify-space-around"
    v-if="userTokens"
    >
    
      <div>
      <h2 class="mb-4"><v-icon class="mx-2">verified_user</v-icon>User and Token</h2>

      <!-- Stream server & key -->
      <div class="mb-4">
        <v-text-field
          v-model="userName"
          class="mb-3"
          label="User Name"
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
              @click="copyToClipboard( userToken )"
            >
              copy
            </v-btn>
          </template>
        </v-text-field>

        <v-text-field
        v-model="userToken"
          ref="streamkeyinput"
          class="mb-3"
          label="User Token"
          
          solo
          light
          hide-details
          
          :loading="loadingData"
          :type="showUserKeyF ? 'text' : 'password'"
        >
          <template slot="append">
            <v-btn

              icon
              @click="showUserToken"
            >
              <v-icon>{{ showUserKeyF ? 'visibility' : 'visibility_off' }}</v-icon>
            </v-btn>
          </template>
          <template slot="append">
            <v-btn
              color="blue"
              depressed
              dark
              @click="copyToClipboard( userToken )"
            >
              copy
            </v-btn>
            <v-btn
              color="blue"
              depressed
              dark
              @click="saveUserToken( userToken )"
            >
              save
            </v-btn>
          </template>
        </v-text-field>
      </div>

      <v-text-field
          v-model="trollName"
          class="mb-3"
          label="Troll Name"
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
              @click="copyToClipboard( trollToken )"
            >
              copy
            </v-btn>
            
          </template>
        </v-text-field>
      <v-text-field
          v-model="trollToken"
          ref="streamkeyinput"
          class="mb-3"
          label="Troll Token"
          
          solo
          light
          hide-details
          
          :loading="loadingData"
          :type="showTrollKeyF ? 'text' : 'password'"
        >
          <template slot="append">
            <v-btn

              icon
              @click="showTrollToken"
            >
              <v-icon>{{ showTrollKeyF ? 'visibility' : 'visibility_off' }}</v-icon>
            </v-btn>
          </template>
          <template slot="append">
            <v-btn
              color="blue"
              depressed
              dark
              @click="copyToClipboard( trollToken )"
            >
              copy
            </v-btn>
            <v-btn
              color="blue"
              depressed
              dark
              @click="saveTroll( trollToken )"
            >
              save
            </v-btn>
          </template>
        </v-text-field>
      </div>


      <div class="d-flex">
        <v-spacer/>
        <v-btn
          color="white"
          outlined
          :loading="loadingData"
          @click="reloadTokens"
          class="mr-2"
        >
          Reload Tokens
        </v-btn>
        
      </div>
    
    </v-card-actions>
  </v-card>
  
</template>

<script>
  import { auth } from '@/plugins/firebase.js'

  export default {
    name: 'LoginDialog',

    data() {
      return {
        unsubAuthChanged: null,
        signUp: false,
        loading: false,
        alert: false,
        alertMessage: '',
        alertType: 'error',
        valid: true,
        user: {
          username: '',
          email: '',
          password: '',
        },
        
        userName:null,
        userToken:null,
        trollToken:null,
        trollName:null,
        

        userTokenDiff:null,
        trollTokenDiff:null,

        showTrollKeyF:false,
        showUserKeyF:false,
        userTokens:false,
        loadingData:false,

        showPassword: false,
        shouldStayLoggedIn: true,

        usernameError: '',
        usernameSuccess: '',

        captchaToken: null,
        attempts: 0,

        rules: {
          adultCheck: val => val || 'You must be 18 to use this site!',
          required: value => !!value || 'Required.',
          min: value => ( value && value.length >= 8 ) || 'Min 8 characters',
          name: v => !!v || 'Name is required',
          email: [
            v => !!v || 'Email is required',
            v => /.+@.+/.test(v) || 'E-mail must be valid',
          ],
        },
      }
    },

    methods: {
      // Toggle Form Mode
      switchForm () {
        this.signUp = !this.signUp;
        this.resetValidation();
        this.hideAlert();
        this.reset();
      },

      showTokens () {
        // should show all of the hidden token stuff
        // should show the UserToken if one exists
        // should show the trol token if it exists, preview the username, show a save/copy option like the stream key
        this.userTokens = !this.userTokens;
      },

      copyToClipboard ( data ) {
        this.$copyText( data ).then( () => {
          this.$toast.success( 'Copied to clipboard', { icon: 'done', duration: 5000 } );
          //this.$refs['streamkeyinput'].focus();
        }, ( error ) => {
          console.log( error );
          this.$toast.error( `Copy Failed: ${error}`, { icon: 'error', duration: 5000 } );
        });
      },

      showUserToken () {
        this.showUserKeyF = !this.showUserKeyF;
        if ( this.showUserKeyF ) setTimeout( () => this.showUserKeyF = false, 10000 );
      },
      showTrollToken () {
        this.showTrollKeyF = !this.showTrollKeyF;
        if ( this.showTrollKeyF ) setTimeout( () => this.showTrollKeyF = false, 10000 );
      },

      saveTroll () {
        console.log("saving:",this.trollToken, ' but I bet it doesns sink the values.');
        localStorage.setItem('troll',this.trollToken);
        this.$toast.success( 'Saved Troll token', { icon: 'done', duration: 5000 } );
      },

      saveUserToken () {

        localStorage.setItem('chatToken',this.userToken);
        this.$toast.success( 'Saved User token', { icon: 'done', duration: 5000 } );
      },

      reloadTokens(){
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
        // check and validate/load token info
        if(localStorage.getItem('troll')){
          // load and parse the troll token
          let trollToken = localStorage.getItem('troll');
          console.log("Loaded troll token:",trollToken);
          let decoded_username = parseToken(trollToken).sub.username;
          console.log("loaded:", decoded_username);
          this.trollToken = trollToken;
          this.trollName = decoded_username;
        }

        if(localStorage.getItem('chatToken')){
          // load and parse the chat token
          let testChatToken = localStorage.getItem('chatToken');
          console.log("Loaded chat token:",testChatToken);
          let decoded_username = parseToken(testChatToken).sub.username;
          console.log("loaded:", decoded_username);
          this.userToken = testChatToken;
          this.userName = decoded_username;
        }
      },
      

      // CAPTCHA verified
      async onCaptchaVerify ( token ) {
        this.captchaToken = token;
        await this.validate();
      },

      // CAPTCHA Expired
      async onCpatchaExpired ( data ) {
        this.captchaToken = null;
        await this.validate();
      },

      // CAPTCHA Error
      async onCaptchaError ( data ) {
        this.captchaToken = null;
        await this.validate();
      },

      // Create hCaptcha User
      async createHcaptchaUser () {

        // Put form in loading state
        this.loading = true;

        // Validate inputs and captcha solution
        const valid = await this.validate();
        console.log( valid );
        if ( !valid ) {
          this.loading = false;
          return false;
        }

        // Log analytics
        /*
        this.$ga.event({
          eventCategory : 'login',
          eventAction   : 'register',
        }); */

        // Send off our data!
        try {
          const endpoint = '' + process.env.APISERVER + 'v1/user/register';
          const payload = {
            username: this.user.username,
            email: this.user.email,
            password: this.user.password,
            captcha: this.captchaToken,
          };

          // Submit to API server
          const result = await this.$axios.$post( endpoint, payload );

          if ( result.success ) {
            this.showSuccess( result.message + '\nSigning in to new account...' );
            console.log('save our token and pretend we are logged in?');
            let chatToken = result.token;
            // save it to the local storage and force it to connect
            let backuptoken = localStorage.getItem( 'troll');
            localStorage.setItem( 'chatToken', chatToken );
            localStorage.setItem( 'troll', chatToken );
            localStorage.setItem( 'oldtroll', backuptoken );
            const tokenUser = {
                  type  : 'user',
                  token : chatToken,
                  page  : this.page,
                };
                // Reconnect to chat
                // prevents duplicating connection
                //await this.disconnectChat();
                //await this.connectToChat( tokenUser ); // Connect to chat server
            
          } else {
            this.showError( result.message );
            this.captchaToken = null;
            this.attempts += 1;
            this.loading = false;
            return false;
          }
        } catch ( error ) {
          console.error( error );
          this.showError( error.message );
          this.captchaToken = null;
          this.attempts += 1;
          this.loading = false;
          return false;
        }

        // Now finally (attempt to) login to our newly created user.
        // In theory this should never fail cuz we just registered
        // our account with the exact same credentials...
        try {
          // Set firebase.auth.Auth.Persistence.SESSION
          await auth.setPersistence( 'local' );
          await auth.signInWithEmailAndPassword( this.user.email, this.user.password );
        } catch ( error ) {
          this.showError( error.message );
          console.log( error.message );
        }

        // Disable loading animation
        this.loading = false;
      },

      // Sign In
      async signIn ( email, password ) {
        if ( !this.$refs.loginForm.validate() ) return;

        /*
        this.$ga.event({
          eventCategory : 'login',
          eventAction   : 'login',
        }); */

        this.loading = true;
        try {
          await auth.setPersistence( this.shouldStayLoggedIn ? 'local' : 'session' ); // firebase.auth.Auth.Persistence.SESSION
          await auth.signInWithEmailAndPassword( email, password );
        } catch ( error ) {
          this.showError( error.message );
          console.log( error.message );
        }
        this.loading = false;
      },

      // Reset Password
      async resetPassword ( email ) {
        /*
        this.$ga.event({
          eventCategory : 'login',
          eventAction   : 'reset password',
        });*/

        try {
          await auth.sendPasswordResetEmail( email );
          this.showSuccess( 'Check email for reset link.' );
        } catch ( error ) {
          this.showError( error.message );
        }
      },

      // Validate Data
      async validate () {
        // Validate username & form
        const validUsername = await this.checkUsername( this.user.username );
        const validForm     = await this.$refs.loginForm.validate();

        console.log( `Valid username: ${validUsername}, validForm: ${validForm}` );

        // Validate Inputs
        if ( !(validUsername && validForm ) ) {
          this.showError( 'Please fix errors in red' );
          return false;
        }

        // All good we are turning off captcha for now
        return true;

        // Check for captcha
        if ( !this.captchaToken ) {
          this.showError( 'Please train an AI with the captcha' );
          return false;
        }

        // All good
        return true;
      },

      // Check Username
      async checkUsername ( username ) {

        // default state
        this.usernameError   = '';
        this.usernameSuccess = '';

        // Don't check unless we have a username
        if ( !username ) {
          this.usernameError = 'Name is required';
          return false;
        }

        this.usernameSuccess = 'Username Available'
        return true;

        try {
          // Verify Username is valid & not taken
          const endpoint = '' + process.env.APISERVER + 'api/check-username';
          const payload = { username: username };
          const config = { progress: false };
          const checkUsername = await this.$axios.$post( endpoint, payload, config );

          // Validate API response
          if ( checkUsername.valid ) {
            this.usernameSuccess = 'Username Available'
            return true;
          } else {
            this.usernameError = checkUsername.error;
            return false;
          }
          // Failed to check username
        } catch { error } {
          console.error( error );
          this.usernameError = error.message;
          return false;
        }

      },

      // Reset Form
      reset () {
        this.$refs.loginForm.reset();
      },

      // Reset form Validation errors
      resetValidation () {
        this.usernameError   = '';
        this.usernameSuccess = '';
        this.$refs.loginForm.resetValidation();
        this.hideAlert();
      },

      // Show error alert
      showError ( message ) {
        this.alertType = 'error';
        this.alert = true;
        this.alertMessage = message;
      },

      // Show success alert
      showSuccess ( message ) {
        this.alertType = 'success';
        this.alert = true;
        this.alertMessage = message;
      },

      // Hide alert
      hideAlert () {
        this.alert = false;
      },

      // onAuth handlers
      async authenticated ( user ) {
        if ( user ) {
          if ( process.client ) console.log( `%cLoginDialog.vue:%c Logged in! %o`, 'background: #2196f3; color: #fff; border-radius: 3px; padding: .2rem .5rem;', '', user );
          if (user.displayName) this.showSuccess( `Logged in! Welcome back, ${user.displayName}.` );
          setTimeout( () => this.$emit( 'close' ), 1000 );
        } else {
          if ( process.client ) console.log( `%cLoginDialog.vue:%c Not logged in!`, 'background: #2196f3; color: #fff; border-radius: 3px; padding: .2rem .5rem;', '' );
        }
      },
    },

    mounted () {
      this.unsubAuthChanged = auth.onAuthStateChanged( async user => await this.authenticated( user ) );
      /*
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
      // check and validate/load token info
      if(localStorage.getItem('troll')){
        // load and parse the troll token
        let trollToken = localStorage.getItem('troll');
        console.log("Loaded troll token:",trollToken);
        let decoded_username = parseToken(trollToken).sub.username;
        console.log("loaded:", decoded_username);
        this.trollToken = trollToken;
        this.trollName = decoded_username;
      }

      if(localStorage.getItem('chatToken')){
        // load and parse the chat token
        let testChatToken = localStorage.getItem('chatToken');
        console.log("Loaded chat token:",testChatToken);
        let decoded_username = parseToken(testChatToken).sub.username;
        console.log("loaded:", decoded_username);
        this.chatToken = testChatToken;
        this.userName = decoded_username;
      }*/
    },

    beforeDestroy () {
      if ( this.unsubAuthChanged ) this.unsubAuthChanged();
    },
  }
</script>
